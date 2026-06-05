const estadosReservaService = require('../services/estadosreserva.service');

const getAll = async (req, res, next) => {
  try {
    const estados = await estadosReservaService.getAll();
    res.status(200).json(estados);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll };