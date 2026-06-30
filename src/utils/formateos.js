import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

// Formatea un número como moneda argentina (sin símbolo $, con puntos de miles)
export function formatearMoneda(valor) {
  if (valor === null || valor === undefined || valor === '') return '—'
  const num = parseFloat(valor)
  if (isNaN(num)) return '—'
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Formatea fecha a "DD/MM/YYYY"
export function formatearFecha(valor) {
  if (!valor) return '—'
  try {
    const fecha = typeof valor === 'string' ? parseISO(valor) : new Date(valor)
    if (!isValid(fecha)) return valor
    return format(fecha, 'dd/MM/yyyy')
  } catch {
    return valor
  }
}

// Devuelve nombre del mes en español (capitalizado)
export function nombreMes(numeroMes) {
  const meses = [
    'ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO',
    'JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'
  ]
  return meses[(numeroMes - 1) % 12] || ''
}

// Formatea "2025-06" → "Junio 2025"
export function formatearPeriodo(mes, anio) {
  const meses = [
    'Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
  ]
  return `${meses[mes - 1]} ${anio}`
}

// Formatea fecha larga institucional: "LA RIOJA, 05 de Junio de 2025.-"
export function formatearFechaInstitucional(fecha = new Date()) {
  return format(fecha, "'LA RIOJA, 'd 'de' MMMM 'de' yyyy'.-'", { locale: es })
    .toUpperCase()
    .replace(/(\d+)/, m => m)
}

// Trunca texto largo para mostrar en tabla
export function truncar(texto, max = 40) {
  if (!texto) return '—'
  return texto.length > max ? texto.slice(0, max) + '…' : texto
}
