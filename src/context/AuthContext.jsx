import { createContext, useContext, useState, useEffect, useRef } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Decodifica el payload del JWT para leer la fecha de expiración sin verificar firma
function tokenExpirado(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch { return true }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const cerrarSesionRef = useRef(null)

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    delete axios.defaults.headers.common['Authorization']
    setUsuario(null)
  }

  const actualizarUsuario = (nuevosDatos, nuevoToken) => {
    localStorage.setItem('token', nuevoToken)
    localStorage.setItem('usuario', JSON.stringify(nuevosDatos))
    axios.defaults.headers.common['Authorization'] = `Bearer ${nuevoToken}`
    setUsuario(nuevosDatos)
  }

  // Guardar referencia para usar dentro del interceptor
  cerrarSesionRef.current = cerrarSesion

  // Al montar, verificar si hay token guardado y que no esté expirado
  useEffect(() => {
    const token = localStorage.getItem('token')
    const usuarioGuardado = localStorage.getItem('usuario')

    if (token && usuarioGuardado) {
      if (tokenExpirado(token)) {
        // Token vencido — limpiar y forzar re-login
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
      } else {
        try {
          setUsuario(JSON.parse(usuarioGuardado))
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('usuario')
        }
      }
    }
    setCargando(false)
  }, [])

  // Interceptor global: si cualquier request devuelve 401, cerrar sesión automáticamente
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          cerrarSesionRef.current?.()
        }
        return Promise.reject(err)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  const login = async (nombreUsuario, contrasena) => {
    const respuesta = await axios.post('/api/auth/login', { nombreUsuario, contrasena })
    const { token, usuario: datos } = respuesta.data
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(datos))
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUsuario(datos)
    return datos
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, cerrarSesion, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
