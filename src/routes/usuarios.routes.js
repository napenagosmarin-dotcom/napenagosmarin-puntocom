const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

router.get('/', usuariosController.getAll);
router.post('/', usuariosController.create);
router.get('/:id', usuariosController.getById);
router.put('/:id', usuariosController.update);
router.put('/:id/estado', usuariosController.updateStatus);

router.delete('/:id', usuariosController.remove);

module.exports = router;

