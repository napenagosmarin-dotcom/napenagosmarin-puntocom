const express = require('express');
const router = express.Router();
const {
    getAllHabitaciones,
    getHabitacionById,
    createHabitacion,
    updateHabitacion,
    deleteHabitacion
} = require('../controllers/habitacion.Controller.js');

// Rutas CRUD de habitaciones
router.get('/',    getAllHabitaciones);
router.get('/:id', getHabitacionById);
router.post('/',   createHabitacion);
router.put('/:id', updateHabitacion);
router.delete('/:id', deleteHabitacion);

module.exports = router;