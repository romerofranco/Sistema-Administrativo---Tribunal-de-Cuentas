import { useState } from 'react'
import axios from 'axios'

const CAMPO_VACIO = {
  ctaFinanc: '', denominacion: '', observOp: '', ff: '', cgto: '',
  tipoOp: '', nroExpediente: '', ejercTramite: '', nroSidif: '',
  fRegistro: '', nroOp: '', impNeto: '', impRetenido: '', impBruto: '',
  fechaVisado: '', entrada: '', fsEntrada: '', observacion: '',
  salida: '', fsSalida: '', firma: '', estado: 'VISADO',
}

// Encabezado de sección dentro del formulario
function SeccionTitulo({ titulo }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <p className="text-xs font-bold text-blue-900 uppercase tracking-wider whitespace-nowrap">
        {titulo}
      </p>
      <div className="flex-1 h-px bg-blue-100" />
    </div>
  )
}

// Campo de texto genérico con etiqueta visible
function Campo({ label, name, form, onChange, tipo = 'text', required = false, placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={tipo}
        name={name}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        value={form[name] ?? ''}
        onChange={onChange}
        required={required}
        placeholder={placeholder || label}
        step={tipo === 'number' ? 'any' : undefined}
      />
    </div>
  )
}

export default function ModalExpediente({ expediente, onGuardar, onCerrar }) {
  const esNuevo = !expediente
  const [form, setForm]             = useState(expediente ? { ...expediente } : { ...CAMPO_VACIO })
  const [guardando, setGuardando]   = useState(false)
  const [error, setError]           = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.denominacion) { setError('El nombre del beneficiario es obligatorio'); return }
    setGuardando(true)
    setError('')
    try {
      if (esNuevo) {
        await axios.post('/api/expedientes', form)
      } else {
        // Usar fila (id_sheets) si está disponible, si no el id local de SQLite
        const idParaEditar = expediente.fila || expediente.id
        await axios.put(`/api/expedientes/${idParaEditar}`, form)
      }
      onGuardar()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el expediente')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-6">

        {/* Encabezado del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              {esNuevo ? 'Nuevo Expediente' : 'Editar Expediente'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Completá los datos del expediente. Los campos marcados con * son obligatorios.
            </p>
          </div>
          <button
            onClick={onCerrar}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200 p-1.5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {/* ── SECCIÓN 1: Beneficiario ─────────────────────────────────── */}
          <div className="space-y-3">
            <SeccionTitulo titulo="Datos del Beneficiario" />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Denominación / Nombre del Beneficiario
                <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                name="denominacion"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={form.denominacion}
                onChange={handleChange}
                required
                placeholder="Ej: MINISTERIO DE SALUD / JUAN PÉREZ S.A."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Tipo de Orden de Pago (Tipo OP)
                </label>
                <select
                  name="tipoOp"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  value={form.tipoOp}
                  onChange={handleChange}
                >
                  <option value="">— Seleccionar tipo —</option>
                  <option value="BYS">BYS — Bienes y Servicios</option>
                  <option value="TRA">TRA — Transferencias</option>
                  <option value="BDU">BDU — Bienes de Uso</option>
                </select>
              </div>
              <Campo
                label="Cuenta Financiera (Cta. Financ.)"
                name="ctaFinanc"
                form={form}
                onChange={handleChange}
                placeholder="Ej: 1.1.2.01"
              />
              <Campo
                label="Observación OP"
                name="observOp"
                form={form}
                onChange={handleChange}
                placeholder="Observación de la orden de pago"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo label="F.F. (Fuente de Financiamiento)" name="ff" form={form} onChange={handleChange} placeholder="Ej: 11" />
              <Campo label="CGto (Carácter del Gasto)" name="cgto" form={form} onChange={handleChange} placeholder="Ej: 10" />
            </div>
          </div>

          {/* ── SECCIÓN 2: Expediente / Trámite ────────────────────────── */}
          <div className="space-y-3">
            <SeccionTitulo titulo="Datos del Expediente / Trámite" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Campo
                label="N° Expediente (Id. Trámite)"
                name="nroExpediente"
                form={form}
                onChange={handleChange}
                placeholder="Ej: 4500-123/2025"
              />
              <Campo
                label="Ejercicio del Trámite (Año)"
                name="ejercTramite"
                form={form}
                onChange={handleChange}
                tipo="number"
                placeholder="Ej: 2025"
              />
            </div>
          </div>

          {/* ── SECCIÓN 3: SIDIF / Orden de Pago ───────────────────────── */}
          <div className="space-y-3">
            <SeccionTitulo titulo="Datos SIDIF / Orden de Pago" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Campo
                label="N° SIDIF (Número en SIDIF)"
                name="nroSidif"
                form={form}
                onChange={handleChange}
                placeholder="Ej: 12345"
              />
              <Campo
                label="N° OP (Número de Orden de Pago)"
                name="nroOp"
                form={form}
                onChange={handleChange}
                placeholder="Ej: 678"
              />
              <Campo
                label="F. Registro PG (Fecha de Registro)"
                name="fRegistro"
                form={form}
                onChange={handleChange}
                tipo="date"
              />
            </div>

            {/* Importes */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3">
                Importes (en pesos, sin símbolo $)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Importe Neto M.C.L.
                  </label>
                  <input
                    type="number"
                    name="impNeto"
                    step="any"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right font-mono"
                    value={form.impNeto ?? ''}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Importe Retenido M.C.L.
                  </label>
                  <input
                    type="number"
                    name="impRetenido"
                    step="any"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right font-mono"
                    value={form.impRetenido ?? ''}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Importe Bruto M.C.L.
                  </label>
                  <input
                    type="number"
                    name="impBruto"
                    step="any"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-right font-mono"
                    value={form.impBruto ?? ''}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ── SECCIÓN 4: Visado y Seguimiento ─────────────────────────── */}
          <div className="space-y-3">
            <SeccionTitulo titulo="Visado y Seguimiento" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Campo
                label="Fecha de Visado"
                name="fechaVisado"
                form={form}
                onChange={handleChange}
                tipo="date"
              />
              <Campo
                label="Fecha de Entrada"
                name="entrada"
                form={form}
                onChange={handleChange}
                tipo="date"
              />
              <Campo
                label="Fs. Entrada (fojas de entrada)"
                name="fsEntrada"
                form={form}
                onChange={handleChange}
                tipo="number"
                placeholder="Nº de fojas"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Campo
                label="Fecha de Salida"
                name="salida"
                form={form}
                onChange={handleChange}
                tipo="date"
              />
              <Campo
                label="Fs. Salida (fojas de salida)"
                name="fsSalida"
                form={form}
                onChange={handleChange}
                tipo="number"
                placeholder="Nº de fojas"
              />
              <Campo
                label="Firma del responsable"
                name="firma"
                form={form}
                onChange={handleChange}
                placeholder="Nombre de quien firma"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Observación general
              </label>
              <textarea
                name="observacion"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white h-20 resize-none"
                value={form.observacion ?? ''}
                onChange={handleChange}
                placeholder="Observaciones adicionales del expediente..."
              />
            </div>
          </div>

          {/* ── ESTADO ──────────────────────────────────────────────────── */}
          <div className="space-y-3">
            <SeccionTitulo titulo="Estado del Expediente" />
            <div className="flex flex-wrap gap-3">
              {[
                { val: 'VISADO',     label: 'Visado',     desc: 'Expediente visado sin observaciones',  color: 'border-gray-300 bg-white text-gray-700' },
                { val: 'PENDIENTE',  label: 'Pendiente',  desc: 'Requiere acción o documentación',       color: 'border-yellow-300 bg-yellow-50 text-yellow-800' },
                { val: 'OBSERVADO',  label: 'Observado',  desc: 'Tiene observaciones que corregir',       color: 'border-red-300 bg-red-50 text-red-800' },
                { val: 'EN_PROCESO', label: 'En Proceso', desc: 'Siendo procesado actualmente',          color: 'border-green-300 bg-green-50 text-green-800' },
              ].map(({ val, label, desc, color }) => (
                <label
                  key={val}
                  className={`flex items-center gap-2 border-2 rounded-xl px-4 py-2.5 cursor-pointer transition-all ${
                    form.estado === val ? color + ' ring-2 ring-offset-1 ring-blue-400' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="estado"
                    value={val}
                    checked={form.estado === val}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-semibold">{label}</span>
                  <span className="text-xs hidden sm:inline">— {desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ── BOTONES ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button type="button" onClick={onCerrar} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="btn-primary px-6">
              {guardando ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (esNuevo ? 'Crear Expediente' : 'Guardar Cambios')}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
