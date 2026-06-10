const express = require('express');
const router = express.Router();
const estadosReservaController = require('../controllers/estadosreserva.controller');

router.get('/', estadosReservaController.getAll);

module.exports = router;