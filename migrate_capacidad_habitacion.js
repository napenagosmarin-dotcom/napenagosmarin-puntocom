const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'aura',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log("Agregando columna CapacidadPersonas a la tabla habitacion...");
        try {
            await db.query(
                `ALTER TABLE habitacion ADD COLUMN CapacidadPersonas INT NOT NULL DEFAULT 1 AFTER Costo`
            );
            console.log("¡Columna CapacidadPersonas agregada exitosamente!");
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log("La columna CapacidadPersonas ya existe, no se hizo ningún cambio.");
            } else {
                throw e;
            }
        }
    } catch (e) {
        console.error("Error durante la migración:", e.message);
    } finally {
        await db.end();
        console.log("Conexión cerrada.");
    }
}

run();
