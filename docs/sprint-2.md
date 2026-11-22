# Sprint 2: Cartografia, VPS OSRM y Gestion de Flota

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 2 (Cartografía, VPS OSRM y Flota)` |
| **Fechas de ejecución** | `2026-11-26 al 2026-12-09` |
| **Puntos de Historia (Story Points)** | **21 SP** |
| **Total de Historias de Usuario** | 6 historias |
| **Épicas involucradas** | Motor Cartográfico, Cálculo Vial Híbrido y Flota (3T-EP2), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Despliegue del motor vial OSRM en RAM en VPS privado protegido mediante Cloudflare Zero Trust y Nginx con secreto, visor cartografico interactivo Leaflet con teselas PMTiles, planificador de rutas por CP/poblacion e hitos horarios (CRUD 01 y 02), gestion de cabezas tractoras y semirremolques (CRUD 06 y 07), y control documental con semaforo de vencimientos (CRUD 08), validado con CP-02 y CP-05.

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-10** | Infraestructura VPS OSRM en RAM con Túnel Cloudflare Zero Trust | `Highest` | **5** | `2026-11-26 a 2026-12-09` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M01-Rutas` |
| **3T-11** | Interfaz Cartográfica Interactiva con Leaflet y PMTiles (M05) | `High` | **3** | `2026-11-26 a 2026-12-09` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M05-UI-Mapa` |
| **3T-12** | Planificador de Rutas por CP/Población e Hitos de Paso (CRUD 01 y CRUD 02) | `Highest` | **5** | `2026-11-26 a 2026-12-09` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M01-Rutas;M04-Persistencia-SQLite;M05-UI-Mapa` |
| **3T-13** | Gestión de Flota: Cabezas Tractoras y Semirremolques (CRUD 06 y CRUD 07) | `High` | **3** | `2026-11-26 a 2026-12-09` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M06-Flota` |
| **3T-14** | Gestión Documental de Flota y Semáforo de Vencimientos (CRUD 08) | `High` | **2** | `2026-11-26 a 2026-12-09` | 3T-EP2 - Cartografía, VPS OSRM y Gestión de Flota | `M07-Documentacion` |
| **3T-15** | [VALIDACIÓN S2] Verificación de latencia sub-segundo OSRM, renderizado Leaflet y Flota/Documentos (CP-02 y CP-05) | `Highest` | **3** | `2026-11-26 a 2026-12-09` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-10] Infraestructura VPS OSRM en RAM con Túnel Cloudflare Zero Trust

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `10` |
| **Issue Key** | `3T-10` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `M01-Rutas` |
| **Etiquetas (Labels)** | `Sprint-2;M01;OSRM;VPS;Cloudflare-Tunnel;RNF-02;RNF-03` |

#### Enunciado de la Historia de Usuario
> Como arquitecto de sistemas, quiero desplegar el motor OSRM (Multi-Level Dijkstra) con el grafo de España en memoria RAM sobre el servidor VPS Linux con Dokploy, conectado mediante Cloudflare Tunnel y protegido con cabecera X-Origin-Secret en Nginx, para calcular rutas reales en menos de 1 segundo sin puertos públicos abiertos.

#### Trazabilidad
- **Módulos / Requisitos:** M01, RNF-02, RNF-03.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Compilar el extracto OpenStreetMap de España con OSRM MLD y alojarlo en RAM en el contenedor Dokploy del VPS.**
- [ ] **Subtarea 2. Configurar el túnel saliente Cloudflare Zero Trust y la validación de la cabecera X-Origin-Secret en Nginx Gateway.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Cálculo vial seguro y sub-segundo en VPS OSRM
  Dado el servicio OSRM activo en el VPS detrás del túnel Cloudflare Zero Trust
  Cuando se envía una solicitud de ruta peninsular (> 500 km) con la cabecera X-Origin-Secret válida
  Entonces el servidor devuelve la polilínea exacta, distancia y duración en menos de 1.000 ms y rechaza con 403 cualquier petición sin la cabecera secreta.
```

---

### [3T-11] Interfaz Cartográfica Interactiva con Leaflet y PMTiles (M05)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `11` |
| **Issue Key** | `3T-11` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `High` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `M05-UI-Mapa` |
| **Etiquetas (Labels)** | `Sprint-2;M05;Leaflet;PMTiles;Mapa` |

#### Enunciado de la Historia de Usuario
> Como usuario, quiero visualizar un mapa interactivo en Leaflet alimentado por teselas vectoriales PMTiles desde Cloudflare R2/Workers que dibuje las polilíneas OSRM y los marcadores dinámicos de hitos, estaciones y alertas climáticas.

#### Trazabilidad
- **Módulos / Requisitos:** M05.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Integrar Leaflet con el proveedor de teselas PMTiles servidas desde Cloudflare R2.**
- [ ] **Subtarea 2. Implementar el renderizado vectorial reactivo de la polilínea OSRM y las capas de marcadores interactivos.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Renderizado ágil del mapa vectorial y polilínea de ruta
  Dado el componente cartográfico Leaflet en la vista principal
  Cuando se carga el mapa y se recibe la geometría vectorial desde el VPS OSRM
  Entonces se renderizan las teselas PMTiles y la polilínea completa logrando interactividad en menos de 2 segundos bajo red 4G.
```

---

### [3T-12] Planificador de Rutas por CP/Población e Hitos de Paso (CRUD 01 y CRUD 02)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `12` |
| **Issue Key** | `3T-12` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `Highest` |
| **Story Points** | **5 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `M01-Rutas;M04-Persistencia-SQLite;M05-UI-Mapa` |
| **Etiquetas (Labels)** | `Sprint-2;M01;M04;CRUD-01;CRUD-02;Rutas;Hitos` |

#### Enunciado de la Historia de Usuario
> Como usuario operativo, quiero seleccionar origen, destino y paradas por código postal o población en España, confirmar el cálculo definitivo en el VPS OSRM y gestionar el CRUD completo de rutas e hitos horarios con su ETA en SQLite.

#### Trazabilidad
- **Módulos / Requisitos:** M01, M04, M05, CRUD 01 (ruta), CRUD 02 (hito_ruta).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar el buscador local de CP y poblaciones de España y el flujo en dos pasos (TortuosityEngine -> Confirmación VPS OSRM).**
- [ ] **Subtarea 2. CRUD 01 (ruta): CREATE (alta con origen, destino, distancia, duración y geometría), READ (consulta y listado filtrado por fecha, vehículo y conductor), UPDATE (cambio de estado, vehículo y observaciones), DELETE (baja lógica o borrado en cascada con hitos).**
- [ ] **Subtarea 3. CRUD 02 (hito_ruta): CREATE (inserción con coordenadas, orden y ETA), READ (lectura ordenada para dibujo en mapa), UPDATE (reordenación de paradas y ajuste de estancia), DELETE (eliminación de hito con recálculo automático del tramo).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Ciclo completo de planificación y persistencia de ruta e hitos
  Dado un origen y un destino seleccionados por código postal o población
  Cuando el usuario confirma el cálculo real en el VPS OSRM y guarda la ruta
  Entonces se persisten transaccionalmente la entidad ruta y sus registros hito_ruta con su ETA en wa-sqlite, permitiendo su edición, reordenación y borrado en cascada.
```

---

### [3T-13] Gestión de Flota: Cabezas Tractoras y Semirremolques (CRUD 06 y CRUD 07)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `13` |
| **Issue Key** | `3T-13` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `High` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `M06-Flota` |
| **Etiquetas (Labels)** | `Sprint-2;M06;CRUD-06;CRUD-07;Flota;Vehiculos;Remolques` |

#### Enunciado de la Historia de Usuario
> Como Administrador de Flota, quiero administrar las fichas técnicas de cabezas tractoras y semirremolques para asignarlos a las rutas preservando la integridad del historial vial.

#### Trazabilidad
- **Módulos / Requisitos:** M06, CRUD 06 (vehiculo), CRUD 07 (remolque).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 06 (vehiculo): CREATE (alta con matrícula, marca, modelo, MMA y consumo medio), READ (consulta individual y catálogo de flota), UPDATE (edición de km, estado activo/taller y conductor), DELETE (baja lógica preservando historial).**
- [ ] **Subtarea 2. CRUD 07 (remolque): CREATE (registro con matrícula, tipo de caja, ejes y carga), READ (inventario y vinculación con tractora), UPDATE (cambio de tractora asignada, carga o estado), DELETE (desactivación lógica).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Administración de cabezas tractoras y semirremolques vinculados
  Dado el módulo de gestión de flota abierto por un Administrador
  Cuando registra una cabeza tractora en vehiculo, le vincula un semirremolque en remolque y posteriormente aplica una baja lógica
  Entonces el estado del vehículo cambia a inactivo sin eliminar los registros históricos de rutas asociadas.
```

---

### [3T-14] Gestión Documental de Flota y Semáforo de Vencimientos (CRUD 08)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `14` |
| **Issue Key** | `3T-14` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP2 - Motor Cartográfico, Cálculo Vial Híbrido y Flota |
| **Prioridad** | `High` |
| **Story Points** | **2 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `M07-Documentacion` |
| **Etiquetas (Labels)** | `Sprint-2;M07;CRUD-08;Documentacion;ITV;CAP-ADR` |

#### Enunciado de la Historia de Usuario
> Como Administrador o Conductor, quiero gestionar y monitorizar los vencimientos legales de la flota (ITV, seguros, tarjetas de transporte, CAP/ADR y calibraciones de tacógrafo) mediante un semáforo automático de urgencia (vigente, próximo < 30 días, vencido).

#### Trazabilidad
- **Módulos / Requisitos:** M07, CRUD 08 (documento).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 08 (documento): CREATE (alta de documento con fecha límite), READ (consulta clasificada por semáforo: vigente, próximo < 30 días, vencido), UPDATE (renovación de vigencia y ajuste de costes), DELETE (archivo o baja lógica de caducados/reemplazados).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Clasificación automática por semáforo de urgencia documental
  Dado un vehículo activo en la flota
  Cuando se da de alta un documento de ITV con fecha de vencimiento a 15 días vista
  Entonces el sistema lo almacena en documento y lo muestra automáticamente en estado de alerta amarillo (próximo a vencer < 30 días).
```

---

### [3T-15] [VALIDACIÓN S2] Verificación de latencia sub-segundo OSRM, renderizado Leaflet y Flota/Documentos (CP-02 y CP-05)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `15` |
| **Issue Key** | `3T-15` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-11-26 al 2026-12-09` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-2;Validacion;CP-02;CP-05;Rendimiento;OSRM` |

#### Enunciado de la Historia de Usuario
> Como ingeniero de V&V, quiero validar el rendimiento extremo a extremo del cálculo vial en el VPS OSRM, la fluidez del mapa PMTiles bajo emulación 4G y las reglas de negocio de flota y semáforo documental entregadas en el Sprint 2.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.3, CP-02 y CP-05.

#### Subtareas de validación:
- [ ] **Subtarea 1. Ejecutar CP-02: Cálculo de ruta peninsular (> 500 km, Murcia-Madrid-Bilbao) vía túnel Cloudflare hacia VPS OSRM.**
- [ ] **Subtarea 2. Medir carga de teselas PMTiles y dibujo de polilínea en Leaflet bajo emulación 4G (< 2 segundos).**
- [ ] **Subtarea 3. Ejecutar CP-05: Alta de tractora/remolque y registro de documento ITV con vencimiento a 15 días vista.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Superación de los casos de prueba CP-02 y CP-05
  Dado el entorno integrado con el VPS OSRM y la base de datos local wa-sqlite
  Cuando se ejecutan las pruebas CP-02 y CP-05
  Entonces la ruta Murcia-Madrid-Bilbao se resuelve en menos de 1.000 ms, el mapa es interactivo en menos de 2 s y la ITV a 15 días se clasifica en estado amarillo.
```

---

## 4. Épicas Relacionadas en este Sprint

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
