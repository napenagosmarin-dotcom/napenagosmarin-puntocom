// controllers/reservation.controller.js

const reservationService = require('../services/reservation.service');

// GET /reservations
const getReservations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const data = await reservationService.getAllReservations(page, limit);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

// GET /reservations/:id
const getReservation = async (req, res, next) => {
  try {
    const reservation = await reservationService.getReservationById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json(reservation);
  } catch (error) {
    next(error);
  }
};

// GET /reservations/user/:userId
const getReservationsByUser = async (req, res, next) => {
  try {
    const reservations = await reservationService.getReservationsByUser(req.params.userId);
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// POST /reservations
const createReservation = async (req, res, next) => {
  try {
    const newReservation = await reservationService.createReservation(req.body);
    res.status(201).json(newReservation);
  } catch (error) {
    next(error);
  }
};

// PUT /reservations/:id
const updateReservation = async (req, res, next) => {
  try {
    const updated = await reservationService.updateReservation(req.params.id, req.body);

    if (!updated) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json(updated);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

// DELETE /reservations/:id
const deleteReservation = async (req, res, next) => {
  try {
    const deleted = await reservationService.deleteReservation(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    res.json({ message: 'Reserva eliminada correctamente' });
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
    next(error);
  }
};

// PATCH /reservations/:id/status
const updateReservationStatus = async (req, res, next) => {
  try {
    const { IdEstadoReserva } = req.body;
    if (!IdEstadoReserva) return res.status(400).json({ message: 'IdEstadoReserva es requerido' });
    
    const updated = await reservationService.updateReservationStatus(req.params.id, IdEstadoReserva);
    if (!updated) return res.status(404).json({ message: 'Reserva no encontrada' });
    
    res.json({ message: 'Estado de reserva actualizado' });
  } catch (error) {
    next(error);
  }
};

// GET /reservations/confirmed/all
const getConfirmedReservations = async (req, res, next) => {
  try {
    const reservations = await reservationService.getConfirmedReservations();
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// GET /reservations/confirmed/accommodation/:accommodationId
const getConfirmedReservationsByAccommodation = async (req, res, next) => {
  try {
    const { accommodationId } = req.params;
    const { type } = req.query; // 'habitacion', 'cabana', 'paquete'
    
    if (!accommodationId) {
      return res.status(400).json({ message: 'accommodationId es requerido' });
    }

    const reservations = await reservationService.getConfirmedReservationsByAccommodation(
      accommodationId, 
      type || 'habitacion'
    );
    res.json(reservations);
  } catch (error) {
    next(error);
  }
};

// GET /reservations/availability/:type/:id
// Retorna arreglo de rangos de fechas bloqueadas para deshabilitar en el date picker
// Ejemplo respuesta: [{ start: '2025-12-24', end: '2025-12-27' }, ...]
const getAvailability = async (req, res, next) => {
  try {
    const { type, id } = req.params;
    const tiposValidos = ['habitacion', 'cabana', 'paquete'];

    if (!tiposValidos.includes(type)) {
      return res.status(400).json({
        message: `Tipo inválido. Usa uno de: ${tiposValidos.join(', ')}`
      });
    }
    if (!id) {
      return res.status(400).json({ message: 'id es requerido' });
    }

    const blockedDates = await reservationService.getBlockedDates(type, id);
    res.json(blockedDates);
  } catch (error) {
    next(error);
  }
};

// POST /reservations/:id/cancel
// ── Cancelar reserva con política de penalización ──
// Flujo de 2 pasos:
//   1er llamado sin body o confirmarConPenalizacion=false:
//     - Si es gratuita → cancela directamente.
//     - Si tiene penalización → responde 200 con { requiresConfirmation: true }
//       para que el cliente confirme explícitamente.
//   2do llamado con { confirmarConPenalizacion: true }:
//     - Cancela con la penalización ya aceptada por el usuario.
// ─────────────────────────────────────────────────────────────────────────────
const cancelReservation = async (req, res, next) => {
  try {
    const { confirmarConPenalizacion } = req.body || {};
    const result = await reservationService.cancelReservation(
      req.params.id,
      { confirmarConPenalizacion: confirmarConPenalizacion === true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    // El servicio solicitó confirmación al frontend antes de proceder
    if (result.requiresConfirmation) {
      return res.status(200).json({
        requiresConfirmation: true,
        reservaId:  result.reservaId,
        mensaje:    result.mensaje,
        politica:   result.politica
      });
    }

    // Cancelación ejecutada exitosamente
    return res.status(200).json({
      message:  'Reserva cancelada correctamente.',
      cancelado: true,
      data: {
        reservaId:       result.reservaId,
        fechaCancelacion: result.fechaCancelacion,
        politica:        result.politica,
        mensaje:         result.mensaje
      }
    });
  } catch (error) {
    // Propagar errores de negocio con código HTTP explícito
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    next(error);
  }
};

module.exports = {
  getReservations,
  getReservation,
  getReservationsByUser,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
  cancelReservation,
  getConfirmedReservations,
  getConfirmedReservationsByAccommodation,
  getAvailability
};
