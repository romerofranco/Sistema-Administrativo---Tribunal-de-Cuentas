const express = require('express')
const { verificarToken, soloAdmin } = require('../middleware/auth')
const db = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router = express.Router()

router.use(verificarToken)

// GET /api/control-preventivo
router.get('/', (req, res, next) => {
  try {
    const { pagina = 1, porPagina = 50, busqueda = '', mes, anio } = req.query

    let where = '1=1'
    const params = []

    if (busqueda) {
      where += ' AND (organismo LIKE ? OR expediente LIKE ? OR concepto LIKE ? OR nro_acto_adm LIKE ?)'
      const b = `%${busqueda}%`
      params.push(b, b, b, b)
    }
    if (mes)  { where += ' AND mes = ?';  params.push(parseInt(mes))  }
    if (anio) { where += ' AND anio = ?'; params.push(parseInt(anio)) }

    const total = db.prepare(`SELECT COUNT(*) AS cnt FROM control_preventivo WHERE ${where}`)
      .get(...params)?.cnt || 0

    const totalImporte = db.prepare(`SELECT COALESCE(SUM(importe), 0) AS suma FROM control_preventivo WHERE ${where}`)
      .get(...params)?.suma || 0

    const offset = (parseInt(pagina) - 1) * parseInt(porPagina)
    const registros = db.prepare(
      `SELECT * FROM control_preventivo WHERE ${where}
       ORDER BY fecha_entrada ASC, id ASC
       LIMIT ? OFFSET ?`
    ).all(...params, parseInt(porPagina), offset)

    res.json({ registros, total, totalImporte, pagina: parseInt(pagina), porPagina: parseInt(porPagina) })
  } catch (err) { next(err) }
})

// POST /api/control-preventivo — solo administradores
router.post('/', soloAdmin, (req, res, next) => {
  try {
    const {
      saf = '420', organismo, delegadoFiscal, autoridad, expediente, concepto,
      nroActoAdm, ippSinPuntos, importe = 0,
      fechaEntrada, fechaSalida, fechaIntervencion, sinObservacion,
      mes, anio,
    } = req.body

    if (!organismo) return res.status(400).json({ error: 'El organismo es requerido' })

    const info = db.prepare(`
      INSERT INTO control_preventivo
        (saf, organismo, delegado_fiscal, autoridad, expediente, concepto,
         nro_acto_adm, ipp_sin_puntos, importe,
         fecha_entrada, fecha_salida, fecha_intervencion, sin_observacion, mes, anio)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      saf, organismo, delegadoFiscal || null, autoridad || null,
      expediente || null, concepto || null,
      nroActoAdm || null, ippSinPuntos || null,
      parseFloat(importe) || 0,
      fechaEntrada || null, fechaSalida || null, fechaIntervencion || null,
      sinObservacion || null,
      mes ? parseInt(mes) : null, anio ? parseInt(anio) : null
    )

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'control_preventivo',
      registroId:   info.lastInsertRowid,
      descripcion:  `Creó intervención de Control Preventivo — ${organismo}`,
      datosNuevos:  req.body,
      ip:           req.ip,
    })

    res.status(201).json({ id: info.lastInsertRowid, mensaje: 'Registro creado' })
  } catch (err) { next(err) }
})

// PUT /api/control-preventivo/:id
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params
    const {
      saf = '420', organismo, delegadoFiscal, autoridad, expediente, concepto,
      nroActoAdm, ippSinPuntos, importe = 0,
      fechaEntrada, fechaSalida, fechaIntervencion, sinObservacion,
      mes, anio,
    } = req.body

    if (!organismo) return res.status(400).json({ error: 'El organismo es requerido' })

    const anterior = db.prepare('SELECT * FROM control_preventivo WHERE id = ?').get(id)

    db.prepare(`
      UPDATE control_preventivo SET
        saf = ?, organismo = ?, delegado_fiscal = ?, autoridad = ?,
        expediente = ?, concepto = ?, nro_acto_adm = ?, ipp_sin_puntos = ?,
        importe = ?, fecha_entrada = ?, fecha_salida = ?, fecha_intervencion = ?,
        sin_observacion = ?, mes = ?, anio = ?,
        modificado_en = datetime('now')
      WHERE id = ?
    `).run(
      saf, organismo, delegadoFiscal || null, autoridad || null,
      expediente || null, concepto || null,
      nroActoAdm || null, ippSinPuntos || null,
      parseFloat(importe) || 0,
      fechaEntrada || null, fechaSalida || null, fechaIntervencion || null,
      sinObservacion || null,
      mes ? parseInt(mes) : null, anio ? parseInt(anio) : null,
      id
    )

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'control_preventivo',
      registroId:      id,
      descripcion:     `Editó intervención ${id} — ${organismo}`,
      datosAnteriores: anterior,
      datosNuevos:     req.body,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Registro actualizado' })
  } catch (err) { next(err) }
})

// DELETE /api/control-preventivo/:id — solo administradores
router.delete('/:id', soloAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const anterior = db.prepare('SELECT * FROM control_preventivo WHERE id = ?').get(id)

    db.prepare('DELETE FROM control_preventivo WHERE id = ?').run(id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'control_preventivo',
      registroId:      id,
      descripcion:     `Eliminó intervención ${id} — ${anterior?.organismo || id}`,
      datosAnteriores: anterior,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Registro eliminado' })
  } catch (err) { next(err) }
})

module.exports = router
