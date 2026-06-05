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
    const [result] = await db.query(
        "INSERT INTO habitacion (NombreHabitacion, precio, Descripcion, imagen, Estado) VALUES (?, ?, ?, ?, ?)",
        [nombre, precio, descripcion, imagen, Estado]
    );
    return result;
};

const update = async (id, data) => {
    const nombre = data.tipo || data.NombreHabitacion || '';
    const precio = data.precio || data.Precio || 0;
    const descripcion = data.descripcion || data.Descripcion || '';
    const imagen = data.imagen || '';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const [result] = await db.query(
        "UPDATE habitacion SET NombreHabitacion=?, precio=?, Descripcion=?, imagen=?, Estado=? WHERE IDHabitacion=?",
        [nombre, precio, descripcion, imagen, Estado, id]
    );
    return result;
};

const remove = async (id) => {
    const [result] = await db.query("DELETE FROM habitacion WHERE IDHabitacion=?", [id]);
    return result;
};

module.exports = { getAll, getById, create, update, remove };