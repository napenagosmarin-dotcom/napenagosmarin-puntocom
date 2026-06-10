const pool = require('../config/db.js');

// Obtener todas las cabañas
const getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM cabanas');
    return rows;
};

// Obtener cabaña por IDCabana
const getById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM cabanas WHERE IDCabana = ?',
        [id]
    );
    return rows[0];
};

// Obtener habitaciones de una cabaña (campos reales de la tabla habitacion)
const getHabitacionesByCabana = async (idCabana) => {
    const [rows] = await pool.query(
        'SELECT IDHabitacion, NombreHabitacion, Descripcion, Costo, Estado FROM habitacion WHERE IDCabana = ?',
        [idCabana]
    );
    return rows;
};

// Crear cabaña
const createCabana = async (cabana) => {
    const { NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado } = cabana;

    const [result] = await pool.query(
        'INSERT INTO cabanas (NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado) VALUES (?, ?, ?, ?, ?)',
        [NombreCabana, Descripcion, CapacidadPersonas ?? null, PrecioNoche, Estado ?? 1]
    );

    return { IDCabana: result.insertId, ...cabana };
};

// Actualizar cabaña
const updateCabana = async (id, cabana) => {
    const { NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado } = cabana;

    await pool.query(
        'UPDATE cabanas SET NombreCabana=?, Descripcion=?, CapacidadPersonas=?, PrecioNoche=?, Estado=? WHERE IDCabana=?',
        [NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado, id]
    );

    return { IDCabana: id, ...cabana };
};

// Actualizar estado de la cabaña
const updateEstadoCabana = async (id, estado) => {
    await pool.query(
        'UPDATE cabanas SET Estado=? WHERE IDCabana=?',
        [estado, id]
    );
    return { IDCabana: id, Estado: estado };
};

// Eliminar cabaña
const remove = async (id) => {
    await pool.query(
        'DELETE FROM cabanas WHERE IDCabana=?',
        [id]
    );
};

module.exports = {
    getAll,
    getById,
    getHabitacionesByCabana,
    createCabana,
    updateCabana,
    updateEstadoCabana,
    remove
};
