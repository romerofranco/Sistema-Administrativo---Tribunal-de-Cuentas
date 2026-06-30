import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const TITULOS = {
  '/':              'Dashboard',
  '/expedientes':   'Expedientes',
  '/programas':     'Programas y Responsables',
  '/informes':      'Informes Mensuales',
  '/control-preventivo': 'Control Preventivo',
  '/libro-entrada':      'Libro de Entrada',
  '/auditoria':     'Auditoría',
  '/configuracion': 'Configuración del Sistema',
}

const RUTAS_SHORTCUT = [
  '/',
  '/expedientes',
  '/programas',
  '/informes',
  '/control-preventivo',
  '/libro-entrada',
  '/auditoria',
  '/configuracion',
]

export default function Layout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const titulo = TITULOS[pathname] || 'Sistema de Expedientes'

  const [colapsado, setColapsado] = useState(() => {
    return localStorage.getItem('sidebar-colapsado') === 'true'
  })

  useEffect(() => {
    const handler = (e) => {
      if (!e.altKey) return
      const n = parseInt(e.key)
      if (isNaN(n) || n < 1 || n > RUTAS_SHORTCUT.length) return
      // No disparar si el foco está en un input/textarea/select
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      navigate(RUTAS_SHORTCUT[n - 1])
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const toggleSidebar = () => {
    setColapsado(v => {
      const nuevo = !v
      localStorage.setItem('sidebar-colapsado', String(nuevo))
      return nuevo
    })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar colapsado={colapsado} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar titulo={titulo} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
