const db = require('../config/db.js');

const getAll = async () => {
    const [rows] = await db.query("SELECT *, precio AS Precio, descripcion AS Descripcion FROM habitacion ORDER BY NombreHabitacion ASC");
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query("SELECT *, precio AS Precio, descripcion AS Descripcion FROM habitacion WHERE IDHabitacion=?", [id]);
    return rows[0];
};

const create = async (data) => {
    const nombre = data.tipo || data.NombreHabitacion || '';
    const precio = data.precio || data.Precio || 0;
    const descripcion = data.descripcion || data.Descripcion || '';
    const imagen = data.imagen || '';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const capacidad = data.CapacidadPersonas || data.capacidad || 1;
    const [result] = await db.query(
        "INSERT INTO habitacion (NombreHabitacion, precio, Descripcion, imagen, Estado, CapacidadPersonas) VALUES (?, ?, ?, ?, ?, ?)",
        [nombre, precio, descripcion, imagen, Estado, capacidad]
    );
    return result;
};

const update = async (id, data) => {
    const nombre = data.tipo || data.NombreHabitacion || '';
    const precio = data.precio || data.Precio || 0;
    const descripcion = data.descripcion || data.Descripcion || '';
    const imagen = data.imagen || '';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const capacidad = data.CapacidadPersonas || data.capacidad || 1;
    const [result] = await db.query(
        "UPDATE habitacion SET NombreHabitacion=?, precio=?, Descripcion=?, imagen=?, Estado=?, CapacidadPersonas=? WHERE IDHabitacion=?",
        [nombre, precio, descripcion, imagen, Estado, capacidad, id]
    );
    return result;
};

const remove = async (id) => {
    const [check] = await db.query(
        'SELECT COUNT(*) AS total FROM detallereservahabitacion WHERE IDHabitacion = ?', [id]
    );
    if (check[0].total > 0) {
        const err = new Error('No se puede eliminar la habitación porque está asociada a reservas existentes. Cambia su estado a inactivo.');
        err.statusCode = 409;
        throw err;
    }
    const [result] = await db.query("DELETE FROM habitacion WHERE IDHabitacion=?", [id]);
    return result;
};

module.exports = { getAll, getById, create, update, remove };