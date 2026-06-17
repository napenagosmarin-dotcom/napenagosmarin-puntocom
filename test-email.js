require('dotenv').config();

// Nota: El prompt solicitaba verificar Nodemailer con GMAIL_USER y GMAIL_PASS, pero al revisar
// el código actual de src/services/email.service.js, noté que se utiliza Resend (RESEND_API_KEY).
// De todas formas requiero dotenv para asegurar que las variables de entorno se carguen correctamente.
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

const emailService = require('./src/services/email.service');

const reservaFalsa = {
  IdReserva: 'TEST-12345',
  NombreUsuario: 'Juan Pérez Test',
  NombreHabitacion: 'Cabaña del Bosque',
  FechaInicio: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  FechaFinalizacion: new Date(new Date().getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
  CantidadHuespedes: 2,
  MontoTotal: 450000,
  FechaReserva: new Date().toISOString()
};

const infoCancelacionFalsa = {
  tipoCancelacion: 'penalizada',
  porcentajePenalizacion: 20,
  valorPenalizacion: 90000,
  valorReembolso: 360000,
  mensaje: 'Cancelación con menos de 7 días de anticipación, aplicando política del 20% de penalización.',
  fechaCancelacion: new Date().toISOString()
};

// Se usa RESEND_TEST_RECIPIENT que existe en el .env, o un fallback
const correoDestino = process.env.RESEND_TEST_RECIPIENT || process.env.GMAIL_USER || 'godienser@gmail.com';

async function testEmails() {
  console.log(`=================================================`);
  console.log(`Iniciando prueba de envío de correos`);
  console.log(`Destinatario: ${correoDestino}`);
  console.log(`=================================================\n`);
  
  try {
    console.log('1️⃣  Probando envío de reserva PENDIENTE...');
    await emailService.sendReservationPendingEmail(correoDestino, reservaFalsa);
    console.log('✅ Correo PENDIENTE enviado exitosamente.\n');
  } catch (error) {
    console.error('❌ Error en correo PENDIENTE:', error.message, '\n');
  }

  try {
    console.log('2️⃣  Probando envío de reserva CONFIRMADA...');
    await emailService.sendReservationConfirmedEmail(correoDestino, reservaFalsa);
    console.log('✅ Correo CONFIRMADA enviado exitosamente.\n');
  } catch (error) {
    console.error('❌ Error en correo CONFIRMADA:', error.message, '\n');
  }

  try {
    console.log('3️⃣  Probando envío de reserva CANCELADA...');
    await emailService.sendReservationCancelledEmail(correoDestino, reservaFalsa, infoCancelacionFalsa);
    console.log('✅ Correo CANCELADA enviado exitosamente.\n');
  } catch (error) {
    console.error('❌ Error en correo CANCELADA:', error.message, '\n');
  }
  
  console.log(`=================================================`);
  console.log('Prueba de envíos de correo finalizada.');
  console.log(`=================================================`);
}

testEmails();
