-- =====================================================================
-- Tick Tock Trucks (3T) - Esquema Relacional DDL en 3FN (15 Entidades)
-- Persistencia Local-First sobre SQLite
-- =====================================================================

PRAGMA foreign_keys = ON;

-- 1. Organizacion (CRUD 14)
CREATE TABLE IF NOT EXISTS organizacion (
    id_organizacion INTEGER PRIMARY KEY AUTOINCREMENT,
    cif TEXT NOT NULL UNIQUE,
    razon_social TEXT NOT NULL,
    direccion TEXT,
    cp TEXT,
    ciudad TEXT,
    provincia TEXT,
    telefono TEXT,
    email TEXT,
    logo_url TEXT,
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 2. Roles y Permisos (CRUD 12)
CREATE TABLE IF NOT EXISTS rol_permiso (
    id_permiso INTEGER PRIMARY KEY AUTOINCREMENT,
    rol TEXT NOT NULL,
    modulo TEXT NOT NULL,
    puede_crear INTEGER NOT NULL DEFAULT 0,
    puede_leer INTEGER NOT NULL DEFAULT 1,
    puede_actualizar INTEGER NOT NULL DEFAULT 0,
    puede_eliminar INTEGER NOT NULL DEFAULT 0,
    UNIQUE(rol, modulo)
);

-- 3. Usuarios y Autenticacion (CRUD 11)
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellidos TEXT,
    email TEXT UNIQUE,
    rol TEXT NOT NULL DEFAULT 'ROL_CONDUCTOR',
    activo INTEGER NOT NULL DEFAULT 1,
    ultimo_login TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 4. Log de Auditoria Inmutable (CRUD 13)
CREATE TABLE IF NOT EXISTS log_auditoria (
    id_log INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER,
    username TEXT NOT NULL,
    rol_ejecutor TEXT NOT NULL,
    accion TEXT NOT NULL,
    entidad TEXT NOT NULL,
    id_registro TEXT,
    valor_anterior TEXT,
    valor_nuevo TEXT,
    timestamp_utc TEXT NOT NULL DEFAULT (datetime('now')),
    origen_sesion TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- 5. Cabezas Tractoras / Vehiculos (CRUD 06)
CREATE TABLE IF NOT EXISTS vehiculo (
    id_vehiculo INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT NOT NULL UNIQUE,
    marca TEXT NOT NULL,
    modelo TEXT NOT NULL,
    mma REAL NOT NULL,
    consumo_medio REAL NOT NULL DEFAULT 30.0,
    km_actuales REAL NOT NULL DEFAULT 0,
    id_conductor INTEGER,
    estado TEXT NOT NULL DEFAULT 'ACTIVO',
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (id_conductor) REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

-- 6. Semirremolques (CRUD 07)
CREATE TABLE IF NOT EXISTS remolque (
    id_remolque INTEGER PRIMARY KEY AUTOINCREMENT,
    matricula TEXT NOT NULL UNIQUE,
    tipo_caja TEXT NOT NULL,
    num_ejes INTEGER NOT NULL DEFAULT 3,
    carga_max REAL NOT NULL,
    id_vehiculo INTEGER,
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE SET NULL
);

-- 7. Documentacion y Vencimientos (CRUD 08)
CREATE TABLE IF NOT EXISTS documento (
    id_documento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vehiculo INTEGER,
    id_remolque INTEGER,
    id_usuario INTEGER,
    tipo_documento TEXT NOT NULL,
    numero_poliza_o_doc TEXT,
    fecha_emision TEXT,
    fecha_vencimiento TEXT NOT NULL,
    coste REAL DEFAULT 0.0,
    estado_semaforo TEXT NOT NULL DEFAULT 'VERDE',
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
    FOREIGN KEY (id_remolque) REFERENCES remolque(id_remolque) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE CASCADE
);

-- 8. Mantenimiento Preventivo y Taller (CRUD 09)
CREATE TABLE IF NOT EXISTS mantenimiento (
    id_mantenimiento INTEGER PRIMARY KEY AUTOINCREMENT,
    id_vehiculo INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    km_programado REAL,
    fecha_programada TEXT,
    fecha_ejecucion TEXT,
    coste REAL DEFAULT 0.0,
    piezas_reemplazadas TEXT,
    proximo_km REAL,
    estado TEXT NOT NULL DEFAULT 'PROGRAMADO',
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE
);

-- 9. Rutas (CRUD 01)
CREATE TABLE IF NOT EXISTS ruta (
    id_ruta INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_vehiculo INTEGER,
    id_remolque INTEGER,
    nombre_ruta TEXT NOT NULL,
    origen_texto TEXT NOT NULL,
    origen_cp TEXT,
    origen_lat REAL NOT NULL,
    origen_lon REAL NOT NULL,
    destino_texto TEXT NOT NULL,
    destino_cp TEXT,
    destino_lat REAL NOT NULL,
    destino_lon REAL NOT NULL,
    distancia_km REAL NOT NULL,
    duracion_segundos INTEGER NOT NULL,
    geometria_osrm TEXT,
    fecha_salida TEXT NOT NULL,
    fecha_llegada_estimada TEXT,
    estado TEXT NOT NULL DEFAULT 'PLANIFICADA',
    activo INTEGER NOT NULL DEFAULT 1,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE SET NULL,
    FOREIGN KEY (id_remolque) REFERENCES remolque(id_remolque) ON DELETE SET NULL
);

-- 10. Hitos de Ruta (CRUD 02)
CREATE TABLE IF NOT EXISTS hito_ruta (
    id_hito INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ruta INTEGER NOT NULL,
    orden INTEGER NOT NULL,
    tipo_hito TEXT NOT NULL DEFAULT 'PARADA',
    poblacion TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    eta_estimada TEXT NOT NULL,
    tiempo_estancia_min INTEGER NOT NULL DEFAULT 0,
    comentarios TEXT,
    FOREIGN KEY (id_ruta) REFERENCES ruta(id_ruta) ON DELETE CASCADE
);

-- 11. Clima por Hito (CRUD 03 - Proceso 1)
CREATE TABLE IF NOT EXISTS clima_hito (
    id_clima INTEGER PRIMARY KEY AUTOINCREMENT,
    id_hito INTEGER NOT NULL,
    temperatura REAL,
    viento_kmh REAL,
    precipitacion_mm REAL,
    prob_nieve INTEGER,
    niebla INTEGER DEFAULT 0,
    nivel_alerta TEXT NOT NULL DEFAULT 'VERDE',
    descripcion_tiempo TEXT,
    consultado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (id_hito) REFERENCES hito_ruta(id_hito) ON DELETE CASCADE
);

-- 12. Estaciones de Servicio MITECO (CRUD 04 - Proceso 2)
CREATE TABLE IF NOT EXISTS estacion_serv (
    id_estacion INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_miteco TEXT UNIQUE,
    rotulo TEXT NOT NULL,
    direccion TEXT NOT NULL,
    localidad TEXT,
    provincia TEXT,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    precio_gasoleo_a REAL NOT NULL,
    precio_adblue REAL DEFAULT 0.0,
    desvio_km REAL DEFAULT 0.0,
    coste_neto REAL DEFAULT 0.0,
    vigencia_precios TEXT NOT NULL,
    activo INTEGER NOT NULL DEFAULT 1
);

-- 13. Repostajes y Tickets (CRUD 05)
CREATE TABLE IF NOT EXISTS repostaje (
    id_repostaje INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ruta INTEGER,
    id_vehiculo INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    id_estacion INTEGER,
    fecha_hora TEXT NOT NULL DEFAULT (datetime('now')),
    litros REAL NOT NULL,
    precio_litro REAL NOT NULL,
    importe_total REAL NOT NULL,
    odometro_km REAL NOT NULL,
    num_ticket TEXT,
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_ruta) REFERENCES ruta(id_ruta) ON DELETE SET NULL,
    FOREIGN KEY (id_vehiculo) REFERENCES vehiculo(id_vehiculo) ON DELETE RESTRICT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_estacion) REFERENCES estacion_serv(id_estacion) ON DELETE SET NULL
);

-- 14. Registros de Tacografo CE 561/2006 (CRUD 10)
CREATE TABLE IF NOT EXISTS reg_tacografo (
    id_tacografo INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_ruta INTEGER,
    tipo_actividad TEXT NOT NULL,
    inicio_utc TEXT NOT NULL,
    fin_utc TEXT,
    duracion_segundos INTEGER,
    acumulado_conduccion_seg INTEGER NOT NULL DEFAULT 0,
    alerta_infraccion TEXT,
    motivo_regularizacion TEXT,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_ruta) REFERENCES ruta(id_ruta) ON DELETE CASCADE
);

-- 15. Reportes y KPIs (CRUD 15)
CREATE TABLE IF NOT EXISTS reporte (
    id_reporte INTEGER PRIMARY KEY AUTOINCREMENT,
    id_usuario INTEGER NOT NULL,
    id_organizacion INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    tipo_reporte TEXT NOT NULL,
    filtros_json TEXT NOT NULL,
    datos_csv TEXT,
    kpis_json TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    activo INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario) ON DELETE RESTRICT,
    FOREIGN KEY (id_organizacion) REFERENCES organizacion(id_organizacion) ON DELETE RESTRICT
);

-- Indices para optimizacion de consultas
CREATE INDEX IF NOT EXISTS idx_log_entidad ON log_auditoria(entidad, timestamp_utc);
CREATE INDEX IF NOT EXISTS idx_vehiculo_matricula ON vehiculo(matricula);
CREATE INDEX IF NOT EXISTS idx_documento_vencimiento ON documento(fecha_vencimiento, estado_semaforo);
CREATE INDEX IF NOT EXISTS idx_mantenimiento_vehiculo ON mantenimiento(id_vehiculo, estado);
CREATE INDEX IF NOT EXISTS idx_ruta_usuario_fecha ON ruta(id_usuario, fecha_salida);
CREATE INDEX IF NOT EXISTS idx_hito_ruta_orden ON hito_ruta(id_ruta, orden);
CREATE INDEX IF NOT EXISTS idx_clima_hito ON clima_hito(id_hito);
CREATE INDEX IF NOT EXISTS idx_estacion_combustible ON estacion_serv(precio_gasoleo_a, coste_neto);
CREATE INDEX IF NOT EXISTS idx_repostaje_vehiculo ON repostaje(id_vehiculo, fecha_hora);
CREATE INDEX IF NOT EXISTS idx_tacografo_usuario ON reg_tacografo(id_usuario, inicio_utc);
CREATE INDEX IF NOT EXISTS idx_reporte_org ON reporte(id_organizacion, creado_en);

-- Triggers de Inmutabilidad Estricta (TTTRUCKS-30: Subtarea TTTRUCKS-33)
CREATE TRIGGER IF NOT EXISTS trg_inmutabilidad_update_log_auditoria
BEFORE UPDATE ON log_auditoria
BEGIN
    SELECT RAISE(FAIL, '403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). No se permiten modificaciones.');
END;

CREATE TRIGGER IF NOT EXISTS trg_inmutabilidad_delete_log_auditoria
BEFORE DELETE ON log_auditoria
BEGIN
    SELECT RAISE(FAIL, '403 Forbidden: La tabla log_auditoria es estrictamente inmutable (append-only). No se permite el borrado de registros.');
END;
