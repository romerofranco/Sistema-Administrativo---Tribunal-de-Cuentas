const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '../../database/expedientes.db')

// Asegurar que el directorio existe
const dirDB = path.dirname(DB_PATH)
if (!fs.existsSync(dirDB)) fs.mkdirSync(dirDB, { recursive: true })

// Abrir la base de datos (crea el archivo si no existe)
const db = new Database(DB_PATH)

// Optimizaciones de SQLite
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('synchronous = NORMAL')

// Aplicar schema inicial
const schemaSQL = fs.readFileSync(
  path.join(__dirname, '../../database/schema.sql'),
  'utf-8'
)
db.exec(schemaSQL)

// Migraciones para instalaciones existentes
;(function migrar() {
  // ── configuracion ───────────────────────────────────────────────────────────
  const colsConf = db.prepare('PRAGMA table_info(configuracion)').all().map(c => c.name)
  if (!colsConf.includes('organismo'))
    db.exec("ALTER TABLE configuracion ADD COLUMN organismo TEXT DEFAULT 'Ministerio de Educación PFE'")
  if (!colsConf.includes('delegado_fiscal'))
    db.exec("ALTER TABLE configuracion ADD COLUMN delegado_fiscal TEXT DEFAULT ''")
  if (!colsConf.includes('sesion_expiracion_minutos'))
    db.exec('ALTER TABLE configuracion ADD COLUMN sesion_expiracion_minutos INTEGER DEFAULT 1440')

  // ── usuarios ─────────────────────────────────────────────────────────────────
  const colsUsr = db.prepare('PRAGMA table_info(usuarios)').all().map(c => c.name)
  if (!colsUsr.includes('intentos_fallidos'))
    db.exec('ALTER TABLE usuarios ADD COLUMN intentos_fallidos INTEGER DEFAULT 0')
  if (!colsUsr.includes('bloqueado_hasta'))
    db.exec('ALTER TABLE usuarios ADD COLUMN bloqueado_hasta TEXT')

  // Migrar rol 'administrador' → 'superadmin'
  db.exec("UPDATE usuarios SET rol = 'superadmin' WHERE rol = 'administrador'")

  // ── expedientes ──────────────────────────────────────────────────────────────
  const colsExp = db.prepare('PRAGMA table_info(expedientes)').all().map(c => c.name)
  if (!colsExp.includes('eliminado_en'))
    db.exec('ALTER TABLE expedientes ADD COLUMN eliminado_en TEXT')
  if (!colsExp.includes('eliminado_por'))
    db.exec('ALTER TABLE expedientes ADD COLUMN eliminado_por TEXT')
  db.exec('CREATE INDEX IF NOT EXISTS idx_exp_eliminado_en ON expedientes (eliminado_en)')
})()

// ─── MÉTODOS PARA EXPEDIENTES ─────────────────────────────────────────────────

db.obtenerExpedientes = function({
  pagina = 1, porPagina = 50,
  busqueda = '', mes, anio, estado, tipoOp,
} = {}) {
  let where = 'eliminado_en IS NULL'
  const params = []

  if (busqueda) {
    where += ` AND (denominacion LIKE ? OR nro_expediente LIKE ? OR nro_sidif LIKE ? OR nro_op LIKE ?)`
    const b = `%${busqueda}%`
    params.push(b, b, b, b)
  }
  if (mes && anio) {
    const mesPad = String(mes).padStart(2, '0')
    const anioStr = String(anio)
    // Handles ISO dates (YYYY-MM-DD) and legacy DD/MM/YYYY dates stored before normalization
    where += ` AND (
      (fecha_visado GLOB '????-??-??*' AND strftime('%m', fecha_visado) = ? AND strftime('%Y', fecha_visado) = ?)
      OR (fecha_visado GLOB '??/??/????*' AND substr(fecha_visado, 4, 2) = ? AND substr(fecha_visado, 7, 4) = ?)
      OR (fecha_visado GLOB '?/??/????*' AND substr(fecha_visado, 3, 2) = ? AND substr(fecha_visado, 6, 4) = ?)
    )`
    params.push(mesPad, anioStr, mesPad, anioStr, mesPad, anioStr)
  }
  if (estado) {
    where += ` AND estado = ?`
    params.push(estado)
  }
  if (tipoOp) {
    where += ` AND tipo_op = ?`
    params.push(tipoOp)
  }

  const total = db.prepare(`SELECT COUNT(*) as c FROM expedientes WHERE ${where}`).get(...params).c
  const offset = (pagina - 1) * porPagina
  const expedientes = db.prepare(
    `SELECT * FROM expedientes WHERE ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
  ).all(...params, porPagina, offset)

  return { expedientes: expedientes.map(filaAExpediente), total }
}

// NOTA (caso de borde preexistente, no introducido por la papelera): si el expediente
// local tiene id_sheets = NULL (nunca se sincronizó a Sheets), el ON CONFLICT(id_sheets)
// de abajo NO dispara —SQLite no trata los NULL como iguales en restricciones UNIQUE—
// y el upsert inserta una fila duplicada en vez de actualizar la existente. Pendiente
// de revisar cuando se audite el flujo de sync en general.
db.upsertExpediente = function(datos) {
  db.prepare(`
    INSERT INTO expedientes (
      id_sheets, cta_financ, denominacion, observ_op, ff, cgto, tipo_op,
      nro_expediente, ejer_tramite, nro_sidif, f_registro, nro_op,
      imp_neto, imp_retenido, imp_bruto, fecha_visado, entrada, fs_entrada,
      observacion, salida, fs_salida, firma, estado, pendiente_sync
    ) VALUES (
      @idSheets, @ctaFinanc, @denominacion, @observOp, @ff, @cgto, @tipoOp,
      @nroExpediente, @ejercTramite, @nroSidif, @fRegistro, @nroOp,
      @impNeto, @impRetenido, @impBruto, @fechaVisado, @entrada, @fsEntrada,
      @observacion, @salida, @fsSalida, @firma, @estado, 0
    )
    -- eliminado_en / eliminado_por quedan fuera a propósito: el pull desde Sheets
    -- no debe revivir expedientes que están en la papelera local.
    ON CONFLICT(id_sheets) DO UPDATE SET
      cta_financ = excluded.cta_financ,
      denominacion = excluded.denominacion,
      observ_op = excluded.observ_op,
      ff = excluded.ff, cgto = excluded.cgto, tipo_op = excluded.tipo_op,
      nro_expediente = excluded.nro_expediente,
      ejer_tramite = excluded.ejer_tramite,
      nro_sidif = excluded.nro_sidif, f_registro = excluded.f_registro,
      nro_op = excluded.nro_op,
      imp_neto = excluded.imp_neto, imp_retenido = excluded.imp_retenido,
      imp_bruto = excluded.imp_bruto, fecha_visado = excluded.fecha_visado,
      entrada = excluded.entrada, fs_entrada = excluded.fs_entrada,
      observacion = excluded.observacion, salida = excluded.salida,
      fs_salida = excluded.fs_salida, firma = excluded.firma,
      estado = excluded.estado, pendiente_sync = 0
  `).run({
    idSheets: datos.fila || datos.id_sheets || null,
    ctaFinanc: datos.ctaFinanc || datos.cta_financ || '',
    denominacion: datos.denominacion || '',
    observOp: datos.observOp || datos.observ_op || '',
    ff: datos.ff || '',
    cgto: datos.cgto || '',
    tipoOp: datos.tipoOp || datos.tipo_op || '',
    nroExpediente: datos.nroExpediente || datos.nro_expediente || '',
    ejercTramite: datos.ejercTramite || datos.ejer_tramite || '',
    nroSidif: datos.nroSidif || datos.nro_sidif || '',
    fRegistro: datos.fRegistro || datos.f_registro || '',
    nroOp: datos.nroOp || datos.nro_op || '',
    impNeto:      parseFloat(datos.impNeto      ?? datos.imp_neto)      || 0,
    impRetenido:  parseFloat(datos.impRetenido  ?? datos.imp_retenido)  || 0,
    impBruto:     parseFloat(datos.impBruto     ?? datos.imp_bruto)     || 0,
    fechaVisado: datos.fechaVisado || datos.fecha_visado || '',
    entrada: datos.entrada || '',
    fsEntrada: datos.fsEntrada || datos.fs_entrada || '',
    observacion: datos.observacion || '',
    salida: datos.salida || '',
    fsSalida: datos.fsSalida || datos.fs_salida || '',
    firma: datos.firma || '',
    estado: datos.estado || 'VISADO',
  })
}

db.crearExpedienteLocal = function(datos) {
  const stmt = db.prepare(`
    INSERT INTO expedientes (
      cta_financ, denominacion, observ_op, ff, cgto, tipo_op,
      nro_expediente, ejer_tramite, nro_sidif, f_registro, nro_op,
      imp_neto, imp_retenido, imp_bruto, fecha_visado, entrada, fs_entrada,
      observacion, salida, fs_salida, firma, estado, pendiente_sync
    ) VALUES (
      @ctaFinanc, @denominacion, @observOp, @ff, @cgto, @tipoOp,
      @nroExpediente, @ejercTramite, @nroSidif, @fRegistro, @nroOp,
      @impNeto, @impRetenido, @impBruto, @fechaVisado, @entrada, @fsEntrada,
      @observacion, @salida, @fsSalida, @firma, @estado, 1
    )
  `)
  const info = stmt.run({
    ctaFinanc: datos.ctaFinanc || '', denominacion: datos.denominacion || '',
    observOp: datos.observOp || '', ff: datos.ff || '', cgto: datos.cgto || '',
    tipoOp: datos.tipoOp || '', nroExpediente: datos.nroExpediente || '',
    ejercTramite: datos.ejercTramite || '', nroSidif: datos.nroSidif || '',
    fRegistro: datos.fRegistro || '', nroOp: datos.nroOp || '',
    impNeto: datos.impNeto || 0, impRetenido: datos.impRetenido || 0,
    impBruto: datos.impBruto || 0, fechaVisado: datos.fechaVisado || '',
    entrada: datos.entrada || '', fsEntrada: datos.fsEntrada || '',
    observacion: datos.observacion || '', salida: datos.salida || '',
    fsSalida: datos.fsSalida || '', firma: datos.firma || '',
    estado: datos.estado || 'VISADO',
  })
  return { id: info.lastInsertRowid, pendienteSync: true }
}

db.actualizarExpedienteLocal = function(idSheets, datos) {
  db.prepare(`
    UPDATE expedientes SET
      cta_financ = @ctaFinanc, denominacion = @denominacion, observ_op = @observOp,
      ff = @ff, cgto = @cgto, tipo_op = @tipoOp, nro_expediente = @nroExpediente,
      ejer_tramite = @ejercTramite, nro_sidif = @nroSidif, f_registro = @fRegistro,
      nro_op = @nroOp, imp_neto = @impNeto, imp_retenido = @impRetenido,
      imp_bruto = @impBruto, fecha_visado = @fechaVisado, entrada = @entrada,
      fs_entrada = @fsEntrada, observacion = @observacion, salida = @salida,
      fs_salida = @fsSalida, firma = @firma, estado = @estado, pendiente_sync = 1
    WHERE id_sheets = @idSheets
  `).run({ ...datos, idSheets })
}

db.resumenMes = function(mes, anio) {
  const mesPad = String(mes).padStart(2, '0')
  const anioStr = String(anio)
  const exps = db.prepare(`
    SELECT estado, imp_neto, imp_bruto, imp_retenido
    FROM expedientes
    WHERE eliminado_en IS NULL AND (
      (fecha_visado GLOB '????-??-??*' AND strftime('%m', fecha_visado) = ? AND strftime('%Y', fecha_visado) = ?)
      OR (fecha_visado GLOB '??/??/????*' AND substr(fecha_visado, 4, 2) = ? AND substr(fecha_visado, 7, 4) = ?)
      OR (fecha_visado GLOB '?/??/????*' AND substr(fecha_visado, 3, 2) = ? AND substr(fecha_visado, 6, 4) = ?)
    )
  `).all(mesPad, anioStr, mesPad, anioStr, mesPad, anioStr)

  return {
    total: exps.length,
    totalBruto: exps.reduce((a, e) => a + (e.imp_bruto || 0), 0),
    totalNeto: exps.reduce((a, e) => a + (e.imp_neto || 0), 0),
    porEstado: {
      VISADO:     exps.filter(e => e.estado === 'VISADO').length,
      PENDIENTE:  exps.filter(e => e.estado === 'PENDIENTE').length,
      OBSERVADO:  exps.filter(e => e.estado === 'OBSERVADO').length,
      EN_PROCESO: exps.filter(e => e.estado === 'EN_PROCESO').length,
    },
  }
}

db.obtenerPapelera = function() {
  const expedientes = db.prepare(
    `SELECT * FROM expedientes WHERE eliminado_en IS NOT NULL ORDER BY eliminado_en DESC`
  ).all()
  return expedientes.map(fila => ({
    ...filaAExpediente(fila),
    eliminadoEn: fila.eliminado_en,
    eliminadoPor: fila.eliminado_por,
  }))
}

// Mapear fila SQLite a objeto estándar
function filaAExpediente(fila) {
  return {
    id: fila.id,
    fila: fila.id_sheets,
    idSheets: fila.id_sheets,
    ctaFinanc: fila.cta_financ,
    denominacion: fila.denominacion,
    observOp: fila.observ_op,
    ff: fila.ff,
    cgto: fila.cgto,
    tipoOp: fila.tipo_op,
    nroExpediente: fila.nro_expediente,
    ejercTramite: fila.ejer_tramite,
    nroSidif: fila.nro_sidif,
    fRegistro: fila.f_registro,
    nroOp: fila.nro_op,
    impNeto: fila.imp_neto,
    impRetenido: fila.imp_retenido,
    impBruto: fila.imp_bruto,
    fechaVisado: fila.fecha_visado,
    entrada: fila.entrada,
    fsEntrada: fila.fs_entrada,
    observacion: fila.observacion,
    salida: fila.salida,
    fsSalida: fila.fs_salida,
    firma: fila.firma,
    estado: fila.estado || 'VISADO',
    pendienteSync: fila.pendiente_sync === 1,
  }
}

module.exports = db
