const usuariosService = require('../services/usuarios.service');
const authService = require('../services/auth.service');
const { sendVerificationEmail } = require('../services/email.service');

const getAll = async (req, res, next) => {
  try {
    const usuarios = await usuariosService.getAll();
    res.status(200).json(usuarios);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const usuario = await usuariosService.create(req.body);

    if (usuario && usuario.Email) {
      try {
        const token = authService.createVerificationToken(usuario.Email);
        await sendVerificationEmail(usuario.Email, token);
      } catch (emailErr) {
        console.error('Email de verificación no enviado:', emailErr.message);
      }
    }

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const usuario = await usuariosService.getById(req.params.id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const usuario = await usuariosService.update(req.params.id, req.body);
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await usuariosService.remove(req.params.id);
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { Estado } = req.body;
    if (Estado === undefined || Estado === null) {
      return res.status(400).json({ error: 'El campo Estado es requerido' });
    }
    const result = await usuariosService.updateStatus(req.params.id, Estado);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const changeRole = async (req, res, next) => {
  try {
    const { IDRol } = req.body;
    if (IDRol !== 1 && IDRol !== 2) {
      return res.status(400).json({ error: 'IDRol debe ser 1 (Cliente) o 2 (Admin)' });
    }
    const resultado = await usuariosService.changeRole(req.params.id, IDRol);
    res.status(200).json(resultado);
  } catch (error) {
    if (error.statusCode) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
};

const getByDocumento = async (req, res, next) => {
  try {
    const usuario = await usuariosService.getByDocumento(req.params.numero);
    if (!usuario) return res.status(404).json({ message: 'No se encontró ningún usuario registrado con ese número de documento.' });
    res.status(200).json(usuario);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, updateStatus, changeRole, remove, getByDocumento };
