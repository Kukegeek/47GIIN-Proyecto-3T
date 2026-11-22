# Sprint 5: Explotacion de Datos, Estadisticas y Resguardo en Cloudflare R2

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 5 (Reportes, Estadísticas y Resguardo R2)` |
| **Fechas de ejecución** | `2027-01-14 al 2027-01-27` |
| **Puntos de Historia (Story Points)** | **19 SP** |
| **Total de Historias de Usuario** | 4 historias |
| **Épicas involucradas** | Explotación de Datos, Reportes CSV y Backup Cloud R2 (3T-EP5), Arquitectura Local-First, Seguridad RBAC y Corporativo (3T-EP1), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Generacion de informes operativos exportables a CSV con cabecera corporativa y panel de KPIs (CRUD 15), interfaz visual de inspeccion de auditoria y purga controlada para Administrador (CRUD 13 - UI), Proceso Automatizado 3 de sincronizacion local-first comprimida (Gzip + SHA-256) hacia Cloudflare R2, y certificacion CP-09.

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-24** | Generador de Reportes Operativos, Exportación CSV y Dashboard de KPIs (CRUD 15) | `High` | **5** | `2027-01-14 a 2027-01-27` | 3T-EP5 - Reportes CSV, KPIs y Resguardo Cloudflare R2 | `M11-Reportes` |
| **3T-25** | Visor de Inspección de Auditoría y Purga Controlada para Administrador (CRUD 13 - UI) | `High` | **4** | `2027-01-14 a 2027-01-27` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M09-Usuarios-RBAC-Auditoria` |
| **3T-26** | Proceso Automatizado 3: Sincronización Local-First y Resguardo en Cloudflare R2 | `Highest` | **6** | `2027-01-14 a 2027-01-27` | 3T-EP5 - Reportes CSV, KPIs y Resguardo Cloudflare R2 | `M04-Persistencia-SQLite;M09-Usuarios-RBAC-Auditoria` |
| **3T-27** | [VALIDACIÓN S5] Validación de Reportes Corporativos CSV, Visor de Auditoría y Backup en R2 (CP-09) | `Highest` | **4** | `2027-01-14 a 2027-01-27` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-24] Generador de Reportes Operativos, Exportación CSV y Dashboard de KPIs (CRUD 15)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `24` |
| **Issue Key** | `3T-24` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP5 - Explotación de Datos, Reportes CSV y Backup Cloud R2 |
| **Prioridad** | `High` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2027-01-14 al 2027-01-27` |
| **Componentes** | `M11-Reportes` |
| **Etiquetas (Labels)** | `Sprint-5;M11;CRUD-15;Reportes;CSV;Dashboard;KPIs` |

#### Enunciado de la Historia de Usuario
> Como Administrador, quiero gestionar la generación, parametrización y borrado de informes operativos de rutas y consumos (reporte), exportarlos a formato CSV incluyendo la cabecera fiscal de la organización, y consultar un panel estadístico con los KPIs de explotación de la flota.

#### Trazabilidad
- **Módulos / Requisitos:** M11, CRUD 15 (reporte).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 15 (reporte): CREATE (generación y guardado según filtros), READ (visualización de reportes, KPIs del dashboard y exportación a CSV), UPDATE (modificación de parámetros de fecha, vehículo o agrupación), DELETE (eliminación de reportes o plantillas).**
- [ ] **Subtarea 2. Inyectar dinámicamente los datos fiscales y corporativos de la tabla organizacion en las cabeceras de los informes.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Generación y exportación a CSV de reporte con cabecera corporativa
  Dado un conjunto de rutas y repostajes registrados en la base de datos local
  Cuando el usuario genera un informe filtrado en la entidad reporte y pulsa exportar a CSV
  Entonces se descarga el archivo CSV estructurado y se presenta en pantalla el informe con la cabecera actualizada de organizacion y los KPIs de flota.
```

---

### [3T-25] Visor de Inspección de Auditoría y Purga Controlada para Administrador (CRUD 13 - UI)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `25` |
| **Issue Key** | `3T-25` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `High` |
| **Story Points** | **4 SP** |
| **Plazo de Ejecución** | `2027-01-14 al 2027-01-27` |
| **Componentes** | `M09-Usuarios-RBAC-Auditoria` |
| **Etiquetas (Labels)** | `Sprint-5;M09;CRUD-13;Visor-Auditoria;RNF-06` |

#### Enunciado de la Historia de Usuario
> Como Administrador de Flota (ROL_ADMIN), quiero disponer de un visor exclusivo con filtros por fecha, usuario, entidad y tipo de operación para inspeccionar la tabla log_auditoria, marcar alertas de seguridad revisadas y ejecutar purgas controladas tras su resguardo en Cloudflare R2.

#### Trazabilidad
- **Módulos / Requisitos:** M09, CRUD 13 (log_auditoria - READ, UPDATE, DELETE), RNF-06.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar la interfaz de consulta filtrada (READ) de log_auditoria con visor de diferencias JSON (valor_anterior vs valor_nuevo).**
- [ ] **Subtarea 2. Implementar el marcado de revisión de seguridad (UPDATE) y la purga controlada post-volcado verificado en R2 (DELETE), exclusivo para ROL_ADMIN.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Inspección filtrada y purga controlada del log de auditoría
  Dado un usuario autenticado con ROL_ADMIN en el visor de auditoría
  Cuando filtra registros por entidad o usuario, marca una alerta como revisada o solicita purgar registros ya respaldados en R2
  Entonces el sistema muestra el detalle JSON completo de cada evento y permite la purga únicamente si consta un backup íntegro en Cloudflare R2.
```

---

### [3T-26] Proceso Automatizado 3: Sincronización Local-First y Resguardo en Cloudflare R2

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `26` |
| **Issue Key** | `3T-26` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP5 - Explotación de Datos, Reportes CSV y Backup Cloud R2 |
| **Prioridad** | `Highest` |
| **Story Points** | **6 SP** |
| **Plazo de Ejecución** | `2027-01-14 al 2027-01-27` |
| **Componentes** | `M04-Persistencia-SQLite;M09-Usuarios-RBAC-Auditoria` |
| **Etiquetas (Labels)** | `Sprint-5;M04;M09;Proceso-3;Cloudflare-R2;Gzip;SHA-256;RNF-04` |

#### Enunciado de la Historia de Usuario
> Como Administrador, quiero que al iniciar la aplicación (cuando hayan transcurrido más de 24 horas desde el último resguardo) un proceso autónomo sincronice los historiales de rutas, consumos y log_auditoria hacia un archivo JSON comprimido con Gzip y verificado con hash SHA-256 en Cloudflare R2.

#### Trazabilidad
- **Módulos / Requisitos:** M04, M09, RNF-04, Proceso Automatizado 3.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Programar la exportación serializada de la BBDD local, compresión Gzip en cliente y cálculo de hash SHA-256.**
- [ ] **Subtarea 2. Desarrollar el endpoint en Cloudflare Worker conectado al bucket R2 para subida y restauración verificada del paquete .json.gz.**
- [ ] **Subtarea 3. Configurar el disparador automático al inicio de la aplicación cuando el último resguardo supere las 24 horas.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Resguardo automático en Cloudflare R2 con verificación SHA-256
  Dado que han transcurrido más de 24 horas desde el último backup y el cliente dispone de conexión
  Cuando se inicia la aplicación Tick Tock Trucks
  Entonces se empaqueta automáticamente la base de datos y log_auditoria en formato .json.gz, se valida su suma SHA-256 y se almacena en Cloudflare R2.
```

---

### [3T-27] [VALIDACIÓN S5] Validación de Reportes Corporativos CSV, Visor de Auditoría y Backup en R2 (CP-09)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `27` |
| **Issue Key** | `3T-27` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **4 SP** |
| **Plazo de Ejecución** | `2027-01-14 al 2027-01-27` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-5;Validacion;CP-09;Reportes;Cloudflare-R2` |

#### Enunciado de la Historia de Usuario
> Como ingeniero de V&V, quiero validar la correcta propagación de los datos fiscales de la organización hacia los reportes exportados a CSV, la seguridad del visor de auditoría para Administrador y la integridad de compresión y firma SHA-256 en Cloudflare R2.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.4, 11.6 (CP-09) y Sprint 5.

#### Subtareas de validación:
- [ ] **Subtarea 1. Ejecutar CP-09: Actualización de razón social/CIF en organizacion y exportación de reporte de rutas y consumos a CSV.**
- [ ] **Subtarea 2. Simular resguardo y restauración desde Cloudflare R2 comprobando la coincidencia exacta del hash SHA-256.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación del caso de prueba CP-09 e integridad de backup R2
  Dado un cambio en la razón social y CIF dentro de la entidad organizacion
  Cuando se genera y exporta un reporte operativo y se ejecuta el resguardo hacia Cloudflare R2
  Entonces el CSV descargado y la vista en pantalla reflejan la nueva cabecera corporativa y el paquete .json.gz restaurado coincide en su hash SHA-256.
```

---

## 4. Épicas Relacionadas en este Sprint

### [3T-EP5] Explotación de Datos, Reportes CSV y Backup Cloud R2
- **Nombre de la Épica:** Reportes CSV, KPIs y Resguardo Cloudflare R2
- **Prioridad:** `High`
- **Plazo de la Épica:** `2027-01-14 al 2027-01-27`
- **Componentes:** `M04-Persistencia-SQLite;M11-Reportes`
- **Etiquetas:** `Epica;Reportes;CSV;Cloudflare-R2;Backup;MVP`
- **Descripción y Alcance:**
  > Épica enfocada en la generación de informes operativos de rutas y consumos exportables a CSV con cabecera corporativa, panel estadístico con KPIs de explotación y proceso autónomo de sincronización y resguardo comprimido (Gzip + SHA-256) hacia Cloudflare R2.
  > Módulos cubiertos: M04, M11.
  > Requisitos No Funcionales: RNF-04.
  > Procesos automatizados: Proceso 3 (Sincronización local-first y resguardo en R2).
  > Peso estimado sobre el producto: 6%.

### [3T-EP1] Arquitectura Local-First, Seguridad RBAC y Corporativo
- **Nombre de la Épica:** Arquitectura Local-First, RBAC y Auditoría
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-01-27`
- **Componentes:** `M04-Persistencia-SQLite;M09-Usuarios-RBAC-Auditoria;M10-Organizacion`
- **Etiquetas:** `Epica;Local-First;RBAC;Auditoria;MVP`
- **Descripción y Alcance:**
  > Épica que agrupa la arquitectura relacional Local-First en wa-sqlite sobre OPFS (3FN para las 15 entidades CRUD), el módulo de gestión de usuarios, autenticación criptográfica y control de acceso basado en roles (RBAC: Administrador y Conductor), el interceptor transaccional inmutable de auditoría explícita (log_auditoria) y la configuración fiscal de la organización.
  > Módulos cubiertos: M04, M09, M10.
  > Requisitos No Funcionales: RNF-01, RNF-05, RNF-06, RNF-07.
  > Peso estimado sobre el producto: 25%.

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
