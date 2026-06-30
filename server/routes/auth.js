const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../../src/services/sqlite')
const { verificarToken } = require('../middleware/auth')
const router = express.Router()

const INTENTOS_MAX   = 5
const BLOQUEO_MIN    = 30

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { nombreUsuario, contrasena } = req.body
    if (!nombreUsuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE nombre_usuario = ?').get(nombreUsuario)

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo. Contacte al administrador.' })
    }

    // Verificar bloqueo por intentos fallidos
    if (usuario.bloqueado_hasta) {
      const hasta = new Date(usuario.bloqueado_hasta)
      if (hasta > new Date()) {
        const minutos = Math.ceil((hasta - new Date()) / 60000)
        return res.status(429).json({
          error: `Cuenta bloqueada por demasiados intentos fallidos. Intente en ${minutos} minuto(s).`,
        })
      }
      // El bloqueo expiró — resetear
      db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?').run(usuario.id)
      usuario.intentos_fallidos = 0
      usuario.bloqueado_hasta   = null
    }

    const contrasenaOk = await bcrypt.compare(contrasena, usuario.contrasena_hash)

    if (!contrasenaOk) {
      const nuevosIntentos = (usuario.intentos_fallidos || 0) + 1

      if (nuevosIntentos >= INTENTOS_MAX) {
        const hasta = new Date(Date.now() + BLOQUEO_MIN * 60000).toISOString()
        db.prepare('UPDATE usuarios SET intentos_fallidos = ?, bloqueado_hasta = ? WHERE id = ?')
          .run(nuevosIntentos, hasta, usuario.id)
        return res.status(429).json({
          error: `Demasiados intentos fallidos. Cuenta bloqueada por ${BLOQUEO_MIN} minutos.`,
        })
      }

      db.prepare('UPDATE usuarios SET intentos_fallidos = ? WHERE id = ?')
        .run(nuevosIntentos, usuario.id)

      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    }

    // Login exitoso — resetear intentos y registrar acceso
    db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_acceso = ? WHERE id = ?')
      .run(new Date().toISOString(), usuario.id)

    // Leer tiempo de sesión configurable
    const config  = db.prepare('SELECT sesion_expiracion_minutos FROM configuracion WHERE id = 1').get()
    const expMin  = config?.sesion_expiracion_minutos || 1440

    const token = jwt.sign(
      { id: usuario.id, nombreUsuario: usuario.nombre_usuario, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: `${expMin}m` }
    )

    res.json({
      token,
      usuario: {
        id:             usuario.id,
        nombreUsuario:  usuario.nombre_usuario,
        nombreCompleto: usuario.nombre_completo,
        rol:            usuario.rol,
      },
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/auth/perfil — actualizar nombre completo y/o nombre de usuario propios
router.put('/perfil', verificarToken, async (req, res, next) => {
  try {
    const { nombreCompleto, nombreUsuario } = req.body
    const { id } = req.usuario

    if (!nombreCompleto && !nombreUsuario) {
      return res.status(400).json({ error: 'Debe indicar al menos un campo a actualizar.' })
    }

    if (nombreUsuario) {
      const tomado = db.prepare('SELECT id FROM usuarios WHERE nombre_usuario = ? AND id != ?').get(nombreUsuario, id)
      if (tomado) return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso.' })
    }

    const actual = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
    db.prepare('UPDATE usuarios SET nombre_completo = ?, nombre_usuario = ? WHERE id = ?').run(
      nombreCompleto || actual.nombre_completo,
      nombreUsuario  || actual.nombre_usuario,
      id
    )

    const actualizado = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)

    // Re-emitir token con los datos actualizados
    const config = db.prepare('SELECT sesion_expiracion_minutos FROM configuracion WHERE id = 1').get()
    const expMin = config?.sesion_expiracion_minutos || 1440
    const nuevoToken = jwt.sign(
      { id: actualizado.id, nombreUsuario: actualizado.nombre_usuario, rol: actualizado.rol },
      process.env.JWT_SECRET,
      { expiresIn: `${expMin}m` }
    )

    res.json({
      mensaje: 'Perfil actualizado correctamente.',
      token: nuevoToken,
      usuario: {
        id:             actualizado.id,
        nombreUsuario:  actualizado.nombre_usuario,
        nombreCompleto: actualizado.nombre_completo,
        rol:            actualizado.rol,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/cambiar-contrasena — requiere token válido en header Authorization
router.post('/cambiar-contrasena', verificarToken, async (req, res, next) => {
  try {
    const { contrasenaActual, contrasenaNueva } = req.body
    if (!contrasenaActual || !contrasenaNueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' })
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    const ok = await bcrypt.compare(contrasenaActual, usuario.contrasena_hash)
    if (!ok) return res.status(400).json({ error: 'Contraseña actual incorrecta' })

    const hash = await bcrypt.hash(contrasenaNueva, 12)
    db.prepare('UPDATE usuarios SET contrasena_hash = ? WHERE id = ?').run(hash, req.usuario.id)

    res.json({ mensaje: 'Contraseña actualizada correctamente' })
  } catch (err) {
    next(err)
  }
})

module.exports = router
