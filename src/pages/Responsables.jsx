import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const VACIO = {
  cargo: '', nombreCompleto: '', dni: '', domicilio: '',
  email: '', programaId: '', ordenJerarquico: '', activo: true,
}

function ModalResponsable({ responsable, programas, onGuardar, onCerrar }) {
  const esNuevo = !responsable
  const [form, setForm]     = useState(responsable ? {
    ...responsable,
    programaId: responsable.programa_id || '',
    nombreCompleto: responsable.nombre_completo,
    ordenJerarquico: responsable.orden_jerarquico,
  } : { ...VACIO })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]   = useState('')

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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">{esNuevo ? 'Nuevo Responsable' : 'Editar Responsable'}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600">
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
            <label htmlFor="activoResp" className="text-sm text-gray-700">Responsable activo</label>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
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

export default function Responsables() {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'administrador'
  const [responsables, setResponsables] = useState([])
  const [programas, setProgramas]       = useState([])
  const [cargando, setCargando]         = useState(true)
  const [modal, setModal]               = useState(false)
  const [editando, setEditando]         = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const [respResp, respProg] = await Promise.all([
        axios.get('/api/responsables'),
        axios.get('/api/programas'),
      ])
      setResponsables(respResp.data)
      setProgramas(respProg.data)
    } catch (err) { console.error(err) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const eliminar = async (resp) => {
    if (!confirm(`¿Eliminar definitivamente a:\n"${resp.nombre_completo}"?\n\nEsta acción no se puede deshacer.`)) return
    try {
      await axios.delete(`/api/responsables/${resp.id}`)
      cargar()
    } catch (err) { alert(err.response?.data?.error || 'Error') }
  }

  const onGuardar = () => { setModal(false); setEditando(null); cargar() }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{responsables.length} responsable(s) registrado(s)</p>
        {esAdmin && (
          <button onClick={() => { setEditando(null); setModal(true) }} className="btn-primary flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Responsable
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
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
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Cargando...</td></tr>
            ) : responsables.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-gray-400">Sin responsables registrados</td></tr>
            ) : responsables.map(resp => (
              <tr key={resp.id} className={!resp.activo ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}>
                <td className="tabla-celda text-gray-400 text-center w-12">{resp.orden_jerarquico}</td>
                <td className="tabla-celda font-semibold text-blue-900 uppercase text-xs">{resp.cargo}</td>
                <td className="tabla-celda font-medium">{resp.nombre_completo}</td>
                <td className="tabla-celda font-mono text-xs">{resp.dni || '—'}</td>
                <td className="tabla-celda">
                  {resp.nombre_programa ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">
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
                        onClick={() => { setEditando(resp); setModal(true) }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded-lg transition-colors"
                        title="Editar responsable"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => eliminar(resp)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
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

      {modal && (
        <ModalResponsable
          responsable={editando}
          programas={programas}
          onGuardar={onGuardar}
          onCerrar={() => { setModal(false); setEditando(null) }}
        />
      )}
    </div>
  )
}
