const express = require('express');
const router = express.Router();
const ClientesController = require('../controllers/clientes.controller.js');

// Rutas CRUD de clientes
router.post('/', ClientesController.createCliente);
router.get('/', ClientesController.getAllClientes);
router.get('/:IDCliente', ClientesController.getClienteById);
router.put('/:IDCliente', ClientesController.updateCliente);
router.put('/:IDCliente/estado', ClientesController.updateEstadoCliente);
router.delete('/:IDCliente', ClientesController.deleteCliente);

module.exports = router;

