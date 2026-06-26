/**
 * Controller: Clientes
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../config/db');
const Cliente = require('../models/models.cliente.js');
const authService = require('../services/auth.service');
const { sendAccountSetupEmail } = require('../services/email.service');

const letrasEspaciosRegex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
const numerosRegex = /^\d+$/;

function validarCliente(data) {
    if (data.Nombre && !letrasEspaciosRegex.test(data.Nombre.toString())) return 'El nombre solo debe contener letras y espacios.';
    if (data.Apellido && !letrasEspaciosRegex.test(data.Apellido.toString())) return 'El apellido solo debe contener letras y espacios.';
    if (data.NroDocumento && !numerosRegex.test(data.NroDocumento.toString())) return 'El documento solo debe contener números.';
    if (data.Telefono && !numerosRegex.test(data.Telefono.toString())) return 'El teléfono solo debe contener números.';
    return null;
}

const ClientesController = {

    async getAllClientes(req, res) {
        try {
            const page = parseInt(req.query.page);
            const limit = parseInt(req.query.limit);
            const search = req.query.search || '';

            if (isNaN(page) || isNaN(limit)) {
                const clientes = await Cliente.getAll();
                return res.json(clientes);
            }

            const offset = (page - 1) * limit;
            const [clientes, total] = await Promise.all([
                Cliente.getPaginated(limit, offset, search),
                Cliente.count(search)
            ]);

            res.json({
                data: clientes,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            res.status(500).json({ error: 'Error al listar clientes', details: error.message });
        }
    },

    async getClienteById(req, res) {
        try {
            const cliente = await Cliente.getById(req.params.IDCliente);
            if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json(cliente);
        } catch (error) {
            res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
        }
    },

    async createCliente(req, res) {
        try {
            const errorValidacion = validarCliente(req.body);
            if (errorValidacion) return res.status(400).json({ error: errorValidacion });

            const { Nombre, Apellido, TipoDocumento, NroDocumento, Email, Pais, Departamento, Municipio, Telefono, Direccion } = req.body;

            if (!Email) return res.status(400).json({ error: 'El correo electrónico es requerido.' });
            if (!Nombre) return res.status(400).json({ error: 'El nombre es requerido.' });

            // Verificar duplicados
            const [[existingUser]] = await db.query('SELECT IDUsuario FROM usuarios WHERE LOWER(Email) = LOWER(?)', [Email]);
            if (existingUser) return res.status(409).json({ error: 'Ya existe un usuario con este correo electrónico.' });

            const [[existingCliente]] = await db.query('SELECT IDCliente FROM clientes WHERE LOWER(Email) = LOWER(?)', [Email]);
            if (existingCliente) return res.status(409).json({ error: 'Ya existe un cliente con este correo electrónico.' });

            const connection = await db.getConnection();
            try {
                await connection.beginTransaction();

                // Crear usuario con contraseña aleatoria (el cliente la establecerá por email)
                const randomPassword = crypto.randomBytes(32).toString('hex');
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(randomPassword, salt);

                await connection.query(
                    `INSERT INTO usuarios
                       (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, Departamento, Municipio, IDRol)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [Nombre, hashedPassword, Apellido || null, Email,
                     TipoDocumento || null, NroDocumento || null,
                     Telefono || null, Pais || null, Direccion || null,
                     Departamento || null, Municipio || null, 1]
                );

                await connection.query(
                    `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, IDRol)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [NroDocumento || null, Nombre, Apellido || null, Direccion || null, Email, Telefono || null, 1]
                );

                await connection.commit();
            } catch (err) {
                await connection.rollback();
                throw err;
            } finally {
                connection.release();
            }

            // Enviar email de configuración de contraseña (no bloquea la respuesta)
            try {
                const setupToken = authService.createPasswordResetToken(Email);
                await sendAccountSetupEmail(Email, setupToken, Nombre);
            } catch (emailErr) {
                console.warn('[clientes.createCliente] No se pudo enviar el correo de configuración:', emailErr.message);
            }

            res.status(201).json({ message: 'Cliente creado. Se envió un correo para que establezca su contraseña.' });
        } catch (error) {
            res.status(500).json({ error: 'Error al crear cliente', details: error.message });
        }
    },

    async updateCliente(req, res) {
        try {
            const errorValidacion = validarCliente(req.body);
            if (errorValidacion) return res.status(400).json({ error: errorValidacion });

            // Obtener email actual para localizar el registro en usuarios
            const existing = await Cliente.getById(req.params.IDCliente);
            if (!existing) return res.status(404).json({ error: 'Cliente no encontrado' });
            const oldEmail = existing.Email;

            const actualizado = await Cliente.update(req.params.IDCliente, req.body);
            if (!actualizado) return res.status(404).json({ error: 'Cliente no encontrado' });

            // Sincronizar datos en la tabla usuarios si el usuario existe
            const { Nombre, Apellido, TipoDocumento, NroDocumento, Email, Pais, Departamento, Municipio, Telefono, Direccion } = req.body;
            const newEmail = Email || oldEmail;

            await db.query(
                `UPDATE usuarios SET
                    NombreUsuario   = COALESCE(?, NombreUsuario),
                    Apellido        = COALESCE(?, Apellido),
                    TipoDocumento   = COALESCE(?, TipoDocumento),
                    NumeroDocumento = COALESCE(?, NumeroDocumento),
                    Telefono        = COALESCE(?, Telefono),
                    Pais            = COALESCE(?, Pais),
                    Direccion       = COALESCE(?, Direccion),
                    Departamento    = COALESCE(?, Departamento),
                    Municipio       = COALESCE(?, Municipio),
                    Email           = ?
                 WHERE LOWER(Email) = LOWER(?)`,
                [Nombre || null, Apellido || null, TipoDocumento || null,
                 NroDocumento || null, Telefono || null, Pais || null,
                 Direccion || null, Departamento || null, Municipio || null,
                 newEmail, oldEmail]
            );

            res.json({ message: 'Cliente actualizado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
        }
    },

    async updateEstadoCliente(req, res) {
        try {
            const { Estado } = req.body;
            if (Estado === undefined || Estado === null) {
                return res.status(400).json({ error: 'El campo Estado es requerido' });
            }
            const actualizado = await Cliente.updateEstado(req.params.IDCliente, Estado);
            if (!actualizado) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json({ message: 'Estado actualizado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al actualizar estado', details: error.message });
        }
    },

    async deleteCliente(req, res) {
        try {
            const eliminado = await Cliente.delete(req.params.IDCliente);
            if (!eliminado) return res.status(404).json({ error: 'Cliente no encontrado' });
            res.json({ message: 'Cliente eliminado correctamente' });
        } catch (error) {
            res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
        }
    }
};

module.exports = ClientesController;
