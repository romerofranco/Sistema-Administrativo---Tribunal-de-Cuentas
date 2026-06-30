const jwt = require('jsonwebtoken')

function esSuperAdmin(rol) {
  return rol === 'superadmin' || rol === 'administrador'
}

function esPrivilegiado(rol) {
  return esSuperAdmin(rol) || rol === 'delegado'
}

// Middleware de autenticación JWT
function verificarToken(req, res, next) {
  const cabecera = req.headers.authorization
  if (!cabecera || !cabecera.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticación requerido' })
  }

  const token = cabecera.split(' ')[1]
  try {
    const datos = jwt.verify(token, process.env.JWT_SECRET)
    req.usuario = datos
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

// superadmin + delegado
function soloAdmin(req, res, next) {
  if (!esPrivilegiado(req.usuario?.rol)) {
    return res.status(403).json({ error: 'Acceso restringido' })
  }
  next()
}

// solo superadmin
function soloSuperAdmin(req, res, next) {
  if (!esSuperAdmin(req.usuario?.rol)) {
    return res.status(403).json({ error: 'Acceso restringido a Super Administradores' })
  }
  next()
}

module.exports = { verificarToken, soloAdmin, soloSuperAdmin, esSuperAdmin, esPrivilegiado }
