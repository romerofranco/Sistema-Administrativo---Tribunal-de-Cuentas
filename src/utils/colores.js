// Definición de estados y sus colores visuales
export const ESTADOS = {
  VISADO: {
    key:    'VISADO',
    label:  'Visado',
    bg:     'bg-white',
    border: 'border-gray-200',
    text:   'text-gray-700',
    badge:  'bg-gray-100 text-gray-700',
    fila:   '#FFFFFF',
  },
  PENDIENTE: {
    key:    'PENDIENTE',
    label:  'Pendiente',
    bg:     'bg-yellow-50',
    border: 'border-yellow-200',
    text:   'text-yellow-800',
    badge:  'bg-yellow-100 text-yellow-800',
    fila:   '#FEFCE8',
  },
  OBSERVADO: {
    key:    'OBSERVADO',
    label:  'Observado',
    bg:     'bg-red-50',
    border: 'border-red-200',
    text:   'text-red-800',
    badge:  'bg-red-100 text-red-800',
    fila:   '#FEF2F2',
  },
  EN_PROCESO: {
    key:    'EN_PROCESO',
    label:  'En Proceso',
    bg:     'bg-green-50',
    border: 'border-green-200',
    text:   'text-green-800',
    badge:  'bg-green-100 text-green-800',
    fila:   '#F0FDF4',
  },
}

export function claseFila(estado) {
  return ESTADOS[estado]?.bg || ESTADOS.VISADO.bg
}

export function clasesBadge(estado) {
  return ESTADOS[estado]?.badge || ESTADOS.VISADO.badge
}

export function labelEstado(estado) {
  return ESTADOS[estado]?.label || estado
}

export const LISTA_ESTADOS = Object.values(ESTADOS)
