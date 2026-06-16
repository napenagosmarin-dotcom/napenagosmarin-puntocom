const { getAll, getById, create, update, remove } = require('../services/habitacion.service.js');

const getAllHabitaciones = async (req, res) => {
    try {
        const habitaciones = await getAll();
        res.json(habitaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createHabitacion = async (req, res) => {
    try {
        const habitacion = await create(req.body);
        res.status(201).json(habitacion);
    } catch (error) {
        // Validación para no repetir nombres
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Ya existe una habitación con ese nombre." });
        }
        res.status(500).json({ error: error.message });
    }
};

const updateHabitacion = async (req, res) => {
    try {
        const habitacion = await update(req.params.id, req.body);
        if (habitacion) {
            res.json(habitacion);
        } else {
            res.status(404).json({ message: "Habitación no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteHabitacion = async (req, res) => {
    try {
        await remove(req.params.id);
        res.json({ message: "Habitación eliminada correctamente" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getHabitacionById = async (req, res) => {
    try {
        const habitacion = await getById(req.params.id);
        if (habitacion) {
            res.json(habitacion);
        } else {
            res.status(404).json({ message: "Habitación no encontrada" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllHabitaciones,
    createHabitacion,
    updateHabitacion,
    deleteHabitacion,
    getHabitacionById
};
