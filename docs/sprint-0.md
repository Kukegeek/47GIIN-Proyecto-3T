# Sprint 0: Inicio y Backlog

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 0 (Inicio y Backlog)` |
| **Fechas de ejecución** | `2026-11-04 al 2026-11-11` |
| **Puntos de Historia (Story Points)** | **8 SP** |
| **Total de Historias de Usuario** | 3 historias |
| **Épicas involucradas** | Arquitectura Local-First, Seguridad RBAC y Corporativo (3T-EP1), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Definicion de la arquitectura relacional 3FN para las 15 entidades del sistema en SQLite, estructuracion modular del repositorio Vanilla JS (ES2024), configuracion del pipeline CI/CD en GitHub Actions con Vitest y formalizacion del Product Backlog en Jira con escenarios BDD.

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-01** | Diseño del esquema relacional 3FN e infraestructura base del repositorio | `Highest` | **3** | `2026-11-04 a 2026-11-11` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `M04-Persistencia-SQLite` |
| **3T-02** | Estructuración del Product Backlog en Jira con escenarios BDD | `High` | **3** | `2026-11-04 a 2026-11-11` | 3T-EP1 - Arquitectura Local-First, RBAC y Auditoría | `QA-Validacion` |
| **3T-03** | [VALIDACIÓN S0] Verificación del modelo de datos 3FN, pipeline CI/CD y DoR del Backlog | `Highest` | **2** | `2026-11-04 a 2026-11-11` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-01] Diseño del esquema relacional 3FN e infraestructura base del repositorio

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `1` |
| **Issue Key** | `3T-01` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-04 al 2026-11-11` |
| **Componentes** | `M04-Persistencia-SQLite` |
| **Etiquetas (Labels)** | `Sprint-0;3FN;SQLite;ES2024;RNF-01;RNF-05` |

#### Enunciado de la Historia de Usuario
> Como arquitecto de software, quiero definir el esquema DDL SQLite en Tercera Forma Normal (3FN) para las 15 entidades del sistema y estructurar el proyecto en Vanilla JS (ES2024 Modules) para asegurar persistencia local sin dependencias pesadas.

#### Trazabilidad
- **Módulos / Requisitos:** M04, RNF-01, RNF-05.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Modelar el script DDL (schema.sql) con claves foráneas y borrados lógicos/en cascada para las 15 tablas: ruta, hito_ruta, clima_hito, estacion_serv, repostaje, vehiculo, remolque, documento, mantenimiento, reg_tacografo, usuario, rol_permiso, log_auditoria, organizacion y reporte.**
- [ ] **Subtarea 2. Inicializar el repositorio en GitHub (47GIIN-Proyecto-3T) con estructura modular ES2024 y workflow base de GitHub Actions con Vitest.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Creación íntegra del esquema relacional en 3FN
  Dado el script de inicialización SQL del proyecto
  Cuando se ejecuta sobre una instancia limpia de SQLite con PRAGMA foreign_keys = ON
  Entonces se crean las 15 tablas en 3FN sin errores de sintaxis y con sus restricciones de integridad referencial activas.
```

---

### [3T-02] Estructuración del Product Backlog en Jira con escenarios BDD

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `2` |
| **Issue Key** | `3T-02` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP1 - Arquitectura Local-First, Seguridad RBAC y Corporativo |
| **Prioridad** | `High` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-04 al 2026-11-11` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-0;Scrum;Backlog;BDD;Gherkin` |

#### Enunciado de la Historia de Usuario
> Como desarrollador único bajo marco Scrum, quiero dar de alta las épicas, sprints e historias de usuario con criterios Gherkin en Jira Software para mantener la trazabilidad completa desde noviembre de 2026 hasta febrero de 2027.

#### Trazabilidad
- **Módulos / Requisitos:** Metodología Scrum (Sección 10 y 12).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Configurar los sprints del proyecto en Jira respetando el cronograma oficial.**
- [ ] **Subtarea 2. Vincular las 15 operaciones CRUD, los 11 módulos y los 10 casos de prueba a las historias de usuario.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Trazabilidad completa del Product Backlog
  Dado el alcance de los 11 módulos y las 15 operaciones CRUD
  Cuando se revisa el tablero de Jira Software
  Entonces todas las historias están asignadas a sus sprints correspondientes con estimación en Story Points y criterios Gherkin definidos.
```

---

### [3T-03] [VALIDACIÓN S0] Verificación del modelo de datos 3FN, pipeline CI/CD y DoR del Backlog

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `3` |
| **Issue Key** | `3T-03` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **2 SP** |
| **Plazo de Ejecución** | `2026-11-04 al 2026-11-11` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-0;Validacion;CI-CD;GitHub-Actions;Vitest` |

#### Enunciado de la Historia de Usuario
> Como responsable de calidad (V&V), quiero validar que el modelo relacional soporte las 15 entidades CRUD sin anomalías de normalización y que el pipeline de integración continua en GitHub Actions se dispare automáticamente en cada push o pull request hacia la rama main.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.5 (CI/CD GitHub Actions) y Sprint 0.

#### Subtareas de validación:
- [ ] **Subtarea 1. Verificar el cumplimiento de la 3FN y claves foráneas en las 15 tablas del DDL.**
- [ ] **Subtarea 2. Comprobar la ejecución desasistida del workflow de GitHub Actions con Vitest en el repositorio remoto.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Ejecución exitosa del pipeline CI/CD inicial
  Dado un commit o pull request hacia la rama main del repositorio GitHub
  Cuando se ejecuta el workflow automatizado de GitHub Actions
  Entonces el linter y el test humo de creación del esquema SQLite de 15 tablas finalizan en estado PASS (verde).
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

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
