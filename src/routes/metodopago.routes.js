const express = require('express');
const router = express.Router();
const metodoPagoController = require('../controllers/metodopago.controller');

router.get('/', metodoPagoController.getAll);

module.exports = router;