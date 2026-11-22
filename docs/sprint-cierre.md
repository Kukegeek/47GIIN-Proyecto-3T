# Cierre y Release: Verificacion Final, Despliegue y Defensa

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Cierre y Release (Verificación Final)` |
| **Fechas de ejecución** | `2027-01-28 al 2027-02-03` |
| **Puntos de Historia (Story Points)** | **9 SP** |
| **Total de Historias de Usuario** | 3 historias |
| **Épicas involucradas** | Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Despliegue en produccion en https://ticktocktrucks.com con tag v1.0.0, redaccion integral de la memoria tecnica y preparacion del video de defensa (VIU), y certificacion final de resiliencia 100% offline con corte de red y sincronizacion posterior a R2 (CP-10) completando la matriz formal CP-01 a CP-10.

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-28** | Despliegue en Producción (ticktocktrucks.com) y Auditoría Final de Código | `Highest` | **3** | `2027-01-28 a 2027-02-03` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |
| **3T-29** | Redacción de Memoria Técnica Final y Grabación de la Defensa (VIU) | `Highest` | **3** | `2027-01-28 a 2027-02-03` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |
| **3T-30** | [VALIDACIÓN CIERRE] Certificación Integral de Resiliencia 100% Offline, Rendimiento y Regresión (CP-01 a CP-10) | `Highest` | **3** | `2027-01-28 a 2027-02-03` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-28] Despliegue en Producción (ticktocktrucks.com) y Auditoría Final de Código

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `28` |
| **Issue Key** | `3T-28` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2027-01-28 al 2027-02-03` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Cierre;Release;Produccion;Deployment` |

#### Enunciado de la Historia de Usuario
> Como desarrollador único, quiero desplegar la versión final del MVP en el dominio https://ticktocktrucks.com conectada a Cloudflare R2/Workers y al túnel del VPS OSRM, etiquetando la release v1.0.0 en el repositorio oficial de GitHub.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 1, 10 y 12 (Cierre y Release).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Publicar el frontend Vanilla JS y activos PMTiles en producción bajo https://ticktocktrucks.com.**
- [ ] **Subtarea 2. Crear el tag v1.0.0 en https://github.com/Kukegeek/47GIIN-Proyecto-3T con todos los checks de GitHub Actions en verde.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Puesta en producción accesible y funcional
  Dado el build final de producción desplegado en https://ticktocktrucks.com
  Cuando un usuario accede desde el navegador web
  Entonces la aplicación inicializa wa-sqlite sobre OPFS sin errores y se comunica correctamente con Cloudflare y el VPS OSRM.
```

---

### [3T-29] Redacción de Memoria Técnica Final y Grabación de la Defensa (VIU)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `29` |
| **Issue Key** | `3T-29` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2027-01-28 al 2027-02-03` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Cierre;Documentacion;Memoria-Tecnica;Defensa-VIU` |

#### Enunciado de la Historia de Usuario
> Como alumno de Proyecto de Ingeniería de Software (VIU), quiero consolidar la memoria técnica final con las evidencias de los 15 CRUD, capturas de Jira, reporte de cobertura de Vitest y grabar la defensa del proyecto antes del 3 de febrero de 2027.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 12 (Cierre y Release).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Compilar la memoria técnica final y manuales con las métricas reales obtenidas en los sprints.**
- [ ] **Subtarea 2. Grabar el vídeo de demostración y defensa mostrando los casos de uso, el modo offline y la auditoría RBAC.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Entrega académica completa dentro de plazo
  Dado el cierre de las actividades de desarrollo y verificación
  Cuando se revisa el paquete de entrega para la cátedra el 03/02/2027
  Entonces están completos el repositorio GitHub, la URL en producción, la memoria técnica y la grabación de la defensa.
```

---

### [3T-30] [VALIDACIÓN CIERRE] Certificación Integral de Resiliencia 100% Offline, Rendimiento y Regresión (CP-01 a CP-10)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `30` |
| **Issue Key** | `3T-30` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2027-01-28 al 2027-02-03` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Cierre;Validacion;CP-09;CP-10;Offline;Regresion-Final` |

#### Enunciado de la Historia de Usuario
> Como responsable de V&V, quiero ejecutar las pruebas finales de resiliencia 100% offline con corte de red y posterior reconexión con backup a R2 (CP-10), junto con la regresión completa de la matriz CP-01 a CP-10, para certificar la calidad definitiva del producto antes de la entrega.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.3, 11.4, 11.6 (CP-01 a CP-10) y Cierre.

#### Subtareas de validación:
- [ ] **Subtarea 1. Ejecutar CP-10: Corte de red (modo avión), autenticación local, ejecución de operaciones CRUD sobre OPFS, exportación CSV y posterior reconexión con sincronización a Cloudflare R2.**
- [ ] **Subtarea 2. Verificar la matriz completa de casos de prueba (CP-01 a CP-10) sin errores pendientes.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Operación 100% Offline y reconexión segura sin colisiones (CP-10)
  Dado el navegador en modo avión (sin conexión a Internet)
  Cuando el usuario inicia sesión localmente, ejecuta operaciones CRUD en wa-sqlite, exporta un CSV y luego restablece la conexión de red
  Entonces toda la operativa offline funciona sin errores y al recuperar red se sube automáticamente el archivo .json.gz a Cloudflare R2 validando el hash SHA-256 sin pérdida ni colisión de claves primarias.
```

---

## 4. Épicas Relacionadas en este Sprint

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
