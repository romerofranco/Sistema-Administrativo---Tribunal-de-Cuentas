import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTema } from '../../context/ThemeContext'
import iconoBlanco from '../../../assets/sinfondo.png'

const ICONOS = {
  dashboard: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
    </svg>
  ),
  expedientes: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  programas: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  responsables: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  informes: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414A1 1 0 0119 9.414V19a2 2 0 01-2 2z" />
    </svg>
  ),
  controlPreventivo: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  libroEntrada: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  config: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  auditoria: (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
}

const LINKS = [
  { to: '/',                    label: 'Dashboard',            icono: 'dashboard',         end: true, atajo: '1' },
  { to: '/expedientes',         label: 'Expedientes',          icono: 'expedientes',                  atajo: '2' },
  { to: '/programas',           label: 'Programas y Resp.',    icono: 'programas',                    atajo: '3' },
  { to: '/informes',            label: 'Informes Mensuales',   icono: 'informes',                     atajo: '4' },
  { to: '/control-preventivo',  label: 'Control Preventivo',   icono: 'controlPreventivo',            atajo: '5' },
  { to: '/libro-entrada',       label: 'Libro de Entrada',     icono: 'libroEntrada',                 atajo: '6' },
  { to: '/auditoria',           label: 'Auditoría',            icono: 'auditoria',                    atajo: '7' },
]

export default function Sidebar({ colapsado, onToggle }) {
  const { usuario }         = useAuth()
  const { oscuro, toggleTema } = useTema()

  const claseItem = colapsado
    ? 'flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-sm font-medium transition-colors duration-150'
    : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 w-full'

  const activo   = 'bg-white/15 text-white'
  const inactivo = 'text-blue-100 hover:bg-white/10 hover:text-white'

  const claseBtn = colapsado
    ? 'flex items-center justify-center w-10 h-10 mx-auto rounded-lg text-blue-200 hover:bg-white/10 hover:text-white transition-colors'
    : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors w-full'

  return (
    <aside
      className={`
        ${colapsado ? 'w-16' : 'w-64'} flex-shrink-0
        bg-blue-900 dark:bg-gray-950
        flex flex-col h-full
        transition-all duration-300 overflow-hidden
      `}
    >
      {/* ── Encabezado / Logo ─────────────────────────────── */}
      <div className={`
        flex border-b border-blue-800 dark:border-gray-800
        ${colapsado ? 'justify-center items-center px-3 py-4' : 'flex-col items-center px-6 py-5 gap-2'}
      `}>
        <img
          src={iconoBlanco}
          alt="Tribunal de Cuentas La Rioja"
          className={colapsado ? 'w-9 h-9 object-contain' : 'h-16 w-auto object-contain'}
        />
        {!colapsado && (
          <div className="text-center min-w-0 w-full">
            <p className="text-white font-bold text-sm leading-tight truncate">Tribunal de Cuentas</p>
            <p className="text-blue-200 text-xs leading-tight truncate">Delegación Fiscal · La Rioja</p>
          </div>
        )}
      </div>

      {/* ── Navegación ────────────────────────────────────── */}
      <nav className={`flex-1 ${colapsado ? 'px-3 py-4 space-y-2' : 'px-3 py-4 space-y-1'} overflow-y-auto`}>
        {LINKS.map(({ to, label, icono, end, atajo }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={colapsado ? `${label} (Alt+${atajo})` : undefined}
            className={({ isActive }) => `${claseItem} ${isActive ? activo : inactivo}`}
          >
            {ICONOS[icono]}
            {!colapsado && (
              <>
                <span className="flex-1">{label}</span>
                <span className="text-blue-400/50 text-xs font-mono">alt+{atajo}</span>
              </>
            )}
          </NavLink>
        ))}

        <div className="border-t border-blue-800 dark:border-gray-800 my-2" />

        <NavLink
          to="/configuracion"
          title={colapsado ? 'Configuración (Alt+8)' : undefined}
          className={({ isActive }) => `${claseItem} ${isActive ? activo : inactivo}`}
        >
          {ICONOS.config}
          {!colapsado && (
            <>
              <span className="flex-1">Configuración</span>
              <span className="text-blue-400/50 text-xs font-mono">alt+8</span>
            </>
          )}
        </NavLink>
      </nav>

      {/* ── Controles inferiores ──────────────────────────── */}
      <div className={`border-t border-blue-800 dark:border-gray-800 ${colapsado ? 'px-3 py-3 space-y-2' : 'px-3 py-3 space-y-1'}`}>
        {/* Toggle tema oscuro/claro */}
        <button onClick={toggleTema} title={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} className={claseBtn}>
          {oscuro ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
          {!colapsado && <span className="text-sm">{oscuro ? 'Tema claro' : 'Tema oscuro'}</span>}
        </button>

        {/* Toggle colapsar/expandir */}
        <button onClick={onToggle} title={colapsado ? 'Expandir menú' : 'Colapsar menú'} className={claseBtn}>
          {colapsado ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
          {!colapsado && <span className="text-sm">Colapsar menú</span>}
        </button>

        {/* Versión */}
        {!colapsado && (
          <div className="pt-2 px-1">
            <p className="text-blue-400 text-xs">Sistema de Expedientes v1.0</p>
            <p className="text-blue-500 text-xs">SAF 420 — Pacto Federal</p>
          </div>
        )}
      </div>
    </aside>
  )
}
