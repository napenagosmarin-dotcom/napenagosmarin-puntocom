/**
 * Modelo: Cabana
 * Maneja las operaciones de base de datos para cabañas
 */

const pool = require('../config/db.js');

const Cabana = {
    
    // Obtener todas las cabañas (con búsqueda opcional)
    async getAll(search = '') {
        let query = 'SELECT * FROM cabanas';
        const params = [];

        if (search) {
            query += ' WHERE NombreCabana LIKE ? OR Descripcion LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY NombreCabana ASC';
        const [rows] = await pool.query(query, params);
        return rows;
    },

    // Obtener cabaña por ID
    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM cabanas WHERE IDCabana = ?', [id]);
        return rows[0];
    },

    // Crear nueva cabaña
    async create(data) {
        // Cambiamos ImagenUrl por ImagenCabana para que coincida con la DB
        const { NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado, ImagenCabana, NumeroHabitaciones } = data;
        const [result] = await pool.query(
            'INSERT INTO cabanas (NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado, ImagenCabana, NumeroHabitaciones) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado ?? 1, ImagenCabana ?? null, NumeroHabitaciones]
        );
        return { id: result.insertId, ...data };
    },

    // Actualizar cabaña
    async update(id, data) {
        // Cambiamos ImagenUrl por ImagenCabana
        const { NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado, ImagenCabana, NumeroHabitaciones } = data;
        const [result] = await pool.query(
            'UPDATE cabanas SET NombreCabana = ?, Descripcion = ?, CapacidadPersonas = ?, PrecioNoche = ?, Estado = ?, ImagenCabana = ?, NumeroHabitaciones = ? WHERE IDCabana = ?',
            [NombreCabana, Descripcion, CapacidadPersonas, PrecioNoche, Estado, ImagenCabana ?? null, NumeroHabitaciones, id]
        );
        return result.affectedRows > 0;
    },

    // Eliminar cabaña
    async delete(id) {
        const [result] = await pool.query('DELETE FROM cabanas WHERE IDCabana = ?', [id]);
        return result.affectedRows > 0;
    },

    // Actualizar solo el estado de la cabaña
    async updateEstado(id, Estado) {
        const [result] = await pool.query('UPDATE cabanas SET Estado = ? WHERE IDCabana = ?', [Estado, id]);
        return result.affectedRows > 0;
    },

    // Obtener habitaciones de una cabaña
    async getHabitaciones(idCabana) {
        // OJO: En tu script SQL la tabla es 'habitacion' (singular)
        const [rows] = await pool.query(
            'SELECT * FROM habitacion WHERE IDCabana = ? ORDER BY NombreHabitacion ASC',
            [idCabana]
        );
        return rows;
    }
};

module.exports = Cabana;