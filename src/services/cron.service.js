// Trabajos en segundo plano — se inician una sola vez con startJobs()
// Regla 3: auto-cancelar reservas Pendientes que superen 2h sin confirmación
// Regla 7: enviar recordatorio de check-in 24h antes

const db           = require('../config/db');
const emailService = require('./email.service');
const usuariosService = require('./usuarios.service');

const ESTADO_PENDIENTE = 1;
const ESTADO_CANCELADO = 3;

// ─── Regla 3: Auto-cancelar pendientes expiradas ────────────────────────────
const cancelarPendientesExpiradas = async () => {
  try {
    const [expiradas] = await db.query(
      `SELECT r.IdReserva, r.UsuarioIdusuario, r.MontoTotal
       FROM reserva r
       WHERE r.IdEstadoReserva = ? AND r.FechaExpiracion IS NOT NULL AND r.FechaExpiracion <= NOW()`,
      [ESTADO_PENDIENTE]
    );

    for (const reserva of expiradas) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        await connection.query(
          `UPDATE reserva
           SET IdEstadoReserva = ?, FechaCancelacion = NOW(),
               TipoCancelacion = 'sistema', PorcentajePenalizacion = 0,
               ValorPenalizacion = 0, ValorReembolso = 0
           WHERE IdReserva = ?`,
          [ESTADO_CANCELADO, reserva.IdReserva]
        );

        // Historial
        await connection.query(
          `INSERT INTO reserva_historial (IdReserva, EstadoAnterior, EstadoNuevo, ModificadoPor, Motivo)
           VALUES (?, ?, ?, 'sistema', 'Cancelación automática: anticipo no recibido en 2 horas')`,
          [reserva.IdReserva, ESTADO_PENDIENTE, ESTADO_CANCELADO]
        );

        await connection.commit();
        console.log(`[cron] Reserva #${reserva.IdReserva} cancelada por expiración`);

        // Enviar correo (no bloquea)
        try {
          const user = reserva.UsuarioIdusuario ? await usuariosService.getById(reserva.UsuarioIdusuario) : null;
          if (user?.Email) {
            await emailService.sendReservationExpiredEmail(user.Email, reserva);
          }
        } catch (emailErr) {
          console.error(`[cron] Email expiración reserva #${reserva.IdReserva}:`, emailErr.message);
        }
      } catch (err) {
        await connection.rollback();
        console.error(`[cron] Error cancelando reserva #${reserva.IdReserva}:`, err.message);
      } finally {
        connection.release();
      }
    }
  } catch (err) {
    console.error('[cron] Error en cancelarPendientesExpiradas:', err.message);
  }
};

// ─── Regla 7: Recordatorio de check-in 24h antes ────────────────────────────
const enviarRecordatoriosCheckin = async () => {
  try {
    // Reservas confirmadas con FechaInicio = mañana (entre 20h y 28h desde ahora)
    const [proximas] = await db.query(
      `SELECT r.IdReserva, r.UsuarioIdusuario, r.FechaInicio, r.FechaFinalizacion,
              r.MontoTotal, u.NombreUsuario, u.Email,
              COALESCE(h.NombreHabitacion, c.NombreCabana, p.nombre) AS Alojamiento
       FROM reserva r
       LEFT JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
       LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IDReserva
       LEFT JOIN habitacion h ON drh.IDHabitacion = h.IDHabitacion
       LEFT JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
       LEFT JOIN cabanas c ON drc.IDCabana = c.IDCabana
       LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
       LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
       WHERE r.IdEstadoReserva = 2
         AND r.FechaInicio BETWEEN DATE_ADD(NOW(), INTERVAL 20 HOUR)
                                AND DATE_ADD(NOW(), INTERVAL 28 HOUR)
         AND (r.RecordatorioEnviado IS NULL OR r.RecordatorioEnviado = 0)`
    );

    for (const reserva of proximas) {
      try {
        if (reserva.Email) {
          await emailService.sendCheckinReminderEmail(reserva.Email, reserva);
          // Marcar como enviado (columna opcional — si no existe, simplemente falla silenciosamente)
          await db.query(
            'UPDATE reserva SET RecordatorioEnviado = 1 WHERE IdReserva = ?',
            [reserva.IdReserva]
          ).catch(() => {});
          console.log(`[cron] Recordatorio check-in enviado para reserva #${reserva.IdReserva}`);
        }
      } catch (emailErr) {
        console.error(`[cron] Email recordatorio reserva #${reserva.IdReserva}:`, emailErr.message);
      }
    }
  } catch (err) {
    console.error('[cron] Error en enviarRecordatoriosCheckin:', err.message);
  }
};

// ─── Inicializar trabajos ────────────────────────────────────────────────────
const startJobs = () => {
  // Regla 3: verificar expiradas cada 5 minutos
  setInterval(cancelarPendientesExpiradas, 5 * 60 * 1000);
  cancelarPendientesExpiradas(); // también al arrancar

  // Regla 7: verificar recordatorios cada hora
  setInterval(enviarRecordatoriosCheckin, 60 * 60 * 1000);
  enviarRecordatoriosCheckin(); // también al arrancar

  console.log('[cron] Trabajos en segundo plano iniciados');
};

module.exports = { startJobs };
