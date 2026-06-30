const express = require('express')
const { verificarToken } = require('../middleware/auth')
const db = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router = express.Router()

router.use(verificarToken)

// GET /api/libro-entrada
router.get('/', (req, res, next) => {
  try {
    const { mes, anio, estado, busqueda, programa } = req.query
    let sql = 'SELECT * FROM libro_entrada WHERE 1=1'
    const params = []

    if (mes)      { sql += " AND strftime('%m', fecha_entrada) = ?"; params.push(String(mes).padStart(2, '0')) }
    if (anio)     { sql += " AND strftime('%Y', fecha_entrada) = ?"; params.push(String(anio)) }
    if (estado)   { sql += ' AND estado = ?'; params.push(estado) }
    if (programa) { sql += ' AND programa LIKE ?'; params.push(`%${programa}%`) }
    if (busqueda) {
      sql += ' AND (nro_expediente LIKE ? OR asunto LIKE ? OR firma LIKE ? OR sidif LIKE ?)'
      params.push(`%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`, `%${busqueda}%`)
    }

    sql += ' ORDER BY id ASC'

    const registros = db.prepare(sql).all(...params)

    const totales = db.prepare(`
      SELECT estado, COUNT(*) as total FROM libro_entrada GROUP BY estado
    `).all()

    res.json({ registros, totales })
  } catch (err) { next(err) }
})

// POST /api/libro-entrada
router.post('/', (req, res, next) => {
  try {
    const {
      nroExpediente, asunto, sidif, opPago,
      impNeto = 0, impRetenido = 0, impBruto = 0,
      resolucion, fechaEntrada, fojasEntrada,
      fechaSalida, fechaVisado, programa, firma,
      requerimiento, estado = 'SIN_VISAR',
    } = req.body

    const info = db.prepare(`
      INSERT INTO libro_entrada (
        nro_expediente, asunto, sidif, op_pago,
        imp_neto, imp_retenido, imp_bruto,
        resolucion, fecha_entrada, fojas_entrada,
        fecha_salida, fecha_visado, programa, firma,
        requerimiento, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      nroExpediente || null, asunto || null, sidif || null, opPago || null,
      parseFloat(impNeto) || 0, parseFloat(impRetenido) || 0, parseFloat(impBruto) || 0,
      resolucion || null, fechaEntrada || null, fojasEntrada ? parseInt(fojasEntrada) : null,
      fechaSalida || null, fechaVisado || null,
      programa || null, firma || null,
      requerimiento || null, estado,
    )

    const nuevo = db.prepare('SELECT * FROM libro_entrada WHERE id = ?').get(info.lastInsertRowid)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'libro_entrada',
      registroId:   info.lastInsertRowid,
      descripcion:  `Creó registro en Libro de Entrada — ${nroExpediente || asunto || 'nuevo'}`,
      datosNuevos:  req.body,
      ip:           req.ip,
    })

    res.status(201).json(nuevo)
  } catch (err) { next(err) }
})

// PUT /api/libro-entrada/:id
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params
    const {
      nroExpediente, asunto, sidif, opPago,
      impNeto = 0, impRetenido = 0, impBruto = 0,
      resolucion, fechaEntrada, fojasEntrada,
      fechaSalida, fechaVisado, programa, firma,
      requerimiento, estado,
    } = req.body

    const anterior = db.prepare('SELECT * FROM libro_entrada WHERE id = ?').get(id)

    db.prepare(`
      UPDATE libro_entrada SET
        nro_expediente = ?, asunto = ?, sidif = ?, op_pago = ?,
        imp_neto = ?, imp_retenido = ?, imp_bruto = ?,
        resolucion = ?, fecha_entrada = ?, fojas_entrada = ?,
        fecha_salida = ?, fecha_visado = ?, programa = ?, firma = ?,
        requerimiento = ?, estado = ?, modificado_en = datetime('now')
      WHERE id = ?
    `).run(
      nroExpediente || null, asunto || null, sidif || null, opPago || null,
      parseFloat(impNeto) || 0, parseFloat(impRetenido) || 0, parseFloat(impBruto) || 0,
      resolucion || null, fechaEntrada || null, fojasEntrada ? parseInt(fojasEntrada) : null,
      fechaSalida || null, fechaVisado || null,
      programa || null, firma || null,
      requerimiento || null, estado, id,
    )

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'libro_entrada',
      registroId:      id,
      descripcion:     `Editó registro ${id} — ${nroExpediente || asunto || id} en Libro de Entrada`,
      datosAnteriores: anterior,
      datosNuevos:     req.body,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Registro actualizado' })
  } catch (err) { next(err) }
})

// PATCH /api/libro-entrada/:id/estado
router.patch('/:id/estado', (req, res, next) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const anterior = db.prepare('SELECT estado FROM libro_entrada WHERE id = ?').get(id)

    db.prepare(`
      UPDATE libro_entrada SET estado = ?, modificado_en = datetime('now') WHERE id = ?
    `).run(estado, id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'CAMBIAR_ESTADO',
      modulo:          'libro_entrada',
      registroId:      id,
      descripcion:     `Cambió estado de "${anterior?.estado || '?'}" a "${estado}" — registro ${id}`,
      datosAnteriores: anterior ? { estado: anterior.estado } : null,
      datosNuevos:     { estado },
      ip:              req.ip,
    })

    res.json({ mensaje: 'Estado actualizado' })
  } catch (err) { next(err) }
})

// DELETE /api/libro-entrada/:id
router.delete('/:id', (req, res, next) => {
  try {
    const { id } = req.params
    const anterior = db.prepare('SELECT * FROM libro_entrada WHERE id = ?').get(id)

    db.prepare('DELETE FROM libro_entrada WHERE id = ?').run(id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'libro_entrada',
      registroId:      id,
      descripcion:     `Eliminó registro ${id} — ${anterior?.nro_expediente || anterior?.asunto || id}`,
      datosAnteriores: anterior,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Registro eliminado' })
  } catch (err) { next(err) }
})

module.exports = router
