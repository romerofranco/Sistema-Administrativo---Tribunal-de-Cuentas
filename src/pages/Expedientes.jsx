import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { formatearFecha, formatearMoneda, truncar } from '../utils/formateos'
import { LISTA_ESTADOS, claseFila, clasesBadge, labelEstado } from '../utils/colores'
import ModalExpediente from '../components/Expedientes/ModalExpediente'

const POR_PAGINA = 50

const MESES = [
  { v: '', l: 'Todos los meses' },
  { v: 1, l: 'Enero' }, { v: 2, l: 'Febrero' }, { v: 3, l: 'Marzo' },
  { v: 4, l: 'Abril' }, { v: 5, l: 'Mayo' }, { v: 6, l: 'Junio' },
  { v: 7, l: 'Julio' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Septiembre' },
  { v: 10, l: 'Octubre' }, { v: 11, l: 'Noviembre' }, { v: 12, l: 'Diciembre' },
]

export default function Expedientes() {
  const [expedientes, setExpedientes]   = useState([])
  const [total, setTotal]               = useState(0)
  const [pagina, setPagina]             = useState(1)
  const [cargando, setCargando]         = useState(false)
  const [busqueda, setBusqueda]         = useState('')
  const [filtros, setFiltros]           = useState({ mes: '', anio: '', estado: '', tipoOp: '' })
  const [modalAbierto, setModalAbierto] = useState(false)
  const [expedienteEditar, setExpedienteEditar] = useState(null)
  const [seleccionados, setSeleccionados] = useState(new Set())
  const navigate = useNavigate()

  const anioActual = new Date().getFullYear()
  const anios = [anioActual+1, anioActual, anioActual-1, anioActual-2, anioActual-3, anioActual-4, anioActual-5]

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/expedientes', {
        params: { pagina, porPagina: POR_PAGINA, busqueda, ...filtros },
      })
      setExpedientes(data.expedientes)
      setTotal(data.total)
    } catch (err) {
      console.error('Error al cargar expedientes:', err)
    } finally {
      setCargando(false)
    }
  }, [pagina, busqueda, filtros])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Resetear paginación al filtrar
  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtros])

  const cambiarEstado = async (expediente, nuevoEstado) => {
    try {
      await axios.patch(`/api/expedientes/${expediente.fila}/estado`, { estado: nuevoEstado })
      setExpedientes(prev =>
        prev.map(e => e.fila === expediente.fila ? { ...e, estado: nuevoEstado } : e)
      )
    } catch (err) {
      alert('Error al cambiar estado: ' + (err.response?.data?.error || err.message))
    }
  }

  const eliminar = async (exp) => {
    const nombre = exp.denominacion || `Expediente N° ${exp.nroExpediente}`
    if (!confirm(`¿Estás seguro que querés eliminar el expediente de:\n"${nombre}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      await axios.delete(`/api/expedientes/${exp.fila || exp.id}`)
      cargar()
    } catch (err) {
      alert('Error al eliminar: ' + (err.response?.data?.error || err.message))
    }
  }

  const abrirNuevo = () => { setExpedienteEditar(null); setModalAbierto(true) }
  const abrirEditar = (exp) => { setExpedienteEditar(exp); setModalAbierto(true) }

  const onGuardar = () => {
    setModalAbierto(false)
    cargar()
  }

  const idExp = (e) => e.fila || e.id

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const todosEnPagina = expedientes.length > 0 && expedientes.every(e => seleccionados.has(idExp(e)))
  const algunoEnPagina = expedientes.some(e => seleccionados.has(idExp(e)))

  const toggleTodosPagina = () => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (todosEnPagina) expedientes.forEach(e => next.delete(idExp(e)))
      else expedientes.forEach(e => next.add(idExp(e)))
      return next
    })
  }

  const enviarAInforme = () => {
    const lista = expedientes.filter(e => seleccionados.has(idExp(e)))
    navigate('/informes', { state: { expedientesManual: lista } })
  }

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
              placeholder="Buscar por beneficiario, N° expediente, SIDIF u OP..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtros */}
          <select
            className="input-base w-auto"
            value={filtros.mes}
            onChange={e => setFiltros(f => ({ ...f, mes: e.target.value }))}
          >
            {MESES.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
          </select>

          <select
            className="input-base w-auto"
            value={filtros.anio}
            onChange={e => setFiltros(f => ({ ...f, anio: e.target.value }))}
          >
            <option value="">Todos los años</option>
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="input-base w-auto"
            value={filtros.estado}
            onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}
          >
            <option value="">Todos los estados</option>
            {LISTA_ESTADOS.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
          </select>

          <select
            className="input-base w-auto"
            value={filtros.tipoOp}
            onChange={e => setFiltros(f => ({ ...f, tipoOp: e.target.value }))}
          >
            <option value="">Todos los tipos</option>
            <option value="BYS">BYS</option>
            <option value="TRA">TRA</option>
            <option value="BDU">BDU</option>
          </select>

          <button onClick={abrirNuevo} className="btn-primary flex items-center gap-2 ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Expediente
          </button>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {cargando ? 'Cargando...' : `${total} expediente${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </span>
        {total > POR_PAGINA && (
          <span>Página {pagina} de {totalPaginas}</span>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="tabla-header text-center px-3 w-10">
                  <input
                    type="checkbox"
                    checked={todosEnPagina}
                    ref={el => { if (el) el.indeterminate = algunoEnPagina && !todosEnPagina }}
                    onChange={toggleTodosPagina}
                    className="rounded border-gray-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                    title="Seleccionar toda la página"
                  />
                </th>
                <th className="tabla-header text-left w-8">Nº</th>
                <th className="tabla-header text-left">Beneficiario</th>
                <th className="tabla-header text-left">N° Expediente</th>
                <th className="tabla-header text-left">Ejer.Trám.(año)</th>
                <th className="tabla-header text-left">Tipo OP</th>
                <th className="tabla-header text-left">N° SIDIF</th>
                <th className="tabla-header text-left">N° OP</th>
                <th className="tabla-header text-right">Imp. Bruto</th>
                <th className="tabla-header text-left">Fecha Visado</th>
                <th className="tabla-header text-left">Estado</th>
                <th className="tabla-header text-center w-20">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(12)].map((_, j) => (
                      <td key={j} className="tabla-celda">
                        <div className="h-3 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : expedientes.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-16 text-gray-400">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium text-gray-500">No se encontraron expedientes</p>
                    <p className="text-xs mt-1">Probá cambiando los filtros o creá uno nuevo</p>
                  </td>
                </tr>
              ) : (
                expedientes.map((exp, idx) => (
                  <tr
                    key={exp.fila || idx}
                    className={`${claseFila(exp.estado)} hover:brightness-95 transition-all`}
                  >
                    <td className="tabla-celda text-center px-3 w-10">
                      <input
                        type="checkbox"
                        checked={seleccionados.has(idExp(exp))}
                        onChange={() => toggleSeleccion(idExp(exp))}
                        className="rounded border-gray-300 text-blue-900 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="tabla-celda text-gray-400 w-8">
                      {(pagina - 1) * POR_PAGINA + idx + 1}
                    </td>
                    <td className="tabla-celda font-medium max-w-[200px]">
                      {truncar(exp.denominacion, 35)}
                      {exp.pendienteSync && (
                        <span className="ml-1 text-orange-500" title="Pendiente de sincronización">●</span>
                      )}
                    </td>
                    <td className="tabla-celda">{exp.nroExpediente || '—'}</td>
                    <td className="tabla-celda font-mono text-xs text-gray-600">{exp.ejercTramite || '—'}</td>
                    <td className="tabla-celda">
                      {exp.tipoOp && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {exp.tipoOp}
                        </span>
                      )}
                    </td>
                    <td className="tabla-celda">{exp.nroSidif || '—'}</td>
                    <td className="tabla-celda">{exp.nroOp || '—'}</td>
                    <td className="tabla-celda text-right font-mono">
                      {formatearMoneda(exp.impBruto)}
                    </td>
                    <td className="tabla-celda">{formatearFecha(exp.fechaVisado)}</td>
                    <td className="tabla-celda">
                      <select
                        className={`text-xs font-medium border rounded px-2 py-1 ${clasesBadge(exp.estado)}`}
                        value={exp.estado || 'VISADO'}
                        onChange={e => cambiarEstado(exp, e.target.value)}
                      >
                        {LISTA_ESTADOS.map(e => (
                          <option key={e.key} value={e.key}>{e.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="tabla-celda text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Editar */}
                        <button
                          onClick={() => abrirEditar(exp)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors p-1.5 rounded-lg"
                          title="Editar expediente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {/* Eliminar */}
                        <button
                          onClick={() => eliminar(exp)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors p-1.5 rounded-lg"
                          title="Eliminar expediente"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(1)}
                disabled={pagina === 1}
                className="btn-secondary text-xs py-1.5 px-2"
                title="Primera página"
              >
                «
              </button>
              <button
                onClick={() => setPagina(p => Math.max(1, p - 1))}
                disabled={pagina === 1}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Anterior
              </button>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPaginas))].map((_, i) => {
                const p = pagina <= 3 ? i + 1 : pagina - 2 + i
                if (p > totalPaginas) return null
                return (
                  <button
                    key={p}
                    onClick={() => setPagina(p)}
                    className={`w-8 h-8 text-xs rounded-lg font-medium transition-colors
                      ${p === pagina ? 'bg-blue-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                disabled={pagina === totalPaginas}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                Siguiente
              </button>
              <button
                onClick={() => setPagina(totalPaginas)}
                disabled={pagina === totalPaginas}
                className="btn-secondary text-xs py-1.5 px-2"
                title="Última página"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de crear/editar */}
      {modalAbierto && (
        <ModalExpediente
          expediente={expedienteEditar}
          onGuardar={onGuardar}
          onCerrar={() => setModalAbierto(false)}
        />
      )}

      {/* Barra flotante de selección */}
      {seleccionados.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-blue-900 text-white pl-5 pr-2 py-2.5 rounded-full shadow-2xl border border-blue-700">
          <span className="text-sm font-medium">
            {seleccionados.size} expediente{seleccionados.size !== 1 ? 's' : ''} seleccionado{seleccionados.size !== 1 ? 's' : ''}
          </span>
          <button
            onClick={() => setSeleccionados(new Set())}
            className="text-blue-300 hover:text-white text-xs px-2 py-1 rounded-full hover:bg-blue-800 transition-colors"
          >
            Limpiar
          </button>
          <button
            onClick={enviarAInforme}
            className="flex items-center gap-1.5 bg-white text-blue-900 font-semibold text-sm px-4 py-1.5 rounded-full hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586l5.414 5.414V19a2 2 0 01-2 2z" />
            </svg>
            Enviar a Informe
          </button>
        </div>
      )}
    </div>
  )
}
