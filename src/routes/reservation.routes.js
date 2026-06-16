const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservation.controller');

// Rutas para reservas confirmadas (deben ir ANTES de las rutas con :id)
router.get('/confirmed/all', reservationController.getConfirmedReservations);
router.get('/confirmed/accommodation/:accommodationId', reservationController.getConfirmedReservationsByAccommodation);

// Rutas estándar
router.get('/', reservationController.getReservations);
router.get('/user/:userId', reservationController.getReservationsByUser);
router.get('/:id', reservationController.getReservation);
router.post('/', reservationController.createReservation);
router.put('/:id', reservationController.updateReservation);
router.delete('/:id', reservationController.deleteReservation);

// ── Agente de gestión de reservas ──
// PATCH /:id/status — Cambio de estado con lógica de negocio y envío de correos
router.patch('/:id/status', reservationController.updateReservationStatus);

// ── Disponibilidad de fechas ──
// GET /availability/:type/:id — Retorna rangos bloqueados
router.get('/availability/:type/:id', reservationController.getAvailability);

// ── Sistema de cancelación con política de penalización ──
// POST /:id/cancel — Cancelar reserva (flujo de 2 pasos si hay penalización)
// Paso 1: POST sin body  → si hay penalización, retorna requiresConfirmation=true
// Paso 2: POST { confirmarConPenalizacion: true } → ejecuta la cancelación
router.post('/:id/cancel', reservationController.cancelReservation);

module.exports = router;
