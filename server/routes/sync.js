const express = require('express')
const { verificarToken } = require('../middleware/auth')
const sheetsService = require('../../src/services/googleSheets')
const db = require('../../src/services/sqlite')
const router = express.Router()

router.use(verificarToken)

// POST /api/sync/pendientes — Empuja cambios locales (SQLite→Sheets)
router.post('/pendientes', async (req, res, next) => {
  try {
    const pendientes = db.prepare('SELECT * FROM expedientes WHERE pendiente_sync = 1').all()

    if (pendientes.length === 0) {
      return res.json({ sincronizados: 0, mensaje: 'No hay registros pendientes' })
    }

    let sincronizados = 0
    const errores = []

    for (const exp of pendientes) {
      try {
        if (exp.id_sheets) {
          await sheetsService.actualizarExpediente(exp.id_sheets, exp)
        } else {
          const resultado = await sheetsService.crearExpediente(exp)
          db.prepare('UPDATE expedientes SET id_sheets = ? WHERE id = ?')
            .run(resultado.fila, exp.id)
        }
        db.prepare('UPDATE expedientes SET pendiente_sync = 0 WHERE id = ?').run(exp.id)
        sincronizados++
      } catch (err) {
        errores.push({ id: exp.id, error: err.message })
      }
    }

    res.json({
      sincronizados,
      errores: errores.length > 0 ? errores : undefined,
      mensaje: `${sincronizados} registro(s) sincronizado(s) correctamente`,
    })
  } catch (err) { next(err) }
})

// GET /api/sync/test-conexion — Diagnóstico rápido de la conexión con Sheets
router.get('/test-conexion', async (req, res, next) => {
  try {
    const sheetsService = require('../../src/services/googleSheets')
    // Intenta listar solo 1 fila para verificar la conexión
    await sheetsService.listarTodos()
    res.json({ ok: true, mensaje: 'Conexión con Google Sheets exitosa' })
  } catch (err) {
    res.status(400).json({
      ok: false,
      error: err.message,
      codigo: err.code || err.status || 'UNKNOWN',
    })
  }
})

// POST /api/sync/importar-sheets — Importa Sheets→SQLite (pull completo)
// Flujo seguro: primero empuja pendientes locales, luego trae todo de Sheets.
// Respeta registros con pendiente_sync=1 (los omite para no pisarlos).
router.post('/importar-sheets', async (req, res, next) => {
  try {
    // Paso 1: empujar pendientes locales antes de sobrescribir
    const pendientes = db.prepare('SELECT * FROM expedientes WHERE pendiente_sync = 1').all()
    let empujados = 0
    for (const exp of pendientes) {
      try {
        if (exp.id_sheets) {
          await sheetsService.actualizarExpediente(exp.id_sheets, exp)
        } else {
          const resultado = await sheetsService.crearExpediente(exp)
          db.prepare('UPDATE expedientes SET id_sheets = ? WHERE id = ?')
            .run(resultado.fila, exp.id)
        }
        db.prepare('UPDATE expedientes SET pendiente_sync = 0 WHERE id = ?').run(exp.id)
        empujados++
      } catch { /* continuar con el resto */ }
    }

    // Paso 2: traer todos los expedientes de Sheets
    const todos = await sheetsService.listarTodos()
    let importados = 0
    let omitidos = 0

    for (const exp of todos) {
      if (!exp.fila) continue

      // No sobreescribir si aún hay cambios locales pendientes
      const local = db.prepare('SELECT pendiente_sync FROM expedientes WHERE id_sheets = ?').get(exp.fila)
      if (local?.pendiente_sync === 1) { omitidos++; continue }

      db.upsertExpediente(exp)
      importados++
    }

    res.json({
      empujados,
      importados,
      omitidos,
      total: todos.length,
      mensaje: `${importados} importados, ${empujados} locales empujados a Sheets`,
    })
  } catch (err) {
    // Devolver el mensaje real de Google para poder diagnosticar
    res.status(500).json({
      error: err.message,
      codigo: err.code || err.status || 'UNKNOWN',
      detalle: 'Error al conectar con Google Sheets',
    })
  }
})

// GET /api/sync/estado — Cuántos registros pendientes y config de Sheets
router.get('/estado', (req, res, next) => {
  try {
    const { count } = db.prepare('SELECT COUNT(*) as count FROM expedientes WHERE pendiente_sync = 1').get()
    const { total } = db.prepare('SELECT COUNT(*) as total FROM expedientes WHERE eliminado_en IS NULL').get()
    const sheetsConfigurado = !!(
      process.env.GOOGLE_SHEET_ID &&
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY
    )
    res.json({ pendientes: count, totalLocal: total, sheetsConfigurado })
  } catch (err) { next(err) }
})

module.exports = router
