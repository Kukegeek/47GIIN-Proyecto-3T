Issue ID,Issue Key,Issue Type,Summary,Epic Name,Parent ID,Epic Link,Priority,Story Points,Sprint,Start Date,Due Date,Components,Labels,Description
101,TTTRUCKS-101,Epic,"Arquitectura Local-First, Seguridad RBAC y Corporativo","Arquitectura Local-First, RBAC y Auditoría",,,Highest,,,2026-11-04,2027-01-27,M04-Persistencia-SQLite;M09-Usuarios-RBAC-Auditoria;M10-Organizacion,Epica;Local-First;RBAC;Auditoria;MVP,"Épica que agrupa la arquitectura relacional Local-First en wa-sqlite sobre OPFS (3FN para las 15 entidades CRUD), el módulo de gestión de usuarios, autenticación criptográfica y control de acceso basado en roles (RBAC: Administrador y Conductor), el interceptor transaccional inmutable de auditoría explícita (log_auditoria) y la configuración fiscal de la organización.

Módulos cubiertos: M04, M09, M10.
Requisitos No Funcionales: RNF-01, RNF-05, RNF-06, RNF-07.
Peso estimado sobre el producto: 25%."
102,TTTRUCKS-102,Epic,"Motor Cartográfico, Cálculo Vial Híbrido y Flota","Cartografía, VPS OSRM y Gestión de Flota",,,Highest,,,2026-11-12,2026-12-09,M01-Rutas;M05-UI-Mapa;M06-Flota;M07-Documentacion,Epica;OSRM;Leaflet;PMTiles;Flota;MVP,"Épica centrada en la planificación de rutas en dos pasos (estimación instantánea con TortuosityEngine y cálculo exacto en VPS privado con OSRM a través de túnel Cloudflare Zero Trust), renderizado cartográfico interactivo con Leaflet y teselas PMTiles, y gestión integral de flota (cabezas tractoras, semirremolques y control documental con semáforo de vencimientos).

Módulos cubiertos: M01, M05, M06, M07.
Requisitos No Funcionales: RNF-02, RNF-03.
Peso estimado sobre el producto: 42%."
103,TTTRUCKS-103,Epic,"Meteorología Predictiva, Tacógrafo UE y Taller","Clima Open-Meteo, Tacógrafo UE y Taller",,,High,,,2026-12-10,2026-12-23,M02-Clima;M08-Tacografo-Taller,Epica;Open-Meteo;Tacografo-561-2006;Mantenimiento;MVP,"Épica que integra el pronóstico meteorológico predictivo por hito horario mediante la API de Open-Meteo (Proceso Automatizado 1), el motor normativo de tiempos de conducción, pausas y descansos según el Reglamento (CE) 561/2006 y la gestión de mantenimiento preventivo en taller.

Módulos cubiertos: M02, M08.
Procesos automatizados: Proceso 1 (Pronóstico meteorológico de la ruta).
Peso estimado sobre el producto: 16%."
104,TTTRUCKS-104,Epic,Optimización de Combustible MITECO y Consumos,Combustible MITECO y Repostajes,,,High,,,2026-12-24,2027-01-13,M03-Combustible,Epica;MITECO;Repostajes;MVP,"Épica destinada a la descarga y análisis del catálogo oficial de precios de carburantes del MITECO (> 10.000 estaciones), recomendación autónoma de la gasolinera de menor coste neto ponderando el desvío kilométrico en un corredor de 20 km (Proceso Automatizado 2) y gestión de tickets de repostaje y consumos.

Módulos cubiertos: M03.
Procesos automatizados: Proceso 2 (Estación de repostaje óptima).
Peso estimado sobre el producto: 11%."
105,TTTRUCKS-105,Epic,"Explotación de Datos, Reportes CSV y Backup Cloud R2","Reportes CSV, KPIs y Resguardo Cloudflare R2",,,High,,,2027-01-14,2027-01-27,M04-Persistencia-SQLite;M11-Reportes,Epica;Reportes;CSV;Cloudflare-R2;Backup;MVP,"Épica enfocada en la generación de informes operativos de rutas y consumos exportables a CSV con cabecera corporativa, panel estadístico con KPIs de explotación y proceso autónomo de sincronización y resguardo comprimido (Gzip + SHA-256) hacia Cloudflare R2.

Módulos cubiertos: M04, M11.
Requisitos No Funcionales: RNF-04.
Procesos automatizados: Proceso 3 (Sincronización local-first y resguardo en R2).
Peso estimado sobre el producto: 6%."
106,TTTRUCKS-106,Epic,"Aseguramiento de Calidad (V&V), Pruebas y Entrega","Verificación, Validación (Vitest) y Release",,,Highest,,,2026-11-04,2027-02-03,QA-Validacion,Epica;Validacion;Vitest;CI-CD;Casos-Prueba,"Épica transversal que agrupa las historias de validación obligatorias de cada sprint, la suite de pruebas automatizadas con Vitest (> 25% cobertura), el pipeline CI/CD en GitHub Actions, la matriz formal de casos de prueba (CP-01 a CP-10), el despliegue en producción y la defensa del proyecto."
1,TTTRUCKS-1,Story,Diseño del esquema relacional 3FN e infraestructura base del repositorio,,101,"Arquitectura Local-First, RBAC y Auditoría",Highest,3,Sprint 0 (Inicio y Backlog),2026-11-04,2026-11-11,M04-Persistencia-SQLite,Sprint-0;3FN;SQLite;ES2024;RNF-01;RNF-05,"Como arquitecto de software, quiero definir el esquema DDL SQLite en Tercera Forma Normal (3FN) para las 15 entidades del sistema y estructurar el proyecto en Vanilla JS (ES2024 Modules) para asegurar persistencia local sin dependencias pesadas.

Trazabilidad: M04, RNF-01, RNF-05.

Subtareas técnicas:
1. Modelar el script DDL (schema.sql) con claves foráneas y borrados lógicos/en cascada para las 15 tablas: ruta, hito_ruta, clima_hito, estacion_serv, repostaje, vehiculo, remolque, documento, mantenimiento, reg_tacografo, usuario, rol_permiso, log_auditoria, organizacion y reporte.
2. Inicializar el repositorio en GitHub (47GIIN-Proyecto-3T) con estructura modular ES2024 y workflow base de GitHub Actions con Vitest.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Creación íntegra del esquema relacional en 3FN
  Dado el script de inicialización SQL del proyecto
  Cuando se ejecuta sobre una instancia limpia de SQLite con PRAGMA foreign_keys = ON
  Entonces se crean las 15 tablas en 3FN sin errores de sintaxis y con sus restricciones de integridad referencial activas."
2,TTTRUCKS-2,Story,Estructuración del Product Backlog en Jira con escenarios BDD,,101,"Arquitectura Local-First, RBAC y Auditoría",High,3,Sprint 0 (Inicio y Backlog),2026-11-04,2026-11-11,QA-Validacion,Sprint-0;Scrum;Backlog;BDD;Gherkin,"Como desarrollador único bajo marco Scrum, quiero dar de alta las épicas, sprints e historias de usuario con criterios Gherkin en Jira Software para mantener la trazabilidad completa desde noviembre de 2026 hasta febrero de 2027.

Trazabilidad: Metodología Scrum (Sección 10 y 12).

Subtareas técnicas:
1. Configurar los sprints del proyecto en Jira respetando el cronograma oficial.
2. Vincular las 15 operaciones CRUD, los 11 módulos y los 10 casos de prueba a las historias de usuario.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Trazabilidad completa del Product Backlog
  Dado el alcance de los 11 módulos y las 15 operaciones CRUD
  Cuando se revisa el tablero de Jira Software
  Entonces todas las historias están asignadas a sus sprints correspondientes con estimación en Story Points y criterios Gherkin definidos."
3,TTTRUCKS-3,Story,"[VALIDACIÓN S0] Verificación del modelo de datos 3FN, pipeline CI/CD y DoR del Backlog",,106,"Verificación, Validación (Vitest) y Release",Highest,2,Sprint 0 (Inicio y Backlog),2026-11-04,2026-11-11,QA-Validacion,Sprint-0;Validacion;CI-CD;GitHub-Actions;Vitest,"Como responsable de calidad (V&V), quiero validar que el modelo relacional soporte las 15 entidades CRUD sin anomalías de normalización y que el pipeline de integración continua en GitHub Actions se dispare automáticamente en cada push o pull request hacia la rama main.

Trazabilidad: Sección 11.5 (CI/CD GitHub Actions) y Sprint 0.

Subtareas de validación:
1. Verificar el cumplimiento de la 3FN y claves foráneas en las 15 tablas del DDL.
2. Comprobar la ejecución desasistida del workflow de GitHub Actions con Vitest en el repositorio remoto.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Ejecución exitosa del pipeline CI/CD inicial
  Dado un commit o pull request hacia la rama main del repositorio GitHub
  Cuando se ejecuta el workflow automatizado de GitHub Actions
  Entonces el linter y el test humo de creación del esquema SQLite de 15 tablas finalizan en estado PASS (verde)."
4,TTTRUCKS-4,Story,Motor de persistencia Local-First en WebAssembly (wa-sqlite sobre OPFS),,101,"Arquitectura Local-First, RBAC y Auditoría",Highest,5,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,M04-Persistencia-SQLite,Sprint-1;M04;wa-sqlite;OPFS;WASM;RNF-01;RNF-05,"Como usuario del sistema, quiero que la base de datos relacional se ejecute y persista directamente en el navegador mediante wa-sqlite y Origin Private File System (OPFS) para operar con latencia nula y disponibilidad offline.

Trazabilidad: M04, RNF-01, RNF-05.

Subtareas técnicas:
1. Integrar el binario WebAssembly de wa-sqlite mediante Web Worker dedicado con sistema de archivos virtual sobre OPFS.
2. Implementar el gestor de transacciones SQLite asíncrono y el bootstrapping automático del esquema de 15 tablas.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Persistencia transaccional en OPFS del navegador
  Dado que el usuario abre la aplicación en el navegador por primera vez
  Cuando se inicializa el motor wa-sqlite y se confirma una transacción local
  Entonces el archivo de base de datos queda persistido en OPFS y mantiene los registros intactos tras recargar la página o reiniciar el navegador."
5,TTTRUCKS-5,Story,"Gestión de Usuarios, Autenticación Criptográfica y Roles RBAC (CRUD 11 y CRUD 12)",,101,"Arquitectura Local-First, RBAC y Auditoría",Highest,5,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,M09-Usuarios-RBAC-Auditoria,Sprint-1;M09;CRUD-11;CRUD-12;RBAC;Seguridad;RNF-07,"Como Administrador de Flota (ROL_ADMIN), quiero gestionar el ciclo de vida de los usuarios y los permisos de los roles (ROL_ADMIN y ROL_CONDUCTOR) con contraseñas protegidas mediante SHA-256 y salt único para segregar el acceso tanto en la interfaz como en la capa SQL.

Trazabilidad: M09, CRUD 11 (usuario), CRUD 12 (rol_permiso), RNF-07.

Subtareas técnicas:
1. CRUD 11 (usuario): CREATE (alta con hash SHA-256 + salt y rol), READ (listado de operadores y último login), UPDATE (edición de perfil, rol y clave), DELETE (bloqueo/baja lógica sin alterar históricos).
2. CRUD 12 (rol_permiso): CREATE (definición de rol y matriz de permisos), READ (consulta de privilegios por módulo/vista), UPDATE (ajuste granular lectura/escritura), DELETE (revocación o baja de perfiles secundarios).
3. Implementar guardias de autorización en el enrutador de vistas UI y en el adaptador de persistencia SQLite.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Segregación estricta de permisos por rol (RBAC)
  Dado un usuario autenticado con ROL_CONDUCTOR
  Cuando intenta acceder a la vista de administración de usuarios o invocar una sentencia SQL de escritura sobre usuario o rol_permiso
  Entonces el sistema oculta el menú en la interfaz y lanza una excepción de autorización (403 Forbidden / Unauthorized op) en la capa de datos."
6,TTTRUCKS-6,Story,Interceptor Transaccional de Auditoría Explícita Inmutable (CRUD 13 - Capa Core),,101,"Arquitectura Local-First, RBAC y Auditoría",High,3,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,M09-Usuarios-RBAC-Auditoria,Sprint-1;M09;CRUD-13;Auditoria;RNF-06,"Como Administrador, quiero que un interceptor en la capa de datos registre de forma desasistida e inmutable (append-only) cada operación INSERT, UPDATE, DELETE y LOGIN en la tabla log_auditoria para garantizar la trazabilidad completa de las 15 entidades.

Trazabilidad: M09, CRUD 13 (log_auditoria - CREATE), RNF-06.

Subtareas técnicas:
1. Programar el interceptor transaccional que capture id_log, id_usuario, username, rol_ejecutor, tipo de acción (INSERT, UPDATE, DELETE, LOGIN), entidad, id_registro, valor_anterior (JSON), valor_nuevo (JSON), timestamp_utc (ISO-8601) y origen_sesion.
2. Bloquear en la capa de datos cualquier intento de modificación o borrado directo por operadores sobre log_auditoria.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Trazabilidad automática en log_auditoria
  Dado un usuario con sesión activa en el sistema
  Cuando ejecuta una operación INSERT, UPDATE o DELETE sobre cualquiera de las 15 entidades del modelo
  Entonces se inserta síncronamente una fila en log_auditoria con el diff serializado en JSON y la marca temporal UTC exacta."
7,TTTRUCKS-7,Story,Configuración Corporativa de la Organización (CRUD 14),,101,"Arquitectura Local-First, RBAC y Auditoría",Medium,2,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,M10-Organizacion,Sprint-1;M10;CRUD-14;Organizacion,"Como Administrador, quiero gestionar los datos fiscales y corporativos de la empresa de transporte (razón social, CIF/NIF, domicilio fiscal, provincia, CP, contacto y logotipo) para que alimenten el perfil de flota y las cabeceras de los informes operativos.

Trazabilidad: M10, CRUD 14 (organizacion).

Subtareas técnicas:
1. CRUD 14 (organizacion): CREATE (alta inicial de empresa), READ (lectura para perfil y cabeceras), UPDATE (actualización fiscal o imagen corporativa), DELETE (limpieza o restablecimiento de parámetros opcionales).
2. Restringir la edición exclusivamente al rol ROL_ADMIN.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Gestión de datos fiscales de la organización
  Dado el formulario de configuración corporativa abierto por un usuario con ROL_ADMIN
  Cuando se registran o actualizan la razón social, el CIF y el logotipo corporativo
  Entonces los datos persisten en la tabla organizacion y se genera automáticamente el registro de auditoría en log_auditoria."
8,TTTRUCKS-8,Story,Algoritmo de estimación vial instantánea (TortuosityEngine),,102,"Cartografía, VPS OSRM y Gestión de Flota",High,2,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,M01-Rutas,Sprint-1;M01;TortuosityEngine;Algoritmo,"Como usuario planificador, quiero obtener una previsualización instantánea en menos de 1 ms de la distancia y tiempo estimado entre coordenadas aplicando un factor de tortuosidad geométrica (TortuosityEngine) antes de solicitar el cálculo definitivo al servidor VPS.

Trazabilidad: M01 (Fase 1 del cálculo híbrido).

Subtareas técnicas:
1. Implementar el cálculo ortodrómico ponderado por factor de tortuosidad peninsular.
2. Contemplar casos límite: distancias nulas, coordenadas idénticas y puntos insulares o sin conexión terrestre directa.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Estimación preliminar sub-milisegundo con TortuosityEngine
  Dado un par de coordenadas geográficas de origen y destino en España
  Cuando se invoca la función de previsualización de TortuosityEngine
  Entonces devuelve la distancia y duración estimadas en un tiempo inferior a 1 ms y gestiona sin errores coordenadas idénticas o insulares."
9,TTTRUCKS-9,Story,"[VALIDACIÓN S1] Suite de pruebas unitarias de Seguridad RBAC, Auditoría y TortuosityEngine (CP-07 y CP-08)",,106,"Verificación, Validación (Vitest) y Release",Highest,3,"Sprint 1 (BBDD, RBAC, Auditoría y Organización)",2026-11-12,2026-11-25,QA-Validacion,Sprint-1;Validacion;Vitest;CP-07;CP-08;RBAC;Auditoria,"Como ingeniero de V&V, quiero ejecutar pruebas automatizadas en Vitest sobre autenticación, segregación RBAC, inmutabilidad de log_auditoria y casos límite de TortuosityEngine para certificar la seguridad y base funcional del Sprint 1.

Trazabilidad: Sección 11.1, 11.2, CP-07 y CP-08.

Subtareas de validación:
1. Automatizar CP-07: Inicio de sesión con rol Conductor e intento de acceso al CRUD de usuarios, empresa o auditoría.
2. Automatizar CP-08: Verificación de generación síncrona de registros inmutables en log_auditoria con diff JSON y hora UTC.
3. Ejecutar tests unitarios de TortuosityEngine para coordenadas válidas y casos límite.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación de los casos de prueba CP-07 y CP-08 en Vitest
  Dado el runner de pruebas Vitest ejecutándose sobre la capa de datos wa-sqlite
  Cuando se corren las suites de seguridad RBAC (CP-07), trazabilidad de auditoría (CP-08) y TortuosityEngine
  Entonces el 100% de los tests finalizan en verde confirmando el bloqueo de permisos al rol Conductor y la inmutabilidad de log_auditoria."
10,TTTRUCKS-10,Story,Infraestructura VPS OSRM en RAM con Túnel Cloudflare Zero Trust,,102,"Cartografía, VPS OSRM y Gestión de Flota",Highest,5,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,M01-Rutas,Sprint-2;M01;OSRM;VPS;Cloudflare-Tunnel;RNF-02;RNF-03,"Como arquitecto de sistemas, quiero desplegar el motor OSRM (Multi-Level Dijkstra) con el grafo de España en memoria RAM sobre el servidor VPS Linux con Dokploy, conectado mediante Cloudflare Tunnel y protegido con cabecera X-Origin-Secret en Nginx, para calcular rutas reales en menos de 1 segundo sin puertos públicos abiertos.

Trazabilidad: M01, RNF-02, RNF-03.

Subtareas técnicas:
1. Compilar el extracto OpenStreetMap de España con OSRM MLD y alojarlo en RAM en el contenedor Dokploy del VPS.
2. Configurar el túnel saliente Cloudflare Zero Trust y la validación de la cabecera X-Origin-Secret en Nginx Gateway.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Cálculo vial seguro y sub-segundo en VPS OSRM
  Dado el servicio OSRM activo en el VPS detrás del túnel Cloudflare Zero Trust
  Cuando se envía una solicitud de ruta peninsular (> 500 km) con la cabecera X-Origin-Secret válida
  Entonces el servidor devuelve la polilínea exacta, distancia y duración en menos de 1.000 ms y rechaza con 403 cualquier petición sin la cabecera secreta."
11,TTTRUCKS-11,Story,Interfaz Cartográfica Interactiva con Leaflet y PMTiles (M05),,102,"Cartografía, VPS OSRM y Gestión de Flota",High,3,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,M05-UI-Mapa,Sprint-2;M05;Leaflet;PMTiles;Mapa,"Como usuario, quiero visualizar un mapa interactivo en Leaflet alimentado por teselas vectoriales PMTiles desde Cloudflare R2/Workers que dibuje las polilíneas OSRM y los marcadores dinámicos de hitos, estaciones y alertas climáticas.

Trazabilidad: M05.

Subtareas técnicas:
1. Integrar Leaflet con el proveedor de teselas PMTiles servidas desde Cloudflare R2.
2. Implementar el renderizado vectorial reactivo de la polilínea OSRM y las capas de marcadores interactivos.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Renderizado ágil del mapa vectorial y polilínea de ruta
  Dado el componente cartográfico Leaflet en la vista principal
  Cuando se carga el mapa y se recibe la geometría vectorial desde el VPS OSRM
  Entonces se renderizan las teselas PMTiles y la polilínea completa logrando interactividad en menos de 2 segundos bajo red 4G."
12,TTTRUCKS-12,Story,Planificador de Rutas por CP/Población e Hitos de Paso (CRUD 01 y CRUD 02),,102,"Cartografía, VPS OSRM y Gestión de Flota",Highest,5,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,M01-Rutas;M04-Persistencia-SQLite;M05-UI-Mapa,Sprint-2;M01;M04;CRUD-01;CRUD-02;Rutas;Hitos,"Como usuario operativo, quiero seleccionar origen, destino y paradas por código postal o población en España, confirmar el cálculo definitivo en el VPS OSRM y gestionar el CRUD completo de rutas e hitos horarios con su ETA en SQLite.

Trazabilidad: M01, M04, M05, CRUD 01 (ruta), CRUD 02 (hito_ruta).

Subtareas técnicas:
1. Implementar el buscador local de CP y poblaciones de España y el flujo en dos pasos (TortuosityEngine -> Confirmación VPS OSRM).
2. CRUD 01 (ruta): CREATE (alta con origen, destino, distancia, duración y geometría), READ (consulta y listado filtrado por fecha, vehículo y conductor), UPDATE (cambio de estado, vehículo y observaciones), DELETE (baja lógica o borrado en cascada con hitos).
3. CRUD 02 (hito_ruta): CREATE (inserción con coordenadas, orden y ETA), READ (lectura ordenada para dibujo en mapa), UPDATE (reordenación de paradas y ajuste de estancia), DELETE (eliminación de hito con recálculo automático del tramo).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Ciclo completo de planificación y persistencia de ruta e hitos
  Dado un origen y un destino seleccionados por código postal o población
  Cuando el usuario confirma el cálculo real en el VPS OSRM y guarda la ruta
  Entonces se persisten transaccionalmente la entidad ruta y sus registros hito_ruta con su ETA en wa-sqlite, permitiendo su edición, reordenación y borrado en cascada."
13,TTTRUCKS-13,Story,Gestión de Flota: Cabezas Tractoras y Semirremolques (CRUD 06 y CRUD 07),,102,"Cartografía, VPS OSRM y Gestión de Flota",High,3,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,M06-Flota,Sprint-2;M06;CRUD-06;CRUD-07;Flota;Vehiculos;Remolques,"Como Administrador de Flota, quiero administrar las fichas técnicas de cabezas tractoras y semirremolques para asignarlos a las rutas preservando la integridad del historial vial.

Trazabilidad: M06, CRUD 06 (vehiculo), CRUD 07 (remolque).

Subtareas técnicas:
1. CRUD 06 (vehiculo): CREATE (alta con matrícula, marca, modelo, MMA y consumo medio), READ (consulta individual y catálogo de flota), UPDATE (edición de km, estado activo/taller y conductor), DELETE (baja lógica preservando historial).
2. CRUD 07 (remolque): CREATE (registro con matrícula, tipo de caja, ejes y carga), READ (inventario y vinculación con tractora), UPDATE (cambio de tractora asignada, carga o estado), DELETE (desactivación lógica).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Administración de cabezas tractoras y semirremolques vinculados
  Dado el módulo de gestión de flota abierto por un Administrador
  Cuando registra una cabeza tractora en vehiculo, le vincula un semirremolque en remolque y posteriormente aplica una baja lógica
  Entonces el estado del vehículo cambia a inactivo sin eliminar los registros históricos de rutas asociadas."
14,TTTRUCKS-14,Story,Gestión Documental de Flota y Semáforo de Vencimientos (CRUD 08),,102,"Cartografía, VPS OSRM y Gestión de Flota",High,2,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,M07-Documentacion,Sprint-2;M07;CRUD-08;Documentacion;ITV;CAP-ADR,"Como Administrador o Conductor, quiero gestionar y monitorizar los vencimientos legales de la flota (ITV, seguros, tarjetas de transporte, CAP/ADR y calibraciones de tacógrafo) mediante un semáforo automático de urgencia (vigente, próximo < 30 días, vencido).

Trazabilidad: M07, CRUD 08 (documento).

Subtareas técnicas:
1. CRUD 08 (documento): CREATE (alta de documento con fecha límite), READ (consulta clasificada por semáforo: vigente, próximo < 30 días, vencido), UPDATE (renovación de vigencia y ajuste de costes), DELETE (archivo o baja lógica de caducados/reemplazados).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Clasificación automática por semáforo de urgencia documental
  Dado un vehículo activo en la flota
  Cuando se da de alta un documento de ITV con fecha de vencimiento a 15 días vista
  Entonces el sistema lo almacena en documento y lo muestra automáticamente en estado de alerta amarillo (próximo a vencer < 30 días)."
15,TTTRUCKS-15,Story,"[VALIDACIÓN S2] Verificación de latencia sub-segundo OSRM, renderizado Leaflet y Flota/Documentos (CP-02 y CP-05)",,106,"Verificación, Validación (Vitest) y Release",Highest,3,"Sprint 2 (Cartografía, VPS OSRM y Flota)",2026-11-26,2026-12-09,QA-Validacion,Sprint-2;Validacion;CP-02;CP-05;Rendimiento;OSRM,"Como ingeniero de V&V, quiero validar el rendimiento extremo a extremo del cálculo vial en el VPS OSRM, la fluidez del mapa PMTiles bajo emulación 4G y las reglas de negocio de flota y semáforo documental entregadas en el Sprint 2.

Trazabilidad: Sección 11.3, CP-02 y CP-05.

Subtareas de validación:
1. Ejecutar CP-02: Cálculo de ruta peninsular (> 500 km, Murcia-Madrid-Bilbao) vía túnel Cloudflare hacia VPS OSRM.
2. Medir carga de teselas PMTiles y dibujo de polilínea en Leaflet bajo emulación 4G (< 2 segundos).
3. Ejecutar CP-05: Alta de tractora/remolque y registro de documento ITV con vencimiento a 15 días vista.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Superación de los casos de prueba CP-02 y CP-05
  Dado el entorno integrado con el VPS OSRM y la base de datos local wa-sqlite
  Cuando se ejecutan las pruebas CP-02 y CP-05
  Entonces la ruta Murcia-Madrid-Bilbao se resuelve en menos de 1.000 ms, el mapa es interactivo en menos de 2 s y la ITV a 15 días se clasifica en estado amarillo."
16,TTTRUCKS-16,Story,Motor de Clima Predictivo con Open-Meteo y Proceso Automatizado 1 (CRUD 03),,103,"Clima Open-Meteo, Tacógrafo UE y Taller",Highest,6,"Sprint 3 (Clima, Tacógrafo y Mantenimiento)",2026-12-10,2026-12-23,M02-Clima;M04-Persistencia-SQLite,Sprint-3;M02;CRUD-03;Proceso-1;Open-Meteo;Clima,"Como Conductor o Administrador, quiero que al confirmar una ruta definitiva un proceso en segundo plano consulte de forma autónoma la API de Open-Meteo para las coordenadas y ETA de cada hito horario, insertando automáticamente las alertas meteorológicas en la BBDD local y permitiendo su gestión CRUD.

Trazabilidad: M02, M04, CRUD 03 (clima_hito), Proceso Automatizado 1.

Subtareas técnicas:
1. Programar el Proceso Automatizado 1 que se dispara tras confirmar una ruta en SQLite y consulta Open-Meteo para cada hito horario.
2. CRUD 03 (clima_hito): CREATE (registro de temperatura, lluvia, nieve, viento y niebla por hito), READ (consulta de pronósticos y alertas activas), UPDATE (actualización de variables y severidad), DELETE (purga de registros de trayectos descartados).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Generación desasistida de alertas climáticas por hito horario
  Dado que el usuario confirma y registra una ruta definitiva en la base de datos
  Cuando finaliza el guardado de los hitos horarios con sus respectivas ETA
  Entonces el proceso en segundo plano consulta Open-Meteo e inserta automáticamente los registros de previsión y nivel de alerta en clima_hito."
17,TTTRUCKS-17,Story,Motor Normativo de Tacógrafo CE 561/2006 y Tiempos de Conducción (CRUD 10),,103,"Clima Open-Meteo, Tacógrafo UE y Taller",Highest,6,"Sprint 3 (Clima, Tacógrafo y Mantenimiento)",2026-12-10,2026-12-23,M08-Tacografo-Taller,Sprint-3;M08;CRUD-10;Tacografo;CE-561-2006,"Como Conductor Profesional, quiero que el planificador compute mis tiempos de conducción e inserte automáticamente pausas reglamentarias de 45 minutos tras un máximo de 4h 30m de conducción continua y descansos diarios de 11 horas según el Reglamento (CE) 561/2006, gestionando el CRUD de reg_tacografo.

Trazabilidad: M08, CRUD 10 (reg_tacografo).

Subtareas técnicas:
1. Implementar el motor de reglas del Reglamento (CE) 561/2006 (límite de 4h 30m continua -> pausa 45m; descanso diario obligatorio de 11h).
2. CRUD 10 (reg_tacografo): CREATE (registro de conducción, pausa 45m, descanso 11h), READ (consulta de acumulados e infracciones), UPDATE (regularización justificada de bloques), DELETE (borrado de simulaciones no confirmadas).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Inserción obligatoria de pausa reglamentaria según CE 561/2006
  Dado un trayecto planificado de 6 horas de conducción para un conductor asignado
  Cuando el motor normativo de tacógrafo procesa el itinerario
  Entonces inserta obligatoriamente una pausa de 45 minutos al cumplirse las 4h 30m de conducción y guarda los bloques en reg_tacografo."
18,TTTRUCKS-18,Story,Gestión de Mantenimiento Preventivo y Órdenes de Taller (CRUD 09),,103,"Clima Open-Meteo, Tacógrafo UE y Taller",Medium,3,"Sprint 3 (Clima, Tacógrafo y Mantenimiento)",2026-12-10,2026-12-23,M08-Tacografo-Taller,Sprint-3;M08;CRUD-09;Mantenimiento;Taller,"Como Administrador de Flota, quiero programar revisiones mecánicas preventivas por fecha límite o umbral de kilometraje y gestionar las órdenes de taller de cada vehículo para mantener la operatividad del parque móvil.

Trazabilidad: M08, CRUD 09 (mantenimiento).

Subtareas técnicas:
1. CRUD 09 (mantenimiento): CREATE (programación por fecha o umbral de km), READ (consulta de plan preventivo e historial por vehículo), UPDATE (cierre de orden con coste, piezas y próximo km), DELETE (cancelación o baja lógica de órdenes no ejecutadas).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Programación y cierre de orden de mantenimiento preventivo
  Dado un vehículo registrado en la flota
  Cuando se crea una orden preventiva en mantenimiento y posteriormente se cierra indicando coste, piezas reemplazadas y próximo kilometraje
  Entonces queda registrado el historial de taller del vehículo y se actualiza su próximo umbral de revisión."
19,TTTRUCKS-19,Story,[VALIDACIÓN S3] Validación del Proceso Automatizado de Clima y Reglas del Tacógrafo UE (CP-03 y CP-06),,106,"Verificación, Validación (Vitest) y Release",Highest,3,"Sprint 3 (Clima, Tacógrafo y Mantenimiento)",2026-12-10,2026-12-23,QA-Validacion,Sprint-3;Validacion;Vitest;CP-03;CP-06;Clima;Tacografo,"Como ingeniero de V&V, quiero verificar mediante pruebas automatizadas la inserción desasistida de pronósticos de Open-Meteo por hito horario y el cumplimiento normativo del Reglamento (CE) 561/2006 sobre el motor de tacógrafo.

Trazabilidad: Sección 11.1, CP-03 y CP-06.

Subtareas de validación:
1. Ejecutar CP-03: Confirmación de ruta y disparo del proceso automático de consulta a Open-Meteo por cada hito horario.
2. Ejecutar CP-06: Planificación de trayecto de 6 horas de conducción y verificación de pausa a las 4h 30m y descanso de 11h.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación de los casos de prueba CP-03 y CP-06
  Dado el entorno de pruebas del Sprint 3
  Cuando se ejecutan los casos CP-03 y CP-06 en Vitest
  Entonces se verifica la inserción autónoma de variables climáticas en clima_hito y la creación obligatoria de la pausa de 45 min en reg_tacografo."
20,TTTRUCKS-20,Story,Catálogo MITECO y Proceso Automatizado 2 de Gasolinera Óptima en Ruta (CRUD 04),,104,Combustible MITECO y Repostajes,Highest,6,Sprint 4 (Repostaje MITECO y Suite de Pruebas),2026-12-24,2027-01-13,M03-Combustible;M04-Persistencia-SQLite,Sprint-4;M03;CRUD-04;Proceso-2;MITECO;Gasolineras,"Como usuario de ruta, quiero que un proceso desasistido escanee las estaciones del catálogo oficial del MITECO (> 10.000 estaciones) ubicadas en un corredor de 20 km alrededor del trazado OSRM, pondere el precio oficial frente al coste kilométrico del desvío e inserte autónomamente en la BBDD la estación más económica.

Trazabilidad: M03, M04, CRUD 04 (estacion_serv), Proceso Automatizado 2.

Subtareas técnicas:
1. Implementar la ingesta y validación de vigencia (< 24h) del catálogo oficial del MITECO.
2. Programar el Proceso Automatizado 2 de filtrado espacial (corredor de 20 km) y función de coste neto combinado (precio/litro + desvío en km).
3. CRUD 04 (estacion_serv): CREATE (alta en catálogo local con coordenadas y tarifa MITECO), READ (listado en ruta ordenado por coste neto y desvío), UPDATE (actualización de precios diésel/AdBlue y estado), DELETE (baja lógica o exclusión del motor).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Selección matemática de la estación de servicio de menor coste neto
  Dado un trazado vial confirmado y el catálogo de precios del MITECO con antigüedad inferior a 24 horas
  Cuando se ejecuta el proceso automatizado de escaneo en el corredor de 20 km
  Entonces el sistema identifica e inserta en estacion_serv la parada de menor coste neto considerando el desvío kilométrico."
21,TTTRUCKS-21,Story,Gestión de Tickets de Repostaje y Consumos de Combustible (CRUD 05),,104,Combustible MITECO y Repostajes,High,4,Sprint 4 (Repostaje MITECO y Suite de Pruebas),2026-12-24,2027-01-13,M03-Combustible;M11-Reportes,Sprint-4;M03;CRUD-05;Repostajes;Consumos,"Como Conductor o Administrador, quiero gestionar los tickets de repostaje registrando litros, precio por litro, coste total y lectura de odómetro para auditar el consumo real por vehículo, conductor y ruta.

Trazabilidad: M03, M11, CRUD 05 (repostaje).

Subtareas técnicas:
1. CRUD 05 (repostaje): CREATE (alta de ticket con litros, precio/litro, coste y odómetro), READ (consulta histórica por vehículo, conductor, ruta y fecha), UPDATE (corrección de litros, importe o km), DELETE (anulación o baja lógica de apuntes erróneos/duplicados).

Criterio de Aceptación (Gherkin - BDD):
Escenario: Registro y cálculo exacto de ticket de repostaje
  Dado un conductor con una ruta activa y una estación de servicio seleccionada
  Cuando da de alta un ticket en la entidad repostaje introduciendo los litros repostados, el precio por litro y el odómetro
  Entonces el sistema calcula exactamente el importe total abonado y persiste el registro vinculado al vehículo y la ruta."
22,TTTRUCKS-22,Story,Batería de Pruebas Transaccionales de las 15 Operaciones CRUD en wa-sqlite (Vitest),,106,"Verificación, Validación (Vitest) y Release",Highest,5,Sprint 4 (Repostaje MITECO y Suite de Pruebas),2026-12-24,2027-01-13,QA-Validacion;M04-Persistencia-SQLite,Sprint-4;Vitest;15-CRUD;Benchmark;Cobertura,"Como desarrollador, quiero programar la batería de pruebas automatizadas en Vitest que ejecute secuencialmente CREATE, READ, UPDATE y DELETE sobre las 15 entidades del esquema en wa-sqlite y evalúe el benchmark de 1.000 registros para superar el 25% de cobertura de código.

Trazabilidad: Sección 11.1, 11.3 y 11.5.

Subtareas técnicas:
1. Implementar los tests transaccionales de las 15 entidades CRUD verificando integridad referencial y borrados lógicos/en cascada.
2. Programar el benchmark de inserción y consulta filtrada de 1.000 registros en menos de 100 ms.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Ejecución de ciclo CRUD de las 15 entidades y benchmark en OPFS
  Dado el entorno de pruebas automatizadas Vitest
  Cuando se ejecuta la suite transaccional sobre las 15 tablas y el test de carga de 1.000 registros
  Entonces el 100% de las operaciones se confirman en menos de 100 ms con integridad referencial intacta y cobertura automatizada superior al 25%."
23,TTTRUCKS-23,Story,[VALIDACIÓN S4] Certificación de la Suite Vitest de extremo a extremo (CP-01 a CP-08),,106,"Verificación, Validación (Vitest) y Release",Highest,5,Sprint 4 (Repostaje MITECO y Suite de Pruebas),2026-12-24,2027-01-13,QA-Validacion,Sprint-4;Validacion;Vitest;CP-01;CP-04;CI-CD,"Como responsable de V&V, quiero ejecutar y certificar conjuntamente los casos de prueba formales CP-01 a CP-08 en el pipeline de GitHub Actions para dejar validada toda la lógica de negocio, algoritmos y persistencia al cierre del Sprint 4.

Trazabilidad: Sección 11.6 (CP-01 a CP-08) y Sprint 4.

Subtareas de validación:
1. Ejecutar y verificar CP-01 (15 CRUD < 100 ms) y CP-04 (Búsqueda MITECO en corredor 20 km y alta de repostaje).
2. Ejecutar en regresión conjunta CP-01, CP-02, CP-03, CP-04, CP-05, CP-06, CP-07 y CP-08 en GitHub Actions.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Superación íntegra de los casos CP-01 a CP-08 en CI/CD
  Dado el pipeline de integración continua en GitHub Actions
  Cuando se dispara la batería completa de pruebas correspondientes a CP-01 hasta CP-08
  Entonces los 8 casos formales de prueba pasan al 100% sin fallos ni regresiones y se supera el umbral del 25% de cobertura."
24,TTTRUCKS-24,Story,"Generador de Reportes Operativos, Exportación CSV y Dashboard de KPIs (CRUD 15)",,105,"Reportes CSV, KPIs y Resguardo Cloudflare R2",High,5,"Sprint 5 (Reportes, Estadísticas y Resguardo R2)",2027-01-14,2027-01-27,M11-Reportes,Sprint-5;M11;CRUD-15;Reportes;CSV;Dashboard;KPIs,"Como Administrador, quiero gestionar la generación, parametrización y borrado de informes operativos de rutas y consumos (reporte), exportarlos a formato CSV incluyendo la cabecera fiscal de la organización, y consultar un panel estadístico con los KPIs de explotación de la flota.

Trazabilidad: M11, CRUD 15 (reporte).

Subtareas técnicas:
1. CRUD 15 (reporte): CREATE (generación y guardado según filtros), READ (visualización de reportes, KPIs del dashboard y exportación a CSV), UPDATE (modificación de parámetros de fecha, vehículo o agrupación), DELETE (eliminación de reportes o plantillas).
2. Inyectar dinámicamente los datos fiscales y corporativos de la tabla organizacion en las cabeceras de los informes.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Generación y exportación a CSV de reporte con cabecera corporativa
  Dado un conjunto de rutas y repostajes registrados en la base de datos local
  Cuando el usuario genera un informe filtrado en la entidad reporte y pulsa exportar a CSV
  Entonces se descarga el archivo CSV estructurado y se presenta en pantalla el informe con la cabecera actualizada de organizacion y los KPIs de flota."
25,TTTRUCKS-25,Story,Visor de Inspección de Auditoría y Purga Controlada para Administrador (CRUD 13 - UI),,101,"Arquitectura Local-First, RBAC y Auditoría",High,4,"Sprint 5 (Reportes, Estadísticas y Resguardo R2)",2027-01-14,2027-01-27,M09-Usuarios-RBAC-Auditoria,Sprint-5;M09;CRUD-13;Visor-Auditoria;RNF-06,"Como Administrador de Flota (ROL_ADMIN), quiero disponer de un visor exclusivo con filtros por fecha, usuario, entidad y tipo de operación para inspeccionar la tabla log_auditoria, marcar alertas de seguridad revisadas y ejecutar purgas controladas tras su resguardo en Cloudflare R2.

Trazabilidad: M09, CRUD 13 (log_auditoria - READ, UPDATE, DELETE), RNF-06.

Subtareas técnicas:
1. Implementar la interfaz de consulta filtrada (READ) de log_auditoria con visor de diferencias JSON (valor_anterior vs valor_nuevo).
2. Implementar el marcado de revisión de seguridad (UPDATE) y la purga controlada post-volcado verificado en R2 (DELETE), exclusivo para ROL_ADMIN.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Inspección filtrada y purga controlada del log de auditoría
  Dado un usuario autenticado con ROL_ADMIN en el visor de auditoría
  Cuando filtra registros por entidad o usuario, marca una alerta como revisada o solicita purgar registros ya respaldados en R2
  Entonces el sistema muestra el detalle JSON completo de cada evento y permite la purga únicamente si consta un backup íntegro en Cloudflare R2."
26,TTTRUCKS-26,Story,Proceso Automatizado 3: Sincronización Local-First y Resguardo en Cloudflare R2,,105,"Reportes CSV, KPIs y Resguardo Cloudflare R2",Highest,6,"Sprint 5 (Reportes, Estadísticas y Resguardo R2)",2027-01-14,2027-01-27,M04-Persistencia-SQLite;M09-Usuarios-RBAC-Auditoria,Sprint-5;M04;M09;Proceso-3;Cloudflare-R2;Gzip;SHA-256;RNF-04,"Como Administrador, quiero que al iniciar la aplicación (cuando hayan transcurrido más de 24 horas desde el último resguardo) un proceso autónomo sincronice los historiales de rutas, consumos y log_auditoria hacia un archivo JSON comprimido con Gzip y verificado con hash SHA-256 en Cloudflare R2.

Trazabilidad: M04, M09, RNF-04, Proceso Automatizado 3.

Subtareas técnicas:
1. Programar la exportación serializada de la BBDD local, compresión Gzip en cliente y cálculo de hash SHA-256.
2. Desarrollar el endpoint en Cloudflare Worker conectado al bucket R2 para subida y restauración verificada del paquete .json.gz.
3. Configurar el disparador automático al inicio de la aplicación cuando el último resguardo supere las 24 horas.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Resguardo automático en Cloudflare R2 con verificación SHA-256
  Dado que han transcurrido más de 24 horas desde el último backup y el cliente dispone de conexión
  Cuando se inicia la aplicación Tick Tock Trucks
  Entonces se empaqueta automáticamente la base de datos y log_auditoria en formato .json.gz, se valida su suma SHA-256 y se almacena en Cloudflare R2."
27,TTTRUCKS-27,Story,"[VALIDACIÓN S5] Validación de Reportes Corporativos CSV, Visor de Auditoría y Backup en R2 (CP-09)",,106,"Verificación, Validación (Vitest) y Release",Highest,4,"Sprint 5 (Reportes, Estadísticas y Resguardo R2)",2027-01-14,2027-01-27,QA-Validacion,Sprint-5;Validacion;CP-09;Reportes;Cloudflare-R2,"Como ingeniero de V&V, quiero validar la correcta propagación de los datos fiscales de la organización hacia los reportes exportados a CSV, la seguridad del visor de auditoría para Administrador y la integridad de compresión y firma SHA-256 en Cloudflare R2.

Trazabilidad: Sección 11.4, 11.6 (CP-09) y Sprint 5.

Subtareas de validación:
1. Ejecutar CP-09: Actualización de razón social/CIF en organizacion y exportación de reporte de rutas y consumos a CSV.
2. Simular resguardo y restauración desde Cloudflare R2 comprobando la coincidencia exacta del hash SHA-256.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Certificación del caso de prueba CP-09 e integridad de backup R2
  Dado un cambio en la razón social y CIF dentro de la entidad organizacion
  Cuando se genera y exporta un reporte operativo y se ejecuta el resguardo hacia Cloudflare R2
  Entonces el CSV descargado y la vista en pantalla reflejan la nueva cabecera corporativa y el paquete .json.gz restaurado coincide en su hash SHA-256."
28,TTTRUCKS-28,Story,Despliegue en Producción (ticktocktrucks.com) y Auditoría Final de Código,,106,"Verificación, Validación (Vitest) y Release",Highest,3,Cierre y Release (Verificación Final),2027-01-28,2027-02-03,QA-Validacion,Cierre;Release;Produccion;Deployment,"Como desarrollador único, quiero desplegar la versión final del MVP en el dominio https://ticktocktrucks.com conectada a Cloudflare R2/Workers y al túnel del VPS OSRM, etiquetando la release v1.0.0 en el repositorio oficial de GitHub.

Trazabilidad: Sección 1, 10 y 12 (Cierre y Release).

Subtareas técnicas:
1. Publicar el frontend Vanilla JS y activos PMTiles en producción bajo https://ticktocktrucks.com.
2. Crear el tag v1.0.0 en https://github.com/Kukegeek/47GIIN-Proyecto-3T con todos los checks de GitHub Actions en verde.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Puesta en producción accesible y funcional
  Dado el build final de producción desplegado en https://ticktocktrucks.com
  Cuando un usuario accede desde el navegador web
  Entonces la aplicación inicializa wa-sqlite sobre OPFS sin errores y se comunica correctamente con Cloudflare y el VPS OSRM."
29,TTTRUCKS-29,Story,Redacción de Memoria Técnica Final y Grabación de la Defensa (VIU),,106,"Verificación, Validación (Vitest) y Release",Highest,3,Cierre y Release (Verificación Final),2027-01-28,2027-02-03,QA-Validacion,Cierre;Documentacion;Memoria-Tecnica;Defensa-VIU,"Como alumno de Proyecto de Ingeniería de Software (VIU), quiero consolidar la memoria técnica final con las evidencias de los 15 CRUD, capturas de Jira, reporte de cobertura de Vitest y grabar la defensa del proyecto antes del 3 de febrero de 2027.

Trazabilidad: Sección 12 (Cierre y Release).

Subtareas técnicas:
1. Compilar la memoria técnica final y manuales con las métricas reales obtenidas en los sprints.
2. Grabar el vídeo de demostración y defensa mostrando los casos de uso, el modo offline y la auditoría RBAC.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Entrega académica completa dentro de plazo
  Dado el cierre de las actividades de desarrollo y verificación
  Cuando se revisa el paquete de entrega para la cátedra el 03/02/2027
  Entonces están completos el repositorio GitHub, la URL en producción, la memoria técnica y la grabación de la defensa."
30,TTTRUCKS-30,Story,"[VALIDACIÓN CIERRE] Certificación Integral de Resiliencia 100% Offline, Rendimiento y Regresión (CP-01 a CP-10)",,106,"Verificación, Validación (Vitest) y Release",Highest,3,Cierre y Release (Verificación Final),2027-01-28,2027-02-03,QA-Validacion,Cierre;Validacion;CP-09;CP-10;Offline;Regresion-Final,"Como responsable de V&V, quiero ejecutar las pruebas finales de resiliencia 100% offline con corte de red y posterior reconexión con backup a R2 (CP-10), junto con la regresión completa de la matriz CP-01 a CP-10, para certificar la calidad definitiva del producto antes de la entrega.

Trazabilidad: Sección 11.3, 11.4, 11.6 (CP-01 a CP-10) y Cierre.

Subtareas de validación:
1. Ejecutar CP-10: Corte de red (modo avión), autenticación local, ejecución de operaciones CRUD sobre OPFS, exportación CSV y posterior reconexión con sincronización a Cloudflare R2.
2. Verificar la matriz completa de casos de prueba (CP-01 a CP-10) sin errores pendientes.

Criterio de Aceptación (Gherkin - BDD):
Escenario: Operación 100% Offline y reconexión segura sin colisiones (CP-10)
  Dado el navegador en modo avión (sin conexión a Internet)
  Cuando el usuario inicia sesión localmente, ejecuta operaciones CRUD en wa-sqlite, exporta un CSV y luego restablece la conexión de red
  Entonces toda la operativa offline funciona sin errores y al recuperar red se sube automáticamente el archivo .json.gz a Cloudflare R2 validando el hash SHA-256 sin pérdida ni colisión de claves primarias."
