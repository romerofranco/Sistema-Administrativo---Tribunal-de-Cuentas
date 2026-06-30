# Sistema de Gestión de Expedientes
## Delegación Fiscal · Tribunal de Cuentas · La Rioja

Sistema web + desktop (Electron) para la gestión de expedientes administrativos.
Conecta con **Google Sheets** como base de datos principal y tiene modo **offline con SQLite**.

---

## Requisitos previos

- **Node.js** v18 o superior — [nodejs.org](https://nodejs.org)
- **npm** v9 o superior (viene con Node.js)
- Cuenta de servicio de Google con acceso al Google Sheet

---

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copiar el archivo de ejemplo y completar los valores:

```bash
copy .env.example .env
```

Editar el archivo `.env` con los datos reales:

```env
GOOGLE_SHEET_ID=ID_de_tu_hoja_de_calculo
GOOGLE_SERVICE_ACCOUNT_EMAIL=cuenta@proyecto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_NAME=base de datos 2020../..2025
JWT_SECRET=una_clave_secreta_larga_y_segura
PORT=3001
```

### 3. Obtener credenciales de Google Service Account

1. Ir a [Google Cloud Console](https://console.cloud.google.com)
2. Crear un proyecto (o usar uno existente)
3. Habilitar la API de **Google Sheets**
4. Crear una **Service Account** (Cuenta de Servicio)
5. Generar una clave JSON para la cuenta de servicio
6. Compartir el Google Sheet con el email de la cuenta de servicio (como Editor)
7. Copiar `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
8. Copiar `private_key` → `GOOGLE_PRIVATE_KEY` (con las `\n` incluidas)

---

## Ejecución

### Modo desarrollo (web + Electron)

```bash
npm run dev
```

Esto inicia simultáneamente:
- Servidor Express en `http://localhost:3001`
- Frontend React (Vite) en `http://localhost:5173`
- Electron apuntando al frontend

### Solo navegador web

```bash
npm run server     # Terminal 1: servidor backend
npm run vite       # Terminal 2: frontend React
```

Abrir `http://localhost:5173` en el navegador.

### Build para distribución (instalador Windows)

```bash
npm run build
```

El instalador se genera en `dist-electron/`.

---

## Credenciales iniciales

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `admin123` | Administrador |

**Cambiar la contraseña inmediatamente** desde Configuración → Usuarios.

---

## Módulos

| Módulo | Descripción |
|--------|-------------|
| **Dashboard** | Resumen del período con estadísticas por estado |
| **Expedientes** | CRUD completo, búsqueda, filtros, colores por estado |
| **Programas** | ABM de programas (Nº 32, 39, etc.) |
| **Responsables** | ABM con jerarquía de cargos para la nota mensual |
| **Informes** | Genera Nota PDF (vertical, legal) + Planillas Excel/PDF (horizontal, legal) |
| **Configuración** | Solo administrador: usuarios, texto de nota, destinatario |

---

## Estructura de archivos

```
Sistema Administrativo/
├── electron/           → Proceso principal de Electron
├── src/
│   ├── components/     → Componentes reutilizables (Layout, modales)
│   ├── context/        → AuthContext, ConexionContext
│   ├── pages/          → Vistas principales (uno por módulo)
│   ├── services/       → Google Sheets, SQLite, exportadores
│   └── utils/          → Colores, formateos
├── server/
│   ├── index.js        → Servidor Express
│   ├── middleware/     → Autenticación JWT
│   └── routes/         → Rutas de la API
├── database/
│   └── schema.sql      → Schema SQLite (se aplica automáticamente)
├── exports/            → PDFs y Excel generados (se crea automáticamente)
├── assets/
│   └── logo-tribunal.png  → Logo para la nota PDF
└── .env                → Variables de entorno (NO subir a git)
```

---

## Modo offline

El sistema detecta automáticamente si hay conexión a internet cada 30 segundos.

- **Online**: Lee y escribe directamente en Google Sheets
- **Offline**: Lee y escribe en SQLite local con flag `pendiente_sync = 1`
- **Al recuperar conexión**: Sincroniza automáticamente todos los registros pendientes

---

## Agregar el logo del Tribunal

Colocar el archivo de imagen en:
```
assets/logo-tribunal.png
```

El logo aparecerá en la esquina superior izquierda de la Nota mensual PDF.

---

## Notas de seguridad

- Nunca subir el archivo `.env` a repositorios Git
- Cambiar `JWT_SECRET` en producción por una cadena larga y aleatoria
- Cambiar la contraseña del usuario `admin` en el primer uso
- El archivo `.gitignore` ya excluye `.env`, `exports/` y `database/*.db`
