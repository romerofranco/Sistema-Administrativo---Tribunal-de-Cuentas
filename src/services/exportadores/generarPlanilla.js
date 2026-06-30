const ExcelJS = require('exceljs')
const puppeteer = require('puppeteer')
const path = require('path')

const MESES = [
  'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE',
]

function formatearMoneda(valor) {
  const num = parseFloat(valor) || 0
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Construye la lista de grupos { titulo, exps } a partir de porPrograma o fallback por programa
function construirGrupos(expedientes, programas, porPrograma) {
  // Si viene porPrograma del frontend (ya agrupado correctamente), usarlo
  if (porPrograma && Object.keys(porPrograma).length > 0) {
    return Object.entries(porPrograma).map(([key, exps]) => {
      // Intentar encontrar un número de programa para el título
      const progEncontrado = programas.find(p =>
        p.cuenta_financiera && p.cuenta_financiera.trim() === key.trim()
      )
      const titulo = progEncontrado
        ? `Programa Nº ${progEncontrado.numero}`
        : key
      return { titulo, exps }
    })
  }

  // Fallback: agrupar todos los expedientes en un bloque por cada programa activo
  return programas
    .filter(p => p.activo)
    .map(p => {
      const exps = expedientes.filter(e => {
        const cta = String(e.ctaFinanc || '').trim()
        const ctaProg = String(p.cuenta_financiera || '').trim()
        return ctaProg && cta === ctaProg
      })
      return { titulo: `Programa Nº ${p.numero}`, exps }
    })
    .filter(g => g.exps.length > 0)
}

async function generarExcel({ mes, anio, expedientes, programas, porPrograma, dirSalida }) {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Sistema Expedientes — Tribunal de Cuentas La Rioja'
  workbook.created = new Date()

  const mesNombre = MESES[mes - 1]
  const COLOR_ENCABEZADO = { argb: 'FFD9D9D9' }
  const BORDE = {
    top:    { style: 'thin', color: { argb: 'FF000000' } },
    left:   { style: 'thin', color: { argb: 'FF000000' } },
    bottom: { style: 'thin', color: { argb: 'FF000000' } },
    right:  { style: 'thin', color: { argb: 'FF000000' } },
  }

  const grupos = construirGrupos(expedientes, programas, porPrograma)

  for (const { titulo, exps } of grupos) {
    const nombreHoja = `${titulo} - ${mesNombre} ${anio}`.slice(0, 31)
    const hoja = workbook.addWorksheet(nombreHoja, {
      pageSetup: {
        paperSize: 6, // Legal
        orientation: 'landscape',
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
      },
    })

    // Fila 1: Título principal
    hoja.mergeCells('A1:P1')
    const t1 = hoja.getCell('A1')
    t1.value = 'DELEGACION FISCAL: PROGRAMA NACIONAL Nº 2 PACTO FEDERAL - SAF 420'
    t1.font = { bold: true, size: 11 }
    t1.alignment = { horizontal: 'center', vertical: 'middle' }
    hoja.getRow(1).height = 18

    // Fila 2: Subtítulo
    hoja.mergeCells('A2:P2')
    const t2 = hoja.getCell('A2')
    t2.value = `${titulo} - INFORME CORRESPONDIENTE AL MES DE ${mesNombre} ${anio}`
    t2.font = { bold: true, size: 10 }
    t2.alignment = { horizontal: 'center', vertical: 'middle' }
    hoja.getRow(2).height = 16

    // Fila 3: Encabezados
    const encabezados = [
      'Nº', 'Nº Cta', 'Denominacion Beneficiario', 'Observaciones OP',
      'F.F.', 'CGto', 'Tipo OP', 'Nº Id. Trámite', 'Ejer Id. Trámite',
      'Nº SIDIF OP', 'F.Registro PG', 'Nº OP',
      'Imp. Neto M.C.I', 'Imp. Retenido M.C.L', 'Imp. Bruto M.C.L', 'Fecha de Visado',
    ]
    const filaEnc = hoja.getRow(3)
    filaEnc.height = 28
    encabezados.forEach((enc, i) => {
      const celda = filaEnc.getCell(i + 1)
      celda.value = enc
      celda.font = { bold: true, size: 9 }
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_ENCABEZADO }
      celda.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      celda.border = BORDE
    })

    const anchos = [5, 10, 30, 20, 6, 8, 8, 18, 10, 12, 12, 10, 15, 15, 15, 14]
    anchos.forEach((w, i) => { hoja.getColumn(i + 1).width = w })

    // Filas de datos
    let totalNeto = 0, totalRetenido = 0, totalBruto = 0
    exps.forEach((exp, idx) => {
      const fila = hoja.getRow(idx + 4)
      fila.height = 14
      const valores = [
        idx + 1,
        exp.ctaFinanc || exp.cta_financ || '',
        exp.denominacion || '',
        exp.observOp || exp.observ_op || '',
        exp.ff || '',
        exp.cgto || '',
        exp.tipoOp || exp.tipo_op || '',
        exp.nroExpediente || exp.nro_expediente || '',
        exp.ejercTramite || exp.ejer_tramite || '',
        exp.nroSidif || exp.nro_sidif || '',
        exp.fRegistro || exp.f_registro || '',
        exp.nroOp || exp.nro_op || '',
        parseFloat(exp.impNeto || exp.imp_neto) || 0,
        parseFloat(exp.impRetenido || exp.imp_retenido) || 0,
        parseFloat(exp.impBruto || exp.imp_bruto) || 0,
        exp.fechaVisado || exp.fecha_visado || '',
      ]
      valores.forEach((val, ci) => {
        const celda = fila.getCell(ci + 1)
        celda.value = val
        celda.font = { size: 8 }
        celda.border = BORDE
        celda.alignment = { vertical: 'middle' }
        if (ci >= 12 && ci <= 14) {
          celda.numFmt = '#,##0.00'
          celda.alignment = { horizontal: 'right', vertical: 'middle' }
        }
        if ([0, 4, 5, 6, 8, 11].includes(ci)) {
          celda.alignment = { horizontal: 'center', vertical: 'middle' }
        }
      })
      totalNeto     += parseFloat(exp.impNeto || exp.imp_neto) || 0
      totalRetenido += parseFloat(exp.impRetenido || exp.imp_retenido) || 0
      totalBruto    += parseFloat(exp.impBruto || exp.imp_bruto) || 0
    })

    // Fila TOTAL
    const filaTotal = hoja.getRow(exps.length + 4)
    filaTotal.height = 16
    for (let ci = 1; ci <= 16; ci++) {
      const c = filaTotal.getCell(ci)
      c.border = BORDE
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_ENCABEZADO }
    }
    const cTotal = filaTotal.getCell(12)
    cTotal.value = 'TOTAL'
    cTotal.font = { bold: true, size: 9 }
    cTotal.alignment = { horizontal: 'right', vertical: 'middle' }

    ;[{ ci: 13, val: totalNeto }, { ci: 14, val: totalRetenido }, { ci: 15, val: totalBruto }]
      .forEach(({ ci, val }) => {
        const c = filaTotal.getCell(ci)
        c.value = val
        c.font = { bold: true, size: 9 }
        c.numFmt = '#,##0.00'
        c.alignment = { horizontal: 'right', vertical: 'middle' }
      })
  }

  const nombreArchivo = `planilla_${mes}-${anio}.xlsx`
  const rutaArchivo = path.join(dirSalida, nombreArchivo)
  await workbook.xlsx.writeFile(rutaArchivo)
  return rutaArchivo
}

async function generarPDFPlanilla({ mes, anio, expedientes, programas, porPrograma, dirSalida }) {
  const mesNombre = MESES[mes - 1]
  const grupos = construirGrupos(expedientes, programas, porPrograma)

  const secciones = grupos.map(({ titulo, exps }) => {
    let totalNeto = 0, totalRetenido = 0, totalBruto = 0

    const filasHTML = exps.map((exp, idx) => {
      const neto     = parseFloat(exp.impNeto || exp.imp_neto) || 0
      const retenido = parseFloat(exp.impRetenido || exp.imp_retenido) || 0
      const bruto    = parseFloat(exp.impBruto || exp.imp_bruto) || 0
      totalNeto     += neto
      totalRetenido += retenido
      totalBruto    += bruto
      return `<tr>
        <td style="text-align:center">${idx + 1}</td>
        <td>${exp.ctaFinanc || exp.cta_financ || ''}</td>
        <td>${exp.denominacion || ''}</td>
        <td>${exp.observOp || exp.observ_op || ''}</td>
        <td style="text-align:center">${exp.ff || ''}</td>
        <td style="text-align:center">${exp.cgto || ''}</td>
        <td style="text-align:center">${exp.tipoOp || exp.tipo_op || ''}</td>
        <td>${exp.nroExpediente || exp.nro_expediente || ''}</td>
        <td style="text-align:center">${exp.ejercTramite || exp.ejer_tramite || ''}</td>
        <td>${exp.nroSidif || exp.nro_sidif || ''}</td>
        <td>${exp.fRegistro || exp.f_registro || ''}</td>
        <td style="text-align:center">${exp.nroOp || exp.nro_op || ''}</td>
        <td style="text-align:right">$${formatearMoneda(neto)}</td>
        <td style="text-align:right">$${formatearMoneda(retenido)}</td>
        <td style="text-align:right">$${formatearMoneda(bruto)}</td>
        <td style="text-align:center">${exp.fechaVisado || exp.fecha_visado || ''}</td>
      </tr>`
    }).join('')

    return `
      <div class="programa" style="page-break-after:always;">
        <h2>DELEGACION FISCAL: PROGRAMA NACIONAL Nº 2 PACTO FEDERAL - SAF 420</h2>
        <h3>${titulo} - INFORME CORRESPONDIENTE AL MES DE ${mesNombre} ${anio}</h3>
        <table>
          <thead>
            <tr>
              <th>Nº</th><th>Nº Cta</th><th>Denominacion Beneficiario</th>
              <th>Observaciones OP</th><th>F.F.</th><th>CGto</th><th>Tipo OP</th>
              <th>Nº Id. Trámite</th><th>Ejer Id. Trámite</th><th>Nº SIDIF OP</th>
              <th>F.Registro PG</th><th>Nº OP</th>
              <th>Imp. Neto M.C.I</th><th>Imp. Retenido M.C.L</th>
              <th>Imp. Bruto M.C.L</th><th>Fecha de Visado</th>
            </tr>
          </thead>
          <tbody>
            ${filasHTML}
            <tr class="total">
              <td colspan="12" style="text-align:right;font-weight:bold">TOTAL</td>
              <td style="text-align:right;font-weight:bold">$${formatearMoneda(totalNeto)}</td>
              <td style="text-align:right;font-weight:bold">$${formatearMoneda(totalRetenido)}</td>
              <td style="text-align:right;font-weight:bold">$${formatearMoneda(totalBruto)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page { size: 14in 8.5in; margin: 1cm 1.5cm; }
    body { font-family: Arial, sans-serif; font-size: 7pt; }
    h2 { font-size: 9pt; text-align: center; margin: 4px 0; font-weight: bold; }
    h3 { font-size: 8pt; text-align: center; margin: 2px 0 8px 0; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #000; padding: 2px 4px; font-size: 7pt; }
    thead th { background: #D9D9D9; font-weight: bold; text-align: center; }
    tr.total td { background: #D9D9D9; }
  </style>
</head>
<body>${secciones}</body>
</html>`

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
    ],
  })
  try {
    const pagina = await browser.newPage()
    await pagina.setContent(html, { waitUntil: 'networkidle0' })
    const nombreArchivo = `planilla_${mes}-${anio}.pdf`
    const rutaArchivo = path.join(dirSalida, nombreArchivo)
    await pagina.pdf({
      path: rutaArchivo,
      landscape: true,
      format: 'Legal',
      printBackground: true,
      margin: { top: '1cm', right: '1.5cm', bottom: '1cm', left: '1.5cm' },
    })
    return rutaArchivo
  } finally {
    await browser.close()
  }
}

async function generarPlanilla({ mes, anio, expedientes, programas, porPrograma, dirSalida }) {
  const [rutaExcel, rutaPDF] = await Promise.all([
    generarExcel({ mes, anio, expedientes, programas, porPrograma, dirSalida }),
    generarPDFPlanilla({ mes, anio, expedientes, programas, porPrograma, dirSalida }),
  ])
  const mesNombre = MESES[mes - 1]
  return [
    { tipo: `Planilla Excel — ${mesNombre} ${anio}`, nombre: path.basename(rutaExcel), url: `/exports/${path.basename(rutaExcel)}` },
    { tipo: `Planilla PDF — ${mesNombre} ${anio}`,   nombre: path.basename(rutaPDF),   url: `/exports/${path.basename(rutaPDF)}` },
  ]
}

module.exports = generarPlanilla
