const {
  Document, Packer, Paragraph, TextRun,
  Table, TableRow, TableCell, ImageRun,
  AlignmentType, WidthType, BorderStyle,
} = require('docx')
const path = require('path')
const fs   = require('fs')
const { format } = require('date-fns')
const { es }     = require('date-fns/locale')

const MESES = [
  'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE',
]

// Celda / tabla sin bordes visibles
const SIN_BORDE = { style: BorderStyle.NIL, size: 0, color: 'FFFFFF' }
const BORDES_CELDA  = { top: SIN_BORDE, bottom: SIN_BORDE, left: SIN_BORDE, right: SIN_BORDE }
const BORDES_TABLA  = { ...BORDES_CELDA, insideHorizontal: SIN_BORDE, insideVertical: SIN_BORDE }

// Convierte mm -> twips (1 twip = 1/1440 in, 1 in ≈ 25.4 mm)
const mmATwips = mm => Math.round((mm / 25.4) * 1440)

// Ancho del área de contenido: 8.5in (12240 twips) - margen izq 3cm - margen der 2.5cm
const ANCHO_TOTAL   = 12240 - mmATwips(30) - mmATwips(25) // ≈ 9119 twips
const ANCHO_LOGO_COL = mmATwips(55)                        // ≈ 3118 twips (~5.5cm)
const ANCHO_DATOS_COL = ANCHO_TOTAL - ANCHO_LOGO_COL

// Lee el logo y calcula el tamaño de visualización manteniendo aspect ratio
function obtenerLogo() {
  const candidatos = [
    path.join(__dirname, '../../../public/logo-tribunal.png'),
    path.join(__dirname, '../../../assets/logo-tribunal.png'),
    path.join(process.cwd(), 'public/logo-tribunal.png'),
    path.join(process.cwd(), 'assets/logo-tribunal.png'),
  ]
  for (const p of candidatos) {
    if (fs.existsSync(p)) return fs.readFileSync(p)
  }
  return null
}

function dimensionesLogo(buf, targetWidth = 140) {
  try {
    const w = buf.readUInt32BE(16)
    const h = buf.readUInt32BE(20)
    return { width: targetWidth, height: Math.round(targetWidth * h / w) }
  } catch {
    return { width: targetWidth, height: targetWidth }
  }
}

// Helper: párrafo con TextRun único (simplifica el código repetitivo)
function p(runs, opts = {}) {
  const normalizeRun = r => (typeof r === 'string')
    ? new TextRun({ text: r, font: 'Times New Roman', size: opts.size ?? 24 })
    : r
  return new Paragraph({
    alignment: opts.alignment ?? AlignmentType.LEFT,
    spacing:   { after: opts.after ?? 120, before: opts.before ?? 0 },
    indent:    opts.indent ? { left: opts.indent } : undefined,
    children:  Array.isArray(runs) ? runs.map(normalizeRun) : [normalizeRun(runs)],
  })
}

// Helper: TextRun con font/size ya seteados
function tr(text, opts = {}) {
  return new TextRun({
    text,
    font:      'Times New Roman',
    size:      opts.size ?? 24,
    bold:      opts.bold ?? false,
    underline: opts.underline ? {} : undefined,
    italics:   opts.italics ?? false,
  })
}

function construirResponsablesDocx(responsables) {
  if (!responsables?.length) return [p('(Sin responsables registrados)')]

  const parrafos = []
  for (const r of responsables) {
    const cargo   = (r.cargo || '').toUpperCase()
    const programa = r.numero_programa ? ` PROGRAMA N.º ${r.numero_programa}` : ''
    parrafos.push(p(
      [tr(cargo + programa, { bold: true, underline: true })],
      { after: 40, before: 200 }
    ))
    if (r.nombre_completo) parrafos.push(p([tr(`${r.nombre_completo}.`)], { after: 40 }))
    if (r.dni)             parrafos.push(p([tr(`DNI N.º: ${r.dni}`)],     { after: 40 }))
    if (r.domicilio)       parrafos.push(p([tr(`Domicilio: ${r.domicilio}`)], { after: 40 }))
    if (r.email)           parrafos.push(p([tr(r.email)],                  { after: 40 }))
  }
  return parrafos
}

async function generarNotaDocx({ mes, anio, numeroNota, expedientes, responsables, config, dirSalida }) {
  const fechaHoy       = new Date()
  const mesNombre      = MESES[mes - 1]
  const fecha          = `LA RIOJA, ${format(fechaHoy, "d 'de' MMMM 'de' yyyy", { locale: es }).toUpperCase()}.-`
  const totalOPs       = expedientes.length
  const presidente     = config?.presidente_nombre || 'CR. MENEM JORGE'
  const cargoLineas    = (config?.presidente_cargo_texto || 'SEÑOR PRESIDENTE DEL\nTRIBUNAL DE CUENTAS').split('\n')

  // ── Logo ──────────────────────────────────────────────────────────────────
  const logoBuffer = obtenerLogo()
  const logoSize   = logoBuffer ? dimensionesLogo(logoBuffer, 140) : null

  const celdaLogo = new TableCell({
    width:   { size: ANCHO_LOGO_COL, type: WidthType.DXA },
    borders: BORDES_CELDA,
    children: logoBuffer ? [
      new Paragraph({
        children: [new ImageRun({ data: logoBuffer, transformation: logoSize, type: 'png' })],
        spacing: { after: 0 },
      }),
    ] : [p('')],
  })

  const celdaDatos = new TableCell({
    width:   { size: ANCHO_DATOS_COL, type: WidthType.DXA },
    borders: BORDES_CELDA,
    children: [
      p([tr(fecha,                               { size: 22 })], { alignment: AlignmentType.RIGHT, after: 60  }),
      p([tr('REF." INFORME MENSUAL"',            { size: 22, bold: true })], { alignment: AlignmentType.RIGHT, after: 60 }),
      p([tr(`MES DE ${mesNombre} ${anio}`,       { size: 22, bold: true })], { alignment: AlignmentType.RIGHT, after: 60 }),
      p([tr(`NOTA:${numeroNota}`,                { size: 22 })],             { alignment: AlignmentType.RIGHT, after: 0  }),
    ],
  })

  const tablaEncabezado = new Table({
    width:        { size: ANCHO_TOTAL, type: WidthType.DXA },
    columnWidths: [ANCHO_LOGO_COL, ANCHO_DATOS_COL],
    borders:      BORDES_TABLA,
    rows: [new TableRow({ children: [celdaLogo, celdaDatos] })],
  })

  // ── Destinatario ──────────────────────────────────────────────────────────
  const destinatario = [
    ...cargoLineas.map(linea => p([tr(linea, { bold: true })], { after: 40 })),
    p([tr(presidente,  { bold: true })], { after: 40 }),
    p([tr('S/D:',      { bold: true })], { after: 320 }),
  ]

  // ── Cuerpo (mismo texto que generarNota.js — hardcodeado igual para que
  //   PDF y Word tengan contenido idéntico; no se lee texto_nota_cuerpo
  //   porque el PDF tampoco lo hace hoy) ─────────────────────────────────────
  const cuerpo = [
    p([tr('De mi mayor consideracion')],                        { after: 280 }),
    p([tr('Por la presente me dirijo a Ud., a los fines de:')], { after: 200, alignment: AlignmentType.JUSTIFIED }),

    // Ítem 1
    p([
      tr('1.   ', { bold: true }),
      tr('Elevar planilla, correspondiente a Ordenes de Pago pagadas por '),
      tr('S.A.F 420, Pacto Federal Programa Nacional N.º 2', { bold: true }),
      tr(` y visadas por esta Delegación Fiscal en el mes de `),
      tr(mesNombre, { bold: true }),
      tr(` de ${anio}. Se Adjunta Anexo 1., conforme a lo establecido en el artículo 316 y 319 de la Resolución 19/19 del Tribunal de Cuentas.`),
    ], { after: 160, alignment: AlignmentType.JUSTIFIED }),

    p([tr(`TOTAL, DE ORDENES DE PAGO VISADAS: ${totalOPs}`, { bold: true })], { after: 200, indent: 720 }),

    // Ítem 2
    p([
      tr('2.   ', { bold: true }),
      tr('Se informa Listado de responsables del Organismo al día de la Fecha:'),
    ], { after: 160, alignment: AlignmentType.JUSTIFIED }),
  ]

  // ── Responsables ──────────────────────────────────────────────────────────
  const bloqueResponsables = construirResponsablesDocx(responsables)

  // ── Firma ─────────────────────────────────────────────────────────────────
  const firma = [
    p([tr('Sin otro particular saludo a Ud. Atentamente. -')], { before: 1440, after: 0 }),
  ]

  // ── Documento ─────────────────────────────────────────────────────────────
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 12240, height: 20160 },  // 8.5in x 14in (Legal)
          margin: {
            top:    mmATwips(20),
            right:  mmATwips(25),
            bottom: mmATwips(20),
            left:   mmATwips(30),
          },
        },
      },
      children: [
        tablaEncabezado,
        p('', { after: 360 }),  // espacio bajo el encabezado
        ...destinatario,
        ...cuerpo,
        ...bloqueResponsables,
        ...firma,
      ],
    }],
  })

  const buffer = await Packer.toBuffer(doc)
  const nombreArchivo = `nota_${String(numeroNota).replace(/\//g, '-')}_${mes}-${anio}.docx`
  const rutaArchivo   = path.join(dirSalida, nombreArchivo)
  fs.writeFileSync(rutaArchivo, buffer)
  return rutaArchivo
}

module.exports = generarNotaDocx
