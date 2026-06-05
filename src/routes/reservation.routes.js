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

module.exports = router;
