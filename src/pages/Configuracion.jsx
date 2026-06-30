import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

// ─── Helpers de rol ───────────────────────────────────────────────────────────
const esSuperAdmin  = (rol) => rol === 'superadmin' || rol === 'administrador'
const esPrivilegiado = (rol) => esSuperAdmin(rol) || rol === 'delegado'

const ROL_LABELS = {
  superadmin:    'Super Administrador',
  administrador: 'Super Administrador',
  delegado:      'Delegado',
  operador:      'Operador',
}
const ROL_COLORES = {
  superadmin:    'bg-purple-100 text-purple-700',
  administrador: 'bg-purple-100 text-purple-700',
  delegado:      'bg-blue-100 text-blue-700',
  operador:      'bg-gray-100 text-gray-600',
}

// ─── Íconos ───────────────────────────────────────────────────────────────────
const IcoUsuario = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)
const IcoUsuarios = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)
const IcoSheets = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M3 10h18M3 14h18M10 3v18M6 3h12a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" />
  </svg>
)
const IcoSeguridad = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
)
const IcoNota = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
  </svg>
)
const IcoCP = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
)

// ─── Alerta reutilizable ──────────────────────────────────────────────────────
function Alerta({ tipo, texto, onCerrar }) {
  if (!texto) return null
  const estilos = tipo === 'ok'
    ? 'bg-green-50 border-green-200 text-green-700'
    : 'bg-red-50 border-red-200 text-red-700'
  return (
    <div className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm ${estilos}`}>
      <span className="flex-1">{texto}</span>
      {onCerrar && <button onClick={onCerrar} className="text-current opacity-60 hover:opacity-100">✕</button>}
    </div>
  )
}

// ─── Sección: Mi Cuenta ───────────────────────────────────────────────────────
function SeccionMiCuenta() {
  const { usuario, actualizarUsuario } = useAuth()

  // ── Perfil (nombre + usuario) ────────────────────────
  const [perfil, setPerfil]           = useState({ nombreCompleto: '', nombreUsuario: '' })
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [msgPerfil, setMsgPerfil]     = useState(null)

  // ── Contraseña ───────────────────────────────────────
  const [pass, setPass]               = useState({ contrasenaActual: '', contrasenaNueva: '', confirmacion: '' })
  const [guardandoPass, setGuardandoPass] = useState(false)
  const [msgPass, setMsgPass]         = useState(null)

  // Inicializar perfil con datos actuales al abrir edición
  const abrirEdicion = () => {
    setPerfil({ nombreCompleto: usuario?.nombreCompleto || '', nombreUsuario: usuario?.nombreUsuario || '' })
    setMsgPerfil(null)
    setEditandoPerfil(true)
  }

  const guardarPerfil = async (e) => {
    e.preventDefault()
    setGuardandoPerfil(true); setMsgPerfil(null)
    try {
      const { data } = await axios.put('/api/auth/perfil', {
        nombreCompleto: perfil.nombreCompleto,
        nombreUsuario:  perfil.nombreUsuario,
      })
      // Actualizar sesión directamente — no depende de que el contexto esté actualizado
      localStorage.setItem('token', data.token)
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
      if (typeof actualizarUsuario === 'function') {
        actualizarUsuario(data.usuario, data.token)
      }
      setMsgPerfil({ tipo: 'ok', texto: data.mensaje })
      setEditandoPerfil(false)
    } catch (err) {
      const msg = err.response?.data?.error
        || (err.response?.status ? `Error ${err.response.status} — ${err.message}` : null)
        || err.message
        || 'Error al guardar perfil.'
      setMsgPerfil({ tipo: 'error', texto: msg })
    } finally { setGuardandoPerfil(false) }
  }

  const guardarContrasena = async (e) => {
    e.preventDefault()
    if (pass.contrasenaNueva !== pass.confirmacion) {
      return setMsgPass({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' })
    }
    if (pass.contrasenaNueva.length < 6) {
      return setMsgPass({ tipo: 'error', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' })
    }
    setGuardandoPass(true); setMsgPass(null)
    try {
      await axios.post('/api/auth/cambiar-contrasena', {
        contrasenaActual: pass.contrasenaActual,
        contrasenaNueva:  pass.contrasenaNueva,
      })
      setMsgPass({ tipo: 'ok', texto: 'Contraseña actualizada correctamente.' })
      setPass({ contrasenaActual: '', contrasenaNueva: '', confirmacion: '' })
    } catch (err) {
      setMsgPass({ tipo: 'error', texto: err.response?.data?.error || 'Error al cambiar contraseña.' })
    } finally { setGuardandoPass(false) }
  }

  return (
    <div className="space-y-4 max-w-lg">
      {/* ── Datos personales ──────────────────────────── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Datos Personales</h3>
          {!editandoPerfil && (
            <button onClick={abrirEdicion} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Editar
            </button>
          )}
        </div>

        {!editandoPerfil ? (
          <>
            <Alerta tipo={msgPerfil?.tipo} texto={msgPerfil?.texto} onCerrar={() => setMsgPerfil(null)} />
            <dl className={`space-y-3 text-sm ${msgPerfil ? 'mt-3' : ''}`}>
              <div className="flex items-center gap-3">
                <dt className="text-gray-500 w-36">Nombre completo</dt>
                <dd className="font-medium text-gray-800">{usuario?.nombreCompleto}</dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="text-gray-500 w-36">Usuario</dt>
                <dd className="font-mono font-medium text-gray-800">{usuario?.nombreUsuario}</dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="text-gray-500 w-36">Rol asignado</dt>
                <dd>
                  <span className={`badge ${ROL_COLORES[usuario?.rol] || 'bg-gray-100 text-gray-600'}`}>
                    {ROL_LABELS[usuario?.rol] || usuario?.rol}
                  </span>
                </dd>
              </div>
            </dl>
          </>
        ) : (
          <form onSubmit={guardarPerfil} className="space-y-3">
            <Alerta tipo={msgPerfil?.tipo} texto={msgPerfil?.texto} onCerrar={() => setMsgPerfil(null)} />
            <div>
              <label className="label-base">Nombre completo</label>
              <input type="text" className="input-base" value={perfil.nombreCompleto}
                onChange={e => setPerfil(p => ({ ...p, nombreCompleto: e.target.value }))} required />
            </div>
            <div>
              <label className="label-base">Nombre de usuario</label>
              <input type="text" className="input-base font-mono" value={perfil.nombreUsuario}
                onChange={e => setPerfil(p => ({ ...p, nombreUsuario: e.target.value }))}
                required pattern="[a-zA-Z0-9_.-]+" title="Solo letras, números, puntos, guiones y guión bajo" />
              <p className="text-xs text-gray-400 mt-1">Cambiar el usuario cerrará tu sesión activa.</p>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={() => setEditandoPerfil(false)} className="btn-secondary">Cancelar</button>
              <button type="submit" disabled={guardandoPerfil} className="btn-primary">
                {guardandoPerfil ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Cambiar contraseña ────────────────────────── */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Cambiar Contraseña</h3>
        <Alerta tipo={msgPass?.tipo} texto={msgPass?.texto} onCerrar={() => setMsgPass(null)} />
        <form onSubmit={guardarContrasena} className={`space-y-3 ${msgPass ? 'mt-3' : ''}`}>
          <div>
            <label className="label-base">Contraseña actual</label>
            <input type="password" className="input-base" value={pass.contrasenaActual}
              onChange={e => setPass(p => ({ ...p, contrasenaActual: e.target.value }))}
              required autoComplete="current-password" />
          </div>
          <div>
            <label className="label-base">Nueva contraseña</label>
            <input type="password" className="input-base" value={pass.contrasenaNueva}
              onChange={e => setPass(p => ({ ...p, contrasenaNueva: e.target.value }))}
              required autoComplete="new-password" />
          </div>
          <div>
            <label className="label-base">Confirmar nueva contraseña</label>
            <input type="password" className="input-base" value={pass.confirmacion}
              onChange={e => setPass(p => ({ ...p, confirmacion: e.target.value }))}
              required autoComplete="new-password" />
          </div>
          <div className="flex justify-end pt-1">
            <button type="submit" disabled={guardandoPass} className="btn-primary">
              {guardandoPass ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sección: Gestión de Usuarios ─────────────────────────────────────────────
function SeccionUsuarios({ rolActual }) {
  const superAdmin = esSuperAdmin(rolActual)

  const [usuarios, setUsuarios]   = useState([])
  const [cargando, setCargando]   = useState(true)
  const [modal, setModal]         = useState(false)
  const [editando, setEditando]   = useState(null)
  const [form, setForm]           = useState({ nombreUsuario: '', nombreCompleto: '', contrasena: '', rol: 'operador', activo: true })
  const [guardando, setGuardando] = useState(false)
  const [error, setError]         = useState('')
  const [confirmElim, setConfirmElim] = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/configuracion/usuarios')
      setUsuarios(data)
    } catch (err) { console.error(err) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditando(null)
    setForm({ nombreUsuario: '', nombreCompleto: '', contrasena: '', rol: 'operador', activo: true })
    setError('')
    setModal(true)
  }

  const abrirEditar = (u) => {
    setEditando(u)
    setForm({ nombreUsuario: u.nombre_usuario, nombreCompleto: u.nombre_completo, contrasena: '', rol: u.rol, activo: !!u.activo })
    setError('')
    setModal(true)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setGuardando(true); setError('')
    try {
      if (!editando) {
        await axios.post('/api/configuracion/usuarios', form)
      } else {
        await axios.put(`/api/configuracion/usuarios/${editando.id}`, form)
      }
      setModal(false)
      cargar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar.')
    } finally { setGuardando(false) }
  }

  const eliminar = async (id) => {
    try {
      await axios.delete(`/api/configuracion/usuarios/${id}`)
      setConfirmElim(null)
      cargar()
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar.')
    }
  }

  const ROLES_DISPONIBLES = superAdmin
    ? [
        { value: 'superadmin', label: 'Super Administrador' },
        { value: 'delegado',   label: 'Delegado' },
        { value: 'operador',   label: 'Operador' },
      ]
    : [{ value: 'operador', label: 'Operador' }]

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-800">Gestión de Usuarios</h3>
            {!superAdmin && (
              <p className="text-xs text-gray-400 mt-0.5">Podés crear usuarios con rol Operador.</p>
            )}
          </div>
          <button onClick={abrirNuevo} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </button>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="tabla-header text-left">Usuario</th>
              <th className="tabla-header text-left">Nombre</th>
              <th className="tabla-header text-left">Rol</th>
              <th className="tabla-header text-center">Estado</th>
              {superAdmin && <th className="tabla-header text-left">Último acceso</th>}
              {superAdmin && <th className="tabla-header text-center">Acciones</th>}
              {!superAdmin && <th className="tabla-header text-center"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={superAdmin ? 6 : 5} className="text-center py-8 text-gray-400">Cargando...</td></tr>
            ) : usuarios.length === 0 ? (
              <tr><td colSpan={superAdmin ? 6 : 5} className="text-center py-8 text-gray-400">No hay usuarios.</td></tr>
            ) : usuarios.map(u => (
              <tr key={u.id} className={!u.activo ? 'opacity-50' : ''}>
                <td className="tabla-celda font-mono font-medium">{u.nombre_usuario}</td>
                <td className="tabla-celda">{u.nombre_completo}</td>
                <td className="tabla-celda">
                  <span className={`badge ${ROL_COLORES[u.rol] || 'bg-gray-100 text-gray-600'}`}>
                    {ROL_LABELS[u.rol] || u.rol}
                  </span>
                </td>
                <td className="tabla-celda text-center">
                  <span className={`badge ${u.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                {superAdmin && (
                  <td className="tabla-celda text-xs text-gray-400">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : '—'}
                  </td>
                )}
                {superAdmin && (
                  <td className="tabla-celda text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => abrirEditar(u)} className="p-1 text-blue-600 hover:text-blue-800" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => setConfirmElim(u)} className="p-1 text-red-500 hover:text-red-700" title="Eliminar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                )}
                {!superAdmin && <td className="tabla-celda" />}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold">{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {error && <Alerta tipo="error" texto={error} />}
              <div>
                <label className="label-base">Usuario <span className="text-red-500">*</span></label>
                <input type="text" name="nombreUsuario" className="input-base" value={form.nombreUsuario}
                  onChange={handleChange} required disabled={!!editando} />
              </div>
              <div>
                <label className="label-base">Nombre Completo</label>
                <input type="text" name="nombreCompleto" className="input-base" value={form.nombreCompleto} onChange={handleChange} />
              </div>
              <div>
                <label className="label-base">
                  {editando ? 'Nueva Contraseña (vacío = sin cambio)' : 'Contraseña'}{!editando && <span className="text-red-500"> *</span>}
                </label>
                <input type="password" name="contrasena" className="input-base" value={form.contrasena}
                  onChange={handleChange} required={!editando} autoComplete="new-password" />
              </div>
              <div>
                <label className="label-base">Rol</label>
                <select name="rol" className="input-base" value={form.rol} onChange={handleChange}>
                  {ROLES_DISPONIBLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {superAdmin && (
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="activo" id="activoChk" checked={!!form.activo} onChange={handleChange}
                    className="rounded border-gray-300" />
                  <label htmlFor="activoChk" className="text-sm text-gray-700">Usuario activo</label>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-primary">
                  {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {confirmElim && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">Eliminar usuario</h3>
            <p className="text-sm text-gray-600 mb-6">
              ¿Eliminar al usuario <span className="font-mono font-medium">{confirmElim.nombre_usuario}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmElim(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => eliminar(confirmElim.id)}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sección: Google Sheets ───────────────────────────────────────────────────
function SeccionGoogle() {
  const [info, setInfo]           = useState(null)
  const [errorCarga, setErrorCarga] = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [probando, setProbando]   = useState(false)
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    axios.get('/api/configuracion/google')
      .then(({ data }) => { setInfo(data); setErrorCarga(null) })
      .catch(err => setErrorCarga(err.response?.data?.error || 'Error al cargar configuración.'))
      .finally(() => setCargando(false))
  }, [])

  const probarConexion = async () => {
    setProbando(true); setResultado(null)
    try {
      const { data } = await axios.post('/api/configuracion/google/probar')
      setResultado({ ok: true, texto: data.mensaje })
    } catch (err) {
      setResultado({ ok: false, texto: err.response?.data?.error || 'No se pudo conectar con Google Sheets.' })
    } finally { setProbando(false) }
  }

  if (cargando) return <div className="card text-center py-10 text-gray-400">Cargando...</div>

  if (errorCarga) return (
    <div className="card">
      <h3 className="font-semibold text-gray-800 mb-3">Conexión Google Sheets</h3>
      <Alerta tipo="error" texto={`Error al cargar configuración: ${errorCarga}`} />
    </div>
  )

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Conexión Google Sheets</h3>

        <dl className="space-y-3 text-sm mb-6">
          <div className="grid grid-cols-3 gap-2 items-start">
            <dt className="text-gray-500">Spreadsheet ID</dt>
            <dd className="font-mono text-xs text-gray-700 col-span-2 break-all">{info?.sheetId || <span className="text-red-500">No configurado</span>}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2 items-start">
            <dt className="text-gray-500">Cuenta de servicio</dt>
            <dd className="font-mono text-xs text-gray-700 col-span-2 break-all">{info?.serviceAccountEmail || <span className="text-red-500">No configurada</span>}</dd>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <dt className="text-gray-500">Clave privada</dt>
            <dd className="col-span-2">
              {info?.privateKeyConfigurada
                ? <span className="badge bg-green-100 text-green-700">✓ Configurada</span>
                : <span className="badge bg-red-100 text-red-700">⚠ No encontrada en .env</span>
              }
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-2 items-center">
            <dt className="text-gray-500">Hoja de cálculo</dt>
            <dd className="font-mono text-xs text-gray-700 col-span-2">{info?.sheetName || '—'}</dd>
          </div>
        </dl>

        {!info?.privateKeyConfigurada && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <strong>Credencial faltante:</strong> GOOGLE_PRIVATE_KEY no está definida en el archivo <code>.env</code>.
            Sin esta clave la sincronización con Google Sheets no funcionará.
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={probarConexion} disabled={probando} className="btn-primary">
            {probando ? 'Conectando...' : 'Probar Conexión'}
          </button>
          {resultado && (
            <div className={`flex items-start gap-1.5 text-sm ${resultado.ok ? 'text-green-600' : 'text-red-600'}`}>
              <span className="font-bold mt-0.5">{resultado.ok ? '✓' : '✕'}</span>
              <span>{resultado.texto}</span>
            </div>
          )}
        </div>

        {resultado && !resultado.ok && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Posibles causas:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>La planilla no está compartida con la cuenta de servicio <span className="font-mono">{info?.serviceAccountEmail}</span></li>
              <li>El Spreadsheet ID es incorrecto</li>
              <li>Las credenciales de la cuenta de servicio fueron revocadas</li>
              <li>Sin acceso a internet o Google bloqueado</li>
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3">Mapeo de Columnas</h3>
        <p className="text-xs text-gray-400 mb-3">
          Columnas de la hoja <span className="font-mono font-medium">{info?.sheetName}</span> y su campo correspondiente en el sistema.
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {(info?.columnas || []).map(c => (
            <div key={c.col} className="flex items-center gap-2">
              <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded w-10 text-center flex-shrink-0">{c.col}</span>
              <span className="text-gray-600">{c.campo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Sección: Seguridad ───────────────────────────────────────────────────────
function SeccionSeguridad() {
  const [datos, setDatos]         = useState(null)
  const [cargando, setCargando]   = useState(true)
  const [sesionMin, setSesionMin] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msgSesion, setMsgSesion] = useState(null)

  const cargar = async () => {
    setCargando(true)
    try {
      const { data } = await axios.get('/api/configuracion/seguridad')
      setDatos(data)
      setSesionMin(data.sesionExpiracionMinutos)
    } catch (err) { console.error(err) }
    finally { setCargando(false) }
  }

  useEffect(() => { cargar() }, [])

  const guardarSesion = async (e) => {
    e.preventDefault()
    setGuardando(true); setMsgSesion(null)
    try {
      await axios.put('/api/configuracion/sesion', { sesionExpiracionMinutos: sesionMin })
      setMsgSesion({ tipo: 'ok', texto: 'Tiempo de sesión actualizado. Efecto en el próximo login.' })
    } catch (err) {
      setMsgSesion({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar.' })
    } finally { setGuardando(false) }
  }

  const desbloquear = async (id, nombre) => {
    try {
      await axios.post(`/api/configuracion/seguridad/desbloquear/${id}`)
      cargar()
    } catch (err) {
      alert(`Error al desbloquear a ${nombre}.`)
    }
  }

  const minutosATexto = (min) => {
    if (min < 60)  return `${min} minuto${min !== 1 ? 's' : ''}`
    if (min < 1440) return `${Math.floor(min / 60)} hora${Math.floor(min / 60) !== 1 ? 's' : ''}`
    return `${Math.floor(min / 1440)} día${Math.floor(min / 1440) !== 1 ? 's' : ''}`
  }

  if (cargando) return <div className="card text-center py-10 text-gray-400">Cargando...</div>

  const bloqueados = (datos?.usuariosConProblemas || []).filter(u => u.bloqueado_hasta && new Date(u.bloqueado_hasta) > new Date())
  const conIntentos = (datos?.usuariosConProblemas || []).filter(u => u.intentos_fallidos > 0 && (!u.bloqueado_hasta || new Date(u.bloqueado_hasta) <= new Date()))

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Tiempo de sesión */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Tiempo de Expiración de Sesión</h3>
        <p className="text-xs text-gray-400 mb-4">Los tokens JWT emitidos tendrán esta duración. Cambios aplican al próximo inicio de sesión.</p>
        <Alerta tipo={msgSesion?.tipo} texto={msgSesion?.texto} onCerrar={() => setMsgSesion(null)} />
        <form onSubmit={guardarSesion} className={`flex items-end gap-3 ${msgSesion ? 'mt-3' : ''}`}>
          <div className="flex-1">
            <label className="label-base">Duración (minutos)</label>
            <input type="number" className="input-base" value={sesionMin} min="5" max="43200"
              onChange={e => setSesionMin(e.target.value)} />
            {sesionMin && <p className="text-xs text-gray-400 mt-1">Equivale a: {minutosATexto(parseInt(sesionMin) || 0)}</p>}
          </div>
          <button type="submit" disabled={guardando} className="btn-primary mb-0.5">
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[{ label: '30 min', val: 30 }, { label: '1 hora', val: 60 }, { label: '8 horas', val: 480 }, { label: '24 horas', val: 1440 }, { label: '7 días', val: 10080 }].map(op => (
            <button key={op.val} onClick={() => setSesionMin(op.val)}
              className={`px-2.5 py-1 rounded-md border transition-colors ${parseInt(sesionMin) === op.val ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Usuarios bloqueados */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Usuarios Bloqueados</h3>
        <p className="text-xs text-gray-400 mb-4">Bloqueados automáticamente tras {5} intentos fallidos consecutivos (30 min).</p>
        {bloqueados.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No hay usuarios bloqueados en este momento.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="tabla-header text-left">Usuario</th>
                <th className="tabla-header text-left">Nombre</th>
                <th className="tabla-header text-center">Intentos</th>
                <th className="tabla-header text-left">Bloqueado hasta</th>
                <th className="tabla-header text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bloqueados.map(u => (
                <tr key={u.id}>
                  <td className="tabla-celda font-mono">{u.nombre_usuario}</td>
                  <td className="tabla-celda">{u.nombre_completo}</td>
                  <td className="tabla-celda text-center">
                    <span className="badge bg-red-100 text-red-700">{u.intentos_fallidos}</span>
                  </td>
                  <td className="tabla-celda text-xs text-gray-500">
                    {new Date(u.bloqueado_hasta).toLocaleString('es-AR')}
                  </td>
                  <td className="tabla-celda text-center">
                    <button onClick={() => desbloquear(u.id, u.nombre_usuario)}
                      className="text-xs px-2 py-1 bg-green-50 border border-green-200 text-green-700 rounded-md hover:bg-green-100 transition-colors">
                      Desbloquear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Intentos fallidos sin bloqueo */}
      {conIntentos.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Intentos Fallidos Acumulados</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="tabla-header text-left">Usuario</th>
                <th className="tabla-header text-center">Intentos</th>
                <th className="tabla-header text-left">Último acceso</th>
                <th className="tabla-header text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conIntentos.map(u => (
                <tr key={u.id}>
                  <td className="tabla-celda font-mono">{u.nombre_usuario}</td>
                  <td className="tabla-celda text-center">
                    <span className={`badge ${u.intentos_fallidos >= 3 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.intentos_fallidos}
                    </span>
                  </td>
                  <td className="tabla-celda text-xs text-gray-400">
                    {u.ultimo_acceso ? new Date(u.ultimo_acceso).toLocaleString('es-AR') : '—'}
                  </td>
                  <td className="tabla-celda text-center">
                    <button onClick={() => desbloquear(u.id, u.nombre_usuario)}
                      className="text-xs px-2 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-md hover:bg-blue-100 transition-colors">
                      Resetear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Sección: Nota Mensual ────────────────────────────────────────────────────
function SeccionNotaMensual() {
  const [config, setConfig]       = useState({})
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg]             = useState(null)

  useEffect(() => {
    axios.get('/api/configuracion')
      .then(({ data }) => setConfig(data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [])

  const handleChange = (e) => setConfig(c => ({ ...c, [e.target.name]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true); setMsg(null)
    try {
      await axios.put('/api/configuracion', {
        presidenteNombre:      config.presidente_nombre,
        presidenteCargoTexto:  config.presidente_cargo_texto,
        textoNotaCuerpo:       config.texto_nota_cuerpo,
        numeroNotaCorrelativo: config.numero_nota_correlativo,
        organismo:             config.organismo,
        delegadoFiscal:        config.delegado_fiscal,
      })
      const { data } = await axios.get('/api/configuracion')
      setConfig(data)
      setMsg({ tipo: 'ok', texto: 'Configuración guardada correctamente.' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar.' })
    } finally { setGuardando(false) }
  }

  if (cargando) return <div className="card text-center py-10 text-gray-400">Cargando...</div>

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-4">Configuración de la Nota Mensual</h3>
        <Alerta tipo={msg?.tipo} texto={msg?.texto} onCerrar={() => setMsg(null)} />
        <form onSubmit={guardar} className={`space-y-4 ${msg ? 'mt-3' : ''}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-base">Cargo del destinatario (Presidente)</label>
              <input type="text" name="presidente_cargo_texto" className="input-base"
                value={config.presidente_cargo_texto || ''} onChange={handleChange} />
            </div>
            <div>
              <label className="label-base">Nombre del Presidente del Tribunal</label>
              <input type="text" name="presidente_nombre" className="input-base"
                value={config.presidente_nombre || ''} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="label-base">Número de nota correlativo actual</label>
            <input type="number" name="numero_nota_correlativo" className="input-base w-32"
              value={config.numero_nota_correlativo || 1} onChange={handleChange} min="1" />
          </div>
          <div>
            <label className="label-base">Texto del cuerpo de la nota</label>
            <p className="text-xs text-gray-400 mb-1">
              Variables:{' '}
              <code className="bg-gray-100 px-1 rounded">{'{MES}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{AÑO}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{TOTAL_OPS}'}</code>{' '}
              <code className="bg-gray-100 px-1 rounded">{'{RESPONSABLES}'}</code>
            </p>
            <textarea name="texto_nota_cuerpo" className="input-base h-64 font-mono text-xs resize-y"
              value={config.texto_nota_cuerpo || ''} onChange={handleChange} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Sección: Control Preventivo ──────────────────────────────────────────────
function SeccionControlPreventivo() {
  const [config, setConfig]       = useState({})
  const [cargando, setCargando]   = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg]             = useState(null)

  useEffect(() => {
    axios.get('/api/configuracion')
      .then(({ data }) => setConfig(data))
      .catch(console.error)
      .finally(() => setCargando(false))
  }, [])

  const handleChange = (e) => setConfig(c => ({ ...c, [e.target.name]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true); setMsg(null)
    try {
      await axios.put('/api/configuracion', {
        presidenteNombre:      config.presidente_nombre,
        presidenteCargoTexto:  config.presidente_cargo_texto,
        textoNotaCuerpo:       config.texto_nota_cuerpo,
        numeroNotaCorrelativo: config.numero_nota_correlativo,
        organismo:             config.organismo,
        delegadoFiscal:        config.delegado_fiscal,
      })
      const { data } = await axios.get('/api/configuracion')
      setConfig(data)
      setMsg({ tipo: 'ok', texto: 'Configuración guardada correctamente.' })
    } catch (err) {
      setMsg({ tipo: 'error', texto: err.response?.data?.error || 'Error al guardar.' })
    } finally { setGuardando(false) }
  }

  if (cargando) return <div className="card text-center py-10 text-gray-400">Cargando...</div>

  return (
    <div className="max-w-lg">
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-1">Configuración Control Preventivo</h3>
        <p className="text-xs text-gray-400 mb-4">Valores pre-llenados en cada nuevo registro de intervención.</p>
        <Alerta tipo={msg?.tipo} texto={msg?.texto} onCerrar={() => setMsg(null)} />
        <form onSubmit={guardar} className={`space-y-4 ${msg ? 'mt-3' : ''}`}>
          <div>
            <label className="label-base">Organismo</label>
            <input type="text" name="organismo" className="input-base" value={config.organismo || ''}
              onChange={handleChange} placeholder="Ej: Ministerio de Educación PFE" />
          </div>
          <div>
            <label className="label-base">Delegado Fiscal</label>
            <input type="text" name="delegado_fiscal" className="input-base" value={config.delegado_fiscal || ''}
              onChange={handleChange} placeholder="Ej: Cra. López Andrea" />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={guardando} className="btn-primary">
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function Configuracion() {
  const { usuario } = useAuth()
  const rol = usuario?.rol || 'operador'
  const superAdmin   = esSuperAdmin(rol)
  const privilegiado = esPrivilegiado(rol)

  const SECCIONES = [
    { id: 'cuenta',    label: 'Mi Cuenta',            icono: <IcoUsuario />,   visible: true },
    { id: 'usuarios',  label: 'Gestión de Usuarios',  icono: <IcoUsuarios />,  visible: privilegiado },
    { id: 'google',    label: 'Google Sheets',         icono: <IcoSheets />,    visible: superAdmin },
    { id: 'seguridad', label: 'Seguridad',             icono: <IcoSeguridad />, visible: superAdmin },
    { id: 'nota',      label: 'Nota Mensual',          icono: <IcoNota />,      visible: superAdmin },
    { id: 'cp',        label: 'Control Preventivo',    icono: <IcoCP />,        visible: superAdmin },
  ].filter(s => s.visible)

  const [seccion, setSeccion] = useState(SECCIONES[0]?.id || 'cuenta')

  return (
    <div className="flex gap-6">
      {/* ── Sidebar interno ─────────────────────────── */}
      <aside className="w-52 flex-shrink-0">
        <nav className="card p-2 space-y-0.5 sticky top-4">
          {SECCIONES.map(s => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors
                ${seccion === s.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 border border-transparent'
                }`}
            >
              {s.icono}
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Contenido ───────────────────────────────── */}
      <main className="flex-1 min-w-0">
        {seccion === 'cuenta'    && <SeccionMiCuenta />}
        {seccion === 'usuarios'  && privilegiado && <SeccionUsuarios rolActual={rol} />}
        {seccion === 'google'    && superAdmin   && <SeccionGoogle />}
        {seccion === 'seguridad' && superAdmin   && <SeccionSeguridad />}
        {seccion === 'nota'      && superAdmin   && <SeccionNotaMensual />}
        {seccion === 'cp'        && superAdmin   && <SeccionControlPreventivo />}
      </main>
    </div>
  )
}
