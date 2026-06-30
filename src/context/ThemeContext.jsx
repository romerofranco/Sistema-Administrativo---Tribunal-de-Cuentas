import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [oscuro, setOscuro] = useState(() => {
    return localStorage.getItem('tema') === 'oscuro'
  })

  useEffect(() => {
    const html = document.documentElement
    if (oscuro) html.classList.add('dark')
    else html.classList.remove('dark')
    localStorage.setItem('tema', oscuro ? 'oscuro' : 'claro')
  }, [oscuro])

  return (
    <ThemeContext.Provider value={{ oscuro, toggleTema: () => setOscuro(v => !v) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTema() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTema debe usarse dentro de ThemeProvider')
  return ctx
}
