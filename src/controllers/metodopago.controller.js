const metodoPagoService = require('../services/metodopago.service');

const getAll = async (req, res, next) => {
  try {
    const metodos = await metodoPagoService.getAll();
    res.status(200).json(metodos);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };