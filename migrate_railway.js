// Script de migración y seed — corre en Railway al iniciar el servidor
// Usa INSERT IGNORE para no duplicar datos si ya existen
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT || 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true
  });

  console.log('DB conectado OK');

  // ── 1. Tablas de catálogo (sin FK) ──────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS roles (
      IDRol   INT AUTO_INCREMENT PRIMARY KEY,
      Nombre  VARCHAR(255),
      Estado  VARCHAR(50),
      IsActive TINYINT(1) DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS estadosreserva (
      IdEstadoReserva     INT AUTO_INCREMENT PRIMARY KEY,
      NombreEstadoReserva VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS metodopago (
      IdMetodoPago  INT AUTO_INCREMENT PRIMARY KEY,
      NomMetodoPago VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // ── 2. Tablas de contenido ───────────────────────────────────────────
  await conn.query(`
    CREATE TABLE IF NOT EXISTS cabanas (
      IDCabana           INT AUTO_INCREMENT PRIMARY KEY,
      NombreCabana       VARCHAR(255) NOT NULL,
      Descripcion        TEXT NULL,
      CapacidadPersonas  INT,
      PrecioNoche        DECIMAL(10,2),
      Estado             INT DEFAULT 1,
      ImagenCabana       VARCHAR(500),
      NumeroHabitaciones INT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS habitacion (
      IDHabitacion    INT AUTO_INCREMENT PRIMARY KEY,
      NombreHabitacion VARCHAR(255) NOT NULL,
      tipo            VARCHAR(50),
      numero          INT,
      Descripcion     TEXT,
      precio          DECIMAL(10,2),
      imagen          VARCHAR(500),
      Costo           DECIMAL(10,2),
      IDCabana        INT,
      Estado          TINYINT(1) NOT NULL DEFAULT 1
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS servicios (
      IDServicio             INT AUTO_INCREMENT PRIMARY KEY,
      nombre                 VARCHAR(255) NOT NULL,
      Descripcion            TEXT NULL,
      precio                 DECIMAL(10,2),
      Duracion               VARCHAR(100),
      CantidadMaximaPersonas INT,
      imagen                 VARCHAR(500),
      Estado                 TINYINT(1) NOT NULL DEFAULT 1,
      Costo                  DECIMAL(10,2)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS paquetes (
      IDPaquete     INT AUTO_INCREMENT PRIMARY KEY,
      nombre        VARCHAR(255) NOT NULL,
      Descripcion   TEXT NULL,
      IDHabitacion  INT,
      IDServicio    INT,
      precio        FLOAT,
      imagen        VARCHAR(500),
      Estado        TINYINT(1) NOT NULL DEFAULT 1,
      IDCabana      INT,
      Descuento     FLOAT DEFAULT 0,
      TipoDescuento VARCHAR(50) DEFAULT 'porcentaje',
      NumeroPersonas INT DEFAULT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  console.log('OK: tablas verificadas');

  // ── 3. Seed de catálogos ─────────────────────────────────────────────
  await conn.query(`
    INSERT IGNORE INTO roles (IDRol, Nombre, Estado, IsActive) VALUES
    (1, 'cliente',       'activo', 0),
    (2, 'administrador', 'activo', 1);
  `);

  await conn.query(`
    INSERT IGNORE INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva) VALUES
    (1, 'Pendiente'),
    (2, 'Confirmada'),
    (3, 'Cancelada'),
    (4, 'Completada'),
    (5, 'En Proceso');
  `);

  await conn.query(`
    INSERT IGNORE INTO metodopago (IdMetodoPago, NomMetodoPago) VALUES
    (1, 'Transferencia'),
    (2, 'Tarjeta de Crédito'),
    (3, 'Tarjeta de Débito'),
    (4, 'Efectivo');
  `);

  console.log('OK: catálogos sembrados');

  // ── 4. Seed de contenido (cabañas, habitaciones, servicios, paquetes) ─
  await conn.query(`
    INSERT IGNORE INTO cabanas (IDCabana, NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, ImagenCabana, Estado, NumeroHabitaciones) VALUES
    (1, 'Cabaña Familiar Bosque Verde', 'Amplia cabaña familiar ideal para disfrutar en grupo, rodeada de naturaleza.', 6, 120000, 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/622764182.jpg?k=f6e684052528eed8cfa20a7a5ded7b4bb77693fe7a39d9a42e2276d4b67f3277&o=', 1, 1),
    (3, 'Cabaña La Montaña',           'Refugio de montaña con decoración rústica, estufa de leña y acceso a senderos ecológicos.', 8, 250000, 'https://images.trvl-media.com/lodging/95000000/94800000/94797300/94797261/f6069e1e.jpg?impolicy=fcrop&w=357&h=201&p=1&q=medium', 1, 1),
    (4, 'Cabaña Los Cedros',           'Espaciosa cabaña familiar con tres habitaciones, barbacoa exterior y jardín privado.', 10, 320000, NULL, 1, 1);
  `);

  await conn.query(`
    INSERT IGNORE INTO habitacion (IDHabitacion, NombreHabitacion, tipo, numero, Descripcion, precio, imagen, Costo, IDCabana, Estado) VALUES
    (5,  'Matrimonial',       'Premium',      NULL, 'Tienda con cama king y vista panorámica',    280000, 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',  NULL, NULL, 1),
    (6,  'Doble',             'Doble',        NULL, 'Habitación con dos camas individuales',      180000, 'https://hotelflamingoinn.com.mx/wp-content/uploads/2021/05/habitacion-ejecuiva-doble-e1632169810237.jpg', NULL, NULL, 1),
    (7,  'Familiar',          'Familiar',     NULL, 'Amplia habitación familiar con zona de estar', 300000, 'https://cdn.easy-rez.com/production/hotels/8700696094450c97c00b7f5c1e216f47/uploads/.rooms/0627388001658265921.jpg', NULL, NULL, 1),
    (8,  'Universitaria',     'Universitaria',NULL, 'Camarotes sencillos',                        350000, 'https://2viajando.com/wp-content/uploads/wood-house-floor-home-cottage-property-1065759-pxhere.com_.jpg', NULL, NULL, 1),
    (9,  'Premium',           'Premium',      NULL, 'Habitación full confort',                    600000, 'https://travelytips.com/wp-content/uploads/2021/04/bio-habitat-1.jpg', NULL, NULL, 1),
    (10, 'Habitacion Japonesa', NULL,         NULL, 'Habitación zen temática asiática',           480000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbmV443G-hfPHEgAwO-8n2WVIwSCDfG5RndQ&s', NULL, NULL, 1);
  `);

  await conn.query(`
    INSERT IGNORE INTO servicios (IDServicio, nombre, Descripcion, precio, Duracion, CantidadMaximaPersonas, imagen, Estado, Costo) VALUES
    (5,  'Masaje Relajante',   'Técnica milenaria para equilibrar cuerpo y mente con aceites esenciales.',      120000, '1 hora',   1,    '',  1, NULL),
    (7,  'Servicio Infantil',  'Servicio especial para los más pequeños de la familia con inflables y entretenimiento para niños.',  80000, '',  NULL, 'https://images.unsplash.com/photo-1765947389722-2e96d8c0aad9?auto=format&fit=crop&w=800&q=80', 1, NULL),
    (8,  'Masaje Chino',       'Enfoque terapéutico para mejorar el rendimiento y aliviar dolores musculares.', 430000, '2 horas',  3,    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfs9-q-lEcUjFQgDSEkfJ259j5inSQ7kXcKg&s', 1, NULL),
    (9,  'Masaje Deportivo',   'Ambiente exclusivo con velas y selección de aceites premium.',                    80000, '',         NULL, 'https://ecopostural.com/wp-content/uploads/2024/02/Beneficios_masaje_deportivo-Ecopostural.jpg', 1, NULL),
    (10, 'Cena Romántica',     'Circuito completo de relajación con sauna, turco y exfoliación corporal.',      150000, '',         2,    'https://i.pinimg.com/736x/c1/29/7f/c1297f095d5dc0cd72c32c93713d5a48.jpg', 1, NULL),
    (11, 'Spa Premium',        'Servicio completo de spa con jacuzzi y tratamientos especiales.',                500000, '',         1,    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf2sOIDjDMTjB7lPFBDjcILH9Xs2OOA9FeQw&s', 1, NULL);
  `);

  await conn.query(`
    INSERT IGNORE INTO paquetes (IDPaquete, nombre, Descripcion, IDHabitacion, IDServicio, precio, imagen, Estado, IDCabana, Descuento, TipoDescuento) VALUES
    (5, 'Paquete Relax',    'Tienda de lujo con masaje y jacuzzi',   5,    5,    470000,  '', 1, NULL, 0, 'porcentaje'),
    (6, 'Paquete El Venado','Experiencia única en contacto con la naturaleza, avistamiento de venados y actividades ecológicas.', NULL, NULL, 1900000, 'https://thumbs.dreamstime.com/b/venado-masculino-realista-388456964.jpg', 1, NULL, 0, 'porcentaje'),
    (7, 'Toro Mecánico',    'Paquete de adrenalina con toro mecánico y actividades de entretenimiento.',                          NULL, NULL, 700000,  'https://www.pobladomedieval.es/wp-content/uploads/2022/09/toromecanico.jpg', 1, NULL, 0, 'porcentaje'),
    (8, 'Paquete Viajero',  'Paquete económico para viajeros independientes con las mejores experiencias.', NULL, NULL, 500000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDsdJCm65xFMI3V0L1hxo2_3kUYQ3Aw7f5DA&s', 1, NULL, 0, 'porcentaje');
  `);

  console.log('OK: contenido sembrado (cabañas, habitaciones, servicios, paquetes)');

  // ── 5. Migraciones de esquema (columnas añadidas en sprints anteriores) ─
  // ALTER TABLE sin IF NOT EXISTS (MySQL 5.7 no lo soporta); ignoramos error de columna duplicada
  try {
    await conn.query(`ALTER TABLE \`usuarios\` ADD COLUMN \`Departamento\` VARCHAR(100) NULL DEFAULT NULL AFTER \`Pais\``);
  } catch(e) { /* columna ya existe */ }
  try {
    await conn.query(`ALTER TABLE \`usuarios\` ADD COLUMN \`Municipio\` VARCHAR(100) NULL DEFAULT NULL AFTER \`Departamento\``);
  } catch(e) { /* columna ya existe */ }
  try {
    await conn.query(`ALTER TABLE \`paquetes\` ADD COLUMN \`NumeroPersonas\` INT NULL DEFAULT NULL AFTER \`TipoDescuento\``);
  } catch(e) { /* columna ya existe */ }

  console.log('OK: migraciones de esquema completadas');

  // ── 6. Asegurar admin ────────────────────────────────────────────────
  await conn.query(`UPDATE usuarios SET IDRol = 2 WHERE Email = 'godienser@gmail.com'`);

  await conn.end();
  console.log('✓ migrate_railway.js finalizado correctamente.');
}

run()
  .then(() => process.exit(0))
  .catch(e => {
    console.error('ADVERTENCIA migrate_railway.js — continuando de todos modos:', e.message);
    process.exit(0); // salir limpio para que "; node server.js" pueda arrancar
  });
