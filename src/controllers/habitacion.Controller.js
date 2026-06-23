const { getAll, getById, create, update, remove } = require('../services/habitacion.service.js');

const getAllHabitaciones = async (req, res) => {
    try {
        const habitaciones = await getAll();
        res.json(habitaciones);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

function traducirErrorMySQL(error) {
    if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
        return 'Ya existe una habitación con ese nombre.';
    }
    if (error.code === 'ER_BAD_FIELD_ERROR') {
        return 'Error de configuración en la base de datos. Es posible que falte ejecutar la migración de la columna CapacidadPersonas. Consulta al administrador del sistema.';
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return 'El registro referenciado no existe en la base de datos.';
    }
    if (error.code === 'ER_DATA_TOO_LONG') {
        return 'Uno de los campos supera el límite de caracteres permitido.';
    }
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return 'Acceso denegado a la base de datos.';
    }
    if (error.code === 'ECONNREFUSED') {
        return 'No se pudo conectar con la base de datos. Verifica que el servidor esté activo.';
    }
    return 'Ocurrió un error interno. Intenta de nuevo más tarde.';
}

const createHabitacion = async (req, res) => {
    try {
        const habitacion = await create(req.body);
        res.status(201).json(habitacion);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Ya existe una habitación con ese nombre." });
        }
        res.status(500).json({ message: traducirErrorMySQL(error) });
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
        res.status(500).json({ message: traducirErrorMySQL(error) });
    }
};

const deleteHabitacion = async (req, res) => {
    try {
        await remove(req.params.id);
        res.json({ message: "Habitación eliminada correctamente" });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ error: error.message });
        }
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
