const express = require('express')
const { verificarToken } = require('../middleware/auth')
const sheetsService = require('../../src/services/googleSheets')
const db = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router = express.Router()

router.use(verificarToken)

// ─── GET /api/expedientes ─────────────────────────────────────────────────────
router.get('/', (req, res, next) => {
  try {
    const {
      pagina = 1, porPagina = 50, busqueda = '',
      mes, anio, programa, estado, tipoOp,
    } = req.query

    const resultado = db.obtenerExpedientes({
      pagina:    parseInt(pagina),
      porPagina: parseInt(porPagina),
      busqueda,
      mes:       mes    ? parseInt(mes)    : null,
      anio:      anio   ? parseInt(anio)   : null,
      programa,
      estado,
      tipoOp,
    })

    res.json({
      expedientes: resultado.expedientes,
      total:       resultado.total,
      fuenteDatos: 'sqlite',
      pagina:      parseInt(pagina),
      porPagina:   parseInt(porPagina),
    })
  } catch (err) { next(err) }
})

// ─── POST /api/expedientes ────────────────────────────────────────────────────
router.post('/', async (req, res, next) => {
  try {
    const datos = req.body

    const local = db.crearExpedienteLocal(datos)

    sheetsService.crearExpediente(datos)
      .then(resultado => {
        db.prepare('UPDATE expedientes SET id_sheets = ?, pendiente_sync = 0 WHERE id = ?')
          .run(resultado.fila, local.id)
      })
      .catch(err => {
        console.warn('[POST expediente] Sheets no disponible, queda pendiente_sync=1:', err.message)
      })

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'expedientes',
      registroId:   local.id,
      descripcion:  `Creó expediente — ${datos.denominacion || datos.nroExpediente || 'nuevo'}`,
      datosNuevos:  datos,
      ip:           req.ip,
    })

    res.status(201).json({ mensaje: 'Expediente creado correctamente', id: local.id })
  } catch (err) { next(err) }
})

// ─── PUT /api/expedientes/:id ─────────────────────────────────────────────────
router.put('/:id', (req, res, next) => {
  try {
    const { id } = req.params
    const d = req.body

    const registro = db.prepare(
      'SELECT * FROM expedientes WHERE id_sheets = ? OR id = ?'
    ).get(id, id)

    if (!registro) return res.status(404).json({ error: 'Expediente no encontrado' })

    db.prepare(`
      UPDATE expedientes SET
        cta_financ = ?, denominacion = ?, observ_op = ?, ff = ?, cgto = ?, tipo_op = ?,
        nro_expediente = ?, ejer_tramite = ?, nro_sidif = ?, f_registro = ?, nro_op = ?,
        imp_neto = ?, imp_retenido = ?, imp_bruto = ?, fecha_visado = ?,
        entrada = ?, fs_entrada = ?, observacion = ?, salida = ?, fs_salida = ?,
        firma = ?, estado = ?, pendiente_sync = 1, modificado_en = datetime('now')
      WHERE id = ?
    `).run(
      d.ctaFinanc || '', d.denominacion || '', d.observOp || '',
      d.ff || '', d.cgto || '', d.tipoOp || '',
      d.nroExpediente || '', d.ejercTramite || '', d.nroSidif || '',
      d.fRegistro || '', d.nroOp || '',
      parseFloat(d.impNeto) || 0, parseFloat(d.impRetenido) || 0, parseFloat(d.impBruto) || 0,
      d.fechaVisado || '', d.entrada || '', d.fsEntrada || '',
      d.observacion || '', d.salida || '', d.fsSalida || '',
      d.firma || '', d.estado || 'VISADO',
      registro.id
    )

    if (registro.id_sheets) {
      sheetsService.actualizarExpediente(registro.id_sheets, d)
        .then(() => {
          db.prepare('UPDATE expedientes SET pendiente_sync = 0 WHERE id = ?').run(registro.id)
        })
        .catch(err => {
          console.warn('[PUT expediente] Sheets no disponible, queda pendiente_sync=1:', err.message)
        })
    }

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'expedientes',
      registroId:      registro.id,
      descripcion:     `Editó expediente — ${d.denominacion || d.nroExpediente || id}`,
      datosAnteriores: registro,
      datosNuevos:     d,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Expediente actualizado correctamente' })
  } catch (err) { next(err) }
})

// ─── PATCH /api/expedientes/:id/estado ───────────────────────────────────────
router.patch('/:id/estado', (req, res, next) => {
  try {
    const { id } = req.params
    const { estado } = req.body

    const registro = db.prepare(
      'SELECT id, id_sheets, estado FROM expedientes WHERE id_sheets = ? OR id = ?'
    ).get(id, id)

    if (!registro) return res.status(404).json({ error: 'Expediente no encontrado' })

    const estadoAnterior = registro.estado

    db.prepare('UPDATE expedientes SET estado = ?, pendiente_sync = 1 WHERE id = ?')
      .run(estado, registro.id)

    if (registro.id_sheets) {
      sheetsService.cambiarEstadoExpediente(registro.id_sheets, estado)
        .then(() => {
          db.prepare('UPDATE expedientes SET pendiente_sync = 0 WHERE id = ?').run(registro.id)
        })
        .catch(err => {
          console.warn('[PATCH estado] Sheets no disponible:', err.message)
        })
    }

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'CAMBIAR_ESTADO',
      modulo:          'expedientes',
      registroId:      registro.id,
      descripcion:     `Cambió estado de "${estadoAnterior}" a "${estado}" — expediente ${registro.id}`,
      datosAnteriores: { estado: estadoAnterior },
      datosNuevos:     { estado },
      ip:              req.ip,
    })

    res.json({ mensaje: 'Estado actualizado', estado })
  } catch (err) { next(err) }
})

// ─── DELETE /api/expedientes/:id ─────────────────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const registro = db.prepare(
      'SELECT * FROM expedientes WHERE id_sheets = ? OR id = ?'
    ).get(id, id)

    if (registro?.id_sheets) {
      sheetsService.eliminarExpediente(registro.id_sheets)
        .catch(err => console.warn('[DELETE expediente] Sheets no disponible:', err.message))
    }

    db.prepare('DELETE FROM expedientes WHERE id_sheets = ? OR id = ?').run(id, id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'expedientes',
      registroId:      registro?.id || id,
      descripcion:     `Eliminó expediente — ${registro?.denominacion || registro?.nro_expediente || id}`,
      datosAnteriores: registro || null,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Expediente eliminado correctamente' })
  } catch (err) { next(err) }
})

// ─── GET /api/expedientes/resumen-mes ────────────────────────────────────────
router.get('/resumen-mes', (req, res, next) => {
  try {
    const { mes, anio } = req.query
    const resumen = db.resumenMes(
      mes  ? parseInt(mes)  : new Date().getMonth() + 1,
      anio ? parseInt(anio) : new Date().getFullYear()
    )
    res.json(resumen)
  } catch (err) { next(err) }
})

module.exports = router
