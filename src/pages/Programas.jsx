import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

// ── Modal Programa ──────────────────────────────────────────
const VACIO_PROG = { numero: '', nombre: '', cuentaFinanciera: '', activo: true }

function ModalPrograma({ programa, onGuardar, onCerrar }) {
  const esNuevo = !programa
  const [form, setForm]         = useState(programa ? { ...programa } : { ...VACIO_PROG })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.numero || !form.nombre) { setError('Número y nombre son requeridos'); return }
    setGuardando(true); setError('')
    try {
      if (esNuevo) await axios.post('/api/programas', form)
      else await axios.put(`/api/programas/${programa.id}`, form)
      onGuardar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-gray-100">{esNuevo ? 'Nuevo Programa' : 'Editar Programa'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="label-base">Número de Programa <span className="text-red-500">*</span></label>
            <input type="number" name="numero" className="input-base" value={form.numero} onChange={handleChange} required />
          </div>
          <div>
            <label className="label-base">Nombre <span className="text-red-500">*</span></label>
            <input type="text" name="nombre" className="input-base" value={form.nombre} onChange={handleChange} required placeholder="Ej: Programa Nacional Nº 32" />
          </div>
          <div>
            <label className="label-base">Cuenta Financiera (Cta. Financ.)</label>
            <input type="text" name="cuentaFinanciera" className="input-base" value={form.cuentaFinanciera || ''} onChange={handleChange} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="activo" id="activoProg" checked={!!form.activo} onChange={handleChange} className="rounded border-gray-300" />
            <label htmlFor="activoProg" className="text-sm text-gray-700 dark:text-gray-300">Programa activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onCerrar} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : esNuevo ? 'Crear Programa' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal Responsable ───────────────────────────────────────
const VACIO_RESP = {
  cargo: '', nombreCompleto: '', dni: '', domicilio: '',
  email: '', programaId: '', ordenJerarquico: '', activo: true,
}

function ModalResponsable({ responsable, programas, onGuardar, onCerrar }) {
  const esNuevo = !responsable
  const [form, setForm]         = useState(responsable ? {
    ...responsable,
    programaId: responsable.programa_id || '',
    nombreCompleto: responsable.nombre_completo,
    ordenJerarquico: responsable.orden_jerarquico,
  } : { ...VACIO_RESP })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]       = useState('')

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.cargo || !form.nombreCompleto) { setError('Cargo y nombre son requeridos'); return }
    setGuardando(true); setError('')
    try {
      if (esNuevo) await axios.post('/api/responsables', form)
      else await axios.put(`/api/responsables/${responsable.id}`, form)
      onGuardar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally { setGuardando(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-gray-100">{esNuevo ? 'Nuevo Responsable' : 'Editar Responsable'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
          <div>
            <label className="label-base">Cargo <span className="text-red-500">*</span></label>
            <input type="text" name="cargo" className="input-base uppercase" value={form.cargo}
              onChange={handleChange} required placeholder="Ej: MINISTRO, DIRECTOR GENERAL..." />
          </div>
          <div>
            <label className="label-base">Nombre Completo <span className="text-red-500">*</span></label>
            <input type="text" name="nombreCompleto" className="input-base" value={form.nombreCompleto}
              onChange={handleChange} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">DNI</label>
              <input type="text" name="dni" className="input-base" value={form.dni || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">Orden Jerárquico</label>
              <input type="number" name="ordenJerarquico" className="input-base" value={form.ordenJerarquico || ''}
                onChange={handleChange} min="1" />
            </div>
          </div>
          <div>
            <label className="label-base">Domicilio</label>
            <input type="text" name="domicilio" className="input-base" value={form.domicilio || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-base">Email</label>
            <input type="email" name="email" className="input-base" value={form.email || ''} onChange={handleChange} />
          </div>
          <div>
            <label className="label-base">Programa Asociado</label>
            <select name="programaId" className="input-base" value={form.programaId || ''} onChange={handleChange}>
              <option value="">— Sin programa asociado —</option>
              {programas.filter(p => p.activo).map(p => (
                <option key={p.id} value={p.id}>Nº {p.numero} — {p.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="activo" id="activoResp" checked={!!form.activo} onChange={handleChange} className="rounded border-gray-300" />
            <label htmlFor="activoResp" className="text-sm text-gray-700 dark:text-gray-300">Responsable activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onCerrar} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : esNuevo ? 'Crear Responsable' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Página principal combinada ──────────────────────────────
export default function Programas() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'

  const [tab, setTab]                   = useState('programas')
  const [programas, setProgramas]       = useState([])
  const [responsables, setResponsables] = useState([])
  const [cargando, setCargando]         = useState(true)
  const [modal, setModal]               = useState(null) // 'programa' | 'responsable' | null
  const [editando, setEditando]         = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const [rProg, rResp] = await Promise.all([
        axios.get('/api/programas'),
        axios.get('/api/responsables'),
      ])
      setProgramas(rProg.data)
      setResponsables(rResp.data)
    } catch (err) { console.error(err) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const bajaPrograma = async (id) => {
    if (!confirm('¿Dar de baja este programa?')) return
    try { await axios.delete(`/api/programas/${id}`); cargar() }
    catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const eliminarResponsable = async (resp) => {
    if (!confirm(`¿Eliminar definitivamente a:\n"${resp.nombre_completo}"?\n\nEsta acción no se puede deshacer.`)) return
    try { await axios.delete(`/api/responsables/${resp.id}`); cargar() }
    catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const onGuardar = () => { setModal(null); setEditando(null); cargar() }
  const onCerrar  = () => { setModal(null); setEditando(null) }

  const TABS = [
    { key: 'programas',    label: 'Programas',    count: programas.length },
    { key: 'responsables', label: 'Responsables', count: responsables.length },
  ]

  return (
    <div className="space-y-4">
      {/* ── Tabs ── */}
      <div className="card py-0 px-0 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px
                ${tab === t.key
                  ? 'border-blue-900 text-blue-900 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-normal
                ${tab === t.key
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Barra de acciones ── */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {tab === 'programas'
            ? `${programas.length} programa(s) registrado(s)`
            : `${responsables.length} responsable(s) registrado(s)`}
        </p>
        {esAdmin && (
          <button
            onClick={() => { setEditando(null); setModal(tab === 'programas' ? 'programa' : 'responsable') }}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {tab === 'programas' ? 'Nuevo Programa' : 'Nuevo Responsable'}
          </button>
        )}
      </div>

      {/* ── Tabla Programas ── */}
      {tab === 'programas' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="tabla-header text-left">N° Programa</th>
                <th className="tabla-header text-left">Nombre</th>
                <th className="tabla-header text-left">Cta. Financiera</th>
                <th className="tabla-header text-center">Estado</th>
                {esAdmin && <th className="tabla-header text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : programas.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16 text-gray-400">Sin programas registrados</td></tr>
              ) : programas.map(prog => (
                <tr key={prog.id} className={!prog.activo ? 'opacity-50' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}>
                  <td className="tabla-celda font-bold text-blue-900 dark:text-blue-400">Nº {prog.numero}</td>
                  <td className="tabla-celda font-medium">{prog.nombre}</td>
                  <td className="tabla-celda">{prog.cuenta_financiera || '—'}</td>
                  <td className="tabla-celda text-center">
                    <span className={`badge ${prog.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {prog.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="tabla-celda text-center">
                      <button
                        onClick={() => { setEditando(prog); setModal('programa') }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {prog.activo && (
                        <button
                          onClick={() => bajaPrograma(prog.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg ml-1 transition-colors"
                          title="Dar de baja"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" />
                          </svg>
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tabla Responsables ── */}
      {tab === 'responsables' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="tabla-header text-left">Orden</th>
                <th className="tabla-header text-left">Cargo</th>
                <th className="tabla-header text-left">Nombre Completo</th>
                <th className="tabla-header text-left">DNI</th>
                <th className="tabla-header text-left">Programa</th>
                <th className="tabla-header text-center">Estado</th>
                {esAdmin && <th className="tabla-header text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cargando ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
              ) : responsables.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">Sin responsables registrados</td></tr>
              ) : responsables.map(resp => (
                <tr key={resp.id} className={!resp.activo ? 'opacity-50 bg-gray-50 dark:bg-gray-700/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/40'}>
                  <td className="tabla-celda text-center w-12">{resp.orden_jerarquico}</td>
                  <td className="tabla-celda font-semibold text-blue-900 dark:text-blue-400 uppercase text-xs">{resp.cargo}</td>
                  <td className="tabla-celda font-medium">{resp.nombre_completo}</td>
                  <td className="tabla-celda font-mono text-xs">{resp.dni || '—'}</td>
                  <td className="tabla-celda">
                    {resp.nombre_programa ? (
                      <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs font-medium">
                        Prog. {resp.numero_programa}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="tabla-celda text-center">
                    <span className={`badge ${resp.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {resp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  {esAdmin && (
                    <td className="tabla-celda text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setEditando(resp); setModal('responsable') }}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 p-1.5 rounded-lg transition-colors"
                          title="Editar responsable"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => eliminarResponsable(resp)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 p-1.5 rounded-lg transition-colors"
                          title="Eliminar responsable"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modales ── */}
      {modal === 'programa' && (
        <ModalPrograma
          programa={editando}
          onGuardar={onGuardar}
          onCerrar={onCerrar}
        />
      )}
      {modal === 'responsable' && (
        <ModalResponsable
          responsable={editando}
          programas={programas}
          onGuardar={onGuardar}
          onCerrar={onCerrar}
        />
      )}
    </div>
  )
}
