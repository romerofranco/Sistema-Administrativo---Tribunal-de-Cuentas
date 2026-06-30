const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')
const { format } = require('date-fns')
const { es } = require('date-fns/locale')

const MESES = [
  'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
  'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE',
]

function formatearMonedaHTML(valor) {
  const num = parseFloat(valor) || 0
  return num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Busca el logo en public/ y en assets/ (compatibilidad)
function obtenerLogoBase64() {
  const candidatos = [
    path.join(__dirname, '../../../public/logo-tribunal.png'),
    path.join(__dirname, '../../../assets/logo-tribunal.png'),
    path.join(process.cwd(), 'public/logo-tribunal.png'),
    path.join(process.cwd(), 'assets/logo-tribunal.png'),
  ]
  for (const p of candidatos) {
    if (fs.existsSync(p)) {
      return `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
    }
  }
  return ''
}

function construirBloqueResponsables(responsables) {
  if (!responsables || responsables.length === 0) return '<p><em>(Sin responsables registrados)</em></p>'

  return responsables.map(r => {
    const cargo = r.cargo || ''
    const nombre = r.nombre_completo || ''
    const dni = r.dni || ''
    const domicilio = r.domicilio || ''
    const email = r.email || ''
    const programa = r.numero_programa ? `Programa N.º ${r.numero_programa}` : ''

    let html = `<p style="font-weight:bold;text-decoration:underline;margin:14px 0 2px 0;text-transform:uppercase;">${cargo}${programa ? ' ' + programa.toUpperCase() : ''}</p>`
    html += `<p style="margin:1px 0;">${nombre}.</p>`
    if (dni) html += `<p style="margin:1px 0;">DNI N.º: ${dni}</p>`
    if (domicilio) html += `<p style="margin:1px 0;">Domicilio: ${domicilio}</p>`
    if (email) html += `<p style="margin:1px 0;">${email}</p>`
    return html
  }).join('')
}

function construirHTMLNota({ mes, anio, numeroNota, expedientes, responsables, config }) {
  const fechaHoy = new Date()
  const mesNombre = MESES[mes - 1]
  const fechaInstitucional = `LA RIOJA, ${format(fechaHoy, "d 'de' MMMM 'de' yyyy", { locale: es }).toUpperCase()}.-`
  const logoBase64 = obtenerLogoBase64()

  const totalOPs = expedientes.length
  const presidente = config?.presidente_nombre || 'CR. MENEM JORGE'
  const presidenteCargo = (config?.presidente_cargo_texto || 'SEÑOR PRESIDENTE DEL\nTRIBUNAL DE CUENTAS')
    .split('\n').join('<br>')

  const bloqueResponsables = construirBloqueResponsables(responsables)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: 8.5in 14in;
      margin: 2cm 2.5cm 2cm 3cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
    }
    .encabezado {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 28px;
    }
    .celda-logo { width: 130px; vertical-align: top; }
    .celda-datos { text-align: right; vertical-align: top; font-size: 11pt; line-height: 1.4; }
    .celda-datos p { margin: 2px 0; }
    .ref-bold { font-weight: bold; }
    .destinatario { margin: 18px 0 10px 0; }
    .destinatario p { margin: 1px 0; font-weight: bold; font-size: 11pt; }
    .saludo { margin: 16px 0 8px 0; }
    .cuerpo p { margin-bottom: 10px; text-align: justify; }
    .item { margin: 14px 0; }
    .item-numero { font-weight: bold; }
    .total-linea { font-weight: bold; margin-left: 35px; margin-top: 10px; }
    .firma { margin-top: 60px; }
  </style>
</head>
<body>

  <!-- Encabezado: logo izquierda, datos nota derecha -->
  <table class="encabezado">
    <tr>
      <td class="celda-logo">
        ${logoBase64 ? `<img src="${logoBase64}" style="width:120px;height:auto;" alt="Tribunal de Cuentas" />` : ''}
      </td>
      <td class="celda-datos">
        <p>${fechaInstitucional}</p>
        <p class="ref-bold">REF.&rdquo; INFORME MENSUAL&rdquo;</p>
        <p class="ref-bold">MES DE ${mesNombre} ${anio}</p>
        <p>NOTA:${numeroNota}</p>
      </td>
    </tr>
  </table>

  <div class="destinatario">
    <p>${presidenteCargo}</p>
    <p>${presidente}</p>
    <p>S/D:</p>
  </div>

  <p class="saludo">De mi mayor consideracion</p>

  <div class="cuerpo">
    <p>Por la presente me dirijo a Ud., a los fines de:</p>

    <div class="item">
      <span class="item-numero">1.</span>&nbsp;&nbsp;
      Elevar planilla, correspondiente a Ordenes de Pago pagadas por <strong>S.A.F 420,
      Pacto Federal Programa Nacional N.&ordm; 2</strong> y visadas por esta Delegación Fiscal
      en el mes de <strong>${mesNombre}</strong> de ${anio}. Se Adjunta Anexo 1., conforme a lo establecido
      en el artículo 316 y 319 de la Resolución 19/19 del Tribunal de Cuentas.
    </div>

    <p class="total-linea">TOTAL, DE ORDENES DE PAGO VISADAS: ${totalOPs}</p>

    <div class="item" style="margin-top:18px;">
      <span class="item-numero">2.</span>&nbsp;&nbsp;
      Se informa Listado de responsables del Organismo al día de la Fecha:
    </div>

    <div style="margin-left:35px;">
      ${bloqueResponsables}
    </div>
  </div>

  <div class="firma">
    <p>Sin otro particular saludo a Ud. Atentamente. -</p>
  </div>

</body>
</html>`
}

async function generarNota({ mes, anio, numeroNota, expedientes, responsables, config, dirSalida }) {
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
    const html = construirHTMLNota({ mes, anio, numeroNota, expedientes, responsables, config })
    await pagina.setContent(html, { waitUntil: 'networkidle0' })

    const nombreArchivo = `nota_${String(numeroNota).replace(/\//g, '-')}_${mes}-${anio}.pdf`
    const rutaArchivo = path.join(dirSalida, nombreArchivo)

    await pagina.pdf({
      path: rutaArchivo,
      format: 'Legal',
      printBackground: true,
      margin: { top: '2cm', right: '2.5cm', bottom: '2cm', left: '3cm' },
    })
    return rutaArchivo
  } finally {
    await browser.close()
  }
}

module.exports = generarNota
