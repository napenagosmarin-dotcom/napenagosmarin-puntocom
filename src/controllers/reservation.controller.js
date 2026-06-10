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

module.exports = {
  getReservations,
  getReservation,
  getReservationsByUser,
  createReservation,
  updateReservation,
  deleteReservation,
  updateReservationStatus,
  getConfirmedReservations,
  getConfirmedReservationsByAccommodation
};
