// Script de migración — usar con variables de entorno, no credenciales en duro
// node migrate_railway.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });

  console.log('Conectado OK');

  await conn.query(`
    ALTER TABLE \`usuarios\`
    ADD COLUMN IF NOT EXISTS \`Departamento\` VARCHAR(100) NULL DEFAULT NULL AFTER \`Pais\`,
    ADD COLUMN IF NOT EXISTS \`Municipio\`    VARCHAR(100) NULL DEFAULT NULL AFTER \`Departamento\`
  `);
  console.log('OK: Departamento y Municipio en usuarios');

  await conn.query(`
    ALTER TABLE \`paquetes\`
    ADD COLUMN IF NOT EXISTS \`NumeroPersonas\` INT NULL DEFAULT NULL AFTER \`TipoDescuento\`
  `);
  console.log('OK: NumeroPersonas en paquetes');

  await conn.end();
  console.log('Migraciones completadas.');
}

run().catch(e => console.error('ERROR:', e.message));
