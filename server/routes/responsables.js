const express = require('express')
const { verificarToken, soloSuperAdmin } = require('../middleware/auth')
const db = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router = express.Router()

router.use(verificarToken)

// GET /api/responsables
router.get('/', (req, res, next) => {
  try {
    const responsables = db.prepare(`
      SELECT r.*, p.nombre AS nombre_programa, p.numero AS numero_programa
      FROM responsables r
      LEFT JOIN programas p ON r.programa_id = p.id
      ORDER BY r.orden_jerarquico ASC, r.cargo ASC
    `).all()
    res.json(responsables)
  } catch (err) { next(err) }
})

// GET /api/responsables/activos
router.get('/activos', (req, res, next) => {
  try {
    const responsables = db.prepare(`
      SELECT r.*, p.nombre AS nombre_programa, p.numero AS numero_programa
      FROM responsables r
      LEFT JOIN programas p ON r.programa_id = p.id
      WHERE r.activo = 1
      ORDER BY r.orden_jerarquico ASC
    `).all()
    res.json(responsables)
  } catch (err) { next(err) }
})

// POST /api/responsables
router.post('/', soloSuperAdmin, (req, res, next) => {
  try {
    const { cargo, nombreCompleto, dni, domicilio, email, programaId, ordenJerarquico, activo = 1 } = req.body
    if (!cargo || !nombreCompleto) {
      return res.status(400).json({ error: 'Cargo y nombre completo son requeridos' })
    }

    const existe = db.prepare(
      'SELECT id FROM responsables WHERE LOWER(TRIM(cargo)) = LOWER(TRIM(?)) AND LOWER(TRIM(nombre_completo)) = LOWER(TRIM(?))'
    ).get(cargo, nombreCompleto)
    if (existe) {
      return res.status(409).json({ error: 'Ya existe un responsable con ese cargo y nombre' })
    }

    const info = db.prepare(`
      INSERT INTO responsables (cargo, nombre_completo, dni, domicilio, email, programa_id, orden_jerarquico, activo)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(cargo, nombreCompleto, dni || null, domicilio || null,
           email || null, programaId || null, ordenJerarquico || 99, activo ? 1 : 0)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'responsables',
      registroId:   info.lastInsertRowid,
      descripcion:  `Creó responsable — ${cargo}: ${nombreCompleto}`,
      datosNuevos:  req.body,
      ip:           req.ip,
    })

    res.status(201).json({ id: info.lastInsertRowid, cargo, nombreCompleto })
  } catch (err) { next(err) }
})

// PUT /api/responsables/:id
router.put('/:id', soloSuperAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const { cargo, nombreCompleto, dni, domicilio, email, programaId, ordenJerarquico, activo } = req.body

    const anterior = db.prepare('SELECT * FROM responsables WHERE id = ?').get(id)

    db.prepare(`
      UPDATE responsables
      SET cargo = ?, nombre_completo = ?, dni = ?, domicilio = ?, email = ?,
          programa_id = ?, orden_jerarquico = ?, activo = ?
      WHERE id = ?
    `).run(cargo, nombreCompleto, dni || null, domicilio || null, email || null,
           programaId || null, ordenJerarquico || 99, activo ? 1 : 0, id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'responsables',
      registroId:      id,
      descripcion:     `Editó responsable — ${cargo}: ${nombreCompleto}`,
      datosAnteriores: anterior,
      datosNuevos:     req.body,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Responsable actualizado' })
  } catch (err) { next(err) }
})

// DELETE /api/responsables/:id
router.delete('/:id', soloSuperAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const anterior = db.prepare('SELECT * FROM responsables WHERE id = ?').get(id)

    db.prepare('DELETE FROM responsables WHERE id = ?').run(id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'responsables',
      registroId:      id,
      descripcion:     `Eliminó responsable — ${anterior?.cargo || ''}: ${anterior?.nombre_completo || id}`,
      datosAnteriores: anterior,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Responsable eliminado' })
  } catch (err) { next(err) }
})

module.exports = router
