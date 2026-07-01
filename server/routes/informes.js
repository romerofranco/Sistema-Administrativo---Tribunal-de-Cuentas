const express = require('express')
const path = require('path')
const fs = require('fs')
const { verificarToken } = require('../middleware/auth')
const sheetsService = require('../../src/services/googleSheets')
const db = require('../../src/services/sqlite')
const generarNota     = require('../../src/services/exportadores/generarNota')
const generarNotaDocx = require('../../src/services/exportadores/generarNotaDocx')
const generarPlanilla = require('../../src/services/exportadores/generarPlanilla')
const router = express.Router()

router.use(verificarToken)

// Directorio para exportaciones temporales
const DIR_EXPORTS = path.join(__dirname, '../../exports')
if (!fs.existsSync(DIR_EXPORTS)) fs.mkdirSync(DIR_EXPORTS, { recursive: true })

// GET /api/informes/preview?mes=6&anio=2025
router.get('/preview', async (req, res, next) => {
  try {
    const { mes, anio } = req.query
    if (!mes || !anio) return res.status(400).json({ error: 'Mes y año son requeridos' })
    const mesN  = parseInt(mes)
    const anioN = parseInt(anio)

    // 1. Obtener expedientes visados del período (Sheets o SQLite)
    let expedientes = []
    try {
      const resultado = await sheetsService.listarExpedientes({
        mes: mesN, anio: anioN, porPagina: 9999, pagina: 1, estado: 'VISADO',
      })
      expedientes = resultado.expedientes
    } catch {
      const resultado = db.obtenerExpedientes({
        mes: mesN, anio: anioN, porPagina: 9999, pagina: 1, estado: 'VISADO',
      })
      expedientes = resultado.expedientes
    }

    // 2. Deduplicar por nro_expediente — conserva el de mayor fila (más reciente en Sheets)
    const vistosNro = new Map()
    const duplicados = []
    const dedupli    = []
    for (const exp of expedientes) {
      const clave = (exp.nroExpediente || '').trim().toLowerCase()
      if (!clave) { dedupli.push(exp); continue }
      if (vistosNro.has(clave)) {
        const prev = vistosNro.get(clave)
        if ((exp.fila || 0) > (prev.fila || 0)) {
          duplicados.push(prev)
          const idx = dedupli.indexOf(prev)
          if (idx !== -1) dedupli[idx] = exp
          vistosNro.set(clave, exp)
        } else {
          duplicados.push(exp)
        }
      } else {
        vistosNro.set(clave, exp)
        dedupli.push(exp)
      }
    }

    // 3. Validar contra libro de entrada del mismo mes/año (por fecha_visado)
    const mesPad  = String(mesN).padStart(2, '0')
    const anioStr = String(anioN)
    const libroDelMes = db.prepare(`
      SELECT * FROM libro_entrada
      WHERE (
        (fecha_visado GLOB '????-??-??*' AND strftime('%m', fecha_visado) = ? AND strftime('%Y', fecha_visado) = ?)
        OR (fecha_visado GLOB '??/??/????*' AND substr(fecha_visado, 4, 2) = ? AND substr(fecha_visado, 7, 4) = ?)
        OR (fecha_visado GLOB '?/??/????*'  AND substr(fecha_visado, 3, 2) = ? AND substr(fecha_visado, 6, 4) = ?)
      )
    `).all(mesPad, anioStr, mesPad, anioStr, mesPad, anioStr)

    const nrosEnInforme = new Set(
      dedupli.map(e => (e.nroExpediente || '').trim().toLowerCase()).filter(Boolean)
    )
    const nrosEnLibro = new Set(
      libroDelMes.map(l => (l.nro_expediente || '').trim().toLowerCase()).filter(Boolean)
    )

    // En libro pero NO en informe — probablemente faltan en el informe
    const soloEnLibro = libroDelMes
      .filter(l => {
        const k = (l.nro_expediente || '').trim().toLowerCase()
        return k && !nrosEnInforme.has(k)
      })
      .map(l => ({
        id:           l.id,
        nroExpediente: l.nro_expediente,
        asunto:        l.asunto,
        sidif:         l.sidif,
        opPago:        l.op_pago,
        impNeto:       l.imp_neto,
        impRetenido:   l.imp_retenido,
        impBruto:      l.imp_bruto,
        fechaVisado:   l.fecha_visado,
        estado:        l.estado,
        programa:      l.programa,
        firma:         l.firma,
      }))

    // En informe pero NO en libro — posiblemente registros dudosos o falta cargar en libro
    const sinEnLibro = dedupli
      .filter(e => {
        const k = (e.nroExpediente || '').trim().toLowerCase()
        return k && !nrosEnLibro.has(k)
      })
      .map(e => ({
        nroExpediente: e.nroExpediente,
        denominacion:  e.denominacion,
        nroSidif:      e.nroSidif,
        impBruto:      e.impBruto,
      }))

    // 4. Agrupar por programa usando ctaFinanc
    const programas = db.prepare('SELECT * FROM programas WHERE activo = 1').all()
    const ctaMap = {}
    programas.forEach(p => {
      if (p.cuenta_financiera) ctaMap[p.cuenta_financiera.trim()] = `Programa Nº ${p.numero}`
    })

    const porPrograma = {}
    dedupli.forEach(exp => {
      const cta  = String(exp.ctaFinanc || '').trim()
      const prog = ctaMap[cta] || exp.programa || cta || 'Sin Programa'
      if (!porPrograma[prog]) porPrograma[prog] = []
      porPrograma[prog].push(exp)
    })

    res.json({
      expedientes: dedupli,
      porPrograma,
      totalOPs:    dedupli.length,
      totalBruto:  dedupli.reduce((acc, e) => acc + (parseFloat(e.impBruto) || 0), 0),
      mes:  mesN,
      anio: anioN,
      validacion: {
        duplicadosEliminados: duplicados.length,
        duplicados:   duplicados.map(e => ({ nroExpediente: e.nroExpediente, denominacion: e.denominacion })),
        soloEnLibro,
        sinEnLibro,
        totalLibro: libroDelMes.length,
      },
    })
  } catch (err) { next(err) }
})

// POST /api/informes/nota — Generar PDF de la Nota
router.post('/nota', async (req, res, next) => {
  try {
    const { mes, anio, numeroNota, expedientes } = req.body

    const responsables = db.prepare(`
      SELECT r.*, p.nombre AS nombre_programa, p.numero AS numero_programa
      FROM responsables r LEFT JOIN programas p ON r.programa_id = p.id
      WHERE r.activo = 1 ORDER BY r.orden_jerarquico ASC
    `).all()

    const config = db.prepare('SELECT * FROM configuracion WHERE id = 1').get() || {}

    const rutaPDF = await generarNota({
      mes: parseInt(mes), anio: parseInt(anio),
      numeroNota, expedientes, responsables, config,
      dirSalida: DIR_EXPORTS,
    })

    res.json({ archivo: path.basename(rutaPDF), url: `/exports/${path.basename(rutaPDF)}` })
  } catch (err) { next(err) }
})

// POST /api/informes/nota-docx — Generar .docx editable de la Nota
router.post('/nota-docx', async (req, res, next) => {
  try {
    const { mes, anio, numeroNota, expedientes } = req.body

    const responsables = db.prepare(`
      SELECT r.*, p.nombre AS nombre_programa, p.numero AS numero_programa
      FROM responsables r LEFT JOIN programas p ON r.programa_id = p.id
      WHERE r.activo = 1 ORDER BY r.orden_jerarquico ASC
    `).all()

    const config = db.prepare('SELECT * FROM configuracion WHERE id = 1').get() || {}

    const rutaDocx = await generarNotaDocx({
      mes: parseInt(mes), anio: parseInt(anio),
      numeroNota, expedientes, responsables, config,
      dirSalida: DIR_EXPORTS,
    })

    res.json({ archivo: path.basename(rutaDocx), url: `/exports/${path.basename(rutaDocx)}` })
  } catch (err) { next(err) }
})

// POST /api/informes/planilla — Generar Excel + PDF de planillas
router.post('/planilla', async (req, res, next) => {
  try {
    const { mes, anio, expedientes, porPrograma } = req.body

    const programas = db.prepare('SELECT * FROM programas WHERE activo = 1').all()

    const archivos = await generarPlanilla({
      mes: parseInt(mes), anio: parseInt(anio),
      expedientes, programas, porPrograma,
      dirSalida: DIR_EXPORTS,
    })

    res.json({ archivos })
  } catch (err) { next(err) }
})

module.exports = router
