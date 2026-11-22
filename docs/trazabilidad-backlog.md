# Matriz de Trazabilidad del Product Backlog (3T-02)

Esta matriz formaliza la trazabilidad requerida en la historia **3T-02** del Sprint 0, vinculando las **15 operaciones CRUD**, los **11 módulos funcionales**, los **10 Casos de Prueba (CP-01 a CP-10)** y su asignación a historias de usuario y sprints.

---

## 1. Módulos y Entidades Relacionales (15 CRUDs)

| N.º | Entidad SQL | Módulo | Historia Jira | Sprint | Descripción Operativa |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **01** | `ruta` | M01 (Rutas) | `3T-12` | Sprint 2 | Planificación y cabecera de trayectos |
| **02** | `hito_ruta` | M01 (Rutas) | `3T-12` | Sprint 2 | Paradas intermedias, ordenación y ETA |
| **03** | `clima_hito` | M02 (Clima) | `3T-16` | Sprint 3 | Pronóstico meteorológico por hito (Open-Meteo) |
| **04** | `estacion_serv` | M03 (Combustible) | `3T-20` | Sprint 4 | Catálogo oficial MITECO y gasolineras en corredor |
| **05** | `repostaje` | M03 (Combustible) | `3T-21` | Sprint 4 | Tickets de repostaje, litros, coste y odómetro |
| **06** | `vehiculo` | M06 (Flota) | `3T-13` | Sprint 2 | Cabezas tractoras, MMA y consumo medio |
| **07** | `remolque` | M06 (Flota) | `3T-13` | Sprint 2 | Semirremolques, tipo de caja y vinculación |
| **08** | `documento` | M07 (Documentación) | `3T-14` | Sprint 2 | Control de ITV, CAP, seguros y semáforo urgencia |
| **09** | `mantenimiento` | M08 (Tacógrafo/Taller)| `3T-18` | Sprint 3 | Mantenimiento preventivo y órdenes de taller |
| **10** | `reg_tacografo` | M08 (Tacógrafo/Taller)| `3T-17` | Sprint 3 | Bloques de conducción, pausas 45m y descansos CE 561/2006 |
| **11** | `usuario` | M09 (Seguridad/RBAC) | `3T-05` | Sprint 1 | Operadores, contraseñas hash SHA-256 + salt |
| **12** | `rol_permiso` | M09 (Seguridad/RBAC) | `3T-05` | Sprint 1 | Matriz de permisos granulares por rol y módulo |
| **13** | `log_auditoria`| M09 (Seguridad/RBAC) | `3T-06` / `3T-25` | Sprint 1 / 5 | Interceptor append-only y visor de inspección con diff JSON |
| **14** | `organizacion` | M10 (Organización) | `3T-07` | Sprint 1 | Datos fiscales corporativos, CIF y logotipo |
| **15** | `reporte` | M11 (Reportes) | `3T-24` | Sprint 5 | Generador de informes de explotación y exportación CSV |

---

## 2. Casos Formales de Prueba (V&V: CP-01 a CP-10)

| Caso de Prueba | Descripción del Test | Historia Jira | Sprint | Criterio de Éxito |
| :--- | :--- | :---: | :---: | :--- |
| **CP-01** | Transacciones de las 15 entidades en wa-sqlite | `3T-22`, `3T-23` | Sprint 4 | 15 CRUD ejecutados en < 100 ms |
| **CP-02** | Cálculo vial peninsular (> 500 km) en VPS OSRM | `3T-10`, `3T-15` | Sprint 2 | Respuesta sub-segundo (< 1.000 ms) vía túnel |
| **CP-03** | Inserción desasistida de clima Open-Meteo por hito | `3T-16`, `3T-19` | Sprint 3 | Guardado de variables climáticas y nivel de alerta |
| **CP-04** | Búsqueda MITECO en corredor de 20 km y repostaje | `3T-20`, `3T-23` | Sprint 4 | Selección de estación de menor coste neto |
| **CP-05** | Vencimiento documental de flota y semáforo | `3T-14`, `3T-15` | Sprint 2 | Clasificación automática en amarillo (< 30 días) |
| **CP-06** | Inserción de pausa CE 561/2006 (4h 30m) y descanso 11h | `3T-17`, `3T-19` | Sprint 3 | Creación obligatoria de pausa reglamentaria |
| **CP-07** | Intento de acceso denegado a usuario con rol Conductor | `3T-05`, `3T-09` | Sprint 1 | Bloqueo en UI y excepción 403 en persistencia |
| **CP-08** | Inmutabilidad de log_auditoria y generación síncrona | `3T-06`, `3T-09` | Sprint 1 | Inserción automática append-only con diff JSON |
| **CP-09** | Reporte CSV con datos de organización y backup R2 | `3T-24`, `3T-27` | Sprint 5 | Cabecera fiscal correcta y hash SHA-256 idéntico |
| **CP-10** | Resiliencia 100% offline con corte de red y sincronización | `3T-30` | Cierre | Operación continua sin red y backup post-reconexión |
