const db = require('../config/db');

const getAll = async () => {
  try {
    const [results] = await db.query('SELECT * FROM metodopago');
    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = { getAll };