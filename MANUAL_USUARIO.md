# Manual de Usuario
## Sistema de Gestión de Expedientes
### Delegación Fiscal · Tribunal de Cuentas · La Rioja

---

## ÍNDICE

1. [Cómo arrancar el sistema](#1-cómo-arrancar-el-sistema)
2. [Inicio de sesión](#2-inicio-de-sesión)
3. [Dashboard](#3-dashboard)
4. [Módulo Expedientes](#4-módulo-expedientes)
5. [Módulo Programas](#5-módulo-programas)
6. [Módulo Responsables](#6-módulo-responsables)
7. [Módulo Informes Mensuales](#7-módulo-informes-mensuales)
8. [Módulo Configuración](#8-módulo-configuración)
9. [Modo Offline](#9-modo-offline)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)

---

## 1. Cómo arrancar el sistema

### Paso a paso:

**1.** Hacé clic derecho en la carpeta `Sistema Administrativo` del Escritorio y elegí **"Abrir en Terminal"**.

**2.** En la terminal que se abre, escribí:
```
npm run server
```
Cuando aparezca `Servidor corriendo en http://localhost:3001`, el backend está listo. **No cierres esa terminal.**

**3.** Abrí **otra terminal** en la misma carpeta y escribí:
```
npm run vite
```
Cuando aparezca `Local: http://localhost:5173`, el frontend está listo.

**4.** Abrí tu navegador (Chrome, Edge, Firefox) y escribí en la barra de direcciones:
```
http://localhost:5173
```

**5.** Vas a ver la pantalla de inicio de sesión del sistema.

> **Nota:** Las dos terminales tienen que quedar abiertas mientras usás el sistema. Si las cerrás, el sistema deja de funcionar.

---

## 2. Inicio de sesión

En la pantalla de login:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

> **Importante:** Cambiá la contraseña apenas puedas desde Configuración → Usuarios.

### Roles disponibles:

| Rol | Qué puede hacer |
|-----|----------------|
| **Administrador** | Todo: expedientes, programas, responsables, informes, configuración y usuarios |
| **Operador** | Expedientes, informes y consultas. No puede modificar programas, responsables ni configuración |

---

## 3. Dashboard

Es la pantalla principal. Muestra un resumen del período seleccionado.

### Cómo usarlo:

1. En los selectores de la parte superior elegí el **Mes** y el **Año** que querés ver.
2. El sistema muestra automáticamente:
   - **Total de expedientes** del período
   - **Importe Bruto total** de las órdenes de pago
   - **Cantidad de pendientes** (estado Pendiente)
   - **Cantidad de observados** (estado Observado)
3. Más abajo hay un desglose por estado: Visados, Pendientes, Observados y En Proceso.
4. Al pie se muestra si el sistema está conectado a Google Sheets o trabajando en modo local.

---

## 4. Módulo Expedientes

Es el módulo principal. Permite ver, buscar, crear y editar todos los expedientes.

### Ver la lista de expedientes

Al entrar al módulo se muestra la tabla con todos los expedientes, de a 50 por página.

**Colores de las filas:**

| Color | Estado |
|-------|--------|
| Blanco | Visado |
| Amarillo | Pendiente |
| Rojo claro | Observado |
| Verde claro | En Proceso |

### Buscar expedientes

En el campo de búsqueda podés escribir:
- Nombre del beneficiario
- Número de expediente
- Número SIDIF
- Número de OP

La búsqueda es en tiempo real.

### Filtrar expedientes

Usá los selectores para filtrar por:
- **Mes y Año** de visado
- **Estado** (Visado, Pendiente, Observado, En Proceso)
- **Tipo OP** (BYS, TRA, BDU)

### Crear un nuevo expediente

1. Hacé clic en el botón **"Nuevo Expediente"** (arriba a la derecha).
2. Completá los campos en el formulario:
   - **Denominación Beneficiario** (obligatorio)
   - Tipo OP, N° Expediente, Ejercicio, N° SIDIF, N° OP
   - Importes (Neto, Retenido, Bruto)
   - Fechas (Visado, Entrada, Salida)
   - Observaciones y Firma
3. Seleccioná el **Estado** inicial (por defecto: Visado).
4. Hacé clic en **"Crear Expediente"**.

Si hay conexión a internet, se guarda en Google Sheets y SQLite. Sin conexión, se guarda solo en SQLite y se sincroniza automáticamente cuando vuelva la conexión.

### Editar un expediente

1. Hacé clic en el ícono de lápiz al final de la fila.
2. Modificá los campos que necesitás.
3. Hacé clic en **"Guardar Cambios"**.

### Cambiar el estado de un expediente

En la columna **Estado** de la tabla, cada fila tiene un selector desplegable. Hacé clic y elegí el nuevo estado. El cambio se aplica de inmediato y:
- Cambia el color de la fila en la tabla
- Actualiza el color de la fila en Google Sheets (si hay conexión)

### Paginación

Si hay más de 50 expedientes, aparecen botones de paginación al pie de la tabla. Usá **"Anterior"** y **"Siguiente"** para navegar, o hacé clic en un número de página.

---

## 5. Módulo Programas

Permite gestionar los programas (Nº 32, Nº 39, etc.) que organizan los expedientes.

> Solo los **Administradores** pueden crear, editar o dar de baja programas.

### Ver programas

Al entrar se muestra la lista con todos los programas, su número, nombre, cuenta financiera y estado (Activo/Inactivo).

### Crear un programa

1. Hacé clic en **"Nuevo Programa"**.
2. Completá:
   - **Número de Programa** (obligatorio, ej: 32)
   - **Nombre** (obligatorio, ej: Programa Nacional Nº 32)
   - **Cuenta Financiera** (opcional)
   - Marcá si está **Activo**
3. Hacé clic en **"Crear Programa"**.

### Editar un programa

1. Hacé clic en el ícono de lápiz.
2. Modificá los datos.
3. Hacé clic en **"Guardar Cambios"**.

### Dar de baja un programa

Hacé clic en el ícono de círculo con raya (baja lógica). El programa queda inactivo pero no se elimina. Los expedientes asociados no se ven afectados.

---

## 6. Módulo Responsables

Permite gestionar los responsables del organismo. Sus datos se insertan automáticamente en la Nota mensual.

> Solo los **Administradores** pueden crear, editar o dar de baja responsables.

### Ver responsables

Se listan ordenados por jerarquía. Cada responsable muestra su cargo, nombre, DNI, programa asociado y estado.

### Crear un responsable

1. Hacé clic en **"Nuevo Responsable"**.
2. Completá:
   - **Cargo** (obligatorio, ej: MINISTRO)
   - **Nombre Completo** (obligatorio)
   - **DNI**
   - **Domicilio** y **Email** (opcionales)
   - **Orden Jerárquico** (número; define el orden en la nota: 1 = primero)
   - **Programa Asociado** (si es responsable de un programa específico)
3. Hacé clic en **"Crear Responsable"**.

### Orden en la Nota mensual

El orden jerárquico define cómo aparecen en la nota:
- 1 → Ministro
- 2 → Director General
- 3, 4... → Responsables contables por programa

---

## 7. Módulo Informes Mensuales

Permite generar la **Nota mensual en PDF** y las **Planillas en Excel y PDF**.

### Paso a paso para generar un informe:

**1. Seleccionar el período**
- Elegí el **Mes** y **Año** del informe.
- El sistema carga automáticamente todos los expedientes visados en ese período.

**2. Verificar el preview**
- Aparece un resumen con: total de OPs, importe bruto total y cantidad de programas.
- Más abajo hay una tabla con todos los expedientes incluidos. Revisala antes de generar.

**3. Ingresar el número de nota**
- En el campo **"N° de Nota"** escribí el número correlativo (ej: `42/25`).
- Este número aparece en el encabezado de la nota PDF.

**4. Generar la Nota PDF**
- Hacé clic en **"Generar Nota (PDF)"**.
- El PDF se genera y se abre automáticamente en el navegador.
- Formato: hoja Legal (8.5" × 14"), orientación vertical.
- Incluye: logo, fecha, destinatario, cuerpo con total de OPs y listado de responsables.

**5. Generar las Planillas**
- Hacé clic en **"Generar Planillas (Excel + PDF)"**.
- Se generan dos archivos:
  - Un **Excel** con una hoja por cada programa activo con expedientes en el mes.
  - Un **PDF** con el mismo contenido, orientación horizontal, tamaño Legal.
- Formato de columnas: Nº, Cta, Beneficiario, Observaciones, F.F., CGto, Tipo OP, N° Expediente, Ejercicio, SIDIF, F.Registro, N° OP, Imp. Neto, Imp. Retenido, Imp. Bruto, Fecha Visado.
- Fila de **TOTAL** al pie de cada hoja.

**6. Descargar los archivos**
- Aparecen en la sección **"Archivos generados"** al pie de la pantalla.
- Hacé clic en **"Descargar"** para guardarlos en tu equipo.

---

## 8. Módulo Configuración

> Solo accesible para **Administradores**.

### Configuración de la Nota

Permite personalizar:
- **Cargo del destinatario** (ej: SEÑOR PRESIDENTE DEL TRIBUNAL DE CUENTAS)
- **Nombre del Presidente del Tribunal** (ej: CR. MENEM JORGE)
- **Número de nota correlativo actual**
- **Texto del cuerpo de la nota** — editable con variables:
  - `{MES}` → nombre del mes en mayúsculas
  - `{AÑO}` → año del informe
  - `{TOTAL_OPS}` → cantidad total de órdenes de pago
  - `{RESPONSABLES}` → listado de responsables activos

### Gestión de Usuarios

Permite crear, editar y desactivar usuarios del sistema.

**Crear usuario:**
1. Hacé clic en **"Nuevo Usuario"**.
2. Completá usuario, nombre, contraseña y rol.
3. Hacé clic en **"Crear Usuario"**.

**Roles disponibles:**
- **Administrador:** acceso total
- **Operador:** acceso a expedientes e informes solamente

---

## 9. Modo Offline

El sistema funciona sin internet. En la barra superior aparece un indicador:

| Indicador | Significado |
|-----------|-------------|
| Verde "En línea" | Conectado a Google Sheets. Lectura y escritura en la nube. |
| Rojo "Sin conexión" | Sin internet. Trabajando con la base de datos local (SQLite). |
| Amarillo "Sincronizando..." | Recuperó la conexión y está subiendo los cambios pendientes. |

### Qué pasa cuando no hay internet

- Podés seguir creando y editando expedientes con normalidad.
- Los cambios se guardan localmente con un punto naranja (●) en la tabla.
- Cada 30 segundos el sistema verifica si volvió la conexión.
- Cuando la conexión se recupera, sincroniza automáticamente todos los cambios y muestra una notificación.

---

## 10. Preguntas frecuentes

**¿Cómo conecto el sistema a Google Sheets?**
Editá el archivo `.env` en la carpeta del proyecto y completá las cuatro variables de Google. Reiniciá el servidor.

**¿Qué pasa si cierro una terminal?**
El sistema deja de funcionar en el navegador. Tenés que volver a abrir las terminales y ejecutar `npm run server` y `npm run vite`.

**¿Dónde se guardan los PDF y Excel generados?**
En la carpeta `exports/` dentro del proyecto. También podés descargarlos desde la pantalla de Informes.

**¿Cómo cambio la contraseña del administrador?**
Entrá a Configuración → Usuarios → hacé clic en el lápiz del usuario `admin` → escribí la nueva contraseña → Guardar.

**¿Puedo tener varios usuarios operadores?**
Sí. Desde Configuración → Usuarios podés crear tantos usuarios como necesites con rol Operador.

**¿Cómo agrego el logo del Tribunal en la nota?**
Guardá el archivo de imagen con el nombre `logo-tribunal.png` dentro de la carpeta `assets/` del proyecto. A partir de ese momento aparece en todos los PDFs.

---

*Sistema de Gestión de Expedientes v1.0 · Delegación Fiscal · Tribunal de Cuentas · La Rioja*
