const express = require('express');
const router = express.Router();
const CabanasController = require('../controllers/cabanas.controller.js');

// Rutas CRUD de cabanas
router.get('/',                          CabanasController.getAllCabanas);
router.get('/:IDCabana',                CabanasController.getCabanaById);
router.get('/:IDCabana/habitaciones',   CabanasController.getHabitacionesByCabana);
router.post('/',          CabanasController.createCabana);
router.put('/:IDCabana', CabanasController.updateCabana);
router.put('/:IDCabana/estado',         CabanasController.updateEstadoCabana);
router.delete('/:IDCabana',             CabanasController.deleteCabana);

module.exports = router;