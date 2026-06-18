const db = require('../config/db.js');

const getAll = async () => {
    const sql = `
        SELECT p.*, p.nombre AS NombrePaquete, h.NombreHabitacion, c.NombreCabana,
            (SELECT GROUP_CONCAT(s.nombre SEPARATOR ', ') FROM servicios s WHERE FIND_IN_SET(s.IDServicio, p.IDServicio)) AS NombreServicio
        FROM paquetes p
        LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
        LEFT JOIN cabanas c ON p.IDCabana = c.IDCabana
    `;
    const [rows] = await db.query(sql);
    return rows;
};

const getById = async (id) => {
    const [rows] = await db.query(
        `SELECT p.*, 
                h.NombreHabitacion, 
                c.NombreCabana,
                (SELECT GROUP_CONCAT(s.nombre SEPARATOR ', ') FROM servicios s WHERE FIND_IN_SET(s.IDServicio, p.IDServicio)) AS NombreServicio
         FROM paquetes p
         LEFT JOIN habitacion h ON p.IDHabitacion = h.IDHabitacion
         LEFT JOIN cabanas c ON p.IDCabana = c.IDCabana
         WHERE p.IDPaquete = ?`, [id]
    );
    const row = rows[0];
    if (row) row.NombrePaquete = row.NombrePaquete || row.nombre;
    return row;
};

const create = async (data) => {
    const nombre = data.NombrePaquete || data.nombre || '';
    const Descripcion = data.Descripcion || data.descripcion || '';
    const IDHabitacion = data.IDHabitacion || null;
    const IDCabana = data.IDCabana || null;
    let IDServicio = data.IDServicio || null;
    if (Array.isArray(IDServicio)) IDServicio = IDServicio.join(',');
    const Precio = data.Precio || data.precio || 0;
    const Descuento = data.Descuento || 0;
    const TipoDescuento = data.TipoDescuento || 'porcentaje';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const imagen = data.imagen || '';
    const NumeroPersonas = data.NumeroPersonas ? Number(data.NumeroPersonas) : null;

    const [result] = await db.query(
        `INSERT INTO paquetes (nombre, Descripcion, IDHabitacion, IDCabana, IDServicio, precio, Descuento, TipoDescuento, Estado, imagen, NumeroPersonas)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [nombre, Descripcion, IDHabitacion, IDCabana, IDServicio, Precio, Descuento, TipoDescuento, Estado, imagen, NumeroPersonas]
    );
    return { IDPaquete: result.insertId, ...data };
};

const update = async (id, data) => {
    const nombre = data.NombrePaquete || data.nombre || '';
    const Descripcion = data.Descripcion || data.descripcion || '';
    const IDHabitacion = data.IDHabitacion || null;
    const IDCabana = data.IDCabana || null;
    let IDServicio = data.IDServicio || null;
    if (Array.isArray(IDServicio)) IDServicio = IDServicio.join(',');
    const Precio = data.Precio || data.precio || 0;
    const Descuento = data.Descuento || 0;
    const TipoDescuento = data.TipoDescuento || 'porcentaje';
    const Estado = data.Estado !== undefined ? Number(data.Estado) : 1;
    const imagen = data.imagen || '';
    const NumeroPersonas = data.NumeroPersonas ? Number(data.NumeroPersonas) : null;

    await db.query(
        `UPDATE paquetes
         SET nombre=?, Descripcion=?, IDHabitacion=?, IDCabana=?, IDServicio=?, precio=?, Descuento=?, TipoDescuento=?, Estado=?, imagen=?, NumeroPersonas=?
         WHERE IDPaquete=?`,
        [nombre, Descripcion, IDHabitacion, IDCabana, IDServicio, Precio, Descuento, TipoDescuento, Estado, imagen, NumeroPersonas, id]
    );
    return getById(id);
};

const remove = async (id) => {
    const [check] = await db.query(
        'SELECT COUNT(*) AS total FROM detallereservapaquetes WHERE IDPaquete = ?', [id]
    );
    if (check[0].total > 0) {
        const err = new Error('No se puede eliminar el paquete porque está asociado a reservas existentes. Cambia su estado a inactivo.');
        err.statusCode = 409;
        throw err;
    }
    await db.query("DELETE FROM paquetes WHERE IDPaquete=?", [id]);
};

const updateStatus = async (id, status) => {
    await db.query("UPDATE paquetes SET Estado=? WHERE IDPaquete=?", [status, id]);
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    updateStatus
};


