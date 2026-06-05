const db = require('../config/db.js');

const getServicios = async () => {
    const [rows] = await db.query("SELECT *, nombre AS NombreServicio FROM servicios");
    return rows;
};

const crearServicio = async (data) => {
    const nombre = data.NombreServicio || data.nombre || '';
    const precio = data.precio || data.Costo || 0;
    const Descripcion = data.Descripcion || data.descripcion || '';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const imagen = data.imagen || '';
    const Costo = data.Costo || data.precio || 0;
    const Duracion = data.Duracion || null;
    const CantidadMaximaPersonas = data.CantidadMaximaPersonas || null;

    const [result] = await db.query(
        "INSERT INTO servicios (nombre, precio, Descripcion, Estado, imagen, Costo, Duracion, CantidadMaximaPersonas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [nombre, precio, Descripcion, Estado, imagen, Costo, Duracion, CantidadMaximaPersonas]
    );
    return { IDServicio: result.insertId, ...data };
};

const actualizarServicio = async (id, data) => {
    const nombre = data.NombreServicio || data.nombre || '';
    const precio = data.precio || data.Costo || 0;
    const Descripcion = data.Descripcion || data.descripcion || '';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const imagen = data.imagen || '';
    const Costo = data.Costo || data.precio || 0;
    const Duracion = data.Duracion || null;
    const CantidadMaximaPersonas = data.CantidadMaximaPersonas || null;

    await db.query(
        "UPDATE servicios SET nombre=?, precio=?, Descripcion=?, Estado=?, imagen=?, Costo=?, Duracion=?, CantidadMaximaPersonas=? WHERE IDServicio=?",
        [nombre, precio, Descripcion, Estado, imagen, Costo, Duracion, CantidadMaximaPersonas, id]
    );
    const [rows] = await db.query("SELECT *, nombre AS NombreServicio FROM servicios WHERE IDServicio=?", [id]);
    return rows[0];
};

const eliminarServicio = async (id) => {
    await db.query("DELETE FROM servicios WHERE IDServicio=?", [id]);
};

module.exports = {
    getServicios,
    crearServicio,
    actualizarServicio,
    eliminarServicio
};


