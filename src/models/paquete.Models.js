const db = require('../config/db');

// Obtener todos los paquetes
exports.getAll = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM paquetes");
        return rows;
    } catch (error) {
        throw error;
    }
};

// Obtener un paquete por ID
exports.getById = async (id) => {
    try {
        const [rows] = await db.query("SELECT * FROM paquetes WHERE id = ?", [id]);
        return rows[0]; // Retorna solo el primer resultado
    } catch (error) {
        throw error;
    }
};

// Crear un nuevo paquete
exports.create = async (paquete) => {
    const { nombre, precio, descripcion, destino, duracion, imagen } = paquete;
    try {
        const [result] = await db.query(
            "INSERT INTO paquetes (nombre, precio, descripcion, destino, duracion, imagen) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, precio, descripcion, destino, duracion, imagen]
        );
        return { id: result.insertId, ...paquete };
    } catch (error) {
        throw error;
    }
};

// Actualizar un paquete existente
exports.update = async (id, paquete) => {
    const { nombre, precio, descripcion, destino, duracion, imagen } = paquete;
    try {
        await db.query(
            "UPDATE paquetes SET nombre = ?, precio = ?, descripcion = ?, destino = ?, duracion = ?, imagen = ? WHERE id = ?",
            [nombre, precio, descripcion, destino, duracion, imagen, id]
        );
        return { id, ...paquete };
    } catch (error) {
        throw error;
    }
};

// Eliminar un paquete
exports.remove = async (id) => {
    try {
        const [result] = await db.query("DELETE FROM paquetes WHERE id = ?", [id]);
        return result;
    } catch (error) {
        throw error;
    }
};