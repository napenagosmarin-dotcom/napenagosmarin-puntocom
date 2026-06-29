const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

console.log('ENV | RESEND_API_KEY:', !!process.env.RESEND_API_KEY);
console.log('ENV | DB_HOST:', process.env.DB_HOST || '(no definido)');
console.log('ENV | DB_PORT:', process.env.DB_PORT || '(no definido)');
console.log('ENV | DB_USER:', process.env.DB_USER || '(no definido)');
console.log('ENV | DB_PASS:', !!process.env.DB_PASS);
console.log('ENV | FRONTEND_URL:', process.env.FRONTEND_URL || '(no definido)');
console.log('ENV | BACKEND_URL:', process.env.BACKEND_URL || '(no definido)');

const app = express();

// ===== IMPORTAR RUTAS =====
const habitacionRoutes      = require('./src/routes/habitacion.routes.js');
const serviciosRoutes       = require('./src/routes/servicios.Routes.js');
const paqueteRoutes         = require('./src/routes/paquete.routes.js');
const clientesRoutes        = require('./src/routes/clientes.routes.js');
const cabanaRoutes          = require('./src/routes/cabanas.routes.js');
const authRoutes            = require('./src/routes/auth.routes');
const reservationRoutes     = require('./src/routes/reservation.routes');
const metodoPagoRoutes      = require('./src/routes/metodopago.routes');
const estadosReservaRoutes  = require('./src/routes/estadosreserva.routes');
const usuariosRoutes        = require('./src/routes/usuarios.routes');
const dashboardRoutes       = require('./src/routes/dashboard.routes');

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());

// ===== RUTAS API (ANTES de archivos estáticos) =====
app.use('/api/habitaciones',    habitacionRoutes);
app.use('/api/servicios',       serviciosRoutes);
app.use('/api/paquetes',        paqueteRoutes);
app.use('/api/clientes',        clientesRoutes);
app.use('/api/cabanas',         cabanaRoutes);
app.use('/api/auth',            authRoutes);
app.use('/api/reservas',        reservationRoutes);
app.use('/api/metodopago',      metodoPagoRoutes);
app.use('/api/estadosreserva',  estadosReservaRoutes);
app.use('/api/usuarios',        usuariosRoutes);
app.use('/api/dashboard',       dashboardRoutes);

// ===== RUTAS DE VISTA (OPCIONAL: RUTAS LIMPIAS) =====
app.get('/reset-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'src', 'pages', 'reset-password.html'));
});

// ===== HEALTH CHECK =====
app.get('/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ===== ARCHIVOS ESTÁTICOS DEL FRONTEND =====
app.use(express.static(path.join(__dirname, 'frontend')));

// ===== FALLBACK SPA =====
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// ===== MANEJADOR DE ERRORES GLOBAL =====
function traducirErrorMySQL(err) {
  if (!err.code) return null;
  switch (err.code) {
    case 'ER_NO_REFERENCED_ROW_2':
    case 'ER_NO_REFERENCED_ROW':
      return 'El valor indicado no existe en la tabla de referencia. Verifica los datos enviados.';
    case 'ER_ROW_IS_REFERENCED_2':
    case 'ER_ROW_IS_REFERENCED':
      return 'No se puede eliminar este registro porque está siendo usado por otros datos del sistema.';
    case 'ER_DUP_ENTRY':
      return 'Ya existe un registro con esos datos. Verifica que no haya duplicados.';
    case 'ER_DATA_TOO_LONG':
      return 'Uno de los campos supera la longitud máxima permitida.';
    case 'ER_BAD_NULL_ERROR':
      return 'Falta un campo obligatorio. Por favor completa todos los datos requeridos.';
    default:
      return null;
  }
}

app.use((err, req, res, next) => {
  console.error('Error:', err);
  const statusCode = err.statusCode || 500;
  const mensajeTraducido = traducirErrorMySQL(err);
  const message = mensajeTraducido || err.message || 'Error interno del servidor';
  res.status(statusCode).json({ message, error: process.env.NODE_ENV === 'development' ? err : {} });
});

// ===== ARRANCAR SERVIDOR =====
const db = require('./src/config/db.js');
const { runMigrations } = require('./src/config/migrations');
const { startJobs }     = require('./src/services/cron.service');
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  try {
    const connection = await db.getConnection();
    connection.release();
    console.log(`✅ Conexión a la base de datos '${process.env.DB_NAME || 'aura'}' establecida.`);

    await runMigrations();
    startJobs();

    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error.message);
    process.exit(1);
  }
};

startServer();

