const db = require('../../src/services/sqlite')

const CAMPOS_SENSIBLES = ['contrasena', 'password', 'token', 'secret', 'contrasenanueva', 'contrasenaactual', 'contrasena_hash', 'hash']

function sanitizar(datos) {
  if (!datos || typeof datos !== 'object') return datos
  return Object.fromEntries(
    Object.entries(datos).map(([k, v]) => [
      k,
      CAMPOS_SENSIBLES.includes(k.toLowerCase()) ? '[REDACTADO]' : v,
    ])
  )
}

module.exports = function auditar({
  usuarioId,
  usuarioNombre,
  accion,
  modulo,
  registroId = null,
  descripcion,
  datosAnteriores = null,
  datosNuevos = null,
  ip = null,
}) {
  try {
    db.prepare(`
      INSERT INTO auditoria
        (usuario_id, usuario_nombre, accion, modulo, registro_id, descripcion, datos_anteriores, datos_nuevos, ip)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      usuarioId ?? null,
      usuarioNombre || 'Sistema',
      accion,
      modulo,
      registroId != null ? String(registroId) : null,
      descripcion,
      datosAnteriores ? JSON.stringify(sanitizar(datosAnteriores)) : null,
      datosNuevos    ? JSON.stringify(sanitizar(datosNuevos))    : null,
      ip ?? null,
    )
  } catch (err) {
    console.warn('[Auditoría] Error al registrar:', err.message)
  }
}
