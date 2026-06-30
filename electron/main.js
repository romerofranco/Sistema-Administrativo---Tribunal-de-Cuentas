const { app, BrowserWindow, shell, dialog } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

// Determinar si estamos en desarrollo o producción
const esDev = process.env.NODE_ENV !== 'production'
const URL_DEV = 'http://localhost:5173'
const URL_PROD = path.join(__dirname, '../dist/index.html')

let ventanaPrincipal = null
let procesoServidor = null

// Iniciar el servidor Express en background
function iniciarServidor() {
  const rutaServidor = esDev
    ? path.join(__dirname, '../server/index.js')
    : path.join(process.resourcesPath, 'server/index.js')

  procesoServidor = spawn('node', [rutaServidor], {
    env: { ...process.env, NODE_ENV: esDev ? 'development' : 'production' },
    stdio: 'pipe',
  })

  procesoServidor.stdout.on('data', (datos) => {
    console.log('[Servidor]', datos.toString().trim())
  })

  procesoServidor.stderr.on('data', (datos) => {
    console.error('[Servidor Error]', datos.toString().trim())
  })

  procesoServidor.on('close', (codigo) => {
    console.log(`[Servidor] Proceso terminado con código ${codigo}`)
  })
}

function crearVentana() {
  ventanaPrincipal = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: 'Sistema de Expedientes — Tribunal de Cuentas La Rioja',
    show: false, // Mostrar solo cuando esté listo
  })

  // Cargar URL según entorno
  if (esDev) {
    ventanaPrincipal.loadURL(URL_DEV)
    ventanaPrincipal.webContents.openDevTools()
  } else {
    ventanaPrincipal.loadFile(URL_PROD)
  }

  // Mostrar la ventana cuando termine de cargar
  ventanaPrincipal.once('ready-to-show', () => {
    ventanaPrincipal.show()
    ventanaPrincipal.maximize()
  })

  // Abrir links externos en el navegador del sistema
  ventanaPrincipal.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  ventanaPrincipal.on('closed', () => {
    ventanaPrincipal = null
  })
}

app.whenReady().then(() => {
  iniciarServidor()

  // Esperar un momento para que el servidor levante
  setTimeout(crearVentana, 1500)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) crearVentana()
  })
})

app.on('window-all-closed', () => {
  // Terminar el servidor al cerrar la app
  if (procesoServidor) {
    procesoServidor.kill()
  }
  if (process.platform !== 'darwin') app.quit()
})

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  console.error('Error no capturado:', error)
  dialog.showErrorBox(
    'Error del Sistema',
    `Ocurrió un error inesperado:\n${error.message}`
  )
})
