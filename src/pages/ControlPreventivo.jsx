import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const POR_PAGINA = 50

const MESES = [
  { v: '', l: 'Todos los meses' },
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

const VACIO = {
  saf: '420', organismo: '', delegadoFiscal: '', autoridad: '',
  expediente: '', concepto: '', nroActoAdm: '', ippSinPuntos: '',
  importe: '', fechaEntrada: '', fechaSalida: '', fechaIntervencion: '',
  sinObservacion: '', mes: '', anio: '',
}

function formatearFecha(f) {
  if (!f) return '—'
  try {
    const d = new Date(f + 'T00:00:00')
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch { return f }
}

function formatearMoneda(n) {
  if (!n && n !== 0) return '—'
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 2 }).format(n)
}

// ── Campo de formulario ──────────────────────────────────────────────────────
function Campo({ label, name, form, onChange, tipo = 'text', required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={tipo}
        name={name}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white"
        value={form[name] ?? ''}
        onChange={onChange}
        required={required}
        placeholder={placeholder || label}
        step={tipo === 'number' ? 'any' : undefined}
      />
    </div>
  )
}

// ── Modal de carga / edición ─────────────────────────────────────────────────
function ModalCP({ registro, onGuardar, onCerrar }) {
  const esNuevo = !registro
  const anioActual = new Date().getFullYear()
  const mesActual  = new Date().getMonth() + 1

  const [form, setForm]           = useState(registro ? {
    saf:               registro.saf             || '420',
    organismo:         registro.organismo        || '',
    delegadoFiscal:    registro.delegado_fiscal  || '',
    autoridad:         registro.autoridad        || '',
    expediente:        registro.expediente       || '',
    concepto:          registro.concepto         || '',
    nroActoAdm:        registro.nro_acto_adm     || '',
    ippSinPuntos:      registro.ipp_sin_puntos   || '',
    importe:           registro.importe          || '',
    fechaEntrada:      registro.fecha_entrada    || '',
    fechaSalida:       registro.fecha_salida     || '',
    fechaIntervencion: registro.fecha_intervencion || '',
    sinObservacion:    registro.sin_observacion  || '',
    mes:               registro.mes              || '',
    anio:              registro.anio             || '',
  } : { ...VACIO, mes: mesActual, anio: anioActual })

  const [guardando, setGuardando]       = useState(false)
  const [error, setError]               = useState('')
  const [configCargando, setConfigCargando] = useState(esNuevo)
  const configCargada = useRef(false)

  // Carga organismo y delegado fiscal desde config solo para registros nuevos
  useEffect(() => {
    if (!esNuevo || configCargada.current) return
    configCargada.current = true
    axios.get('/api/configuracion')
      .then(({ data }) => {
        setForm(f => ({
          ...f,
          organismo:      data.organismo      || f.organismo,
          delegadoFiscal: data.delegado_fiscal || f.delegadoFiscal,
        }))
      })
      .catch(() => {})
      .finally(() => setConfigCargando(false))
  }, [esNuevo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.organismo) { setError('El organismo es obligatorio'); return }
    setGuardando(true); setError('')
    try {
      if (esNuevo) {
        await axios.post('/api/control-preventivo', form)
      } else {
        await axios.put(`/api/control-preventivo/${registro.id}`, form)
      }
      onGuardar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  const anios = [anioActual + 1, anioActual, anioActual - 1, anioActual - 2]

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6">

        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {esNuevo ? 'Nuevo Registro — Control Preventivo' : 'Editar Registro'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Completá los datos de la intervención. Los campos marcados con * son obligatorios.
            </p>
          </div>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* ── Período ─────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 pt-1">
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider whitespace-nowrap">Período</p>
              <div className="flex-1 h-px bg-teal-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Mes</label>
                <select name="mes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={form.mes} onChange={handleChange}>
                  <option value="">— Seleccionar —</option>
                  {MESES.filter(m => m.v !== '').map(m => (
                    <option key={m.v} value={m.v}>{m.l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                <select name="anio" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={form.anio} onChange={handleChange}>
                  <option value="">— Seleccionar —</option>
                  {anios.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <Campo label="S.A.F." name="saf" form={form} onChange={handleChange} placeholder="420" />
            </div>
          </div>

          {/* ── Organismo ───────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider whitespace-nowrap">Organismo y Autoridades</p>
              <div className="flex-1 h-px bg-teal-100" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Organismo <span className="text-red-500">*</span>
                {configCargando && (
                  <span className="ml-2 inline-flex items-center gap-1 text-gray-400 font-normal text-xs">
                    <span className="w-3 h-3 border border-gray-300 border-t-teal-500 rounded-full animate-spin inline-block" />
                    cargando...
                  </span>
                )}
              </label>
              <input
                type="text"
                name="organismo"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                value={form.organismo ?? ''}
                onChange={handleChange}
                required
                placeholder="Ej: Ministerio de Educación PFE"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Delegado Fiscal
                  <span className="ml-2 text-gray-400 font-normal text-xs">(pre-llenado desde configuración)</span>
                </label>
                <input
                  type="text"
                  name="delegadoFiscal"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  value={form.delegadoFiscal ?? ''}
                  onChange={handleChange}
                  placeholder="Ej: Cra. López Andrea"
                />
              </div>
              <Campo label="Autoridad" name="autoridad" form={form} onChange={handleChange} placeholder="Ej: Cr. Jorge Menem" />
            </div>
          </div>

          {/* ── Expediente y Acto ───────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider whitespace-nowrap">Datos del Expediente</p>
              <div className="flex-1 h-px bg-teal-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="N° Expediente" name="expediente" form={form} onChange={handleChange} placeholder="Ej: D4-0007-6-26" />
              <Campo label="N° Acto Adm. Nº/Año" name="nroActoAdm" form={form} onChange={handleChange} placeholder="Ej: 387/26" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Concepto / Descripción</label>
              <textarea
                name="concepto"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white h-20 resize-none"
                value={form.concepto ?? ''}
                onChange={handleChange}
                placeholder="Descripción del concepto o motivo del expediente..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="IPP Sin Puntos" name="ippSinPuntos" form={form} onChange={handleChange} placeholder="Ej: 3710/3720" />
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Importe ($)</label>
                <input
                  type="number"
                  name="importe"
                  step="any"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-right font-mono"
                  value={form.importe ?? ''}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ── Fechas ──────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs font-bold text-teal-800 uppercase tracking-wider whitespace-nowrap">Fechas</p>
              <div className="flex-1 h-px bg-teal-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Campo label="Fecha Entrada" name="fechaEntrada" form={form} onChange={handleChange} tipo="date" />
              <Campo label="Fecha Salida" name="fechaSalida" form={form} onChange={handleChange} tipo="date" />
              <Campo label="Fecha Intervención" name="fechaIntervencion" form={form} onChange={handleChange} tipo="date" />
              <Campo label="Sin Observación (fecha)" name="sinObservacion" form={form} onChange={handleChange} tipo="date" />
            </div>
          </div>

          {/* ── Botones ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button type="button" onClick={onCerrar} className="btn-secondary">Cancelar</button>
            <button
              type="submit"
              disabled={guardando}
              className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {guardando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (esNuevo ? 'Crear Registro' : 'Guardar Cambios')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────────────────
export default function ControlPreventivo() {
  const [registros, setRegistros]   = useState([])
  const [total, setTotal]           = useState(0)
  const [totalImporte, setTotalImporte] = useState(0)
  const [pagina, setPagina]         = useState(1)
  const [cargando, setCargando]     = useState(false)
  const [busqueda, setBusqueda]     = useState('')
  const [filtros, setFiltros]       = useState({ mes: '', anio: '' })
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando]     = useState(null)

  const anioActual = new Date().getFullYear()
  const anios = [anioActual + 1, anioActual, anioActual - 1, anioActual - 2]

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/control-preventivo', {
        params: { pagina, porPagina: POR_PAGINA, busqueda, ...filtros },
      })
      setRegistros(data.registros)
      setTotal(data.total)
      setTotalImporte(data.totalImporte)
    } catch (err) {
      console.error('Error al cargar control preventivo:', err)
    } finally { setCargando(false) }
  }, [pagina, busqueda, filtros])

  useEffect(() => { cargar() }, [cargar])
  useEffect(() => { setPagina(1) }, [busqueda, filtros])

  const eliminar = async (reg) => {
    const id = reg.expediente || `ID ${reg.id}`
    if (!confirm(`¿Eliminar el registro:\n"${id}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      await axios.delete(`/api/control-preventivo/${reg.id}`)
      cargar()
    } catch (err) { alert('Error al eliminar: ' + (err.response?.data?.error || err.message)) }
  }

  const onGuardar = () => { setModalAbierto(false); setEditando(null); cargar() }
  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-4">
      {/* Barra de acciones */}
      <div className="card py-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[220px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              className="input-base pl-9"
              placeholder="Buscar por organismo, expediente, acto, concepto..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          <select className="input-base w-auto" value={filtros.mes} onChange={e => setFiltros(f => ({ ...f, mes: e.target.value }))}>
            {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>

          <select className="input-base w-auto" value={filtros.anio} onChange={e => setFiltros(f => ({ ...f, anio: e.target.value }))}>
            <option value="">Todos los años</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <button
            onClick={() => { setEditando(null); setModalAbierto(true) }}
            className="ml-auto flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total de intervenciones</p>
            <p className="text-2xl font-bold text-gray-800">{cargando ? '—' : total}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-3 flex items-center gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Total importe intervenido</p>
            <p className="text-2xl font-bold text-gray-800">{cargando ? '—' : formatearMoneda(totalImporte)}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-teal-900 text-white">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold w-8">#</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Organismo</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Delegado Fiscal</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Expediente</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Concepto</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">Nº Acto Adm.</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">IPP</th>
                <th className="px-3 py-3 text-right text-xs font-semibold">Importe</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">F. Entrada</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">F. Salida</th>
                <th className="px-3 py-3 text-left text-xs font-semibold">F. Intervención</th>
                <th className="px-3 py-3 text-center text-xs font-semibold w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cargando ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="tabla-celda">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-gray-500">No hay registros de control preventivo</p>
                    <p className="text-xs mt-1">Hacé clic en "Nuevo Registro" para agregar el primero</p>
                  </td>
                </tr>
              ) : registros.map((reg, idx) => (
                <tr key={reg.id} className="hover:bg-teal-50/40 transition-colors">
                  <td className="tabla-celda text-gray-400 text-xs">
                    {(pagina - 1) * POR_PAGINA + idx + 1}
                  </td>
                  <td className="tabla-celda font-medium max-w-[160px]">
                    <span className="line-clamp-2 text-xs">{reg.organismo || '—'}</span>
                  </td>
                  <td className="tabla-celda text-xs text-gray-600 max-w-[120px]">
                    <span className="line-clamp-1">{reg.delegado_fiscal || '—'}</span>
                  </td>
                  <td className="tabla-celda font-mono text-xs text-teal-700 font-semibold">
                    {reg.expediente || '—'}
                  </td>
                  <td className="tabla-celda text-xs text-gray-600 max-w-[180px]">
                    <span className="line-clamp-2" title={reg.concepto}>{reg.concepto || '—'}</span>
                  </td>
                  <td className="tabla-celda text-xs font-mono">{reg.nro_acto_adm || '—'}</td>
                  <td className="tabla-celda text-xs font-mono text-gray-500">{reg.ipp_sin_puntos || '—'}</td>
                  <td className="tabla-celda text-right font-mono text-sm font-semibold text-green-700">
                    {formatearMoneda(reg.importe)}
                  </td>
                  <td className="tabla-celda text-xs">{formatearFecha(reg.fecha_entrada)}</td>
                  <td className="tabla-celda text-xs">{formatearFecha(reg.fecha_salida)}</td>
                  <td className="tabla-celda text-xs">{formatearFecha(reg.fecha_intervencion)}</td>
                  <td className="tabla-celda text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => { setEditando(reg); setModalAbierto(true) }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-1.5 rounded-lg"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminar(reg)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-1.5 rounded-lg"
                        title="Eliminar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Fila de totales */}
            {registros.length > 0 && !cargando && (
              <tfoot>
                <tr className="bg-teal-50 border-t-2 border-teal-200">
                  <td colSpan={7} className="px-3 py-2 text-xs font-bold text-teal-800 uppercase tracking-wide">
                    SUBTOTAL ({total} intervenciones)
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-green-700 font-mono">
                    {formatearMoneda(totalImporte)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setPagina(p => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                const p = pagina <= 3 ? i + 1 : pagina - 2 + i
                if (p > totalPaginas) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors
                      ${p === pagina ? 'bg-teal-700 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <button
              onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="btn-secondary text-xs py-1.5 px-3"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {modalAbierto && (
        <ModalCP
          registro={editando}
          onGuardar={onGuardar}
          onCerrar={() => { setModalAbierto(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
