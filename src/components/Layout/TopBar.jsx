import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useConexion, ESTADO_CONEXION } from '../../context/ConexionContext'
import { useNavigate } from 'react-router-dom'

function BadgeConexion({ estado, pendientes }) {
  if (estado === ESTADO_CONEXION.SINCRONIZANDO) {
    return (
      <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        Sincronizando...
      </div>
    )
  }
  if (estado === ESTADO_CONEXION.ONLINE) {
    return (
      <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
        <span className="w-2 h-2 rounded-full bg-green-400" />
        En línea
      </div>
    )
  }
  return (
    <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
      <span className="w-2 h-2 rounded-full bg-red-400" />
      Sin conexión {pendientes > 0 && `(${pendientes} pendientes)`}
    </div>
  )
}

export default function TopBar({ titulo }) {
  const { usuario, cerrarSesion }                       = useAuth()
  const { estado, pendientes, importando, importarDesdeSheets, ultimaSync } = useConexion()
  const navigate                                         = useNavigate()
  const [resultadoSync, setResultadoSync] = useState(null)
  const [errorSync, setErrorSync]         = useState(null)

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/login')
  }

  const handleImportar = async () => {
    setErrorSync(null)
    try {
      const data = await importarDesdeSheets()
      if (data) {
        setResultadoSync(data)
        setTimeout(() => setResultadoSync(null), 5000)
      }
    } catch (err) {
      // Mostrar el error real que devuelve Google para poder diagnosticar
      const data = err.response?.data
      const msj  = data?.error || err.message || 'Error desconocido'
      if (msj.includes('no está configurado') || msj.includes('credenciales')) {
        setErrorSync('Sheets no configurado — completá el .env')
      } else if (msj.includes('403') || msj.includes('Permission') || msj.includes('access')) {
        setErrorSync('Sin permiso — compartí la planilla con la cuenta de servicio')
      } else if (msj.includes('404') || msj.includes('not found') || msj.includes('Unable to parse range')) {
        setErrorSync('Pestaña no encontrada — verificá GOOGLE_SHEET_NAME en .env')
      } else {
        setErrorSync(msj.length > 80 ? msj.slice(0, 80) + '…' : msj)
      }
      console.error('[Sync Sheets]', data || err.message)
      setTimeout(() => setErrorSync(null), 8000)
    }
  }

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{titulo}</h1>

      <div className="flex items-center gap-3">
        <BadgeConexion estado={estado} pendientes={pendientes} />

        {/* Botón sincronizar con Sheets — solo visible cuando está en línea */}
        {estado === ESTADO_CONEXION.ONLINE && (
          <div className="flex items-center gap-2">
            {resultadoSync ? (
              <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {resultadoSync.importados} importados
              </div>
            ) : errorSync ? (
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {errorSync}
              </div>
            ) : (
              <button
                onClick={handleImportar}
                disabled={importando}
                title={ultimaSync
                  ? `Última sync: ${ultimaSync.toLocaleTimeString('es-AR')}`
                  : 'Importar expedientes desde Google Sheets'}
                className="flex items-center gap-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
              >
                {importando ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Sincronizar Sheets
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Info de usuario */}
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {usuario?.nombreCompleto || usuario?.nombreUsuario}
            </p>
            <p className="text-xs text-gray-500 leading-tight capitalize">
              {usuario?.rol}
            </p>
          </div>
          <div className="w-8 h-8 bg-blue-900 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {(usuario?.nombreCompleto || usuario?.nombreUsuario || '?')[0].toUpperCase()}
          </div>
          <button
            onClick={handleCerrarSesion}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
