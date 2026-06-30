import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatearMoneda } from '../utils/formateos'
import { useConexion, ESTADO_CONEXION } from '../context/ConexionContext'
import iconoBlanco from '../../assets/sinfondo.png'

const SECCIONES_DEFAULT = ['resumen', 'distribucion', 'tareas', 'sistema']

function TarjetaResumen({ titulo, valor, subvalor, color, icono }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{titulo}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{valor}</p>
          {subvalor && <p className="text-xs text-gray-400 mt-1">{subvalor}</p>}
        </div>
        <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('-700', '-100')}`}>
          {icono}
        </div>
      </div>
    </div>
  )
}

function IconoGrip() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z"/>
    </svg>
  )
}

function ListadoTareas() {
  const [tareas, setTareas] = useState(() => {
    try {
      const guardadas = localStorage.getItem('dashboard-tareas')
      return guardadas ? JSON.parse(guardadas) : []
    } catch { return [] }
  })
  const [nuevaTarea, setNuevaTarea] = useState('')
  const inputRef = useRef(null)

  const guardar = (lista) => {
    setTareas(lista)
    localStorage.setItem('dashboard-tareas', JSON.stringify(lista))
  }

  const agregar = (e) => {
    e.preventDefault()
    const texto = nuevaTarea.trim()
    if (!texto) return
    guardar([...tareas, { id: Date.now(), texto, completada: false }])
    setNuevaTarea('')
    inputRef.current?.focus()
  }

  const toggleCompletada = (id) => {
    guardar(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t))
  }

  const eliminar = (id) => {
    guardar(tareas.filter(t => t.id !== id))
  }

  const limpiarCompletadas = () => {
    guardar(tareas.filter(t => !t.completada))
  }

  const pendientes  = tareas.filter(t => !t.completada).length
  const completadas = tareas.filter(t => t.completada).length

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Listado de tareas</h3>
          {tareas.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {pendientes} pendiente{pendientes !== 1 ? 's' : ''}
              {completadas > 0 && ` · ${completadas} completada${completadas !== 1 ? 's' : ''}`}
            </p>
          )}
        </div>
        {completadas > 0 && (
          <button
            onClick={limpiarCompletadas}
            className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Eliminar tareas completadas"
          >
            Limpiar completadas
          </button>
        )}
      </div>

      {/* Input nueva tarea */}
      <form onSubmit={agregar} className="flex gap-2 mb-4">
        <input
          ref={inputRef}
          type="text"
          className="input-base flex-1 text-sm"
          placeholder="Escribir nueva tarea..."
          value={nuevaTarea}
          onChange={e => setNuevaTarea(e.target.value)}
          maxLength={200}
        />
        <button
          type="submit"
          disabled={!nuevaTarea.trim()}
          className="btn-primary px-4 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Agregar
        </button>
      </form>

      {/* Lista */}
      {tareas.length === 0 ? (
        <div className="text-center py-8 text-gray-400 dark:text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <p className="text-sm">No hay tareas todavía</p>
          <p className="text-xs mt-1">Agregá una tarea usando el campo de arriba</p>
        </div>
      ) : (
        <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {tareas.map(tarea => (
            <li
              key={tarea.id}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group
                ${tarea.completada
                  ? 'bg-gray-50 dark:bg-gray-700/40'
                  : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
            >
              <input
                type="checkbox"
                checked={tarea.completada}
                onChange={() => toggleCompletada(tarea.id)}
                className="w-4 h-4 rounded accent-blue-600 cursor-pointer flex-shrink-0"
              />
              <span className={`flex-1 text-sm leading-snug break-words min-w-0
                ${tarea.completada
                  ? 'line-through text-gray-400 dark:text-gray-500'
                  : 'text-gray-700 dark:text-gray-200'
                }`}>
                {tarea.texto}
              </span>
              <button
                onClick={() => eliminar(tarea.id)}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 dark:text-gray-600 dark:hover:text-red-400 transition-all p-0.5 rounded"
                title="Eliminar tarea"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Barra de progreso */}
      {tareas.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progreso</span>
            <span>{Math.round((completadas / tareas.length) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(completadas / tareas.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard() {
  const ahora = new Date()
  const [mes, setMes]       = useState(ahora.getMonth() + 1)
  const [anio, setAnio]     = useState(ahora.getFullYear())
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { estado } = useConexion()

  const [orden, setOrden] = useState(() => {
    try {
      const guardado = localStorage.getItem('dashboard-orden')
      if (!guardado) return [...SECCIONES_DEFAULT]
      const guardadoArr = JSON.parse(guardado)
      const nuevas = SECCIONES_DEFAULT.filter(s => !guardadoArr.includes(s))
      return [...guardadoArr, ...nuevas]
    } catch { return [...SECCIONES_DEFAULT] }
  })
  const [arrastrando, setArrastrando] = useState(null)
  const [sobreItem, setSobreItem]     = useState(null)

  useEffect(() => { cargarResumen() }, [mes, anio])

  const cargarResumen = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/expedientes/resumen-mes', { params: { mes, anio } })
      setResumen(data)
    } catch (err) {
      console.error('Error al cargar resumen:', err)
    } finally {
      setCargando(false)
    }
  }

  const MESES = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
  ]

  // ─── Drag & Drop ───────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    setArrastrando(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, id) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (sobreItem !== id) setSobreItem(id)
  }

  const handleDrop = (e, id) => {
    e.preventDefault()
    if (!arrastrando || arrastrando === id) return
    const nuevo = [...orden]
    const from  = nuevo.indexOf(arrastrando)
    const to    = nuevo.indexOf(id)
    nuevo.splice(from, 1)
    nuevo.splice(to, 0, arrastrando)
    setOrden(nuevo)
    localStorage.setItem('dashboard-orden', JSON.stringify(nuevo))
    setArrastrando(null)
    setSobreItem(null)
  }

  const handleDragEnd = () => { setArrastrando(null); setSobreItem(null) }

  // ─── Contenido de cada sección ─────────────────────────────────
  const seccionResumen = (
    <>
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : resumen ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <TarjetaResumen
            titulo="Total Expedientes"
            valor={resumen.total}
            subvalor={`${MESES[mes-1]} ${anio}`}
            color="text-blue-700"
            icono={
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          <TarjetaResumen
            titulo="Importe Bruto Total"
            valor={formatearMoneda(resumen.totalBruto)}
            subvalor="Suma de importes brutos"
            color="text-emerald-700"
            icono={
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <TarjetaResumen
            titulo="Pendientes"
            valor={resumen.porEstado?.PENDIENTE || 0}
            subvalor="Requieren acción"
            color="text-yellow-700"
            icono={
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <TarjetaResumen
            titulo="Observados"
            valor={resumen.porEstado?.OBSERVADO || 0}
            subvalor="Requieren revisión"
            color="text-red-700"
            icono={
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
        </div>
      ) : null}
    </>
  )

  const seccionDistribucion = resumen && (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Distribución por estado</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: 'VISADO',     label: 'Visados',    bg: 'bg-white border-2 border-gray-200',   text: 'text-gray-700' },
          { key: 'PENDIENTE',  label: 'Pendientes', bg: 'bg-yellow-50 border-2 border-yellow-200', text: 'text-yellow-800' },
          { key: 'OBSERVADO',  label: 'Observados', bg: 'bg-red-50 border-2 border-red-200',   text: 'text-red-800' },
          { key: 'EN_PROCESO', label: 'En Proceso', bg: 'bg-green-50 border-2 border-green-200', text: 'text-green-800' },
        ].map(({ key, label, bg, text }) => (
          <div key={key} className={`${bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${text}`}>{resumen.porEstado?.[key] || 0}</p>
            <p className={`text-xs font-medium mt-1 ${text}`}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const seccionSistema = (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Estado del sistema</h3>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">Fuente de datos:</span>
        {estado === ESTADO_CONEXION.ONLINE ? (
          <span className="text-green-600 font-medium">Google Sheets (en línea)</span>
        ) : (
          <span className="text-orange-600 font-medium">SQLite local (sin conexión)</span>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm mt-2">
        <span className="text-gray-500">Fecha:</span>
        <span className="text-gray-700 font-medium">
          {format(ahora, "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
        </span>
      </div>
    </div>
  )

  const CONTENIDO = { resumen: seccionResumen, distribucion: seccionDistribucion, tareas: <ListadoTareas />, sistema: seccionSistema }
  const ETIQUETAS = { resumen: 'Tarjetas resumen', distribucion: 'Distribución por estado', tareas: 'Listado de tareas', sistema: 'Estado del sistema' }

  return (
    <div className="space-y-6">
      {/* ── Encabezado con logo — siempre arriba, no arrastrable ── */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-xl shadow-sm border border-blue-700 p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <img
              src={iconoBlanco}
              alt="Tribunal de Cuentas La Rioja"
              className="h-14 w-auto object-contain flex-shrink-0"
            />
            <div>
              <h2 className="text-base font-semibold text-white">Resumen del período</h2>
              <p className="text-sm text-blue-200">Estadísticas de expedientes visados</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="bg-white/10 border border-blue-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={mes}
              onChange={e => setMes(parseInt(e.target.value))}
            >
              {MESES.map((m, i) => <option key={i} value={i + 1} className="text-gray-800 bg-white">{m}</option>)}
            </select>
            <select
              className="bg-white/10 border border-blue-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={anio}
              onChange={e => setAnio(parseInt(e.target.value))}
            >
              {[2020,2021,2022,2023,2024,2025,2026].map(a => (
                <option key={a} value={a} className="text-gray-800 bg-white">{a}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Secciones reordenables ── */}
      {orden.map(id => {
        if (!CONTENIDO[id]) return null
        const esOrigen = arrastrando === id
        const esSobre  = sobreItem === id && arrastrando !== id
        return (
          <div
            key={id}
            draggable
            onDragStart={e => {
              // Solo permitir arrastre desde el handle — nunca desde inputs, botones, etc.
              if (!e.target.closest('[data-grip]')) {
                e.preventDefault()
                return
              }
              handleDragStart(e, id)
            }}
            onDragOver={e => handleDragOver(e, id)}
            onDrop={e => handleDrop(e, id)}
            onDragEnd={handleDragEnd}
            className={`
              relative group transition-all duration-150 select-none
              ${esOrigen ? 'opacity-40 scale-[0.99]' : ''}
              ${esSobre  ? 'ring-2 ring-blue-400 ring-offset-2 rounded-xl' : ''}
            `}
          >
            {/* Handle de arrastre — visible al hacer hover */}
            <div
              data-grip
              className="absolute top-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg px-2 py-1 shadow-sm"
              title={`Mover "${ETIQUETAS[id]}"`}
            >
              <IconoGrip />
              <span className="text-xs text-gray-400 font-medium">mover</span>
            </div>

            {CONTENIDO[id]}
          </div>
        )
      })}
    </div>
  )
}
