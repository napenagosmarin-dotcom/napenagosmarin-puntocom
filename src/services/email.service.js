const { Resend } = require('resend');

let resend;
try {
  resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
} catch (error) {
  console.error('Error inicializando Resend:', error.message);
  resend = null;
}

const resendFromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const sendPasswordResetEmail = async (toEmail, resetToken) => {
  if (!resend) {
    throw new Error('Servicio de email no configurado (falta RESEND_API_KEY). No se envió el correo a: ' + toEmail);
  }
  const resetUrl = `${process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

  const { data, error } = await resend.emails.send({
    from: resendFromEmail,
    to: toEmail,
    subject: 'Recuperación de contraseña - Aura Travel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Recupera tu contraseña</h2>
        <p>Recibimos una solicitud para restablecer tu contraseña.</p>
        <a href="${resetUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Restablecer contraseña
        </a>
        <p style="color: #666; margin-top: 20px;">Este enlace expira en <strong>1 hora</strong>.</p>
        <p style="color: #666;">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
  });

  if (error) throw new Error(`Error enviando email: ${error.message}. Revisa que RESEND_FROM_EMAIL esté configurado con un remitente verificado en resend.com/domains.`);
  return data;
};

const sendVerificationEmail = async (toEmail, verificationToken) => {
  if (!resend) {
    throw new Error('Servicio de email no configurado (falta RESEND_API_KEY). No se envió el correo a: ' + toEmail);
  }
  const verificationUrl = `${process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;

  const { data, error } = await resend.emails.send({
    from: resendFromEmail,
    to: toEmail,
    subject: 'Verifica tu correo electrónico - Aura Travel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenido a Aura Travel</h2>
        <p>Gracias por registrarte. Antes de continuar, verifica tu correo electrónico.</p>
        <a href="${verificationUrl}" 
           style="background-color: #4F46E5; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Verificar correo
        </a>
        <p style="color: #666; margin-top: 20px;">Este enlace expira en <strong>1 hora</strong>.</p>
        <p style="color: #666;">Si no te registraste, ignora este correo.</p>
      </div>
    `,
  });

  if (error) throw new Error(`Error enviando email: ${error.message}. Revisa que RESEND_FROM_EMAIL esté configurado con un remitente verificado en resend.com/domains.`);
  return data;
};

const sendReservationConfirmationEmail = async (toEmail, reservation) => {
  if (!resend) {
    throw new Error('Servicio de email no configurado (falta RESEND_API_KEY). No se envió el correo a: ' + toEmail);
  }

  const recipient = process.env.RESEND_TEST_RECIPIENT || toEmail;
  const nombreCliente = reservation.NombreUsuario || reservation.Nombre || 'Cliente';
  const alojamiento = reservation.NombreHabitacion || reservation.NombreCabana || reservation.NombrePaquete || 'Alojamiento';
  const fechaInicio = reservation.FechaInicio ? new Date(reservation.FechaInicio).toLocaleDateString() : 'N/A';
  const fechaFin = reservation.FechaFinalizacion ? new Date(reservation.FechaFinalizacion).toLocaleDateString() : 'N/A';
  const cantidadHuespedes = reservation.CantidadHuespedes || reservation.CantidadPersonas || reservation.Cantidad || 'N/A';
  const montoTotal = reservation.MontoTotal !== undefined ? Number(reservation.MontoTotal).toFixed(2) : 'N/A';

  const { data, error } = await resend.emails.send({
    from: resendFromEmail,
    to: recipient,
    subject: 'Reserva confirmada - Aura Travel',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reserva confirmada</h2>
        <p>Hola ${nombreCliente},</p>
        <p>Tu reserva ha sido confirmada exitosamente. A continuación los detalles:</p>
        <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
          <tr>
            <td style="padding:6px; font-weight:600;">Alojamiento:</td>
            <td style="padding:6px;">${alojamiento}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:600;">Fecha de entrada:</td>
            <td style="padding:6px;">${fechaInicio}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:600;">Fecha de salida:</td>
            <td style="padding:6px;">${fechaFin}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:600;">Cantidad de huéspedes:</td>
            <td style="padding:6px;">${cantidadHuespedes}</td>
          </tr>
          <tr>
            <td style="padding:6px; font-weight:600;">Valor total:</td>
            <td style="padding:6px;">${montoTotal}</td>
          </tr>
        </table>

        ${reservation.servicios && reservation.servicios.length ? `
          <h3 style="margin-top:16px;">Servicios adicionales</h3>
          <ul>
            ${reservation.servicios.map(s => `<li>${s.NombreServicio || s.nombre} - ${Number(s.Costo || s.precio || 0).toFixed(2)}</li>`).join('')}
          </ul>
        ` : ''}

        <p style="color:#666; margin-top:18px;">Gracias por reservar con Aura Travel. Si necesitas ayuda, responde este correo o contáctanos a través de la plataforma.</p>
      </div>
    `,
  });

  // Log response for debugging and visibility
  if (data) console.log('Resend send response:', data);
  if (error) {
    console.error('Resend send error:', error);
    throw new Error(`Error enviando email: ${error.message}. Revisa que RESEND_FROM_EMAIL esté configurado con un remitente verificado en resend.com/domains.`);
  }
  return data;
};

module.exports = { sendPasswordResetEmail, sendVerificationEmail, sendReservationConfirmationEmail };