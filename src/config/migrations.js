const db = require('./db');

const addColumnIfMissing = async (table, column, definition) => {
  const [rows] = await db.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (rows.length === 0) {
    await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`[migration] + ${table}.${column}`);
  }
};

const runMigrations = async () => {
  try {
    // Regla 3: marca de expiración en reservas pendientes (2 horas desde creación)
    await addColumnIfMissing('reserva', 'FechaExpiracion', 'DATETIME NULL');

    // Regla 10: verificación de email para permitir reservas
    await addColumnIfMissing('usuarios', 'EmailVerificado', 'TINYINT(1) NOT NULL DEFAULT 1');

    // Regla 8: historial de cambios de estado en reservas
    await db.query(`
      CREATE TABLE IF NOT EXISTS reserva_historial (
        IDHistorial   INT AUTO_INCREMENT PRIMARY KEY,
        IdReserva     INT NOT NULL,
        EstadoAnterior TINYINT,
        EstadoNuevo   TINYINT NOT NULL,
        FechaCambio   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        ModificadoPor VARCHAR(100),
        Motivo        TEXT,
        INDEX idx_rh_reserva (IdReserva)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('[migration] reserva_historial ready');

    // Columnas de ubicación en usuarios (usadas en registro y perfil de cliente)
    await addColumnIfMissing('usuarios', 'Departamento', 'VARCHAR(100) NULL');
    await addColumnIfMissing('usuarios', 'Municipio',    'VARCHAR(100) NULL');

    // Índice UNIQUE en Email de usuarios (solo si no hay duplicados existentes)
    const [idxRows] = await db.query(
      `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'Email' AND NON_UNIQUE = 0`
    );
    if (idxRows.length === 0) {
      const [[{ dupes }]] = await db.query(
        `SELECT COUNT(*) - COUNT(DISTINCT LOWER(Email)) AS dupes FROM usuarios`
      );
      if (dupes === 0) {
        await db.query(`ALTER TABLE usuarios ADD UNIQUE INDEX idx_usuarios_email (Email)`);
        console.log('[migration] + usuarios.Email UNIQUE');
      } else {
        console.warn(`[migration] Hay ${dupes} email(s) duplicados en usuarios — índice UNIQUE no aplicado`);
      }
    }

    // Estado 'En Proceso' (ID=5) — requerido por el flujo unidireccional de reservas
    await db.query(`
      INSERT INTO estadosreserva (IdEstadoReserva, NombreEstadoReserva)
      VALUES (5, 'En Proceso')
      ON DUPLICATE KEY UPDATE NombreEstadoReserva = NombreEstadoReserva
    `);
    console.log('[migration] estadosreserva: En Proceso (5) ready');

    console.log('[migration] all migrations OK');
  } catch (err) {
    console.error('[migration] Error:', err.message);
  }
};

module.exports = { runMigrations };
