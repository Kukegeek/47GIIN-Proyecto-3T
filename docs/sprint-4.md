# Sprint 4: Optimizacion de Combustible MITECO y Suite de Pruebas

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 4 (Repostaje MITECO y Suite de Pruebas)` |
| **Fechas de ejecución** | `2026-12-24 al 2027-01-13` |
| **Puntos de Historia (Story Points)** | **20 SP** |
| **Total de Historias de Usuario** | 4 historias |
| **Épicas involucradas** | Optimización de Combustible MITECO y Consumos (3T-EP4), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Descarga y analisis del catalogo de estaciones MITECO (> 10.000 estaciones), Proceso Automatizado 2 de recomendacion de estacion de menor coste neto en corredor de 20 km (CRUD 04), gestion de tickets de repostaje y consumos (CRUD 05), y desarrollo de la suite de pruebas transaccionales de las 15 entidades en wa-sqlite con certificacion conjunta de CP-01 a CP-08 en GitHub Actions (> 25% cobertura).

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-20** | Catálogo MITECO y Proceso Automatizado 2 de Gasolinera Óptima en Ruta (CRUD 04) | `Highest` | **6** | `2026-12-24 a 2027-01-13` | 3T-EP4 - Combustible MITECO y Repostajes | `M03-Combustible;M04-Persistencia-SQLite` |
| **3T-21** | Gestión de Tickets de Repostaje y Consumos de Combustible (CRUD 05) | `High` | **4** | `2026-12-24 a 2027-01-13` | 3T-EP4 - Combustible MITECO y Repostajes | `M03-Combustible;M11-Reportes` |
| **3T-22** | Batería de Pruebas Transaccionales de las 15 Operaciones CRUD en wa-sqlite (Vitest) | `Highest` | **5** | `2026-12-24 a 2027-01-13` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion;M04-Persistencia-SQLite` |
| **3T-23** | [VALIDACIÓN S4] Certificación de la Suite Vitest de extremo a extremo (CP-01 a CP-08) | `Highest` | **5** | `2026-12-24 a 2027-01-13` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-20] Catálogo MITECO y Proceso Automatizado 2 de Gasolinera Óptima en Ruta (CRUD 04)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `20` |
| **Issue Key** | `3T-20` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP4 - Optimización de Combustible MITECO y Consumos |
| **Prioridad** | `Highest` |
| **Story Points** | **6 SP** |
| **Plazo de Ejecución** | `2026-12-24 al 2027-01-13` |
| **Componentes** | `M03-Combustible;M04-Persistencia-SQLite` |
| **Etiquetas (Labels)** | `Sprint-4;M03;CRUD-04;Proceso-2;MITECO;Gasolineras` |

#### Enunciado de la Historia de Usuario
> Como usuario de ruta, quiero que un proceso desasistido escanee las estaciones del catálogo oficial del MITECO (> 10.000 estaciones) ubicadas en un corredor de 20 km alrededor del trazado OSRM, pondere el precio oficial frente al coste kilométrico del desvío e inserte autónomamente en la BBDD la estación más económica.

#### Trazabilidad
- **Módulos / Requisitos:** M03, M04, CRUD 04 (estacion_serv), Proceso Automatizado 2.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar la ingesta y validación de vigencia (< 24h) del catálogo oficial del MITECO.**
- [ ] **Subtarea 2. Programar el Proceso Automatizado 2 de filtrado espacial (corredor de 20 km) y función de coste neto combinado (precio/litro + desvío en km).**
- [ ] **Subtarea 3. CRUD 04 (estacion_serv): CREATE (alta en catálogo local con coordenadas y tarifa MITECO), READ (listado en ruta ordenado por coste neto y desvío), UPDATE (actualización de precios diésel/AdBlue y estado), DELETE (baja lógica o exclusión del motor).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Selección matemática de la estación de servicio de menor coste neto
  Dado un trazado vial confirmado y el catálogo de precios del MITECO con antigüedad inferior a 24 horas
  Cuando se ejecuta el proceso automatizado de escaneo en el corredor de 20 km
  Entonces el sistema identifica e inserta en estacion_serv la parada de menor coste neto considerando el desvío kilométrico.
```

---

### [3T-21] Gestión de Tickets de Repostaje y Consumos de Combustible (CRUD 05)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `21` |
| **Issue Key** | `3T-21` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP4 - Optimización de Combustible MITECO y Consumos |
| **Prioridad** | `High` |
| **Story Points** | **4 SP** |
| **Plazo de Ejecución** | `2026-12-24 al 2027-01-13` |
| **Componentes** | `M03-Combustible;M11-Reportes` |
| **Etiquetas (Labels)** | `Sprint-4;M03;CRUD-05;Repostajes;Consumos` |

#### Enunciado de la Historia de Usuario
> Como Conductor o Administrador, quiero gestionar los tickets de repostaje registrando litros, precio por litro, coste total y lectura de odómetro para auditar el consumo real por vehículo, conductor y ruta.

#### Trazabilidad
- **Módulos / Requisitos:** M03, M11, CRUD 05 (repostaje).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 05 (repostaje): CREATE (alta de ticket con litros, precio/litro, coste y odómetro), READ (consulta histórica por vehículo, conductor, ruta y fecha), UPDATE (corrección de litros, importe o km), DELETE (anulación o baja lógica de apuntes erróneos/duplicados).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Registro y cálculo exacto de ticket de repostaje
  Dado un conductor con una ruta activa y una estación de servicio seleccionada
  Cuando da de alta un ticket en la entidad repostaje introduciendo los litros repostados, el precio por litro y el odómetro
  Entonces el sistema calcula exactamente el importe total abonado y persiste el registro vinculado al vehículo y la ruta.
```

---

### [3T-22] Batería de Pruebas Transaccionales de las 15 Operaciones CRUD en wa-sqlite (Vitest)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `22` |
| **Issue Key** | `3T-22` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-12-24 al 2027-01-13` |
| **Componentes** | `QA-Validacion;M04-Persistencia-SQLite` |
| **Etiquetas (Labels)** | `Sprint-4;Vitest;15-CRUD;Benchmark;Cobertura` |

#### Enunciado de la Historia de Usuario
> Como desarrollador, quiero programar la batería de pruebas automatizadas en Vitest que ejecute secuencialmente CREATE, READ, UPDATE y DELETE sobre las 15 entidades del esquema en wa-sqlite y evalúe el benchmark de 1.000 registros para superar el 25% de cobertura de código.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.1, 11.3 y 11.5.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar los tests transaccionales de las 15 entidades CRUD verificando integridad referencial y borrados lógicos/en cascada.**
- [ ] **Subtarea 2. Programar el benchmark de inserción y consulta filtrada de 1.000 registros en menos de 100 ms.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Ejecución de ciclo CRUD de las 15 entidades y benchmark en OPFS
  Dado el entorno de pruebas automatizadas Vitest
  Cuando se ejecuta la suite transaccional sobre las 15 tablas y el test de carga de 1.000 registros
  Entonces el 100% de las operaciones se confirman en menos de 100 ms con integridad referencial intacta y cobertura automatizada superior al 25%.
```

---

### [3T-23] [VALIDACIÓN S4] Certificación de la Suite Vitest de extremo a extremo (CP-01 a CP-08)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `23` |
| **Issue Key** | `3T-23` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-12-24 al 2027-01-13` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-4;Validacion;Vitest;CP-01;CP-04;CI-CD` |

#### Enunciado de la Historia de Usuario
> Como responsable de V&V, quiero ejecutar y certificar conjuntamente los casos de prueba formales CP-01 a CP-08 en el pipeline de GitHub Actions para dejar validada toda la lógica de negocio, algoritmos y persistencia al cierre del Sprint 4.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.6 (CP-01 a CP-08) y Sprint 4.

#### Subtareas de validación:
- [ ] **Subtarea 1. Ejecutar y verificar CP-01 (15 CRUD < 100 ms) y CP-04 (Búsqueda MITECO en corredor 20 km y alta de repostaje).**
- [ ] **Subtarea 2. Ejecutar en regresión conjunta CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07 y CP-08 en GitHub Actions.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Superación íntegra de los casos CP-01 a CP-08 en CI/CD
  Dado el pipeline de integración continua en GitHub Actions
  Cuando se dispara la batería completa de pruebas correspondientes a CP-01 hasta CP-08
  Entonces los 8 casos formales de prueba pasan al 100% sin fallos ni regresiones y se supera el umbral del 25% de cobertura.
```

---

## 4. Épicas Relacionadas en este Sprint

### [3T-EP4] Optimización de Combustible MITECO y Consumos
- **Nombre de la Épica:** Combustible MITECO y Repostajes
- **Prioridad:** `High`
- **Plazo de la Épica:** `2026-12-24 al 2027-01-13`
- **Componentes:** `M03-Combustible`
- **Etiquetas:** `Epica;MITECO;Repostajes;MVP`
- **Descripción y Alcance:**
  > Épica destinada a la descarga y análisis del catálogo oficial de precios de carburantes del MITECO (> 10.000 estaciones), recomendación autónoma de la gasolinera de menor coste neto ponderando el desvío kilométrico en un corredor de 20 km (Proceso Automatizado 2) y gestión de tickets de repostaje y consumos.
  > Módulos cubiertos: M03.
  > Procesos automatizados: Proceso 2 (Estación de repostaje óptima).
  > Peso estimado sobre el producto: 11%.

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
