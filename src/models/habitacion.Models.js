const db = require('../config/db'); // Esto usa tu conexión de MySQL

exports.obtenerHabitaciones = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM habitacion ORDER BY NombreHabitacion ASC");
        return rows;
    } catch (error) {
        throw error;
    }
};

exports.crearHabitacion = async (habitacion) => {
    const NombreHabitacion = habitacion.NombreHabitacion;
    const precio = habitacion.Precio || habitacion.precio || habitacion.Costo;
    const descripcion = habitacion.Descripcion || habitacion.descripcion;
    const imagen = habitacion.imagen;
    const estado = habitacion.Estado !== undefined ? habitacion.Estado : 1;
    try {
        const [result] = await db.query(
            "INSERT INTO habitacion (NombreHabitacion, precio, Descripcion, imagen, Estado) VALUES (?, ?, ?, ?, ?)",
            [NombreHabitacion, precio, descripcion, imagen, estado]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.actualizarHabitacion = async (id, habitacion) => {
    const NombreHabitacion = habitacion.NombreHabitacion;
    const precio = habitacion.Precio || habitacion.precio || habitacion.Costo;
    const descripcion = habitacion.Descripcion || habitacion.descripcion;
    const imagen = habitacion.imagen;
    const estado = habitacion.Estado !== undefined ? habitacion.Estado : 1;
    try {
        const [result] = await db.query(
            "UPDATE habitacion SET NombreHabitacion=?, precio=?, Descripcion=?, imagen=?, Estado=? WHERE IDHabitacion=?",
            [NombreHabitacion, precio, descripcion, imagen, estado, id]
        );
        return result;
    } catch (error) {
        throw error;
    }
};

exports.eliminarHabitacion = async (id) => {
    try {
        const [result] = await db.query("DELETE FROM habitacion WHERE IDHabitacion=?", [id]);
        return result;
    } catch (error) {
        throw error;
    }
};

exports.obtenerHabitacionPorId = async (id) => {
    try {
        const [rows] = await db.query("SELECT * FROM habitacion WHERE IDHabitacion=?", [id]);
        return rows[0];
    } catch (error) {
        throw error;
    }
};