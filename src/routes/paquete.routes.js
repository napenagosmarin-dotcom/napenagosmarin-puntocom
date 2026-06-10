const express = require('express');
const router = express.Router();
const { getAllPaquetes, getPaqueteById, createPaquete, updatePaquete, deletePaquete, updatePaqueteStatus } = require('../controllers/paquete.Controller.js');

// Rutas CRUD de paquetes
router.get('/', getAllPaquetes);
router.get('/:id', getPaqueteById);
router.post('/', createPaquete);
router.put('/:id', updatePaquete);
router.put('/:id/estado', updatePaqueteStatus);
router.delete('/:id', deletePaquete);

module.exports = router;