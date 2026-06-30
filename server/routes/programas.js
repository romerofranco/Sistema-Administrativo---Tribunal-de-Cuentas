const express = require('express')
const { verificarToken, soloAdmin } = require('../middleware/auth')
const db = require('../../src/services/sqlite')
const auditar = require('../middleware/auditoria')
const router = express.Router()

router.use(verificarToken)

// GET /api/programas
router.get('/', (req, res, next) => {
  try {
    const programas = db.prepare('SELECT * FROM programas ORDER BY numero ASC').all()
    res.json(programas)
  } catch (err) { next(err) }
})

// GET /api/programas/activos
router.get('/activos', (req, res, next) => {
  try {
    const programas = db.prepare('SELECT * FROM programas WHERE activo = 1 ORDER BY numero ASC').all()
    res.json(programas)
  } catch (err) { next(err) }
})

// POST /api/programas
router.post('/', soloAdmin, (req, res, next) => {
  try {
    const { numero, nombre, cuentaFinanciera, activo = 1 } = req.body
    if (!numero || !nombre) {
      return res.status(400).json({ error: 'Número y nombre del programa son requeridos' })
    }
    const existente = db.prepare('SELECT id FROM programas WHERE numero = ?').get(numero)
    if (existente) {
      return res.status(409).json({ error: `Ya existe el programa Nº ${numero}` })
    }
    const stmt = db.prepare(
      'INSERT INTO programas (numero, nombre, cuenta_financiera, activo) VALUES (?, ?, ?, ?)'
    )
    const info = stmt.run(numero, nombre, cuentaFinanciera || null, activo ? 1 : 0)

    auditar({
      usuarioId:    req.usuario.id,
      usuarioNombre: req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:       'CREAR',
      modulo:       'programas',
      registroId:   info.lastInsertRowid,
      descripcion:  `Creó Programa Nº ${numero} — ${nombre}`,
      datosNuevos:  req.body,
      ip:           req.ip,
    })

    res.status(201).json({ id: info.lastInsertRowid, numero, nombre, cuentaFinanciera, activo })
  } catch (err) { next(err) }
})

// PUT /api/programas/:id
router.put('/:id', soloAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const { numero, nombre, cuentaFinanciera, activo } = req.body

    const anterior = db.prepare('SELECT * FROM programas WHERE id = ?').get(id)

    db.prepare(
      'UPDATE programas SET numero = ?, nombre = ?, cuenta_financiera = ?, activo = ? WHERE id = ?'
    ).run(numero, nombre, cuentaFinanciera || null, activo ? 1 : 0, id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'EDITAR',
      modulo:          'programas',
      registroId:      id,
      descripcion:     `Editó Programa Nº ${numero} — ${nombre}`,
      datosAnteriores: anterior,
      datosNuevos:     req.body,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Programa actualizado' })
  } catch (err) { next(err) }
})

// DELETE /api/programas/:id
router.delete('/:id', soloAdmin, (req, res, next) => {
  try {
    const { id } = req.params
    const anterior = db.prepare('SELECT * FROM programas WHERE id = ?').get(id)

    db.prepare('UPDATE programas SET activo = 0 WHERE id = ?').run(id)

    auditar({
      usuarioId:       req.usuario.id,
      usuarioNombre:   req.usuario.nombre_completo || req.usuario.nombre_usuario,
      accion:          'ELIMINAR',
      modulo:          'programas',
      registroId:      id,
      descripcion:     `Dio de baja Programa Nº ${anterior?.numero || id} — ${anterior?.nombre || id}`,
      datosAnteriores: anterior,
      ip:              req.ip,
    })

    res.json({ mensaje: 'Programa dado de baja' })
  } catch (err) { next(err) }
})

module.exports = router
