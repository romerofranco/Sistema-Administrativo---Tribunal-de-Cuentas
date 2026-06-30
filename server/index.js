require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const { verificarToken } = require('./middleware/auth')

const app = express()
const PUERTO = process.env.PORT || 3001

// Headers de seguridad HTTP
app.use(helmet())

// Middlewares base
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Assets públicos (logo, iconos)
app.use('/assets', express.static(path.join(__dirname, '../assets')))

// Exports protegidos — requiere autenticación JWT válida
const EXPORTS_DIR = path.join(__dirname, '../exports')
app.get('/exports/:archivo', verificarToken, (req, res) => {
  const archivo = path.basename(req.params.archivo) // previene path traversal
  const rutaArchivo = path.join(EXPORTS_DIR, archivo)
  if (!fs.existsSync(rutaArchivo)) return res.status(404).json({ error: 'Archivo no encontrado' })
  res.sendFile(rutaArchivo)
})

// Rate limiting: máx. 10 intentos de login por IP cada 15 minutos
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente nuevamente en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
}))

// Rutas de la API
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/expedientes',   require('./routes/expedientes'))
app.use('/api/programas',     require('./routes/programas'))
app.use('/api/responsables',  require('./routes/responsables'))
app.use('/api/informes',      require('./routes/informes'))
app.use('/api/configuracion', require('./routes/configuracion'))
app.use('/api/sync',               require('./routes/sync'))
app.use('/api/control-preventivo', require('./routes/controlPreventivo'))
app.use('/api/libro-entrada',      require('./routes/libroEntrada'))
app.use('/api/auditoria',          require('./routes/auditoria'))

// Health check para verificar conectividad
app.get('/api/health', (req, res) => {
  res.json({ estado: 'ok', timestamp: new Date().toISOString() })
})

// Manejo centralizado de errores
app.use((err, req, res, next) => {
  console.error('[Error API]', err.stack)
  const codigo = err.status || 500
  res.status(codigo).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
})

app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`)
  console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`)
})

module.exports = app
