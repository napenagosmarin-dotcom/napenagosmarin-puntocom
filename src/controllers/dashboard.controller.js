// controllers/dashboard.controller.js

const dashboardService = require('../services/dashboard.service');

const getStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardStats();
    res.json(data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStats
};
