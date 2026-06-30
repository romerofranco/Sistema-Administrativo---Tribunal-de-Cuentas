import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ConexionProvider } from './context/ConexionContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Expedientes from './pages/Expedientes'
import Programas from './pages/Programas'
import Informes from './pages/Informes'
import Configuracion from './pages/Configuracion'
import ControlPreventivo from './pages/ControlPreventivo'
import LibroEntrada from './pages/LibroEntrada'
import Auditoria from './pages/Auditoria'

// Ruta protegida: redirige al login si no hay sesión
function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario, cargando } = useAuth()

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  if (!usuario) return <Navigate to="/login" replace />
  if (soloAdmin && usuario.rol !== 'superadmin') return <Navigate to="/" replace />

  return children
}

function AppRutas() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RutaProtegida>
            <Layout />
          </RutaProtegida>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="expedientes" element={<Expedientes />} />
        <Route path="programas" element={<Programas />} />
        <Route path="responsables" element={<Navigate to="/programas" replace />} />
        <Route path="informes" element={<Informes />} />
        <Route path="control-preventivo" element={<ControlPreventivo />} />
        <Route path="libro-entrada" element={<LibroEntrada />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route
          path="configuracion"
          element={
            <RutaProtegida soloAdmin>
              <Configuracion />
            </RutaProtegida>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ConexionProvider>
            <AppRutas />
          </ConexionProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
