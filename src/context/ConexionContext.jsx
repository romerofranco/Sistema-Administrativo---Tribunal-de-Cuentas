import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

const ConexionContext = createContext(null)

export const ESTADO_CONEXION = {
  ONLINE:        'online',
  OFFLINE:       'offline',
  SINCRONIZANDO: 'sincronizando',
}

export function ConexionProvider({ children }) {
  const [estado, setEstado]         = useState(ESTADO_CONEXION.OFFLINE)
  const [pendientes, setPendientes] = useState(0)
  const [importando, setImportando] = useState(false)
  const [ultimaSync, setUltimaSync] = useState(null)
  const eraOffline = useRef(true)

  const verificarConexion = useCallback(async () => {
    try {
      await axios.get('/api/health', { timeout: 5000 })

      // Si venía de offline → sincronizar pendientes locales primero
      if (eraOffline.current) {
        eraOffline.current = false
        setEstado(ESTADO_CONEXION.SINCRONIZANDO)
        try {
          const resp = await axios.post('/api/sync/pendientes')
          setPendientes(resp.data.sincronizados || 0)
        } catch { /* no crítico */ }
      }

      setEstado(ESTADO_CONEXION.ONLINE)
    } catch {
      eraOffline.current = true
      setEstado(ESTADO_CONEXION.OFFLINE)
    }
  }, [])

  // Polling cada 30 segundos
  useEffect(() => {
    verificarConexion()
    const intervalo = setInterval(verificarConexion, 30_000)
    return () => clearInterval(intervalo)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Importar todos los datos de Sheets → SQLite
  const importarDesdeSheets = useCallback(async () => {
    if (importando || estado !== ESTADO_CONEXION.ONLINE) return null
    setImportando(true)
    try {
      const { data } = await axios.post('/api/sync/importar-sheets')
      setUltimaSync(new Date())
      return data
    } catch (err) {
      // Re-lanzar con el objeto completo para que el TopBar pueda leer err.response.data
      throw err
    } finally {
      setImportando(false)
    }
  }, [importando, estado])

  return (
    <ConexionContext.Provider value={{
      estado, pendientes, verificarConexion,
      importando, importarDesdeSheets, ultimaSync,
    }}>
      {children}
    </ConexionContext.Provider>
  )
}

export function useConexion() {
  const ctx = useContext(ConexionContext)
  if (!ctx) throw new Error('useConexion debe usarse dentro de ConexionProvider')
  return ctx
}
