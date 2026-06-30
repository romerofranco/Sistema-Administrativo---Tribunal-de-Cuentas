const express = require('express')
const bcrypt  = require('bcryptjs')
const { verificarToken, soloAdmin, soloSuperAdmin, esSuperAdmin, esPrivilegiado } = require('../middleware/auth')
const db      = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router  = express.Router()

router.use(verificarToken)

// ─── CONFIGURACIÓN GENERAL ────────────────────────────────────────────────────

// GET /api/configuracion
router.get('/', (req, res, next) => {
  try {
    const config = db.prepare('SELECT * FROM configuracion WHERE id = 1').get()
    res.json(config || {})
  } catch (err) { next(err) }
})

// PUT /api/configuracion — solo superadmin
router.put('/', soloSuperAdmin, (req, res, next) => {
  try {
    const {
      presidenteNombre, presidenteCargoTexto,
      textoNotaCuerpo, numeroNotaCorrelativo,
      organismo, delegadoFiscal,
    } = req.body

    const anterior = db.prepare('SELECT * FROM configuracion WHERE id = 1').get()

    db.prepare(`
      INSERT INTO configuracion (id, presidente_nombre, presidente_cargo_texto, texto_nota_cuerpo, numero_nota_correlativo, organismo, delegado_fiscal)
      VALUES (1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        presidente_nombre       = excluded.presidente_nombre,
        presidente_cargo_texto  = excluded.presidente_cargo_texto,
        texto_nota_cuerpo       = excluded.texto_nota_cuerpo,
        numero_nota_correlativo = excluded.numero_nota_correlativo,
        organismo               = excluded.organismo,
        delegado_fiscal         = excluded.delegado_fiscal
    `).run(presidenteNombre, presidenteCargoTexto, textoNotaCuerpo, numeroNotaCorrelativo, organismo || '', delegadoFiscal || '')

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'configuracion',
      registroId:      1,
      descripcion:     'Actualizó la configuración del sistema',
      datosAnteriores: anterior,
      datosNuevos:     req.body,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Configuración guardada' })
  } catch (err) { next(err) }
})

// ─── USUARIOS ─────────────────────────────────────────────────────────────────

// GET /api/configuracion/usuarios — superadmin ve todos, delegado solo operadores
router.get('/usuarios', soloAdmin, (req, res, next) => {
  try {
    const filtroRol = esSuperAdmin(req.usuario.rol) ? '' : "WHERE rol = 'operador'"
    const usuarios  = db.prepare(
      `SELECT id, nombre_usuario, nombre_completo, rol, activo, ultimo_acceso
       FROM usuarios ${filtroRol} ORDER BY nombre_usuario`
    ).all()
    res.json(usuarios)
  } catch (err) { next(err) }
})

// POST /api/configuracion/usuarios — superadmin: cualquier rol. delegado: solo operador
router.post('/usuarios', soloAdmin, async (req, res, next) => {
  try {
    const { nombreUsuario, nombreCompleto, contrasena, rol } = req.body
    if (!nombreUsuario || !contrasena || !rol) {
      return res.status(400).json({ error: 'Usuario, contraseña y rol son requeridos' })
    }

    if (!esSuperAdmin(req.usuario.rol) && rol !== 'operador') {
      return res.status(403).json({ error: 'El Delegado solo puede crear usuarios con rol Operador' })
    }

    const hash = await bcrypt.hash(contrasena, 12)
    const info = db.prepare(
      'INSERT INTO usuarios (nombre_usuario, nombre_completo, contrasena_hash, rol) VALUES (?, ?, ?, ?)'
    ).run(nombreUsuario, nombreCompleto || nombreUsuario, hash, rol)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'usuarios',
      registroId:   info.lastInsertRowid,
      descripcion:  `Creó usuario "${nombreUsuario}" con rol "${rol}"`,
      datosNuevos:  { nombreUsuario, nombreCompleto, rol },
      ip:           req.ip,
    })

    res.status(201).json({ id: info.lastInsertRowid, nombreUsuario, rol })
  } catch (err) { next(err) }
})

// PUT /api/configuracion/usuarios/:id — solo superadmin
router.put('/usuarios/:id', soloSuperAdmin, async (req, res, next) => {
  try {
    const { id } = req.params
    const { nombreCompleto, contrasena, rol, activo } = req.body

    const anterior = db.prepare('SELECT id, nombre_usuario, nombre_completo, rol, activo FROM usuarios WHERE id = ?').get(id)

    if (contrasena) {
      const hash = await bcrypt.hash(contrasena, 12)
      db.prepare('UPDATE usuarios SET nombre_completo = ?, contrasena_hash = ?, rol = ?, activo = ? WHERE id = ?')
        .run(nombreCompleto, hash, rol, activo ? 1 : 0, id)
    } else {
      db.prepare('UPDATE usuarios SET nombre_completo = ?, rol = ?, activo = ? WHERE id = ?')
        .run(nombreCompleto, rol, activo ? 1 : 0, id)
    }

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'usuarios',
      registroId:      id,
      descripcion:     `Editó usuario "${anterior?.nombre_usuario || id}" — rol: ${rol}, activo: ${activo ? 'Sí' : 'No'}`,
      datosAnteriores: anterior,
      datosNuevos:     { nombreCompleto, rol, activo: activo ? 1 : 0 },
      ip:              req.ip,
    })

    res.json({ mensaje: 'Usuario actualizado' })
  } catch (err) { next(err) }
})

// DELETE /api/configuracion/usuarios/:id — solo superadmin
router.delete('/usuarios/:id', soloSuperAdmin, (req, res, next) => {
  try {
    const { id } = req.params

    if (parseInt(id) === req.usuario.id) {
      return res.status(400).json({ error: 'No podés eliminar tu propio usuario' })
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    db.prepare('DELETE FROM usuarios WHERE id = ?').run(id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'usuarios',
      registroId:      id,
      descripcion:     `Eliminó usuario "${usuario.nombre_usuario}"`,
      datosAnteriores: usuario,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Usuario eliminado' })
  } catch (err) { next(err) }
})

// ─── GOOGLE SHEETS ────────────────────────────────────────────────────────────

// GET /api/configuracion/google — info de conexión (sin exponer private key)
router.get('/google', soloSuperAdmin, (req, res, next) => {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID    || ''
    const email   = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
    const key     = process.env.GOOGLE_PRIVATE_KEY || ''
    const sheetName = process.env.GOOGLE_SHEET_NAME || ''

    res.json({
      sheetId,
      serviceAccountEmail: email,
      privateKeyConfigurada: key.includes('-----BEGIN') && key.length > 500,
      sheetName,
      columnas: [
        { campo: 'Número de fila',        col: 'A' },
        { campo: 'Cta. Financiera',       col: 'B' },
        { campo: 'Denominación',          col: 'D' },
        { campo: 'Observación OP',        col: 'E' },
        { campo: 'FF',                    col: 'F' },
        { campo: 'CGTO',                  col: 'G' },
        { campo: 'Tipo OP',               col: 'H' },
        { campo: 'Nro. Expediente',       col: 'J' },
        { campo: 'Ejercicio Trámite',     col: 'K' },
        { campo: 'Nro. SIDIF',            col: 'Q' },
        { campo: 'F. Registro',           col: 'R' },
        { campo: 'Nro. OP',               col: 'S' },
        { campo: 'Importe Neto',          col: 'T' },
        { campo: 'Importe Retenido',      col: 'U' },
        { campo: 'Importe Bruto',         col: 'V' },
        { campo: 'Fecha Visado',          col: 'W' },
        { campo: 'Entrada',               col: 'X' },
        { campo: 'FS Entrada',            col: 'Y' },
        { campo: 'Observación',           col: 'Z' },
        { campo: 'Salida',                col: 'AA' },
        { campo: 'FS Salida',             col: 'AB' },
        { campo: 'Firma',                 col: 'AC' },
      ],
    })
  } catch (err) { next(err) }
})

// POST /api/configuracion/google/probar — prueba la conexión (solo metadata, sin leer filas)
router.post('/google/probar', soloSuperAdmin, async (req, res, next) => {
  try {
    const gs = require('../../src/services/googleSheets')
    const info = await gs.probarConexion()
    res.json({
      ok: true,
      mensaje: `Conexión exitosa. Planilla: "${info.titulo}" · Hojas: ${info.hojas.join(', ')}`,
    })
  } catch (err) {
    res.status(503).json({ ok: false, error: err.message || 'Error al conectar con Google Sheets' })
  }
})

// ─── SEGURIDAD ────────────────────────────────────────────────────────────────

// GET /api/configuracion/seguridad
router.get('/seguridad', soloSuperAdmin, (req, res, next) => {
  try {
    const config = db.prepare('SELECT sesion_expiracion_minutos FROM configuracion WHERE id = 1').get()

    const usuariosConProblemas = db.prepare(`
      SELECT id, nombre_usuario, nombre_completo, rol, intentos_fallidos, bloqueado_hasta, ultimo_acceso
      FROM usuarios
      WHERE intentos_fallidos > 0 OR bloqueado_hasta IS NOT NULL
      ORDER BY intentos_fallidos DESC
    `).all()

    res.json({
      sesionExpiracionMinutos: config?.sesion_expiracion_minutos || 1440,
      usuariosConProblemas,
    })
  } catch (err) { next(err) }
})

// POST /api/configuracion/seguridad/desbloquear/:id
router.post('/seguridad/desbloquear/:id', soloSuperAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' })

    db.prepare('UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?').run(id)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'EDITAR',
      modulo:       'seguridad',
      registroId:   id,
      descripcion:  `Desbloqueó al usuario "${usuario.nombre_usuario}"`,
      ip:           req.ip,
    })

    res.json({ mensaje: `Usuario "${usuario.nombre_usuario}" desbloqueado.` })
  } catch (err) { next(err) }
})

// PUT /api/configuracion/sesion — tiempo de expiración de sesión
router.put('/sesion', soloSuperAdmin, (req, res, next) => {
  try {
    const { sesionExpiracionMinutos } = req.body
    const minutos = parseInt(sesionExpiracionMinutos)
    if (!minutos || minutos < 5 || minutos > 43200) {
      return res.status(400).json({ error: 'El tiempo de sesión debe estar entre 5 y 43200 minutos (30 días máx.)' })
    }

    db.prepare('UPDATE configuracion SET sesion_expiracion_minutos = ? WHERE id = 1').run(minutos)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'EDITAR',
      modulo:       'configuracion',
      registroId:   1,
      descripcion:  `Actualizó tiempo de sesión a ${minutos} minutos`,
      ip:           req.ip,
    })

    res.json({ mensaje: 'Tiempo de sesión actualizado' })
  } catch (err) { next(err) }
})

module.exports = router
