-- ============================================================
-- SCHEMA SQLite — Sistema de Expedientes
-- Tribunal de Cuentas — Delegación Fiscal — La Rioja
-- ============================================================

-- Tabla principal de expedientes (réplica local de Google Sheets)
CREATE TABLE IF NOT EXISTS expedientes (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  id_sheets       INTEGER UNIQUE,        -- Número de fila en Google Sheets
  cta_financ      TEXT,
  denominacion    TEXT,
  observ_op       TEXT,
  ff              TEXT,
  cgto            TEXT,
  tipo_op         TEXT,                  -- BYS / TRA / BDU
  nro_expediente  TEXT,
  ejer_tramite    INTEGER,
  nro_sidif       TEXT,
  f_registro      TEXT,                  -- Fecha ISO
  nro_op          TEXT,
  imp_neto        REAL DEFAULT 0,
  imp_retenido    REAL DEFAULT 0,
  imp_bruto       REAL DEFAULT 0,
  fecha_visado    TEXT,                  -- Fecha ISO
  entrada         TEXT,
  fs_entrada      INTEGER,
  observacion     TEXT,
  salida          TEXT,
  fs_salida       INTEGER,
  firma           TEXT,
  estado          TEXT DEFAULT 'VISADO', -- VISADO | PENDIENTE | OBSERVADO | EN_PROCESO
  pendiente_sync  INTEGER DEFAULT 0,     -- 1 = hay cambios sin sincronizar a Sheets
  eliminado_en    TEXT,                  -- NULL = activo, fecha ISO = en papelera (soft-delete local)
  eliminado_por   TEXT,                  -- nombre de usuario que lo envió a la papelera
  creado_en       TEXT DEFAULT (datetime('now')),
  modificado_en   TEXT DEFAULT (datetime('now'))
);

-- Programas (ABM)
CREATE TABLE IF NOT EXISTS programas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  numero           INTEGER NOT NULL UNIQUE,
  nombre           TEXT NOT NULL,
  cuenta_financiera TEXT,
  activo           INTEGER DEFAULT 1,
  creado_en        TEXT DEFAULT (datetime('now'))
);

-- Datos iniciales de programas
INSERT OR IGNORE INTO programas (numero, nombre, cuenta_financiera, activo)
VALUES
  (32, 'Programa Nacional Nº 32', '113.253.252.038.679', 1),
  (39, 'Programa Nacional Nº 39', '113.253.250.045.241', 1),
  (45, 'Programa Nacional Nº 45', '113.253.250.050.924', 1);

-- Asegurar cuentas financieras correctas en cada arranque
UPDATE programas SET cuenta_financiera = '113.253.252.038.679' WHERE numero = 32;
UPDATE programas SET cuenta_financiera = '113.253.250.045.241' WHERE numero = 39;
UPDATE programas SET cuenta_financiera = '113.253.250.050.924' WHERE numero = 45;

-- Responsables del organismo
CREATE TABLE IF NOT EXISTS responsables (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  cargo            TEXT NOT NULL,
  nombre_completo  TEXT NOT NULL,
  dni              TEXT,
  domicilio        TEXT,
  email            TEXT,
  programa_id      INTEGER REFERENCES programas(id),
  orden_jerarquico INTEGER DEFAULT 99,
  activo           INTEGER DEFAULT 1,
  creado_en        TEXT DEFAULT (datetime('now'))
);

-- Datos iniciales de responsables (id explícito para que INSERT OR IGNORE detecte el conflicto)
INSERT OR IGNORE INTO responsables (id, cargo, nombre_completo, dni, programa_id, orden_jerarquico, activo)
VALUES
  (1, 'MINISTRO', 'ING. ARIEL NICOLAS MARTÍNEZ FRANCES', '23.016.184', NULL, 1, 1),
  (2, 'DIRECTOR GENERAL DE ADMINISTRACIÓN', 'CR. DIAZ CRISTIAN ADRIAN', '27.450.073', NULL, 2, 1),
  (3, 'RESPONSABLE CONTABLE', 'MORENO MARCELA', '37.654.009', 1, 3, 1),
  (4, 'RESPONSABLE CONTABLE', 'HERRERA GEORGINA NADIR', '42.058.960', 2, 4, 1);

-- Eliminar duplicados existentes conservando el registro más antiguo (menor id)
DELETE FROM responsables WHERE id NOT IN (
  SELECT MIN(id) FROM responsables GROUP BY LOWER(TRIM(cargo)), LOWER(TRIM(nombre_completo))
);

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre_usuario    TEXT NOT NULL UNIQUE,
  nombre_completo   TEXT NOT NULL,
  contrasena_hash   TEXT NOT NULL,
  rol               TEXT NOT NULL DEFAULT 'operador', -- superadmin | delegado | operador
  activo            INTEGER DEFAULT 1,
  ultimo_acceso     TEXT,
  intentos_fallidos INTEGER DEFAULT 0,
  bloqueado_hasta   TEXT,
  creado_en         TEXT DEFAULT (datetime('now'))
);

-- Usuario administrador inicial (contraseña: admin123 — cambiar en producción)
INSERT OR IGNORE INTO usuarios (nombre_usuario, nombre_completo, contrasena_hash, rol, activo)
VALUES (
  'admin',
  'Administrador del Sistema',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK8JzDHka',
  'administrador',
  1
);

-- Configuración del sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id                      INTEGER PRIMARY KEY DEFAULT 1,
  presidente_nombre       TEXT DEFAULT 'CR. MENEM JORGE',
  presidente_cargo_texto  TEXT DEFAULT 'SEÑOR PRESIDENTE DEL TRIBUNAL DE CUENTAS',
  texto_nota_cuerpo       TEXT DEFAULT 'De mi mayor consideracion

Por la presente me dirijo a Ud., a los fines de:

1. Elevar planilla, correspondiente a Ordenes de Pago pagadas por S.A.F 420, Pacto Federal Programa Nacional N.º 2 y visadas por esta Delegación Fiscal en el mes de {MES} de {AÑO}. Se Adjunta Anexo 1., conforme a lo establecido en el artículo 316 y 319 de la Resolución 19/19 del Tribunal de Cuentas.

   TOTAL, DE ORDENES DE PAGO VISADAS: {TOTAL_OPS}

2. Se informa Listado de responsables del Organismo al día de la Fecha:

{RESPONSABLES}

Sin otro particular saludo a Ud. Atentamente. -',
  numero_nota_correlativo   INTEGER DEFAULT 1,
  organismo                 TEXT    DEFAULT 'Ministerio de Educación PFE',
  delegado_fiscal           TEXT    DEFAULT '',
  sesion_expiracion_minutos INTEGER DEFAULT 1440,
  modificado_en             TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO configuracion (id) VALUES (1);

-- Control Preventivo (planilla mensual de intervenciones)
CREATE TABLE IF NOT EXISTS control_preventivo (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  saf                TEXT DEFAULT '420',
  organismo          TEXT NOT NULL,
  delegado_fiscal    TEXT,
  autoridad          TEXT,
  expediente         TEXT,
  concepto           TEXT,
  nro_acto_adm       TEXT,
  ipp_sin_puntos     TEXT,
  importe            REAL DEFAULT 0,
  fecha_entrada      TEXT,
  fecha_salida       TEXT,
  fecha_intervencion TEXT,
  sin_observacion    TEXT,
  mes                INTEGER,
  anio               INTEGER,
  creado_en          TEXT DEFAULT (datetime('now')),
  modificado_en      TEXT DEFAULT (datetime('now'))
);

-- Libro de Entrada (registro físico de entrada/salida de expedientes)
CREATE TABLE IF NOT EXISTS libro_entrada (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  nro_expediente  TEXT,
  asunto          TEXT,
  sidif           TEXT,
  op_pago         TEXT,
  imp_neto        REAL DEFAULT 0,
  imp_retenido    REAL DEFAULT 0,
  imp_bruto       REAL DEFAULT 0,
  resolucion      TEXT,
  fecha_entrada   TEXT,
  fojas_entrada   INTEGER,
  fecha_salida    TEXT,
  fecha_visado    TEXT,
  programa        TEXT,
  firma           TEXT,
  requerimiento   TEXT,
  estado          TEXT DEFAULT 'SIN_VISAR',  -- INGRESADO | SIN_VISAR | VISADO | SALIDA
  creado_en       TEXT DEFAULT (datetime('now')),
  modificado_en   TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_le_fecha_entrada ON libro_entrada (fecha_entrada);
CREATE INDEX IF NOT EXISTS idx_le_estado        ON libro_entrada (estado);
CREATE INDEX IF NOT EXISTS idx_le_nro_exp       ON libro_entrada (nro_expediente);

-- Índices de búsqueda frecuente
CREATE INDEX IF NOT EXISTS idx_exp_fecha_visado    ON expedientes (fecha_visado);
CREATE INDEX IF NOT EXISTS idx_exp_denominacion    ON expedientes (denominacion);
CREATE INDEX IF NOT EXISTS idx_exp_nro_expediente  ON expedientes (nro_expediente);
CREATE INDEX IF NOT EXISTS idx_exp_estado          ON expedientes (estado);
CREATE INDEX IF NOT EXISTS idx_exp_pendiente_sync  ON expedientes (pendiente_sync);
CREATE INDEX IF NOT EXISTS idx_exp_tipo_op         ON expedientes (tipo_op);
-- idx_exp_eliminado_en se crea en la migración de src/services/sqlite.js,
-- no acá: en bases existentes la columna todavía no existe en este punto
-- (CREATE TABLE IF NOT EXISTS es un no-op sobre tablas ya creadas).
CREATE INDEX IF NOT EXISTS idx_cp_mes_anio         ON control_preventivo (mes, anio);
CREATE INDEX IF NOT EXISTS idx_cp_organismo        ON control_preventivo (organismo);

-- Auditoría: historial de cambios realizados por los usuarios
CREATE TABLE IF NOT EXISTS auditoria (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id       INTEGER,
  usuario_nombre   TEXT NOT NULL,
  accion           TEXT NOT NULL,  -- CREAR | EDITAR | ELIMINAR | CAMBIAR_ESTADO
  modulo           TEXT NOT NULL,  -- expedientes | libro_entrada | control_preventivo | programas | responsables | configuracion | usuarios
  registro_id      TEXT,
  descripcion      TEXT NOT NULL,
  datos_anteriores TEXT,           -- JSON
  datos_nuevos     TEXT,           -- JSON
  ip               TEXT,
  creado_en        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aud_creado_en  ON auditoria (creado_en);
CREATE INDEX IF NOT EXISTS idx_aud_usuario_id ON auditoria (usuario_id);
CREATE INDEX IF NOT EXISTS idx_aud_modulo     ON auditoria (modulo);
CREATE INDEX IF NOT EXISTS idx_aud_accion     ON auditoria (accion);
