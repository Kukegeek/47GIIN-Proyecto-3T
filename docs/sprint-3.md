# Sprint 3: Meteorologia Predictiva, Tacografo UE y Mantenimiento

## 1. Ficha del Sprint

| Parámetro | Detalle |
| :--- | :--- |
| **Nombre oficial en Jira** | `Sprint 3 (Clima, Tacógrafo y Mantenimiento)` |
| **Fechas de ejecución** | `2026-12-10 al 2026-12-23` |
| **Puntos de Historia (Story Points)** | **18 SP** |
| **Total de Historias de Usuario** | 4 historias |
| **Épicas involucradas** | Meteorología Predictiva, Tacógrafo UE y Taller (3T-EP3), Aseguramiento de Calidad (V&V), Pruebas y Entrega (3T-EP6) |

> [!NOTE]
> **Objetivo del Sprint:**
> Integracion del Proceso Automatizado 1 de pronostico meteorologico por hito horario con la API de Open-Meteo (CRUD 03), implementacion del motor normativo del tacografo CE 561/2006 con calculo de pausas y descansos (CRUD 10), y gestion de mantenimiento preventivo y ordenes de taller (CRUD 09), validado con CP-03 y CP-06.

---

## 2. Tabla Resumen de Historias de Usuario

| Clave | Resumen / Título | Prioridad | SP | Fechas | Épica Vinculada | Componentes |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| **3T-16** | Motor de Clima Predictivo con Open-Meteo y Proceso Automatizado 1 (CRUD 03) | `Highest` | **6** | `2026-12-10 a 2026-12-23` | 3T-EP3 - Clima Open-Meteo, Tacógrafo UE y Taller | `M02-Clima;M04-Persistencia-SQLite` |
| **3T-17** | Motor Normativo de Tacógrafo CE 561/2006 y Tiempos de Conducción (CRUD 10) | `Highest` | **6** | `2026-12-10 a 2026-12-23` | 3T-EP3 - Clima Open-Meteo, Tacógrafo UE y Taller | `M08-Tacografo-Taller` |
| **3T-18** | Gestión de Mantenimiento Preventivo y Órdenes de Taller (CRUD 09) | `Medium` | **3** | `2026-12-10 a 2026-12-23` | 3T-EP3 - Clima Open-Meteo, Tacógrafo UE y Taller | `M08-Tacografo-Taller` |
| **3T-19** | [VALIDACIÓN S3] Validación del Proceso Automatizado de Clima y Reglas del Tacógrafo UE (CP-03 y CP-06) | `Highest` | **3** | `2026-12-10 a 2026-12-23` | 3T-EP6 - Verificación, Validación (Vitest) y Release | `QA-Validacion` |

---

## 3. Detalle de Historias de Usuario, Subtareas y Criterios BDD

### [3T-16] Motor de Clima Predictivo con Open-Meteo y Proceso Automatizado 1 (CRUD 03)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `16` |
| **Issue Key** | `3T-16` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP3 - Meteorología Predictiva, Tacógrafo UE y Taller |
| **Prioridad** | `Highest` |
| **Story Points** | **6 SP** |
| **Plazo de Ejecución** | `2026-12-10 al 2026-12-23` |
| **Componentes** | `M02-Clima;M04-Persistencia-SQLite` |
| **Etiquetas (Labels)** | `Sprint-3;M02;CRUD-03;Proceso-1;Open-Meteo;Clima` |

#### Enunciado de la Historia de Usuario
> Como Conductor o Administrador, quiero que al confirmar una ruta definitiva un proceso en segundo plano consulte de forma autónoma la API de Open-Meteo para las coordenadas y ETA de cada hito horario, insertando automáticamente las alertas meteorológicas en la BBDD local y permitiendo su gestión CRUD.

#### Trazabilidad
- **Módulos / Requisitos:** M02, M04, CRUD 03 (clima_hito), Proceso Automatizado 1.

#### Subtareas técnicas:
- [ ] **Subtarea 1. Programar el Proceso Automatizado 1 que se dispara tras confirmar una ruta en SQLite y consulta Open-Meteo para cada hito horario.**
- [ ] **Subtarea 2. CRUD 03 (clima_hito): CREATE (registro de temperatura, lluvia, nieve, viento y niebla por hito), READ (consulta de pronósticos y alertas activas), UPDATE (actualización de variables y severidad), DELETE (purga de registros de trayectos descartados).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Generación desasistida de alertas climáticas por hito horario
  Dado que el usuario confirma y registra una ruta definitiva en la base de datos
  Cuando finaliza el guardado de los hitos horarios con sus respectivas ETA
  Entonces el proceso en segundo plano consulta Open-Meteo e inserta automáticamente los registros de previsión y nivel de alerta en clima_hito.
```

---

### [3T-17] Motor Normativo de Tacógrafo CE 561/2006 y Tiempos de Conducción (CRUD 10)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `17` |
| **Issue Key** | `3T-17` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP3 - Meteorología Predictiva, Tacógrafo UE y Taller |
| **Prioridad** | `Highest` |
| **Story Points** | **6 SP** |
| **Plazo de Ejecución** | `2026-12-10 al 2026-12-23` |
| **Componentes** | `M08-Tacografo-Taller` |
| **Etiquetas (Labels)** | `Sprint-3;M08;CRUD-10;Tacografo;CE-561-2006` |

#### Enunciado de la Historia de Usuario
> Como Conductor Profesional, quiero que el planificador compute mis tiempos de conducción e inserte automáticamente pausas reglamentarias de 45 minutos tras un máximo de 4h 30m de conducción continua y descansos diarios de 11 horas según el Reglamento (CE) 561/2006, gestionando el CRUD de reg_tacografo.

#### Trazabilidad
- **Módulos / Requisitos:** M08, CRUD 10 (reg_tacografo).

#### Subtareas técnicas:
- [ ] **Subtarea 1. Implementar el motor de reglas del Reglamento (CE) 561/2006 (límite de 4h 30m continua -> pausa 45m; descanso diario obligatorio de 11h).**
- [ ] **Subtarea 2. CRUD 10 (reg_tacografo): CREATE (registro de conducción, pausa 45m, descanso 11h), READ (consulta de acumulados e infracciones), UPDATE (regularización justificada de bloques), DELETE (borrado de simulaciones no confirmadas).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Inserción obligatoria de pausa reglamentaria según CE 561/2006
  Dado un trayecto planificado de 6 horas de conducción para un conductor asignado
  Cuando el motor normativo de tacógrafo procesa el itinerario
  Entonces inserta obligatoriamente una pausa de 45 minutos al cumplirse las 4h 30m de conducción y guarda los bloques en reg_tacografo.
```

---

### [3T-18] Gestión de Mantenimiento Preventivo y Órdenes de Taller (CRUD 09)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `18` |
| **Issue Key** | `3T-18` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP3 - Meteorología Predictiva, Tacógrafo UE y Taller |
| **Prioridad** | `Medium` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-12-10 al 2026-12-23` |
| **Componentes** | `M08-Tacografo-Taller` |
| **Etiquetas (Labels)** | `Sprint-3;M08;CRUD-09;Mantenimiento;Taller` |

#### Enunciado de la Historia de Usuario
> Como Administrador de Flota, quiero programar revisiones mecánicas preventivas por fecha límite o umbral de kilometraje y gestionar las órdenes de taller de cada vehículo para mantener la operatividad del parque móvil.

#### Trazabilidad
- **Módulos / Requisitos:** M08, CRUD 09 (mantenimiento).

#### Subtareas técnicas:
- [ ] **Subtarea 1. CRUD 09 (mantenimiento): CREATE (programación por fecha o umbral de km), READ (consulta de plan preventivo e historial por vehículo), UPDATE (cierre de orden con coste, piezas y próximo km), DELETE (cancelación o baja lógica de órdenes no ejecutadas).**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Programación y cierre de orden de mantenimiento preventivo
  Dado un vehículo registrado en la flota
  Cuando se crea una orden preventiva en mantenimiento y posteriormente se cierra indicando coste, piezas reemplazadas y próximo kilometraje
  Entonces queda registrado el historial de taller del vehículo y se actualiza su próximo umbral de revisión.
```

---

### [3T-19] [VALIDACIÓN S3] Validación del Proceso Automatizado de Clima y Reglas del Tacógrafo UE (CP-03 y CP-06)

| Metadato | Valor |
| :--- | :--- |
| **Issue ID** | `19` |
| **Issue Key** | `3T-19` |
| **Issue Type** | `Story` |
| **Épica (Parent)** | 3T-EP6 - Aseguramiento de Calidad (V&V), Pruebas y Entrega |
| **Prioridad** | `Highest` |
| **Story Points** | **3 SP** |
| **Plazo de Ejecución** | `2026-12-10 al 2026-12-23` |
| **Componentes** | `QA-Validacion` |
| **Etiquetas (Labels)** | `Sprint-3;Validacion;Vitest;CP-03;CP-06;Clima;Tacografo` |

#### Enunciado de la Historia de Usuario
> Como ingeniero de V&V, quiero verificar mediante pruebas automatizadas la inserción desasistida de pronósticos de Open-Meteo por hito horario y el cumplimiento normativo del Reglamento (CE) 561/2006 sobre el motor de tacógrafo.

#### Trazabilidad
- **Módulos / Requisitos:** Sección 11.1, CP-03 y CP-06.

#### Subtareas de validación:
- [ ] **Subtarea 1. Ejecutar CP-03: Confirmación de ruta y disparo del proceso automático de consulta a Open-Meteo por cada hito horario.**
- [ ] **Subtarea 2. Ejecutar CP-06: Planificación de trayecto de 6 horas de conducción y verificación de pausa a las 4h 30m y descanso de 11h.**

#### Criterios de Aceptación (BDD - Gherkin)
```gherkin
Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación de los casos de prueba CP-03 y CP-06
  Dado el entorno de pruebas del Sprint 3
  Cuando se ejecutan los casos CP-03 y CP-06 en Vitest
  Entonces se verifica la inserción autónoma de variables climáticas en clima_hito y la creación obligatoria de la pausa de 45 min en reg_tacografo.
```

---

## 4. Épicas Relacionadas en este Sprint

### [3T-EP3] Meteorología Predictiva, Tacógrafo UE y Taller
- **Nombre de la Épica:** Clima Open-Meteo, Tacógrafo UE y Taller
- **Prioridad:** `High`
- **Plazo de la Épica:** `2026-12-10 al 2026-12-23`
- **Componentes:** `M02-Clima;M08-Tacografo-Taller`
- **Etiquetas:** `Epica;Open-Meteo;Tacografo-561-2006;Mantenimiento;MVP`
- **Descripción y Alcance:**
  > Épica que integra el pronóstico meteorológico predictivo por hito horario mediante la API de Open-Meteo (Proceso Automatizado 1), el motor normativo de tiempos de conducción, pausas y descansos según el Reglamento (CE) 561/2006 y la gestión de mantenimiento preventivo en taller.
  > Módulos cubiertos: M02, M08.
  > Procesos automatizados: Proceso 1 (Pronóstico meteorológico de la ruta).
  > Peso estimado sobre el producto: 16%.

### [3T-EP6] Aseguramiento de Calidad (V&V), Pruebas y Entrega
- **Nombre de la Épica:** Verificación, Validación (Vitest) y Release
- **Prioridad:** `Highest`
- **Plazo de la Épica:** `2026-11-04 al 2027-02-03`
- **Componentes:** `QA-Validacion`
- **Etiquetas:** `Epica;Validacion;Vitest;CI-CD;Casos-Prueba`
- **Descripción y Alcance:**
  > Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto.
