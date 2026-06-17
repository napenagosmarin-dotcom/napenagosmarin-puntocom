const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function migrate() {
  console.log('Conectando a la base de datos de Railway (Red Interna)...');
  
  // Utiliza la URL interna que provee Railway nativamente, o las variables locales
  const dbUrl = process.env.MYSQL_URL || `mysql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

  const connection = await mysql.createConnection({
    uri: dbUrl,
    multipleStatements: true
  });

  console.log('¡Conexión exitosa!');

  const tablesToDrop = ['detallereservacabana', 'detallereservahabitacion', 'detallereservaservicio', 'reserva', 'paquetes', 'habitacion', 'cabanas', 'servicios', 'clientes', 'roles', 'metodopago', 'estadosreserva'];
  
  await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
  for (const table of tablesToDrop) {
      console.log(`Dropping ${table}...`);
      await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
  }
  await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

  const files = [
    'seed.sql'
  ];

  for (const file of files) {
    console.log(`\nProcesando ${file}...`);
    try {
      const sql = await fs.readFile(path.join(__dirname, file), 'utf8');
      
      if (sql.trim().length > 0) {
        await connection.query(sql);
        console.log(`✅ ${file} ejecutado correctamente.`);
      } else {
        console.log(`⚠️ ${file} está vacío.`);
      }
    } catch (err) {
      console.error(`❌ Error ejecutando ${file}:`, err.message);
    }
  }

  console.log('\nCerrando conexión...');
  await connection.end();
  console.log('✅ Migración finalizada.');
}

migrate().catch(console.error);
