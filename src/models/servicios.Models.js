const db = require('../config/db.js');

const obtenerServicios = async () => {
    const [rows] = await db.query("SELECT * FROM servicios");
    return rows;
};

const obtenerServicioPorId = async (id) => {
    const [rows] = await db.query(
        "SELECT *, nombre AS NombreServicio FROM servicios WHERE IDServicio=?",
        [id]
    );
    return rows[0];
};

const crearServicio = async (servicio) => {
    const nombre = servicio.nombre || servicio.NombreServicio || '';
    const Descripcion = servicio.Descripcion || servicio.descripcion || '';
    const Duracion = servicio.Duracion || servicio.duracion || '';
    const CantidadMaximaPersonas = servicio.CantidadMaximaPersonas || null;
    const precio = servicio.precio || servicio.Costo || 0;
    const Estado = servicio.Estado !== undefined ? Number(servicio.Estado) : 1;
    const imagen = servicio.imagen || '';

    const [result] = await db.query(
        "INSERT INTO servicios (nombre, Descripcion, Duracion, CantidadMaximaPersonas, precio, Estado, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [nombre, Descripcion, Duracion, CantidadMaximaPersonas, precio, Estado, imagen]
    );

    return result;
};

const actualizarServicio = async (id, servicio) => {
    const nombre = servicio.nombre || servicio.NombreServicio || '';
    const Descripcion = servicio.Descripcion || servicio.descripcion || '';
    const Duracion = servicio.Duracion || servicio.duracion || '';
    const CantidadMaximaPersonas = servicio.CantidadMaximaPersonas || null;
    const precio = servicio.precio || servicio.Costo || 0;
    const Estado = servicio.Estado !== undefined ? Number(servicio.Estado) : 1;
    const imagen = servicio.imagen || '';

    const [result] = await db.query(
        "UPDATE servicios SET nombre=?, Descripcion=?, Duracion=?, CantidadMaximaPersonas=?, precio=?, Estado=?, imagen=? WHERE IDServicio=?",
        [nombre, Descripcion, Duracion, CantidadMaximaPersonas, precio, Estado, imagen, id]
    );

    return result;
};

const eliminarServicio = async (id) => {
    const [check] = await db.query(
        'SELECT COUNT(*) AS total FROM detallereservaservicio WHERE IDServicio = ?', [id]
    );
    if (check[0].total > 0) {
        const err = new Error('No se puede eliminar el servicio porque está asociado a reservas existentes. Cambia su estado a inactivo.');
        err.statusCode = 409;
        throw err;
    }
    const [result] = await db.query("DELETE FROM servicios WHERE IDServicio=?", [id]);
    return result;
};

module.exports = {
    obtenerServicios,
    obtenerServicioPorId,
    crearServicio,
    actualizarServicio,
    eliminarServicio
};