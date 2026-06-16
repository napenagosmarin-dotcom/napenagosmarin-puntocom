const pool = require('../config/db.js');

// ⚠️ MAPEO: La BD usa "Email", pero el frontend usa "Correo"
// Este archivo mapea automáticamente: Correo (frontend) -> Email (BD)

// Crear cliente
const create = async (cliente) => {
    const { NroDocumento, Nombre, Apellido, Correo, Telefono, Estado } = cliente;

    const [result] = await pool.query(
        `INSERT INTO clientes 
        (NroDocumento, Nombre, Apellido, Email, Telefono, Estado) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [NroDocumento, Nombre, Apellido, Correo, Telefono, Estado ?? 1]
    );

    return { IDCliente: result.insertId, NroDocumento, Nombre, Apellido, Correo, Telefono, Estado: Estado ?? 1 };
};

// Obtener todos los clientes
const getAll = async () => {
    const [rows] = await pool.query('SELECT * FROM clientes');
    // Mapear Email -> Correo para consistencia con el frontend
    return rows.map(cliente => ({
        ...cliente,
        Correo: cliente.Email,
    }));
};

// Obtener cliente por IDCliente
const getById = async (id) => {
    const [rows] = await pool.query(
        'SELECT * FROM clientes WHERE IDCliente = ?',
        [id]
    );
    const cliente = rows[0];
    if (!cliente) return null;
    // Mapear Email -> Correo
    return { ...cliente, Correo: cliente.Email };
};

// Actualizar cliente
const updateCliente = async (id, cliente) => {
    const { NroDocumento, Nombre, Apellido, Correo, Telefono } = cliente;

    const [result] = await pool.query(
        `UPDATE clientes 
         SET NroDocumento=?, Nombre=?, Apellido=?, Email=?, Telefono=? 
         WHERE IDCliente=?`,
        [NroDocumento, Nombre, Apellido, Correo, Telefono, id]
    );

    return result.affectedRows > 0;
};

// Actualizar estado del cliente
const updateEstadoCliente = async (id, estado) => {
    await pool.query(
        'UPDATE clientes SET Estado=? WHERE IDCliente=?',
        [estado, id]
    );
    return { IDCliente: id, Estado: estado };
};

// Eliminar cliente
const remove = async (id) => {
    const [result] = await pool.query(
        'DELETE FROM clientes WHERE IDCliente=?',
        [id]
    );
    return result.affectedRows > 0;
};

module.exports = {
    create,
    getAll,
    getById,
    updateCliente,
    updateEstadoCliente,
    remove
};

