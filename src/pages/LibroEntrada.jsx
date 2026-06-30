import { useState, useEffect, useCallback, Fragment } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { formatearFecha, formatearMoneda, truncar } from '../utils/formateos'

// ── Constantes ──────────────────────────────────────────────
const ESTADOS = [
  { key: 'INGRESADO',  label: 'Ingresado',  colorClass: 'text-gray-600 dark:text-gray-400',    badgeClass: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',           rowClass: '' },
  { key: 'SIN_VISAR',  label: 'Sin Visar',  colorClass: 'text-yellow-600 dark:text-yellow-400', badgeClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300', rowClass: 'bg-yellow-50 dark:bg-yellow-900/10' },
  { key: 'VISADO',     label: 'Visado',     colorClass: 'text-green-600 dark:text-green-400',   badgeClass: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',     rowClass: 'bg-green-50 dark:bg-green-900/10' },
  { key: 'SALIDA',     label: 'Salida',     colorClass: 'text-blue-600 dark:text-blue-400',     badgeClass: 'bg-blue-600 text-white dark:bg-blue-700',                                  rowClass: 'bg-blue-50 dark:bg-blue-900/10' },
  { key: 'TRIMESTRAL', label: 'Trimestral', colorClass: 'text-purple-600 dark:text-purple-400', badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300', rowClass: 'bg-purple-50 dark:bg-purple-900/10' },
]

const ESTADO_MAP = Object.fromEntries(ESTADOS.map(e => [e.key, e]))

const MESES_NOMBRES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const VACIO = {
  nroExpediente: '', asunto: '', sidif: '', opPago: '',
  impNeto: '', impRetenido: '', impBruto: '',
  resolucion: '', fechaEntrada: '', fojasEntrada: '',
  fechaSalida: '', fechaVisado: '', programa: '', firma: '',
  requerimiento: '', estado: 'SIN_VISAR',
}

// ── Helpers ─────────────────────────────────────────────────
function claveGrupo(fechaStr) {
  if (!fechaStr) return 'sin-fecha'
  const [anio, mes] = fechaStr.split('-')
  return `${anio}-${mes}`
}

function labelGrupo(clave) {
  if (clave === 'sin-fecha') return 'Sin fecha de entrada'
  const [anio, mes] = clave.split('-')
  return `${MESES_NOMBRES[parseInt(mes) - 1]} ${anio}`
}

function agruparPorMes(registros) {
  const grupos = {}
  registros.forEach(r => {
    const k = claveGrupo(r.fecha_entrada)
    if (!grupos[k]) grupos[k] = []
    grupos[k].push(r)
  })
  return Object.entries(grupos).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
}

// ── Modal ────────────────────────────────────────────────────
function ModalLibro({ registro, onGuardar, onCerrar }) {
  const esNuevo = !registro
  const [form, setForm]         = useState(registro ? {
    nroExpediente: registro.nro_expediente || '',
    asunto:        registro.asunto || '',
    sidif:         registro.sidif || '',
    opPago:        registro.op_pago || '',
    impNeto:       registro.imp_neto ?? '',
    impRetenido:   registro.imp_retenido ?? '',
    impBruto:      registro.imp_bruto ?? '',
    resolucion:    registro.resolucion || '',
    fechaEntrada:  registro.fecha_entrada || '',
    fojasEntrada:  registro.fojas_entrada ?? '',
    fechaSalida:   registro.fecha_salida || '',
    fechaVisado:   registro.fecha_visado || '',
    programa:      registro.programa ?? '',
    firma:         registro.firma || '',
    requerimiento: registro.requerimiento || '',
    estado:        registro.estado || 'SIN_VISAR',
  } : { ...VACIO })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }))
  const handleChange = e => {
    const { name, value } = e.target
    set(name, value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      if (esNuevo) await axios.post('/api/libro-entrada', form)
      else await axios.put(`/api/libro-entrada/${registro.id}`, form)
      onGuardar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-6">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold dark:text-gray-100">
              {esNuevo ? 'Nuevo Registro' : 'Editar Registro'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Libro de Entrada</p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

          {/* Fila 1: N° Expediente + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">N° Expediente</label>
              <input name="nroExpediente" className="input-base uppercase" value={form.nroExpediente} onChange={handleChange}
                placeholder="D4-0001-0-25" />
            </div>
            <div>
              <label className="label-base">Estado</label>
              <select name="estado" className="input-base" value={form.estado} onChange={handleChange}>
                {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
          </div>

          {/* Asunto */}
          <div>
            <label className="label-base">Asunto</label>
            <textarea name="asunto" className="input-base resize-none" rows={2} value={form.asunto} onChange={handleChange}
              placeholder="Descripción del expediente..." />
          </div>

          {/* Fila: SIDIF + O.Pago + Resolución */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">SIDIF</label>
              <input name="sidif" className="input-base" value={form.sidif} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">O.Pago</label>
              <input name="opPago" className="input-base" value={form.opPago} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">Resolución</label>
              <input name="resolucion" className="input-base" value={form.resolucion} onChange={handleChange} />
            </div>
          </div>

          {/* Importes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label-base">Imp. Neto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-green-600 dark:text-green-400 pointer-events-none">$</span>
                <input type="number" step="0.01" name="impNeto" className="input-base pl-7" value={form.impNeto} onChange={handleChange} placeholder="0,00" />
              </div>
            </div>
            <div>
              <label className="label-base">Imp. Retenido</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-red-500 dark:text-red-400 pointer-events-none">$</span>
                <input type="number" step="0.01" name="impRetenido" className="input-base pl-7" value={form.impRetenido} onChange={handleChange} placeholder="0,00" />
              </div>
            </div>
            <div>
              <label className="label-base">Imp. Bruto</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-blue-600 dark:text-blue-400 pointer-events-none">$</span>
                <input type="number" step="0.01" name="impBruto" className="input-base pl-7 font-semibold" value={form.impBruto} onChange={handleChange} placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Fechas de entrada */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Fecha de Entrada</label>
              <input type="date" name="fechaEntrada" className="input-base" value={form.fechaEntrada} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">Fojas Entrada</label>
              <input type="number" name="fojasEntrada" className="input-base" value={form.fojasEntrada} onChange={handleChange} min="0" />
            </div>
          </div>

          {/* Fechas de visado y salida */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Fecha Visado</label>
              <input type="date" name="fechaVisado" className="input-base" value={form.fechaVisado} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">Fecha Salida</label>
              <input type="date" name="fechaSalida" className="input-base" value={form.fechaSalida} onChange={handleChange} />
            </div>
          </div>

          {/* Programa + Firma */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">Programa</label>
              <input type="text" name="programa" className="input-base" value={form.programa} onChange={handleChange} placeholder="32, 39, CAF..." />
            </div>
            <div>
              <label className="label-base">Firma</label>
              <input name="firma" className="input-base" value={form.firma} onChange={handleChange} placeholder="Ej: Claudia Ludueña" />
            </div>
          </div>

          {/* Requerimiento */}
          <div>
            <label className="label-base">Requerimiento</label>
            <input name="requerimiento" className="input-base" value={form.requerimiento} onChange={handleChange} placeholder="——" />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onCerrar} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : esNuevo ? 'Agregar Registro' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────
export default function LibroEntrada() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  const anioActual = new Date().getFullYear()

  const [registros, setRegistros]   = useState([])
  const [totales, setTotales]       = useState({})
  const [cargando, setCargando]     = useState(true)
  const [busqueda, setBusqueda]     = useState('')
  const [filtros, setFiltros]       = useState({ mes: '', anio: String(anioActual), estado: '', programa: '' })
  const [modal, setModal]           = useState(false)
  const [editando, setEditando]     = useState(null)
  const [colapsados, setColapsados] = useState(() => {
    try {
      const guardado = JSON.parse(sessionStorage.getItem('libro_colapsados') || '[]')
      return new Set(guardado)
    } catch { return new Set() }
  })

  const toggleMes = (clave) => {
    setColapsados(prev => {
      const s = new Set(prev)
      s.has(clave) ? s.delete(clave) : s.add(clave)
      try { sessionStorage.setItem('libro_colapsados', JSON.stringify([...s])) } catch {}
      return s
    })
  }

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/libro-entrada', { params: { busqueda, ...filtros } })
      setRegistros(data.registros)
      const map = {}
      data.totales.forEach(t => { map[t.estado] = t.total })
      setTotales(map)
    } catch (err) { console.error(err) }
    finally { setCargando(false) }
  }, [busqueda, filtros])

  useEffect(() => { cargar() }, [cargar])

  const cambiarEstado = async (id, estado) => {
    try {
      await axios.patch(`/api/libro-entrada/${id}/estado`, { estado })
      setRegistros(prev => prev.map(r => r.id === id ? { ...r, estado } : r))
    } catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const eliminar = async (reg) => {
    if (!confirm(`¿Eliminar el registro:\n"${reg.nro_expediente || 'sin número'}"?\n\nEsta acción no se puede deshacer.`)) return
    try { await axios.delete(`/api/libro-entrada/${reg.id}`); cargar() }
    catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const onGuardar = () => { setModal(false); setEditando(null); cargar() }

  const grupos = agruparPorMes(registros)
  const totalGeneral = Object.values(totales).reduce((a, b) => a + b, 0)

  // Número correlativo por posición en la vista actual
  const numerosOrden = {}
  let orden = 0
  grupos.forEach(([, items]) => items.forEach(r => { numerosOrden[r.id] = ++orden }))

  const anios = [anioActual + 1, anioActual, anioActual - 1, anioActual - 2, anioActual - 3]

  return (
    <div className="space-y-4">

      {/* ── Cards resumen ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="card py-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{totalGeneral}</p>
          <p className="text-xs text-gray-400 mt-1">registros</p>
        </div>
        {ESTADOS.slice(1).map(est => (
          <div key={est.key} className="card py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{est.label}</p>
            <p className={`text-2xl font-bold ${est.colorClass}`}>{totales[est.key] || 0}</p>
            <p className="text-xs text-gray-400 mt-1">expedientes</p>
          </div>
        ))}
      </div>

      {/* ── Barra de filtros ── */}
      <div className="card py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-base pl-9"
              placeholder="Buscar por N° exp, asunto, firma, SIDIF..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          <select className="input-base w-auto" value={filtros.mes}
            onChange={e => setFiltros(f => ({ ...f, mes: e.target.value }))}>
            <option value="">Todos los meses</option>
            {MESES_NOMBRES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>

          <select className="input-base w-auto" value={filtros.anio}
            onChange={e => setFiltros(f => ({ ...f, anio: e.target.value }))}>
            <option value="">Todos los años</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select className="input-base w-auto" value={filtros.estado}
            onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>

          <input
            type="text"
            className="input-base w-28"
            placeholder="Programa..."
            value={filtros.programa}
            onChange={e => setFiltros(f => ({ ...f, programa: e.target.value }))}
            title="Filtrar por programa (32, 39, CAF...)"
          />

          <button
            onClick={() => {
              setBusqueda('')
              setFiltros({ mes: '', anio: '', estado: '', programa: '' })
            }}
            className="btn-secondary flex items-center gap-1.5"
            title="Limpiar todos los filtros"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Limpiar
          </button>

          <button
            onClick={() => { setEditando(null); setModal(true) }}
            className="btn-primary flex items-center gap-2 ml-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* ── Tabla ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full table-fixed text-xs">
          <colgroup>
            <col className="w-[3%]" />
            <col className="w-[12%]" />
            <col className="w-[18%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
            <col className="w-[6%]" />
            <col className="w-[8%]" />
            <col className="w-[10%]" />
            <col className="w-[4%]" />
          </colgroup>
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="tabla-header text-center text-gray-400">#</th>
              <th className="tabla-header text-left">N° Expediente</th>
              <th className="tabla-header text-left">Asunto</th>
              <th className="tabla-header text-left">SIDIF / OP</th>
              <th className="tabla-header text-right">Imp. Bruto</th>
              <th className="tabla-header text-left">Entrada</th>
              <th className="tabla-header text-left">Visado</th>
              <th className="tabla-header text-left">Salida</th>
              <th className="tabla-header text-left">Prog.</th>
              <th className="tabla-header text-left">Firma</th>
              <th className="tabla-header text-center">Estado</th>
              <th className="tabla-header text-center">Acc.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {cargando ? (
              <tr>
                <td colSpan={12} className="text-center py-14 text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando registros...</span>
                  </div>
                </td>
              </tr>
            ) : registros.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-16 text-gray-400 dark:text-gray-500">
                  <svg className="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <p className="font-medium text-gray-500 dark:text-gray-400">No hay registros</p>
                  <p className="text-gray-400 mt-1">Ajustá los filtros o creá el primer registro</p>
                </td>
              </tr>
            ) : (
              grupos.map(([clave, items]) => (
                <Fragment key={clave}>
                  {/* Separador de mes — clickeable para colapsar */}
                  <tr
                    className="bg-blue-900 dark:bg-blue-950 cursor-pointer hover:bg-blue-800 dark:hover:bg-blue-900 transition-colors select-none"
                    onClick={() => toggleMes(clave)}
                  >
                    <td colSpan={12} className="px-4 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            className={`w-3.5 h-3.5 text-blue-300 transition-transform duration-200 flex-shrink-0 ${colapsados.has(clave) ? '-rotate-90' : 'rotate-0'}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                          </svg>
                          <span className="text-white font-semibold text-xs uppercase tracking-widest">
                            {labelGrupo(clave)}
                          </span>
                          <span className="text-blue-300 text-xs">
                            {items.length} registro{items.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <span className="text-blue-400 text-xs">
                          {colapsados.has(clave) ? 'Mostrar' : 'Ocultar'}
                        </span>
                      </div>
                    </td>
                  </tr>

                  {!colapsados.has(clave) && items.map(reg => {
                    const est = ESTADO_MAP[reg.estado] || ESTADO_MAP['INGRESADO']
                    return (
                      <tr key={reg.id} className={`${est.rowClass} hover:brightness-95 transition-all`}>

                        {/* # */}
                        <td className="tabla-celda text-center text-gray-400 dark:text-gray-500 font-mono select-none">
                          {numerosOrden[reg.id]}
                        </td>

                        {/* N° Expediente */}
                        <td className="tabla-celda font-mono font-semibold text-blue-900 dark:text-blue-300 truncate">
                          {reg.nro_expediente || '—'}
                        </td>

                        {/* Asunto */}
                        <td className="tabla-celda truncate" title={reg.asunto || ''}>
                          {reg.asunto || <span className="text-gray-400">—</span>}
                        </td>

                        {/* SIDIF / OP */}
                        <td
                          className="tabla-celda truncate text-gray-600 dark:text-gray-300"
                          title={[reg.sidif, reg.op_pago].filter(Boolean).join(' / ') || ''}
                        >
                          {reg.sidif && reg.op_pago
                            ? `${reg.sidif} / ${reg.op_pago}`
                            : reg.sidif || reg.op_pago || <span className="text-gray-400">—</span>}
                        </td>

                        {/* Imp. Bruto */}
                        <td className="tabla-celda text-right font-mono whitespace-nowrap">
                          {reg.imp_bruto ? (
                            <>
                              <span className="text-blue-600 dark:text-blue-400 font-bold">$</span>
                              <span className="font-semibold text-gray-800 dark:text-gray-100">{formatearMoneda(reg.imp_bruto)}</span>
                            </>
                          ) : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Entrada */}
                        <td className="tabla-celda text-gray-700 dark:text-gray-200 whitespace-nowrap">
                          {formatearFecha(reg.fecha_entrada)}
                        </td>

                        {/* Visado */}
                        <td className="tabla-celda whitespace-nowrap">
                          {reg.fecha_visado
                            ? <span className="text-green-700 dark:text-green-400 font-medium">{formatearFecha(reg.fecha_visado)}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Salida */}
                        <td className="tabla-celda whitespace-nowrap">
                          {reg.fecha_salida
                            ? <span className="text-blue-700 dark:text-blue-400 font-medium">{formatearFecha(reg.fecha_salida)}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Programa */}
                        <td className="tabla-celda">
                          {reg.programa
                            ? <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-semibold">{reg.programa}</span>
                            : <span className="text-gray-400">—</span>}
                        </td>

                        {/* Firma */}
                        <td className="tabla-celda truncate text-gray-600 dark:text-gray-300" title={reg.firma || ''}>
                          {reg.firma || <span className="text-gray-400">—</span>}
                        </td>

                        {/* Estado */}
                        <td className="tabla-celda text-center">
                          <select
                            value={reg.estado}
                            onChange={e => cambiarEstado(reg.id, e.target.value)}
                            className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400 ${est.badgeClass}`}
                          >
                            {ESTADOS.map(e => (
                              <option key={e.key} value={e.key} className="bg-white text-gray-800">{e.label}</option>
                            ))}
                          </select>
                        </td>

                        {/* Acciones */}
                        <td className="tabla-celda text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => { setEditando(reg); setModal(true) }}
                              className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1 rounded transition-colors"
                              title="Editar"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            {esAdmin && (
                              <button
                                onClick={() => eliminar(reg)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 p-1 rounded transition-colors"
                                title="Eliminar"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </Fragment>
              ))
            )}
          </tbody>
        </table>

        {/* Pie */}
        {!cargando && registros.length > 0 && (
          <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {registros.length} registro{registros.length !== 1 ? 's' : ''} mostrado{registros.length !== 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-2">
              {ESTADOS.map(est => (
                totales[est.key] ? (
                  <span key={est.key} className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.badgeClass}`}>
                    {est.label}: {totales[est.key]}
                  </span>
                ) : null
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Botón inferior para comodidad al cargar */}
      <div className="flex justify-end">
        <button
          onClick={() => { setEditando(null); setModal(true) }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Registro
        </button>
      </div>

      {/* Modal */}
      {modal && (
        <ModalLibro
          registro={editando}
          onGuardar={onGuardar}
          onCerrar={() => { setModal(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
