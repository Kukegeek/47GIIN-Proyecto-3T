# Sprint 1: Base de Datos Local-First, RBAC, Auditoria y Organizacion

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 1 (BBDD, RBAC, Auditoría y Organización)` |
| **Fechas de ejecución** | `2026-11-12 al 2026-11-25` |
| **Puntos de Historia (Story Points)** | **20 SP** |
| **Total de Historias de Usuario** | 6 historias |
| **Épicas involucradas** | Arquitectura Local-First, Seguridad RBAC y Corporativo (3T-EP1), Motor Cartográfico, Cálculo Vial Híbrido y Flota (3T-EP2), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Implementacion del motor de persistencia Local-First wa-sqlite sobre OPFS, modulo de usuarios con autenticacion SHA-256 + salt y roles RBAC (Admin/Conductor), interceptor transaccional inmutable de auditoria (log_auditoria), configuracion corporativa de la empresa y motor de estimacion instantanea TortuosityEngine, certificado con pruebas automatizadas (CP-07 y CP-08).

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-04** | Motor de persistencia Local-First en WebAssembly (wa-sqlite sobre OPFS) | `Highest` | **5** | `2026-11-12 a 2026-11-25` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M04-Persistencia-SQLite` |
| **3T-05** | Gestión de Usuarios, Autenticación Criptográfica y Roles RBAC (CRUD 11 y CRUD 12) | `Highest` | **5** | `2026-11-12 a 2026-11-25` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M09-Usuarios-RBAC-Auditoria` |
| **3T-06** | Interceptor Transaccional de Auditoría Explícita Inmutable (CRUD 13 - Capa Core) | `High` | **3** | `2026-11-12 a 2026-11-25` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M09-Usuarios-RBAC-Auditoria` |
| **3T-07** | Configuración Corporativa de la Organización (CRUD 14) | `Medium` | **2** | `2026-11-12 a 2026-11-25` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M10-Organizacion` |
| **3T-08** | Algoritmo de estimación vial instantánea (TortuosityEngine) | `High` | **2** | `2026-11-12 a 2026-11-25` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M01-Rutas` |
| **3T-09** | [VALIDACIÓN S1] Suite de pruebas unitarias de Seguridad RBAC, Auditoría y TortuosityEngine (CP-07 y CP-08) | `Highest` | **3** | `2026-11-12 a 2026-11-25` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-04] Motor de persistencia Local-First en WebAssembly (wa-sqlite sobre OPFS)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `4` |
| **Issue Key** | `3T-04` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `M04-Persistencia-SQLite` |
| **Etiquetas (Labels)** | `Sprint-1;M04;wa-sqlite;OPFS;WASM;RNF-01;RNF-05` |

#### Enunciado de la Historia de Usuario
> Como usuario del sistema, quiero que la base de datos relacional se ejecute y persista directamente en el navegador mediante wa-sqlite y Origin Private File System (OPFS) para operar con latencia nula y disponibilidad offline.

#### Trazabilidad
- **Módulos / Requisitos:** M04, RNF-01, RNF-05.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Integrar el binario WebAssembly de wa-sqlite mediante Web Worker dedicado con sistema de archivos virtual sobre OPFS.**
- [ ] **Subtarea 2. Implementar el gestor de transacciones SQLite asíncrono y el bootstrapping automático del esquema de 15 tablas.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Persistencia transaccional en OPFS del navegador
  Dado que el usuario abre la aplicación en el navegador por primera vez
  Cuando se inicializa el motor wa-sqlite y se confirma una transacción local
  Entonces el archivo de base de datos queda persistido en OPFS y mantiene los registros intactos tras recargar la página o reiniciar el navegador.
```

---

### [3T-05] Gestión de Usuarios, Autenticación Criptográfica y Roles RBAC (CRUD 11 y CRUD 12)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `5` |
| **Issue Key** | `3T-05` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `M09-Usuarios-RBAC-Auditoria` |
| **Etiquetas (Labels)** | `Sprint-1;M09;CRUD-11;CRUD-12;RBAC;Seguridad;RNF-07` |

#### Enunciado de la Historia de Usuario
> Como Administrador de Flota (ROL_ADMIN), quiero gestionar el ciclo de vida de los usuarios y los permisos de los roles (ROL_ADMIN y ROL_CONDUCTOR) con contraseñas protegidas mediante SHA-256 y salt único para segregar el acceso tanto en la interfaz como en la capa SQL.

#### Trazabilidad
- **Módulos / Requisitos:** M09, CRUD 11 (usuario), CRUD 12 (rol_permiso), RNF-07.

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 11 (usuario): CREATE (alta con hash SHA-256 + salt y rol), READ (listado de operadores y último login), UPDATE (edición de perfil, rol y clave), DELETE (bloqueo/baja lógica sin alterar históricos).**
- [ ] **Subtarea 2. CRUD 12 (rol_permiso): CREATE (definición de rol y matriz de permisos), READ (consulta de privilegios por módulo/vista), UPDATE (ajuste granular lectura/escritura), DELETE (revocación o baja de perfiles secundarios).**
- [ ] **Subtarea 3. Implementar guardias de autorización en el enrutador de vistas UI y en el adaptador de persistencia SQLite.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Segregación estricta de permisos por rol (RBAC)
  Dado un usuario autenticado con ROL_CONDUCTOR
  Cuando intenta acceder a la vista de administración de usuarios o invocar una sentencia SQL de escritura sobre usuario o rol_permiso
  Entonces el sistema oculta el menú en la interfaz y lanza una excepción de autorización (403 Forbidden / Unauthorized op) en la capa de datos.
```

---

### [3T-06] Interceptor Transaccional de Auditoría Explícita Inmutable (CRUD 13 - Capa Core)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `6` |
| **Issue Key** | `3T-06` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `High` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `M09-Usuarios-RBAC-Auditoria` |
| **Etiquetas (Labels)** | `Sprint-1;M09;CRUD-13;Auditoria;RNF-06` |

#### Enunciado de la Historia de Usuario
> Como Administrador, quiero que un interceptor en la capa de datos registre de forma desasistida e inmutable (append-only) cada operación INSERT, UPDATE, DELETE y LOGIN en la tabla log_auditoria para garantizar la trazabilidad completa de las 15 entidades.

#### Trazabilidad
- **Módulos / Requisitos:** M09, CRUD 13 (log_auditoria - CREATE), RNF-06.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Programar el interceptor transaccional que capture id_log, id_usuario, username, rol_ejecutor, tipo de acción (INSERT, UPDATE, DELETE, LOGIN), entidad, id_registro, valor_anterior (JSON), valor_nuevo (JSON), timestamp_utc (ISO-8601) y origen_sesion.**
- [ ] **Subtarea 2. Bloquear en la capa de datos cualquier intento de modificación o borrado directo por operadores sobre log_auditoria.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Trazabilidad automática en log_auditoria
  Dado un usuario con sesión activa en el sistema
  Cuando ejecuta una operación INSERT, UPDATE o DELETE sobre cualquiera de las 15 entidades del modelo
  Entonces se inserta síncronamente una fila en log_auditoria con el diff serializado en JSON y la marca temporal UTC exacta.
```

---

### [3T-07] Configuración Corporativa de la Organización (CRUD 14)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `7` |
| **Issue Key** | `3T-07` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `Medium` |
| **Story Points** | **2 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `M10-Organizacion` |
| **Etiquetas (Labels)** | `Sprint-1;M10;CRUD-14;Organizacion` |

#### Enunciado de la Historia de Usuario
> Como Administrador, quiero gestionar los datos fiscales y corporativos de la empresa de transporte (razón social, CIF/NIF, domicilio fiscal, provincia, CP, contacto y logotipo) para que alimenten el perfil de flota y las cabeceras de los informes operativos.

#### Trazabilidad
- **Módulos / Requisitos:** M10, CRUD 14 (organizacion).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 14 (organizacion): CREATE (alta inicial de empresa), READ (lectura para perfil y cabeceras), UPDATE (actualización fiscal o imagen corporativa), DELETE (limpieza o restablecimiento de parámetros opcionales).**
- [ ] **Subtarea 2. Restringir la edición exclusivamente al rol ROL_ADMIN.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Gestión de datos fiscales de la organización
  Dado el formulario de configuración corporativa abierto por un usuario con ROL_ADMIN
  Cuando se registran o actualizan la razón social, el CIF y el logotipo corporativo
  Entonces los datos persisten en la tabla organizacion y se genera automáticamente el registro de auditoría en log_auditoria.
```

---

### [3T-08] Algoritmo de estimación vial instantánea (TortuosityEngine)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `8` |
| **Issue Key** | `3T-08` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `High` |
| **Story Points** | **2 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `M01-Rutas` |
| **Etiquetas (Labels)** | `Sprint-1;M01;TortuosityEngine;Algoritmo` |

#### Enunciado de la Historia de Usuario
> Como usuario planificador, quiero obtener una previsualización instantánea en menos de 1 ms de la distancia y tiempo estimado entre coordenadas aplicando un factor de tortuosidad geométrica (TortuosityEngine) antes de solicitar el cálculo definitivo al servidor VPS.

#### Trazabilidad
- **Módulos / Requisitos:** M01 (Fase 1 del cálculo híbrido).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar el cálculo ortodrómico ponderado por factor de tortuosidad peninsular.**
- [ ] **Subtarea 2. Contemplar casos límite: distancias nulas, coordenadas idénticas y puntos insulares o sin conexión terrestre directa.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Estimación preliminar sub-milisegundo con TortuosityEngine
  Dado un par de coordenadas geográficas de origen y destino en España
  Cuando se invoca la función de previsualización de TortuosityEngine
  Entonces devuelve la distancia y duración estimadas en un tiempo inferior a 1 ms y gestiona sin errores coordenadas idénticas o insulares.
```

---

### [3T-09] [VALIDACIÓN S1] Suite de pruebas unitarias de Seguridad RBAC, Auditoría y TortuosityEngine (CP-07 y CP-08)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `9` |
| **Issue Key** | `3T-09` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-12 al 2026-11-25` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-1;Validacion;Vitest;CP-07;CP-08;RBAC;Auditoria` |

#### Enunciado de la Historia de Usuario
> Como ingeniero de V&V, quiero ejecutar pruebas automatizadas en Vitest sobre autenticación, segregación RBAC, inmutabilidad de log_auditoria y casos límite de TortuosityEngine para certificar la seguridad y base funcional del Sprint 1.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.1, 11.2, CP-07 y CP-08.

#### Subtareas de validación:
- [ ] **Subtarea 1. Automatizar CP-07: Inicio de sesión con rol Conductor e intento de acceso al CRUD de usuarios, empresa o auditoría.**
- [ ] **Subtarea 2. Automatizar CP-08: Verificación de generación síncrona de registros inmutables en log_auditoria con diff JSON y hora UTC.**
- [ ] **Subtarea 3. Ejecutar tests unitarios de TortuosityEngine para coordenadas válidas y casos límite.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación de los casos de prueba CP-07 y CP-08 en Vitest
  Dado el runner de pruebas Vitest ejecutándose sobre la capa de datos wa-sqlite
  Cuando se corren las suites de seguridad RBAC (CP-07), trazabilidad de auditoría (CP-08) y TortuosityEngine
  Entonces el 100% de los tests finalizan en verde confirmando el bloqueo de permisos al rol Conductor y la inmutabilidad de log_auditoria.
```

---

## 4. Épicas Relacionadas en este Sprint

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

### [3T-EP2] Motor Cartográfico, Cálculo Vial Híbrido y Flota
- **Nombre de la Épica:** Cartografía, VPS OSRM y Gestión de Flota
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-12 al 2026-12-09`
- **Componentes:** `M01-Rutas;M05-UI-Mapa;M06-Flota;M07-Documentacion`
- **Etiquetas:** `Epica;OSRM;Leaflet;PMTiles;Flota;MVP`
- **Descripción y Alcance:**
  > Épica centrada en la planificación de rutas en dos pasos (estimación instantánea con TortuosityEngine y cálculo exacto en VPS privado con OSRM a través de túnel Cloudflare Zero Trust), renderizado cartográfico interactivo con Leaflet y teselas PMTiles, y gestión integral de flota (cabezas tractoras, semirremolques y control documental con semáforo de vencimientos).
  > Módulos cubiertos: M01, M05, M06, M07.
  > Requisitos No Funcionales: RNF-02, RNF-03.
  > Peso estimado sobre el producto: 42%.

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
