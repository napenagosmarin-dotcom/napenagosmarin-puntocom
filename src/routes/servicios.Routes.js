const express = require('express');
const router = express.Router();
const { getServicios, getServicioById, postServicio, putServicio, deleteServicio } = require('../controllers/servicios.Controller.js');

// Rutas CRUD de servicios
router.get('/', getServicios);
router.get('/:id', getServicioById);
router.post('/', postServicio);
router.put('/:id', putServicio);
router.delete('/:id', deleteServicio);

module.exports = router;