import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

const MODULOS = [
  { value: '', label: 'Todos los módulos' },
  { value: 'expedientes',       label: 'Expedientes' },
  { value: 'libro_entrada',     label: 'Libro de Entrada' },
  { value: 'control_preventivo', label: 'Control Preventivo' },
  { value: 'programas',         label: 'Programas' },
  { value: 'responsables',      label: 'Responsables' },
  { value: 'configuracion',     label: 'Configuración' },
  { value: 'usuarios',          label: 'Usuarios' },
]

const ACCIONES = [
  { value: '', label: 'Todas las acciones' },
  { value: 'CREAR',          label: 'Crear' },
  { value: 'EDITAR',         label: 'Editar' },
  { value: 'ELIMINAR',       label: 'Eliminar' },
  { value: 'CAMBIAR_ESTADO', label: 'Cambiar Estado' },
]

const LABEL_MODULO = {
  expedientes:        'Expedientes',
  libro_entrada:      'Libro de Entrada',
  control_preventivo: 'Control Preventivo',
  programas:          'Programas',
  responsables:       'Responsables',
  configuracion:      'Configuración',
  usuarios:           'Usuarios',
}

const LABEL_ACCION = {
  CREAR:          'Crear',
  EDITAR:         'Editar',
  ELIMINAR:       'Eliminar',
  CAMBIAR_ESTADO: 'Cambiar Estado',
}

const BADGE_ACCION = {
  CREAR:          'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  EDITAR:         'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  ELIMINAR:       'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  CAMBIAR_ESTADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
}

function formatFecha(str) {
  if (!str) return '—'
  const d = new Date(str.replace(' ', 'T'))
  if (isNaN(d)) return str
  return d.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ModalDetalle({ registro, onClose }) {
  if (!registro) return null

  let antes = null
  let despues = null
  try { antes   = registro.datos_anteriores ? JSON.parse(registro.datos_anteriores) : null } catch {}
  try { despues  = registro.datos_nuevos     ? JSON.parse(registro.datos_nuevos)     : null } catch {}

  const campos = [...new Set([
    ...Object.keys(antes   || {}),
    ...Object.keys(despues || {}),
  ])]

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Encabezado modal */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Detalle del cambio</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {formatFecha(registro.creado_en)} — <span className="font-medium">{registro.usuario_nombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cuerpo modal */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Descripción */}
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg px-4 py-3">
            {registro.descripcion}
          </p>

          {/* Tabla de diferencias */}
          {campos.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700">
                    <th className="text-left px-3 py-2 border-b dark:border-gray-600 font-semibold text-gray-600 dark:text-gray-300">
                      Campo
                    </th>
                    <th className="text-left px-3 py-2 border-b dark:border-gray-600 font-semibold text-red-600 dark:text-red-400">
                      Antes
                    </th>
                    <th className="text-left px-3 py-2 border-b dark:border-gray-600 font-semibold text-green-600 dark:text-green-400">
                      Después
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campos.map(campo => {
                    const vAntes   = antes?.[campo]   ?? '—'
                    const vDespues = despues?.[campo]  ?? '—'
                    const cambio   = JSON.stringify(vAntes) !== JSON.stringify(vDespues)
                    return (
                      <tr
                        key={campo}
                        className={cambio
                          ? 'bg-yellow-50 dark:bg-yellow-900/10'
                          : 'bg-white dark:bg-gray-800'}
                      >
                        <td className="px-3 py-1.5 border-b dark:border-gray-700 font-mono text-gray-500 dark:text-gray-400">
                          {campo}
                        </td>
                        <td className="px-3 py-1.5 border-b dark:border-gray-700 text-red-700 dark:text-red-300 break-all">
                          {String(vAntes)}
                        </td>
                        <td className="px-3 py-1.5 border-b dark:border-gray-700 text-green-700 dark:text-green-300 break-all">
                          {String(vDespues)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500 italic text-center py-4">
              No hay datos de campos disponibles para este registro.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const POR_PAGINA = 50
const FILTROS_VACIOS = { modulo: '', accion: '', usuario: '', fechaDesde: '', fechaHasta: '' }

export default function Auditoria() {
  const [registros, setRegistros]   = useState([])
  const [total, setTotal]           = useState(0)
  const [pagina, setPagina]         = useState(1)
  const [cargando, setCargando]     = useState(false)
  const [detalle, setDetalle]       = useState(null)

  // filtros: estado vivo del formulario (lo que el usuario escribe)
  // aplicados: lo que realmente se manda a la query (solo cambia al presionar Filtrar o Limpiar)
  const [filtros, setFiltros]       = useState({ ...FILTROS_VACIOS })
  const [aplicados, setAplicados]   = useState({ ...FILTROS_VACIOS })

  const cargar = useCallback(async (pag = 1) => {
    setCargando(true)
    try {
      const params = { pagina: pag, porPagina: POR_PAGINA }
      if (aplicados.modulo)     params.modulo     = aplicados.modulo
      if (aplicados.accion)     params.accion     = aplicados.accion
      if (aplicados.usuario)    params.usuario    = aplicados.usuario
      if (aplicados.fechaDesde) params.fechaDesde = aplicados.fechaDesde
      if (aplicados.fechaHasta) params.fechaHasta = aplicados.fechaHasta

      const { data } = await axios.get('/api/auditoria', { params })
      setRegistros(data.registros)
      setTotal(data.total)
      setPagina(pag)
    } catch (err) {
      console.error('[Auditoría] Error al cargar:', err)
    } finally {
      setCargando(false)
    }
  }, [aplicados])

  // Se dispara cada vez que `aplicados` cambia (Filtrar o Limpiar)
  useEffect(() => { cargar(1) }, [cargar])

  const handleFiltrar = () => setAplicados({ ...filtros })

  const handleLimpiar = () => {
    setFiltros({ ...FILTROS_VACIOS })
    setAplicados({ ...FILTROS_VACIOS })
  }

  const totalPaginas = Math.ceil(total / POR_PAGINA)

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Auditoría del Sistema</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Historial de cambios realizados por los usuarios
          </p>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {total} {total === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {/* Panel de filtros */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Módulo */}
          <div className="min-w-[160px]">
            <label className="form-label">Módulo</label>
            <select
              className="form-input"
              value={filtros.modulo}
              onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value }))}
            >
              {MODULOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          {/* Acción */}
          <div className="min-w-[150px]">
            <label className="form-label">Acción</label>
            <select
              className="form-input"
              value={filtros.accion}
              onChange={e => setFiltros(f => ({ ...f, accion: e.target.value }))}
            >
              {ACCIONES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>

          {/* Separador visual */}
          <div className="w-px self-stretch bg-gray-200 dark:bg-gray-600 my-1 hidden sm:block" />

          {/* Usuario */}
          <div className="min-w-[180px]">
            <label className="form-label">Usuario</label>
            <input
              className="form-input"
              placeholder="Buscar por nombre..."
              value={filtros.usuario}
              onChange={e => setFiltros(f => ({ ...f, usuario: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleFiltrar()}
            />
          </div>

          {/* Separador visual */}
          <div className="w-px self-stretch bg-gray-200 dark:bg-gray-600 my-1 hidden sm:block" />

          {/* Rango de fechas */}
          <div className="flex items-end gap-2">
            <div className="min-w-[140px]">
              <label className="form-label">Desde</label>
              <input
                type="date"
                className="form-input"
                value={filtros.fechaDesde}
                onChange={e => setFiltros(f => ({ ...f, fechaDesde: e.target.value }))}
              />
            </div>
            <div className="pb-2 text-gray-400 dark:text-gray-500 text-sm font-medium flex-shrink-0">—</div>
            <div className="min-w-[140px]">
              <label className="form-label">Hasta</label>
              <input
                type="date"
                className="form-input"
                value={filtros.fechaHasta}
                onChange={e => setFiltros(f => ({ ...f, fechaHasta: e.target.value }))}
              />
            </div>
          </div>

          {/* Separador visual */}
          <div className="w-px self-stretch bg-gray-200 dark:bg-gray-600 my-1 hidden sm:block" />

          {/* Botones */}
          <div className="flex gap-2">
            <button onClick={handleFiltrar} className="btn-primary">
              Filtrar
            </button>
            <button onClick={handleLimpiar} className="btn-secondary">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="tabla-base">
            <thead className="tabla-encabezado">
              <tr>
                <th className="tabla-th">Fecha y Hora</th>
                <th className="tabla-th">Usuario</th>
                <th className="tabla-th">Acción</th>
                <th className="tabla-th">Módulo</th>
                <th className="tabla-th">Descripción</th>
                <th className="tabla-th text-center w-16">Det.</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={6} className="tabla-celda text-center py-10">
                    <div className="flex items-center justify-center gap-2 text-gray-400">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="tabla-celda text-center py-10 text-gray-400 dark:text-gray-500">
                    No hay registros de auditoría
                  </td>
                </tr>
              ) : registros.map(r => (
                <tr key={r.id} className="tabla-fila">
                  <td className="tabla-celda text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatFecha(r.creado_en)}
                  </td>
                  <td className="tabla-celda font-medium text-gray-800 dark:text-gray-200">
                    {r.usuario_nombre}
                  </td>
                  <td className="tabla-celda">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${BADGE_ACCION[r.accion] || 'bg-gray-100 text-gray-700'}`}>
                      {LABEL_ACCION[r.accion] || r.accion}
                    </span>
                  </td>
                  <td className="tabla-celda text-sm text-gray-600 dark:text-gray-300">
                    {LABEL_MODULO[r.modulo] || r.modulo}
                  </td>
                  <td
                    className="tabla-celda text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate"
                    title={r.descripcion}
                  >
                    {r.descripcion}
                  </td>
                  <td className="tabla-celda text-center">
                    {(r.datos_anteriores || r.datos_nuevos) ? (
                      <button
                        onClick={() => setDetalle(r)}
                        className="text-blue-600 dark:text-blue-400 hover:underline text-xs font-medium"
                        title="Ver detalle del cambio"
                      >
                        Ver
                      </button>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Página {pagina} de {totalPaginas} — {total} registros
            </p>
            <div className="flex gap-2">
              <button
                disabled={pagina <= 1}
                onClick={() => cargar(pagina - 1)}
                className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              <button
                disabled={pagina >= totalPaginas}
                onClick={() => cargar(pagina + 1)}
                className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {detalle && <ModalDetalle registro={detalle} onClose={() => setDetalle(null)} />}
    </div>
  )
}
