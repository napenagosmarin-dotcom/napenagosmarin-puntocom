const db = require('../config/db');

const getAll = async () => {
  try {
    const [results] = await db.query('SELECT * FROM estadosreserva');
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = { getAll };