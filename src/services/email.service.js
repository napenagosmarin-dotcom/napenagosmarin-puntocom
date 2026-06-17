const nodemailer = require('nodemailer');
const dns = require('dns');

// Solución al "Connection timeout" en Railway: Gmail bloquea algunas IPs IPv6. 
// Forzamos a Node.js a usar IPv4 para conectarse a smtp.gmail.com.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

let transporter;
try {
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true para puerto 465
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    },
    family: 4 // Fuerza a Nodemailer a usar IPv4 (ignora IPv6 ENETUNREACH)
  });
} catch (error) {
  console.error('Error inicializando Nodemailer:', error.message);
  transporter = null;
}

const senderEmail = process.env.GMAIL_USER || 'noreply@auraglamping.com';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG DEL GLAMPING — centralizada aquí para fácil personalización
// ─────────────────────────────────────────────────────────────────────────────
const GLAMPING = {
  nombre:       process.env.GLAMPING_NOMBRE      || 'Aura Glamping',
  nequi:        process.env.GLAMPING_NEQUI       || '300 123 4567',
  bancolombia:  process.env.GLAMPING_BANCOLOMBIA || 'Ahorro N° 1234-5678-90 – Aura SAS',
  daviplata:    process.env.GLAMPING_DAVIPLATA   || '300 123 4567',
  titular:      process.env.GLAMPING_TITULAR     || 'Aura SAS',
  whatsapp:     process.env.GLAMPING_WHATSAPP    || '+57 300 123 4567',
  telefono:     process.env.GLAMPING_TELEFONO    || '+57 300 123 4567',
  instagram:    process.env.GLAMPING_INSTAGRAM   || '@auraglamping',
  sitioWeb:     process.env.GLAMPING_WEB         || 'www.auraglamping.com',
  horasCancel:  process.env.GLAMPING_HORAS_CANCEL|| '24 horas',
  horaCheckin:  process.env.GLAMPING_CHECKIN     || '3:00 PM',
  horaCheckout: process.env.GLAMPING_CHECKOUT    || '12:00 PM',
  direccion:    process.env.GLAMPING_DIRECCION   || 'Consulta el link de Google Maps enviado por WhatsApp',
  mapsLink:     process.env.GLAMPING_MAPS        || '#',
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function calcularNoches(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) return 1;
  const ms = new Date(fechaFin) - new Date(fechaInicio);
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

function formatFecha(f) {
  if (!f) return '—';
  return new Date(f).toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString('es-CO');
}

// ─────────────────────────────────────────────────────────────────────────────
// PASO 1 — CORREO: RESERVA PENDIENTE DE PAGO
// ─────────────────────────────────────────────────────────────────────────────
const sendReservationPendingEmail = async (toEmail, reservation) => {
  if (!transporter) {
    console.warn('[email] Nodemailer no configurado. No se envió correo PENDIENTE a:', toEmail);
    return null;
  }

  const recipient  = process.env.RESEND_TEST_RECIPIENT || toEmail;
  const nombre     = reservation.NombreUsuario || reservation.Nombre || 'Cliente';
  const alojamiento = reservation.NombreHabitacion || reservation.NombreCabana || reservation.NombrePaquete || 'Alojamiento';
  const checkin    = formatFecha(reservation.FechaInicio);
  const checkout   = formatFecha(reservation.FechaFinalizacion);
  const noches     = calcularNoches(reservation.FechaInicio, reservation.FechaFinalizacion);
  const huespedes  = reservation.CantidadHuespedes || reservation.Cantidad || '—';
  const monto      = formatMoney(reservation.MontoTotal);
  const idReserva  = reservation.IdReserva || reservation.id || '—';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        
        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a472a 0%,#2d6a4f 60%,#40916c 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🌿</div>
            <h1 style="color:#ffffff;margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.5px;">${GLAMPING.nombre}</h1>
            <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:0.95rem;">Reserva recibida · Pendiente de pago</p>
          </td>
        </tr>

        <!-- SALUDO -->
        <tr>
          <td style="padding:32px 32px 0;">
            <h2 style="color:#1a472a;margin:0 0 12px;font-size:1.25rem;">¡Hola, ${nombre}! 👋</h2>
            <p style="color:#4a5568;margin:0;line-height:1.7;">¡Gracias por elegir <strong>${GLAMPING.nombre}</strong>! Hemos recibido tu solicitud de reserva con éxito. A continuación encontrarás el resumen:</p>
          </td>
        </tr>

        <!-- DETALLE RESERVA -->
        <tr>
          <td style="padding:24px 32px;">
            <div style="background:#f0faf4;border-radius:12px;border:1px solid #c3e6cb;padding:24px;">
              <h3 style="margin:0 0 16px;color:#1a472a;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">📋 Detalle de tu reserva</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Código de reserva</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#1a472a;font-weight:700;text-align:right;">#${idReserva}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Nombre</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${nombre}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de llegada</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkin}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de salida</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkout}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Noches</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${noches}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Tipo de alojamiento</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${alojamiento}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Huéspedes</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${huespedes}</td></tr>
                <tr>
                  <td style="padding:12px 0 0;color:#1a472a;font-weight:700;font-size:1rem;">Total a pagar</td>
                  <td style="padding:12px 0 0;color:#1a472a;font-weight:700;font-size:1.1rem;text-align:right;">$${monto} COP</td>
                </tr>
              </table>
              <div style="margin-top:16px;text-align:center;">
                <span style="background:#f59e0b;color:#fff;padding:6px 16px;border-radius:20px;font-size:0.85rem;font-weight:600;">⏳ PENDIENTE DE PAGO</span>
              </div>
            </div>
          </td>
        </tr>

        <!-- INFO DE PAGO -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#fffbeb;border-radius:12px;border:1px solid #fde68a;padding:24px;">
              <h3 style="margin:0 0 16px;color:#92400e;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">💳 Información de pago</h3>
              <p style="color:#78350f;margin:0 0 16px;font-size:0.9rem;">Para confirmar tu reserva, realiza el pago por alguno de estos medios:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div style="display:flex;align-items:center;gap:8px;">
                      <span style="font-size:1.2rem;">📱</span>
                      <div>
                        <div style="color:#92400e;font-weight:700;font-size:0.9rem;">Nequi</div>
                        <div style="color:#78350f;font-size:0.85rem;">${GLAMPING.nequi} – ${GLAMPING.titular}</div>
                      </div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);">
                    <div>
                      <span style="font-size:1.2rem;">🏦</span>
                      <span style="color:#92400e;font-weight:700;font-size:0.9rem;"> Bancolombia</span>
                      <div style="color:#78350f;font-size:0.85rem;margin-top:4px;">${GLAMPING.bancolombia}</div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <div>
                      <span style="font-size:1.2rem;">📲</span>
                      <span style="color:#92400e;font-weight:700;font-size:0.9rem;"> Daviplata</span>
                      <div style="color:#78350f;font-size:0.85rem;margin-top:4px;">${GLAMPING.daviplata} – ${GLAMPING.titular}</div>
                    </div>
                  </td>
                </tr>
              </table>
              <div style="margin-top:16px;padding:12px;background:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
                <p style="margin:0;color:#92400e;font-size:0.85rem;line-height:1.6;">⚠️ <strong>IMPORTANTE:</strong> Tu reserva estará en estado PENDIENTE hasta que recibamos el comprobante de pago. Si no recibimos el comprobante en <strong>${GLAMPING.horasCancel}</strong>, la reserva será cancelada automáticamente.</p>
              </div>
            </div>
          </td>
        </tr>

        <!-- CÓMO ENVIAR COMPROBANTE -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:24px;">
              <h3 style="margin:0 0 12px;color:#1e40af;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">📎 ¿Cómo enviar tu comprobante?</h3>
              <p style="color:#1e3a8a;margin:0 0 12px;font-size:0.9rem;line-height:1.7;">Responde directamente a este correo adjuntando la foto o captura de pantalla de tu comprobante de pago. También puedes enviarlo por WhatsApp al <strong>${GLAMPING.whatsapp}</strong>.</p>
              <p style="color:#1e3a8a;margin:0;font-size:0.9rem;">Por favor incluye:</p>
              <ul style="color:#1e3a8a;font-size:0.9rem;margin:8px 0 0;padding-left:20px;line-height:1.8;">
                <li>Tu nombre completo</li>
                <li>El código de reserva: <strong>#${idReserva}</strong></li>
              </ul>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1a472a;padding:28px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:0.9rem;">Una vez recibamos y verifiquemos el pago, te enviaremos la confirmación oficial. 🏕️</p>
            <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.8rem;">${GLAMPING.telefono} &nbsp;|&nbsp; ${GLAMPING.instagram} &nbsp;|&nbsp; ${GLAMPING.sitioWeb}</p>
            <p style="color:rgba(255,255,255,0.5);margin:12px 0 0;font-size:0.75rem;">Con cariño, el equipo de ${GLAMPING.nombre}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: recipient,
      subject: `🌿 Reserva recibida en ${GLAMPING.nombre} – Pendiente de pago`,
      html,
    });
    console.log('[email] PENDIENTE enviado | Message ID:', info.messageId, '→', recipient);
    return info;
  } catch (error) {
    console.error('[email] Error enviando PENDIENTE:', error);
    throw new Error(`Error enviando email de reserva pendiente: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 2 — CORREO: RESERVA CONFIRMADA
// ─────────────────────────────────────────────────────────────────────────────
const sendReservationConfirmedEmail = async (toEmail, reservation) => {
  if (!transporter) {
    console.warn('[email] Nodemailer no configurado. No se envió correo CONFIRMADO a:', toEmail);
    return null;
  }

  const recipient   = process.env.RESEND_TEST_RECIPIENT || toEmail;
  const nombre      = reservation.NombreUsuario || reservation.Nombre || 'Cliente';
  const alojamiento = reservation.NombreHabitacion || reservation.NombreCabana || reservation.NombrePaquete || 'Alojamiento';
  const checkin     = formatFecha(reservation.FechaInicio);
  const checkout    = formatFecha(reservation.FechaFinalizacion);
  const idReserva   = reservation.IdReserva || reservation.id || '—';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER CONFIRMADA -->
        <tr>
          <td style="background:linear-gradient(135deg,#065f46 0%,#059669 60%,#10b981 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:3rem;margin-bottom:8px;">✅</div>
            <h1 style="color:#ffffff;margin:0;font-size:1.6rem;font-weight:700;">¡Reserva Confirmada!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.95rem;">${GLAMPING.nombre} · Nos vemos pronto 🏕️</p>
          </td>
        </tr>

        <!-- SALUDO -->
        <tr>
          <td style="padding:32px 32px 0;">
            <h2 style="color:#065f46;margin:0 0 12px;font-size:1.25rem;">¡Hola, ${nombre}! 🌟</h2>
            <p style="color:#4a5568;margin:0;line-height:1.7;">¡Tu reserva ha sido <strong>confirmada</strong>! Recibimos y verificamos tu pago correctamente. ¡Ya eres parte de nuestra próxima experiencia!</p>
          </td>
        </tr>

        <!-- DETALLE CONFIRMADO -->
        <tr>
          <td style="padding:24px 32px;">
            <div style="background:#ecfdf5;border-radius:12px;border:1px solid #a7f3d0;padding:24px;">
              <h3 style="margin:0 0 16px;color:#065f46;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">📋 Reserva confirmada</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Código de reserva</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#065f46;font-weight:700;text-align:right;">#${idReserva}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de llegada</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkin} · a partir de las ${GLAMPING.horaCheckin}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de salida</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkout} · hasta las ${GLAMPING.horaCheckout}</td></tr>
                <tr><td style="padding:8px 0;color:#718096;font-size:0.9rem;">Tipo de alojamiento</td><td style="padding:8px 0;color:#2d3748;text-align:right;">${alojamiento}</td></tr>
              </table>
              <div style="margin-top:16px;text-align:center;">
                <span style="background:#10b981;color:#fff;padding:6px 20px;border-radius:20px;font-size:0.85rem;font-weight:600;">✅ CONFIRMADA</span>
              </div>
            </div>
          </td>
        </tr>

        <!-- CÓMO LLEGAR -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe;padding:20px;">
              <h3 style="margin:0 0 10px;color:#1e40af;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.5px;">📍 Cómo llegar</h3>
              <p style="color:#1e3a8a;margin:0;font-size:0.9rem;line-height:1.6;">${GLAMPING.direccion}</p>
              ${GLAMPING.mapsLink !== '#' ? `<a href="${GLAMPING.mapsLink}" style="display:inline-block;margin-top:12px;background:#1e40af;color:#fff;padding:8px 18px;border-radius:8px;text-decoration:none;font-size:0.85rem;">📌 Ver en Google Maps</a>` : ''}
            </div>
          </td>
        </tr>

        <!-- RECOMENDACIONES -->
        <tr>
          <td style="padding:0 32px 24px;">
            <div style="background:#fdf4ff;border-radius:12px;border:1px solid #e9d5ff;padding:20px;">
              <h3 style="margin:0 0 12px;color:#7c3aed;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.5px;">📌 Recomendaciones</h3>
              <ul style="color:#5b21b6;font-size:0.9rem;margin:0;padding-left:20px;line-height:2;">
                <li>Llega a tiempo — el check-in es a las <strong>${GLAMPING.horaCheckin}</strong></li>
                <li>El check-out es a las <strong>${GLAMPING.horaCheckout}</strong></li>
                <li>Ante cualquier novedad, contáctanos al <strong>${GLAMPING.whatsapp}</strong></li>
              </ul>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#065f46;padding:28px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:1rem;font-weight:600;">¡Nos vemos muy pronto! 🌿</p>
            <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.8rem;">${GLAMPING.telefono} &nbsp;|&nbsp; ${GLAMPING.instagram} &nbsp;|&nbsp; ${GLAMPING.sitioWeb}</p>
            <p style="color:rgba(255,255,255,0.5);margin:12px 0 0;font-size:0.75rem;">El equipo de ${GLAMPING.nombre}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: recipient,
      subject: `✅ ¡Reserva confirmada! Te esperamos en ${GLAMPING.nombre}`,
      html,
    });
    console.log('[email] CONFIRMADA enviado | Message ID:', info.messageId, '→', recipient);
    return info;
  } catch (error) {
    console.error('[email] Error enviando CONFIRMADA:', error);
    throw new Error(`Error enviando email de reserva confirmada: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PASO 3 — CORREO: RESERVA CANCELADA
// ─────────────────────────────────────────────────────────────────────────────
// cancellationInfo = { tipoCancelacion, porcentajePenalizacion, valorPenalizacion,
//                      valorReembolso, diasRestantes, mensaje, fechaCancelacion }
// ─────────────────────────────────────────────────────────────────────────────
const sendReservationCancelledEmail = async (toEmail, reservation, cancellationInfo) => {
  if (!transporter) {
    console.warn('[email] Nodemailer no configurado. No se envió correo CANCELACIÓN a:', toEmail);
    return null;
  }

  const recipient   = process.env.RESEND_TEST_RECIPIENT || toEmail;
  const nombre      = reservation.NombreUsuario || reservation.Nombre || 'Cliente';
  const alojamiento = reservation.NombreHabitacion || reservation.NombreCabana || reservation.NombrePaquete || 'Alojamiento';
  const checkin     = formatFecha(reservation.FechaInicio);
  const checkout    = formatFecha(reservation.FechaFinalizacion);
  const fechaReserva = formatFecha(reservation.FechaReserva);
  const idReserva   = reservation.IdReserva || reservation.id || '—';
  const montoTotal  = formatMoney(reservation.MontoTotal);

  // Datos de cancelación
  const tipoCancelacion       = cancellationInfo.tipoCancelacion       || 'penalizada';
  const porcentajePenalizacion = cancellationInfo.porcentajePenalizacion ?? 0;
  const valorPenalizacion     = formatMoney(cancellationInfo.valorPenalizacion  || 0);
  const valorReembolso        = formatMoney(cancellationInfo.valorReembolso     || 0);
  const mensajePolitica       = cancellationInfo.mensaje                || '';
  const esGratuita            = tipoCancelacion === 'gratuita';

  // Fecha y hora de cancelación formateada
  const fechaCancelObj  = cancellationInfo.fechaCancelacion
    ? new Date(cancellationInfo.fechaCancelacion)
    : new Date();
  const fechaCancelStr  = fechaCancelObj.toLocaleDateString('es-CO', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
  const horaCancelStr   = fechaCancelObj.toLocaleTimeString('es-CO', {
    hour: '2-digit', minute: '2-digit', hour12: true
  });

  // Paleta de colores según el tipo de cancelación
  const colorHeader    = esGratuita ? '#1a472a' : '#7f1d1d';
  const colorHeaderMid = esGratuita ? '#2d6a4f' : '#991b1b';
  const colorHeaderEnd = esGratuita ? '#40916c' : '#dc2626';
  const badgeBg        = esGratuita ? '#10b981' : '#ef4444';
  const badgeTexto     = esGratuita ? '✅ CANCELACIÓN GRATUITA' : `⚠️ CANCELACIÓN CON PENALIZACIÓN (${porcentajePenalizacion}%)`;
  const headerEmoji    = esGratuita ? '🌿' : '❌';
  const headerSubtitulo = esGratuita
    ? 'Tu reserva ha sido cancelada sin cargos'
    : 'Tu reserva ha sido cancelada con penalización';

  const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- HEADER CANCELACIÓN -->
        <tr>
          <td style="background:linear-gradient(135deg,${colorHeader} 0%,${colorHeaderMid} 60%,${colorHeaderEnd} 100%);padding:40px 32px;text-align:center;">
            <div style="font-size:2.8rem;margin-bottom:8px;">${headerEmoji}</div>
            <h1 style="color:#ffffff;margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.5px;">${GLAMPING.nombre}</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.95rem;">Reserva Cancelada · ${headerSubtitulo}</p>
          </td>
        </tr>

        <!-- SALUDO -->
        <tr>
          <td style="padding:32px 32px 0;">
            <h2 style="color:#1a202c;margin:0 0 12px;font-size:1.25rem;">Hola, ${nombre} 👋</h2>
            <p style="color:#4a5568;margin:0;line-height:1.7;">Te confirmamos que tu reserva <strong>#${idReserva}</strong> en <strong>${GLAMPING.nombre}</strong> ha sido <strong>cancelada</strong> exitosamente. A continuación encontrarás el resumen de la operación.</p>
          </td>
        </tr>

        <!-- BADGE DE TIPO DE CANCELACIÓN -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="text-align:center;">
              <span style="background:${badgeBg};color:#fff;padding:10px 24px;border-radius:24px;font-size:0.9rem;font-weight:700;display:inline-block;">
                ${badgeTexto}
              </span>
            </div>
          </td>
        </tr>

        <!-- DETALLE DE LA RESERVA -->
        <tr>
          <td style="padding:24px 32px 0;">
            <div style="background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;padding:24px;">
              <h3 style="margin:0 0 16px;color:#1a202c;font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">📋 Detalles de la Reserva</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Código de reserva</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#1a202c;font-weight:700;text-align:right;">#${idReserva}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Cliente</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${nombre}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Alojamiento</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${alojamiento}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de creación</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${fechaReserva}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de llegada</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkin}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de salida</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${checkout}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Estado</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);text-align:right;"><span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:12px;font-size:0.8rem;font-weight:600;">CANCELADA</span></td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#718096;font-size:0.9rem;">Fecha de cancelación</td><td style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.06);color:#2d3748;text-align:right;">${fechaCancelStr}</td></tr>
                <tr><td style="padding:8px 0;color:#718096;font-size:0.9rem;">Hora de cancelación</td><td style="padding:8px 0;color:#2d3748;text-align:right;">${horaCancelStr}</td></tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- RESUMEN FINANCIERO -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="background:${esGratuita ? '#f0faf4' : '#fff7ed'};border-radius:12px;border:1px solid ${esGratuita ? '#c3e6cb' : '#fed7aa'};padding:24px;">
              <h3 style="margin:0 0 16px;color:${esGratuita ? '#1a472a' : '#92400e'};font-size:1rem;text-transform:uppercase;letter-spacing:0.5px;">💰 Resumen Financiero</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.08);color:#4a5568;font-size:0.9rem;">Valor total de la reserva</td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.08);color:#1a202c;font-weight:600;text-align:right;">$${montoTotal} COP</td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.08);color:${esGratuita ? '#4a5568' : '#991b1b'};font-size:0.9rem;">
                    ${esGratuita ? 'Penalización aplicada' : `Penalización retenida (${porcentajePenalizacion}%)`}
                  </td>
                  <td style="padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.08);color:${esGratuita ? '#10b981' : '#dc2626'};font-weight:700;text-align:right;">
                    ${esGratuita ? '$0 COP (sin cargo)' : `$${valorPenalizacion} COP`}
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 0 0;color:#1a202c;font-weight:700;font-size:1rem;">Valor a reembolsar</td>
                  <td style="padding:14px 0 0;color:${esGratuita ? '#1a472a' : '#065f46'};font-weight:700;font-size:1.15rem;text-align:right;">$${valorReembolso} COP</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- MENSAJE DE POLÍTICA -->
        <tr>
          <td style="padding:20px 32px 0;">
            <div style="background:${esGratuita ? '#eff6ff' : '#fef3c7'};border-radius:12px;border-left:4px solid ${esGratuita ? '#3b82f6' : '#f59e0b'};padding:20px 24px;">
              <h3 style="margin:0 0 10px;color:${esGratuita ? '#1e40af' : '#92400e'};font-size:0.9rem;text-transform:uppercase;letter-spacing:0.5px;">
                ${esGratuita ? '📋 Información sobre la cancelación' : '⚠️ Política de cancelación aplicada'}
              </h3>
              <p style="color:${esGratuita ? '#1e3a8a' : '#78350f'};margin:0;font-size:0.9rem;line-height:1.7;">${mensajePolitica}</p>
              ${!esGratuita ? `
              <div style="margin-top:12px;padding:10px;background:rgba(0,0,0,0.04);border-radius:8px;">
                <p style="margin:0;color:#78350f;font-size:0.85rem;">La cancelación gratuita aplica cuando se realiza con al menos <strong>${process.env.DIAS_CANCELACION_GRATIS || 7} días</strong> de anticipación a la fecha de llegada.</p>
              </div>` : ''}
            </div>
          </td>
        </tr>

        <!-- SOPORTE Y CONTACTO -->
        <tr>
          <td style="padding:20px 32px 24px;">
            <div style="background:#fdf4ff;border-radius:12px;border:1px solid #e9d5ff;padding:20px;">
              <h3 style="margin:0 0 12px;color:#7c3aed;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.5px;">📞 ¿Tienes dudas o necesitas ayuda?</h3>
              <p style="color:#5b21b6;margin:0 0 10px;font-size:0.9rem;line-height:1.7;">Nuestro equipo está disponible para resolver cualquier inquietud sobre tu cancelación o reembolso.</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#6d28d9;font-size:0.9rem;">📱 WhatsApp</td>
                  <td style="padding:6px 0;color:#5b21b6;font-weight:600;text-align:right;">${GLAMPING.whatsapp}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6d28d9;font-size:0.9rem;">📞 Teléfono</td>
                  <td style="padding:6px 0;color:#5b21b6;font-weight:600;text-align:right;">${GLAMPING.telefono}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6d28d9;font-size:0.9rem;">📸 Instagram</td>
                  <td style="padding:6px 0;color:#5b21b6;font-weight:600;text-align:right;">${GLAMPING.instagram}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#6d28d9;font-size:0.9rem;">🌐 Sitio web</td>
                  <td style="padding:6px 0;color:#5b21b6;font-weight:600;text-align:right;">${GLAMPING.sitioWeb}</td>
                </tr>
              </table>
            </div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1a472a;padding:28px 32px;text-align:center;">
            <p style="color:rgba(255,255,255,0.9);margin:0 0 8px;font-size:0.9rem;">Esperamos verte pronto de nuevo en ${GLAMPING.nombre} 🌿</p>
            <p style="color:rgba(255,255,255,0.7);margin:0;font-size:0.8rem;">${GLAMPING.telefono} &nbsp;|&nbsp; ${GLAMPING.instagram} &nbsp;|&nbsp; ${GLAMPING.sitioWeb}</p>
            <p style="color:rgba(255,255,255,0.5);margin:12px 0 0;font-size:0.75rem;">Con cariño, el equipo de ${GLAMPING.nombre}</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: recipient,
      subject: `${esGratuita ? '✅' : '⚠️'} Reserva #${idReserva} cancelada – ${GLAMPING.nombre}`,
      html,
    });
    console.log('[email] CANCELACIÓN enviado | Message ID:', info.messageId, '→', recipient);
    return info;
  } catch (error) {
    console.error('[email] Error enviando CANCELACIÓN:', error);
    throw new Error(`Error enviando email de cancelación: ${error.message}`);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MANTENIDOS — emails de auth
// ─────────────────────────────────────────────────────────────────────────────
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  if (!transporter) {
    throw new Error('Servicio de email no configurado (faltan credenciales de Gmail). No se envió el correo a: ' + toEmail);
  }
  const resetUrl = `${process.env.FRONTEND_URL || process.env.BACKEND_URL || 'http://localhost:3001'}/reset-password?token=${resetToken}`;

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
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
    return info;
  } catch (error) {
    throw new Error(`Error enviando email: ${error.message}. Revisa tus credenciales de Gmail.`);
  }
};

const sendVerificationEmail = async (toEmail, verificationToken) => {
  if (!transporter) {
    throw new Error('Servicio de email no configurado (faltan credenciales de Gmail). No se envió el correo a: ' + toEmail);
  }
  const verificationUrl = `${process.env.BACKEND_URL || process.env.FRONTEND_URL || 'http://localhost:3001'}/api/auth/verify-email?token=${verificationToken}`;

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
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
    return info;
  } catch (error) {
    throw new Error(`Error enviando email: ${error.message}. Revisa tus credenciales de Gmail.`);
  }
};

// ALIAS de compatibilidad — mantiene el nombre viejo que usa reservation.service.js
const sendReservationConfirmationEmail = sendReservationPendingEmail;

module.exports = {
  sendPasswordResetEmail,
  sendVerificationEmail,
  sendReservationConfirmationEmail,   // alias (crea reserva → PENDIENTE)
  sendReservationPendingEmail,        // explícito
  sendReservationConfirmedEmail,      // pago confirmado
  sendReservationCancelledEmail,      // cancelación con política de penalización
};