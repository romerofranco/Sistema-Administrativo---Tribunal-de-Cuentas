const { google } = require('googleapis')

// Columnas exactas del Google Sheet (1-indexed)
const COLUMNAS = {
  FILA:         'A',  // Col 1
  CTA_FINANC:   'B',  // Col 2
  // C vacía
  DENOMINACION: 'D',  // Col 4
  OBSERV_OP:    'E',  // Col 5
  FF:           'F',  // Col 6
  CGTO:         'G',  // Col 7
  TIPO_OP:      'H',  // Col 8
  // I vacía
  NRO_EXPEDIENTE: 'J',// Col 10
  EJER_TRAMITE:   'K',// Col 11
  // L-P vacías
  NRO_SIDIF:    'Q',  // Col 17
  F_REGISTRO:   'R',  // Col 18
  NRO_OP:       'S',  // Col 19
  IMP_NETO:     'T',  // Col 20
  IMP_RETENIDO: 'U',  // Col 21
  IMP_BRUTO:    'V',  // Col 22
  FECHA_VISADO: 'W',  // Col 23
  ENTRADA:      'X',  // Col 24
  FS_ENTRADA:   'Y',  // Col 25
  OBSERVACION:  'Z',  // Col 26
  SALIDA:       'AA', // Col 27
  FS_SALIDA:    'AB', // Col 28
  FIRMA:        'AC', // Col 29
}

// Rango completo de datos (desde fila 2 para saltear encabezado)
const RANGO_DATOS = `${process.env.GOOGLE_SHEET_NAME || 'Hoja1'}!A2:AC`
const RANGO_COMPLETO = `${process.env.GOOGLE_SHEET_NAME || 'Hoja1'}!A:AC`

let authClient = null
let sheets = null

// Verifica si las credenciales de Google están configuradas con valores reales
function credencialesConfiguradas() {
  const id    = process.env.GOOGLE_SHEET_ID || ''
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || ''
  const key   = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

  return (
    id.length > 10 &&
    !id.includes('tu_') &&
    email.includes('@') && email.includes('.iam.gserviceaccount.com') && !email.startsWith('tu_') &&
    key.includes('-----BEGIN') && key.length > 500  // clave real tiene >1600 chars
  )
}

// Inicializar autenticación con Service Account
async function inicializarAuth() {
  if (!credencialesConfiguradas()) {
    throw new Error('Google Sheets no está configurado. Completá el archivo .env con las credenciales reales.')
  }

  if (authClient) return authClient

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  })

  authClient = await auth.getClient()
  sheets = google.sheets({ version: 'v4', auth: authClient })
  return authClient
}

// Convierte números formateados en AR ($1.234,56 / 1.234,56 / 1234.56) a float
function parsearImporte(valor) {
  if (valor === null || valor === undefined || valor === '') return 0
  if (typeof valor === 'number') return valor
  const s = String(valor)
    .replace(/\s/g, '')    // espacios
    .replace(/\$/g, '')    // símbolo de moneda
    .replace(/\./g, '')    // puntos de miles (formato AR)
    .replace(',', '.')     // coma decimal → punto decimal
  return parseFloat(s) || 0
}

// Convierte DD/MM/YYYY → YYYY-MM-DD (ISO). Si ya es ISO o vacío, lo devuelve tal cual.
function normalizarFecha(valor) {
  if (!valor) return ''
  const s = String(valor).trim()
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  return s
}

// Convierte string de fecha (cualquier formato) a objeto Date para comparar
function parsearFecha(valor) {
  if (!valor) return null
  const iso = normalizarFecha(valor)
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

// Convertir una fila de array a objeto expediente
function arrayAExpediente(fila, indice) {
  return {
    fila: indice + 2, // +2 porque la hoja empieza en fila 2
    ctaFinanc:    fila[1]  || '',
    denominacion: fila[3]  || '',
    observOp:     fila[4]  || '',
    ff:           fila[5]  || '',
    cgto:         fila[6]  || '',
    tipoOp:       fila[7]  || '',
    nroExpediente: fila[9] || '',
    ejercTramite: fila[10] || '',
    nroSidif:     fila[16] || '',
    fRegistro:    normalizarFecha(fila[17]),
    nroOp:        fila[18] || '',
    impNeto:      parsearImporte(fila[19]),
    impRetenido:  parsearImporte(fila[20]),
    impBruto:     parsearImporte(fila[21]),
    fechaVisado:  normalizarFecha(fila[22]),
    entrada:      normalizarFecha(fila[23]),
    fsEntrada:    fila[24] || '',
    observacion:  fila[25] || '',
    salida:       normalizarFecha(fila[26]),
    fsSalida:     fila[27] || '',
    firma:        fila[28] || '',
    estado: fila[22] ? 'VISADO' : 'PENDIENTE',
  }
}

// Convertir objeto expediente a array para Sheets
function expedienteAArray(datos) {
  const fila = new Array(29).fill('')
  fila[1]  = datos.ctaFinanc     || ''
  fila[3]  = datos.denominacion  || ''
  fila[4]  = datos.observOp      || ''
  fila[5]  = datos.ff            || ''
  fila[6]  = datos.cgto          || ''
  fila[7]  = datos.tipoOp        || ''
  fila[9]  = datos.nroExpediente || ''
  fila[10] = datos.ejercTramite  || ''
  fila[16] = datos.nroSidif      || ''
  fila[17] = datos.fRegistro     || ''
  fila[18] = datos.nroOp         || ''
  fila[19] = datos.impNeto       || ''
  fila[20] = datos.impRetenido   || ''
  fila[21] = datos.impBruto      || ''
  fila[22] = datos.fechaVisado   || ''
  fila[23] = datos.entrada       || ''
  fila[24] = datos.fsEntrada     || ''
  fila[25] = datos.observacion   || ''
  fila[26] = datos.salida        || ''
  fila[27] = datos.fsSalida      || ''
  fila[28] = datos.firma         || ''
  return fila
}

// Colores de estado para formato de celdas
const COLORES_ESTADO = {
  VISADO:     { red: 1,    green: 1,    blue: 1    },  // Blanco
  PENDIENTE:  { red: 1,    green: 1,    blue: 0    },  // Amarillo
  OBSERVADO:  { red: 1,    green: 0,    blue: 0    },  // Rojo
  EN_PROCESO: { red: 0,    green: 1,    blue: 0    },  // Verde
}

// ─── API PÚBLICA ─────────────────────────────────────────────────────────────

async function listarExpedientes({ pagina = 1, porPagina = 50, busqueda = '', mes, anio, estado, tipoOp } = {}) {
  await inicializarAuth()

  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGO_DATOS,
  })

  let filas = respuesta.data.values || []
  let todos = filas.map((fila, i) => arrayAExpediente(fila, i)).filter(e => e.denominacion || e.nroExpediente)

  // Aplicar filtros
  if (busqueda) {
    const b = busqueda.toLowerCase()
    todos = todos.filter(e =>
      e.denominacion.toLowerCase().includes(b) ||
      e.nroExpediente.toLowerCase().includes(b) ||
      String(e.nroSidif).includes(b) ||
      String(e.nroOp).includes(b)
    )
  }

  if (mes && anio) {
    todos = todos.filter(e => {
      if (!e.fechaVisado) return false
      const fecha = new Date(e.fechaVisado)
      return fecha.getMonth() + 1 === mes && fecha.getFullYear() === anio
    })
  }

  if (estado) todos = todos.filter(e => e.estado === estado)
  if (tipoOp) todos = todos.filter(e => e.tipoOp === tipoOp)

  const total = todos.length
  const inicio = (pagina - 1) * porPagina
  const expedientes = todos.slice(inicio, inicio + porPagina)

  return { expedientes, total }
}

async function crearExpediente(datos) {
  await inicializarAuth()

  const valores = [expedienteAArray(datos)]
  const respuesta = await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGO_COMPLETO,
    valueInputOption: 'USER_ENTERED',
    resource: { values: valores },
  })

  // Extraer número de fila del resultado
  const rangoActualizado = respuesta.data.updates.updatedRange
  const fila = parseInt(rangoActualizado.match(/\d+/g)?.pop() || '0')
  return { fila, rangoActualizado }
}

async function actualizarExpediente(numeroFila, datos) {
  await inicializarAuth()

  const hoja = process.env.GOOGLE_SHEET_NAME || 'Hoja1'
  const rango = `${hoja}!A${numeroFila}:AC${numeroFila}`
  const valores = [expedienteAArray(datos)]

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: rango,
    valueInputOption: 'USER_ENTERED',
    resource: { values: valores },
  })
}

async function cambiarEstadoExpediente(numeroFila, estado) {
  await inicializarAuth()

  const color = COLORES_ESTADO[estado] || COLORES_ESTADO.VISADO

  // Obtener el sheetId (id de la hoja específica)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID })
  const hojaNombre = process.env.GOOGLE_SHEET_NAME || 'Hoja1'
  const hojaInfo = meta.data.sheets.find(h => h.properties.title === hojaNombre)
  const sheetId = hojaInfo?.properties.sheetId || 0

  const fila = parseInt(numeroFila)

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    resource: {
      requests: [{
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: fila - 1,
            endRowIndex: fila,
            startColumnIndex: 0,
            endColumnIndex: 29,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: color,
            },
          },
          fields: 'userEnteredFormat.backgroundColor',
        },
      }],
    },
  })
}

async function resumenMes(mes, anio) {
  const resultado = await listarExpedientes({ mes, anio, porPagina: 9999, pagina: 1 })
  const exps = resultado.expedientes

  return {
    total: exps.length,
    totalBruto: exps.reduce((acc, e) => acc + e.impBruto, 0),
    totalNeto: exps.reduce((acc, e) => acc + e.impNeto, 0),
    porEstado: {
      VISADO:     exps.filter(e => e.estado === 'VISADO').length,
      PENDIENTE:  exps.filter(e => e.estado === 'PENDIENTE').length,
      OBSERVADO:  exps.filter(e => e.estado === 'OBSERVADO').length,
      EN_PROCESO: exps.filter(e => e.estado === 'EN_PROCESO').length,
    },
  }
}

// Vacía el contenido de una fila en Google Sheets (sin borrar la fila)
async function eliminarExpediente(numeroFila) {
  await inicializarAuth()

  const hoja = process.env.GOOGLE_SHEET_NAME || 'Hoja1'
  const rango = `${hoja}!A${numeroFila}:AC${numeroFila}`

  await sheets.spreadsheets.values.clear({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: rango,
  })
}

// Devuelve TODOS los expedientes sin paginar (para importación a SQLite)
async function listarTodos() {
  await inicializarAuth()

  const respuesta = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: RANGO_DATOS,
  })

  const filas = respuesta.data.values || []
  return filas
    .map((fila, i) => arrayAExpediente(fila, i))
    .filter(e => e.denominacion || e.nroExpediente)
}

// Prueba la conexión obteniendo solo los metadatos del spreadsheet (rápido, sin leer datos)
async function probarConexion() {
  if (!credencialesConfiguradas()) {
    throw new Error(
      'Credenciales de Google no configuradas o incompletas. ' +
      'Verificar GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL y GOOGLE_PRIVATE_KEY en el archivo .env'
    )
  }
  await inicializarAuth()
  const meta = await sheets.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEET_ID })
  return {
    titulo:    meta.data.properties?.title || '(sin título)',
    hojas:     meta.data.sheets?.map(h => h.properties.title) || [],
    sheetId:   process.env.GOOGLE_SHEET_ID,
  }
}

module.exports = {
  listarExpedientes,
  listarTodos,
  crearExpediente,
  actualizarExpediente,
  cambiarEstadoExpediente,
  eliminarExpediente,
  resumenMes,
  probarConexion,
}
