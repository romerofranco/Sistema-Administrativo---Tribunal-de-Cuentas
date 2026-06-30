import { useState, useEffect, useCallback, useRef, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatearMoneda, nombreMes, formatearFecha } from '../utils/formateos'
import { truncar } from '../utils/formateos'

const MESES_LISTA = [
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

function PanelValidacion({ validacion, soloEnLibro }) {
  const [expandirDup, setExpandirDup]           = useState(false)
  const [expandirSinLibro, setExpandirSinLibro] = useState(false)

  if (!validacion) return null
  const { duplicadosEliminados, duplicados, sinEnLibro, totalLibro } = validacion
  const hayProblemas = duplicadosEliminados > 0 || soloEnLibro.length > 0 || sinEnLibro.length > 0
  if (totalLibro === 0 && !hayProblemas) return null

  return (
    <div className="card space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Validación — Libro de Entrada
        {totalLibro > 0 && (
          <span className="ml-auto text-xs font-normal text-gray-400">
            {totalLibro} registro{totalLibro !== 1 ? 's' : ''} en el libro del período
          </span>
        )}
      </h3>

      {/* Todo coincide */}
      {!hayProblemas && totalLibro > 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Los datos del informe coinciden con el libro de entrada ({totalLibro} registros verificados).
        </div>
      )}

      {/* Duplicados eliminados */}
      {duplicadosEliminados > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 text-sm font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {duplicadosEliminados} expediente{duplicadosEliminados !== 1 ? 's' : ''} duplicado{duplicadosEliminados !== 1 ? 's' : ''} eliminado{duplicadosEliminados !== 1 ? 's' : ''} automáticamente
            </div>
            {duplicados?.length > 0 && (
              <button onClick={() => setExpandirDup(v => !v)} className="text-amber-600 hover:text-amber-800 text-xs underline ml-4">
                {expandirDup ? 'Ocultar' : 'Ver detalle'}
              </button>
            )}
          </div>
          {expandirDup && (
            <ul className="mt-2 space-y-1">
              {duplicados.map((d, i) => (
                <li key={i} className="text-xs text-amber-700 font-mono">
                  {d.nroExpediente || '(sin número)'} — <span className="font-sans">{d.denominacion || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* En libro pero no en informe — solo informativo */}
      {soloEnLibro.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 space-y-2">
          <p className="text-sm font-medium text-orange-800 flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {soloEnLibro.length} registro{soloEnLibro.length !== 1 ? 's' : ''} del libro de entrada no tienen expediente visado correspondiente en el informe
          </p>
          <div className="space-y-1.5">
            {soloEnLibro.map(l => (
              <div key={l.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-orange-100">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-mono text-gray-700">{l.nroExpediente || '—'}</p>
                  <p className="text-xs text-gray-500 truncate">{l.asunto || '—'}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    l.estado === 'VISADO'  ? 'bg-green-100 text-green-700'  :
                    l.estado === 'SALIDA'  ? 'bg-blue-100 text-blue-700'   :
                    'bg-gray-100 text-gray-600'
                  }`}>{l.estado}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* En informe pero sin registro en libro */}
      {sinEnLibro?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {sinEnLibro.length} expediente{sinEnLibro.length !== 1 ? 's' : ''} del informe sin registro en el libro de entrada
            </span>
            <button onClick={() => setExpandirSinLibro(v => !v)} className="text-blue-600 hover:text-blue-800 text-xs underline ml-4">
              {expandirSinLibro ? 'Ocultar' : 'Ver listado'}
            </button>
          </div>
          {expandirSinLibro && (
            <ul className="mt-2 space-y-1">
              {sinEnLibro.map((e, i) => (
                <li key={i} className="text-xs text-blue-700 font-mono">
                  {e.nroExpediente || '—'} — <span className="font-sans">{e.denominacion || '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default function Informes() {
  const ahora = new Date()
  const location = useLocation()
  const navigate = useNavigate()
  const expManual = location.state?.expedientesManual || null

  const [mes, setMes]           = useState(ahora.getMonth() + 1)
  const [anio, setAnio]         = useState(ahora.getFullYear())
  const [numeroNota, setNumeroNota] = useState('')
  const [modoManual, setModoManual] = useState(!!expManual)
  const [preview, setPreview]   = useState(expManual ? {
    expedientes: expManual,
    totalOPs: expManual.length,
    totalBruto: expManual.reduce((s, e) => s + (parseFloat(e.impBruto) || 0), 0),
    porPrograma: {},
  } : null)
  const [cargandoPreview, setCargandoPreview] = useState(false)
  const [generando, setGenerando] = useState({ nota: false, planilla: false })
  const [archivos, setArchivos] = useState([])
  const [error, setError]       = useState('')
  const [chequeados, setChequeados]   = useState(new Set())
  const [ordenGrupos, setOrdenGrupos] = useState({})
  const [arrastre, setArrastre]       = useState(null)  // { programa, idx }
  const [sobreIdx, setSobreIdx]       = useState(null)  // { programa, idx }
  const [quitados, setQuitados]       = useState([])    // { programa, exp, idx } para restaurar
  const [libroValidacion, setLibroValidacion]     = useState(null)
  const [libroSoloEntradas, setLibroSoloEntradas] = useState([])

  // Refs para usar mes/anio en efectos sin agregarlos como dependencias
  const mesRef  = useRef(mes)
  const anioRef = useRef(anio)
  useEffect(() => { mesRef.current = mes; anioRef.current = anio }, [mes, anio])

  // Flag para no guardar en sessionStorage durante la carga inicial
  const ordenListo = useRef(false)

  useEffect(() => { setChequeados(new Set()); setQuitados([]) }, [preview])

  // Restaura el orden desde sessionStorage o inicializa desde preview
  useEffect(() => {
    if (!preview?.porPrograma) {
      setOrdenGrupos({})
      ordenListo.current = false
      return
    }
    const clave = `orden_${mesRef.current}_${anioRef.current}`
    let guardado = null
    try { guardado = JSON.parse(sessionStorage.getItem(clave) || 'null') } catch {}

    if (guardado) {
      const restaurado = {}
      for (const [prog, exps] of Object.entries(preview.porPrograma)) {
        const ids = guardado[prog]
        if (!ids) { restaurado[prog] = [...exps]; continue }
        const mapa = Object.fromEntries(
          exps.map(e => [e.nroSidif || e.nroExpediente || '', e])
        )
        // Deduplicar por referencia: si el mismo objeto aparece varias veces en ids
        // (por IDs repetidas de sesiones anteriores con duplicados), solo se incluye una vez
        const seenRefs = new Set()
        const ordenados = ids.map(id => mapa[id]).filter(e => {
          if (!e || seenRefs.has(e)) return false
          seenRefs.add(e); return true
        })
        const enOrden = new Set(ordenados)
        exps.forEach(e => { if (!enOrden.has(e)) ordenados.push(e) })
        restaurado[prog] = ordenados
      }
      setOrdenGrupos(restaurado)
    } else {
      setOrdenGrupos(
        Object.fromEntries(
          Object.entries(preview.porPrograma).map(([k, v]) => [k, [...v]])
        )
      )
    }
    ordenListo.current = true
  }, [preview])

  // Guarda el orden en sessionStorage cada vez que cambia por un drag
  useEffect(() => {
    if (!ordenListo.current || !Object.keys(ordenGrupos).length) return
    try {
      const ids = Object.fromEntries(
        Object.entries(ordenGrupos).map(([prog, exps]) => [
          prog,
          exps.map(e => e.nroSidif || e.nroExpediente || ''),
        ])
      )
      sessionStorage.setItem(`orden_${mesRef.current}_${anioRef.current}`, JSON.stringify(ids))
    } catch {}
  }, [ordenGrupos])

  const quitarExpediente = useCallback((programa, idx) => {
    setOrdenGrupos(prev => {
      const arr = [...prev[programa]]
      const [exp] = arr.splice(idx, 1)
      setQuitados(q => [...q, { programa, exp, idx }])
      return { ...prev, [programa]: arr }
    })
  }, [])

  const restaurarQuitados = useCallback(() => {
    setQuitados([])
    if (!preview?.porPrograma) return
    setOrdenGrupos(
      Object.fromEntries(
        Object.entries(preview.porPrograma).map(([k, v]) => [k, [...v]])
      )
    )
  }, [preview])


  const toggleChequeado = useCallback((exp) => {
    setChequeados(prev => {
      const next = new Set(prev)
      if (next.has(exp)) next.delete(exp)
      else next.add(exp)
      return next
    })
  }, [])

  const handleDragStart = useCallback((e, programa, idx) => {
    setArrastre({ programa, idx })
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e, programa, idx) => {
    if (!arrastre || arrastre.programa !== programa) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setSobreIdx(prev => (prev?.programa === programa && prev?.idx === idx) ? prev : { programa, idx })
  }, [arrastre])

  const handleDrop = useCallback((e, programa, idx) => {
    e.preventDefault()
    if (!arrastre || arrastre.programa !== programa || arrastre.idx === idx) {
      setArrastre(null); setSobreIdx(null); return
    }
    setOrdenGrupos(prev => {
      const arr = [...prev[programa]]
      const [item] = arr.splice(arrastre.idx, 1)
      arr.splice(idx, 0, item)
      return { ...prev, [programa]: arr }
    })
    setArrastre(null)
    setSobreIdx(null)
  }, [arrastre])

  const anios = [2020,2021,2022,2023,2024,2025,2026]

  const salirModoManual = () => {
    setModoManual(false)
    setPreview(null)
    navigate('/informes', { replace: true, state: null })
  }

  const limpiarTodo = () => {
    const hoy = new Date()
    setMes(hoy.getMonth() + 1)
    setAnio(hoy.getFullYear())
    setNumeroNota('')
    setPreview(null)
    setArchivos([])
    setError('')
    if (modoManual) {
      setModoManual(false)
      navigate('/informes', { replace: true, state: null })
    }
  }

  const cargarPreview = useCallback(async (signal) => {
    setCargandoPreview(true)
    setError('')
    try {
      const { data } = await axios.get('/api/informes/preview', { params: { mes, anio }, signal })
      setPreview(data)
      setLibroValidacion(data.validacion || null)
      setLibroSoloEntradas(data.validacion?.soloEnLibro || [])
    } catch (err) {
      if (axios.isCancel(err)) return
      setError(err.response?.data?.error || 'Error al cargar el preview')
    } finally { setCargandoPreview(false) }
  }, [mes, anio])

  useEffect(() => {
    if (modoManual) return
    const controller = new AbortController()
    cargarPreview(controller.signal)
    return () => controller.abort()
  }, [mes, anio, modoManual, cargarPreview])

  // Los grupos de control (libro de entrada) nunca van al informe
  const ordenGruposInforme = Object.fromEntries(
    Object.entries(ordenGrupos).filter(([prog]) => prog !== 'Libro de Entrada')
  )

  const generarNota = async () => {
    if (!numeroNota) { setError('Ingresá el número de nota antes de generar'); return }
    setGenerando(g => ({ ...g, nota: true }))
    setError('')
    try {
      const expedientesFiltrados = Object.values(ordenGruposInforme).flat()
      const { data } = await axios.post('/api/informes/nota', {
        mes, anio, numeroNota,
        expedientes: expedientesFiltrados,
      })
      setArchivos(prev => [...prev, { tipo: 'PDF Nota', url: data.url, nombre: data.archivo }])
      window.open(data.url, '_blank')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la nota')
    } finally { setGenerando(g => ({ ...g, nota: false })) }
  }

  const generarPlanillas = async () => {
    setGenerando(g => ({ ...g, planilla: true }))
    setError('')
    try {
      const { data } = await axios.post('/api/informes/planilla', {
        mes, anio,
        expedientes: preview?.expedientes || [],
        porPrograma: ordenGruposInforme,
      })
      const nuevos = data.archivos.map(a => ({
        tipo: a.tipo, url: a.url, nombre: a.nombre
      }))
      setArchivos(prev => [...prev, ...nuevos])
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar las planillas')
    } finally { setGenerando(g => ({ ...g, planilla: false })) }
  }

  return (
    <div className="space-y-5">
      {/* Selector de período */}
      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Seleccionar período</h2>
        <div className="flex items-end gap-4">
          <div>
            <label className="label-base">Mes</label>
            <select className="input-base w-auto" value={mes} onChange={e => setMes(parseInt(e.target.value))}>
              {MESES_LISTA.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select>
          </div>
          <div>
            <label className="label-base">Año</label>
            <select className="input-base w-auto" value={anio} onChange={e => setAnio(parseInt(e.target.value))}>
              {anios.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button onClick={() => cargarPreview()} className="btn-secondary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </button>
          <button
            onClick={limpiarTodo}
            className="flex items-center gap-2 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 font-medium py-2 px-4 rounded-lg border border-red-200 hover:border-red-300 transition-colors duration-150 text-sm dark:bg-gray-700 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Limpiar todo
          </button>
        </div>
      </div>

      {/* N° de Nota — tarjeta propia, sin riesgo de solapamiento */}
      <div className="card">
        <label className="label-base">
          N° de Nota
          <span className="text-gray-400 font-normal ml-2 text-xs">Requerido para generar el PDF de la nota</span>
        </label>
        <input
          type="text"
          className="input-base mt-1"
          style={{ maxWidth: '280px' }}
          placeholder="Ej: 42/25"
          value={numeroNota}
          onChange={e => setNumeroNota(e.target.value)}
          autoComplete="off"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Banner modo manual */}
      {modoManual && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3 text-sm text-blue-800">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>
              <strong>{expManual?.length || preview?.totalOPs || 0} expedientes seleccionados manualmente</strong>
              {' '}desde la lista — el informe se generará con estos expedientes.
            </span>
          </div>
          <button
            onClick={salirModoManual}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-900 font-medium border border-blue-300 hover:border-blue-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Volver al modo automático
          </button>
        </div>
      )}

      {/* Preview del informe */}
      {cargandoPreview ? (
        <div className="card text-center py-12 text-gray-400">
          <div className="w-8 h-8 border-4 border-blue-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Cargando expedientes del período...
        </div>
      ) : preview && (
        <>
          {/* Resumen */}
          {(() => {
            const totalNeto = preview.expedientes.reduce((acc, e) => acc + (parseFloat(e.impNeto) || 0), 0)
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="card text-center">
                  <p className="text-3xl font-bold text-blue-900">{preview.totalOPs}</p>
                  <p className="text-sm text-gray-500 mt-1">Órdenes de Pago visadas</p>
                </div>
                <div className="card text-center">
                  <p className="text-xl font-bold text-blue-700">{formatearMoneda(totalNeto)}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Importe Neto</p>
                </div>
                <div className="card text-center">
                  <p className="text-xl font-bold text-emerald-700">{formatearMoneda(preview.totalBruto)}</p>
                  <p className="text-sm text-gray-500 mt-1">Total Importe Bruto</p>
                </div>
                <div className="card text-center">
                  <p className="text-xl font-bold text-gray-700">{nombreMes(mes)} {anio}</p>
                  <p className="text-sm text-gray-500 mt-1">Período del informe</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {Object.keys(preview.porPrograma).length} programa(s)
                  </p>
                </div>
              </div>
            )
          })()}

          {/* Panel de validación contra libro de entrada */}
          {!modoManual && (
            <PanelValidacion
              validacion={libroValidacion}
              soloEnLibro={libroSoloEntradas}
            />
          )}

          {/* Tabla preview */}
          <div className="card">
            <div className="flex items-center gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Expedientes del período ({preview.expedientes.length})
              </h3>
              {chequeados.size > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {chequeados.size} marcado{chequeados.size !== 1 ? 's' : ''}
                </span>
              )}
              {quitados.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.037.158-2.037.45-2.983M9.172 9.172A4 4 0 0114.83 14.83M3 3l18 18" />
                  </svg>
                  {quitados.length} excluido{quitados.length !== 1 ? 's' : ''}
                  <button
                    onClick={restaurarQuitados}
                    className="underline hover:text-amber-900 font-semibold"
                  >Restaurar</button>
                </span>
              )}
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="tabla-header w-6"></th>
                    <th className="tabla-header w-6"></th>
                    <th className="tabla-header text-center w-8"></th>
                    <th className="tabla-header text-center">Nº</th>
                    <th className="tabla-header text-left">Beneficiario</th>
                    <th className="tabla-header text-left">N° Expediente</th>
                    <th className="tabla-header text-center">Ejercicio</th>
                    <th className="tabla-header text-left">N° SIDIF</th>
                    <th className="tabla-header text-left">N° OP</th>
                    <th className="tabla-header text-left">Tipo</th>
                    <th className="tabla-header text-right">Imp. Neto</th>
                    <th className="tabla-header text-right">Imp. Bruto</th>
                    <th className="tabla-header text-left">Fecha Visado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(ordenGruposInforme).map(([programa, exps]) => {
                    const subNeto  = exps.reduce((acc, e) => acc + (parseFloat(e.impNeto)  || 0), 0)
                    const subBruto = exps.reduce((acc, e) => acc + (parseFloat(e.impBruto) || 0), 0)
                    return (
                      <Fragment key={programa}>
                        {/* Separador de programa */}
                        <tr className="bg-blue-900">
                          <td colSpan={13} className="px-4 py-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <span className="text-white font-semibold text-xs uppercase tracking-widest">
                                {programa}
                              </span>
                              <span className="text-blue-200 text-xs font-mono">
                                {exps.length} exp.
                                {' · '}Neto: <span className="text-blue-100 font-semibold">{formatearMoneda(subNeto)}</span>
                                {' · '}Bruto: <span className="text-white font-semibold">{formatearMoneda(subBruto)}</span>
                              </span>
                            </div>
                          </td>
                        </tr>
                        {exps.map((exp, i) => {
                          const esSobre   = sobreIdx?.programa === programa && sobreIdx?.idx === i
                          const esDragging = arrastre?.programa === programa && arrastre?.idx === i
                          return (
                            <tr
                              key={i}
                              onDragOver={e => handleDragOver(e, programa, i)}
                              onDragLeave={() => setSobreIdx(null)}
                              onDrop={e => handleDrop(e, programa, i)}
                              className={[
                                'hover:bg-gray-50 transition-colors',
                                chequeados.has(exp) ? 'bg-emerald-50' : '',
                                esDragging ? 'opacity-40' : '',
                                esSobre ? 'border-t-2 border-blue-400' : '',
                              ].join(' ')}
                            >
                              <td className="tabla-celda text-center px-1">
                                <button
                                  onClick={() => quitarExpediente(programa, i)}
                                  className="text-gray-300 hover:text-red-500 transition-colors leading-none font-bold text-base"
                                  title="Quitar del informe"
                                >×</button>
                              </td>
                              <td className="tabla-celda text-center px-1">
                                <span
                                  draggable
                                  onDragStart={e => handleDragStart(e, programa, i)}
                                  onDragEnd={() => { setArrastre(null); setSobreIdx(null) }}
                                  className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-800 select-none text-sm leading-none inline-block px-1"
                                  title="Arrastrar para reordenar"
                                >⠿</span>
                              </td>
                              <td className="tabla-celda text-center">
                                <input
                                  type="checkbox"
                                  checked={chequeados.has(exp)}
                                  onChange={() => toggleChequeado(exp)}
                                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                                />
                              </td>
                              <td className="tabla-celda text-center text-gray-500 font-mono">{i + 1}</td>
                              <td className="tabla-celda">{truncar(exp.denominacion, 35)}</td>
                              <td className="tabla-celda font-mono">{exp.nroExpediente || '—'}</td>
                              <td className="tabla-celda text-center font-mono">{exp.ejercTramite || '—'}</td>
                              <td className="tabla-celda font-mono">{exp.nroSidif || '—'}</td>
                              <td className="tabla-celda font-mono">{exp.nroOp || '—'}</td>
                              <td className="tabla-celda">{exp.tipoOp || '—'}</td>
                              <td className="tabla-celda text-right font-mono text-blue-700">{formatearMoneda(exp.impNeto)}</td>
                              <td className="tabla-celda text-right font-mono text-emerald-700 font-semibold">{formatearMoneda(exp.impBruto)}</td>
                              <td className="tabla-celda">{formatearFecha(exp.fechaVisado)}</td>
                            </tr>
                          )
                        })}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Botones de generación */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Generar documentos</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={generarNota}
                disabled={generando.nota || !preview.totalOPs}
                className="btn-primary flex items-center gap-2"
              >
                {generando.nota ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Generar Nota (PDF)
              </button>

              <button
                onClick={generarPlanillas}
                disabled={generando.planilla || !preview.totalOPs}
                className="btn-success flex items-center gap-2"
              >
                {generando.planilla ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                Generar Planillas (Excel + PDF)
              </button>
            </div>

            {!preview.totalOPs && (
              <p className="text-xs text-gray-400 mt-3">
                No hay expedientes visados en el período seleccionado para generar documentos.
              </p>
            )}
          </div>

          {/* Archivos generados */}
          {archivos.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Archivos generados</h3>
              <div className="space-y-2">
                {archivos.map((archivo, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{archivo.nombre}</p>
                        <p className="text-xs text-gray-400">{archivo.tipo}</p>
                      </div>
                    </div>
                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Descargar
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
