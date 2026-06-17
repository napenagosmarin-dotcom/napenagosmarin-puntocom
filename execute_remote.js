// Usando fetch nativo
async function executeQuery(sql) {
    const url = new URL('https://ficha3312967aura-production.up.railway.app/api/auth/query');
    url.searchParams.append('sql', sql);
    console.log(`Ejecutando: ${sql.substring(0, 50)}...`);
    try {
        const response = await fetch(url);
        const text = await response.text();
        try {
            console.log(JSON.parse(text));
        } catch(e) {
            console.log(text);
        }
    } catch(err) {
        console.error(err);
    }
}

async function run() {
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('Godie777-', 10);
    
    await executeQuery('SET FOREIGN_KEY_CHECKS = 0');
    
    // Actualizar contrasena de id 17 y id 16
    await executeQuery(`UPDATE usuarios SET Contrasena = '${hash}', IDRol = 2 WHERE IDUsuario IN (16, 17)`);
    
    await executeQuery('SET FOREIGN_KEY_CHECKS = 1');
    
    await executeQuery('SELECT IDUsuario, Email, IDRol, Contrasena FROM usuarios WHERE Email = "godienser@gmail.com"');
}

run();
