const mysql = require('mysql2/promise');

async function updateAdmin() {
  const connectionString = 'mysql://root:lAwqInvzIFcpaKPyzHwDCsjzddUtGfEY@junction.proxy.rlwy.net:3306/railway';
  try {
    const connection = await mysql.createConnection(connectionString);
    console.log('Conectado a Railway.');
    
    const [result] = await connection.query("UPDATE usuarios SET IDRol = 2 WHERE Email = 'godienser@gmail.com'");
    console.log('Resultado del UPDATE:', result);
    
    const [rows] = await connection.query("SELECT IDUsuario, Email, IDRol FROM usuarios WHERE Email = 'godienser@gmail.com'");
    console.log('Usuario actual en DB:', rows[0]);

    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

updateAdmin();
