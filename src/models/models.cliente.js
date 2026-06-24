/**
 * Modelo: Cliente
 * Maneja las operaciones de base de datos para clientes
 */

const pool = require('../config/db.js');

const Cliente = {

    // Sincroniza en clientes los usuarios con IDRol=1 que no tengan registro previo.
    // INSERT IGNORE + try/catch: nunca rompe la carga aunque haya constraint o columna inexistente.
    async syncFromUsuarios() {
        try {
            await pool.query(`
                INSERT IGNORE INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado)
                SELECT
                    u.NumeroDocumento,
                    u.NombreUsuario,
                    u.Apellido,
                    u.Direccion,
                    u.Email,
                    u.Telefono,
                    COALESCE(u.Estado, 1)
                FROM usuarios u
                WHERE u.IDRol = 1
                  AND u.Email IS NOT NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM clientes c WHERE c.Email = u.Email
                  )
            `);
        } catch (err) {
            console.error('[syncFromUsuarios]', err.message);
        }
    },

    // Obtener todos los clientes
    async getAll() {
        await this.syncFromUsuarios();
        const [rows] = await pool.query('SELECT * FROM clientes ORDER BY Nombre ASC');
        return rows.map(this.mapCliente);
    },

    // Obtener clientes paginados y con búsqueda
    async getPaginated(limit, offset, search = '') {
        await this.syncFromUsuarios();
        let query = 'SELECT * FROM clientes';
        let params = [];

        if (search) {
            query += ' WHERE Nombre LIKE ? OR Apellido LIKE ? OR NroDocumento LIKE ? OR Email LIKE ?';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        query += ' ORDER BY Nombre ASC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows] = await pool.query(query, params);
        return rows.map(this.mapCliente);
    },

    // Contar total de clientes (para paginación)
    async count(search = '') {
        let query = 'SELECT COUNT(*) as total FROM clientes';
        let params = [];

        if (search) {
            query += ' WHERE Nombre LIKE ? OR Apellido LIKE ? OR NroDocumento LIKE ? OR Email LIKE ?';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam, searchParam);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].total;
    },

    // Helper para mapear el objeto cliente
    mapCliente(cliente) {
        return {
            IDCliente:    cliente.IDCliente,
            NroDocumento: cliente.NroDocumento,
            Nombre:       cliente.Nombre,
            Apellido:     cliente.Apellido,
            Direccion:    cliente.Direccion,
            Email:        cliente.Email,
            Correo:       cliente.Email,
            Telefono:     cliente.Telefono,
            Estado:       cliente.Estado,
            IDRol:        cliente.IDRol
        };
    },

    // Obtener cliente por ID
    async getById(id) {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE IDCliente = ?', [id]);
        const c = rows[0];
        if (!c) return null;
        return this.mapCliente(c);
    },

    // Crear nuevo cliente
    async create(data) {
        const { NroDocumento, Nombre, Apellido, Direccion, Correo, Email, Telefono, IDRol } = data;
        const emailToSave = Email !== undefined ? Email : Correo;
        const rolToSave = IDRol !== undefined ? IDRol : 1;
        const [result] = await pool.query(
            'INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, IDRol) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [NroDocumento, Nombre, Apellido, Direccion ?? null, emailToSave, Telefono, rolToSave]
        );
        return { id: result.insertId, NroDocumento, Nombre, Apellido, Direccion, Email: emailToSave, Telefono, IDRol: rolToSave };
    },

    // Actualizar cliente (todos los campos)
    async update(id, data) {
        const { NroDocumento, Nombre, Apellido, Direccion, Correo, Email, Telefono, IDRol } = data;
        const emailToSave = Email !== undefined ? Email : Correo;
        const rolToSave = IDRol !== undefined ? IDRol : 1;
        const [result] = await pool.query(
            'UPDATE clientes SET NroDocumento = ?, Nombre = ?, Apellido = ?, Direccion = ?, Email = ?, Telefono = ?, IDRol = ? WHERE IDCliente = ?',
            [NroDocumento, Nombre, Apellido, Direccion ?? null, emailToSave, Telefono, rolToSave, id]
        );
        return result.affectedRows > 0;
    },

    // ✅ Actualizar SOLO el estado del cliente
    async updateEstado(id, estado) {
        const [result] = await pool.query(
            'UPDATE clientes SET Estado = ? WHERE IDCliente = ?',
            [estado, id]
        );
        return result.affectedRows > 0;
    },

    // Eliminar cliente
    async delete(id) {
        const [result] = await pool.query('DELETE FROM clientes WHERE IDCliente = ?', [id]);
        return result.affectedRows > 0;
    },

    // Buscar cliente por documento
    async getByDocumento(nroDocumento) {
        const [rows] = await pool.query('SELECT * FROM clientes WHERE NroDocumento = ?', [nroDocumento]);
        return rows[0];
    }
};

module.exports = Cliente;