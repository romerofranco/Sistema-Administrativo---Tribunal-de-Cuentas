const express = require('express')
const { verificarToken } = require('../middleware/auth')
const db = require('../../src/services/sqlite')
const router = express.Router()

router.use(verificarToken)

// GET /api/auditoria?modulo=&accion=&usuario=&fechaDesde=&fechaHasta=&pagina=&porPagina=
router.get('/', (req, res, next) => {
  try {
    const { pagina = 1, porPagina = 50, modulo, accion, usuario, fechaDesde, fechaHasta } = req.query

    const conds  = []
    const params = []

    if (modulo)     { conds.push('modulo = ?');            params.push(modulo) }
    if (accion)     { conds.push('accion = ?');            params.push(accion) }
    if (usuario)    { conds.push('usuario_nombre LIKE ?'); params.push(`%${usuario}%`) }
    if (fechaDesde) { conds.push('creado_en >= ?');        params.push(fechaDesde) }
    if (fechaHasta) { conds.push('creado_en <= ?');        params.push(`${fechaHasta} 23:59:59`) }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : ''

    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM auditoria ${where}`).get(...params)?.cnt || 0
    const offset = (parseInt(pagina) - 1) * parseInt(porPagina)
    const registros = db.prepare(
      `SELECT * FROM auditoria ${where} ORDER BY creado_en DESC LIMIT ? OFFSET ?`
    ).all(...params, parseInt(porPagina), offset)

    res.json({ registros, total, pagina: parseInt(pagina), porPagina: parseInt(porPagina) })
  } catch (err) { next(err) }
})

module.exports = router
