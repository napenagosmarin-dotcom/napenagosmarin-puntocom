/**
 * Controller: Cabañas
 * Maneja las peticiones HTTP para cabañas
 */

const Cabana = require('../models/models.cabanas.js');

const CabanasController = {
    
    async getAllCabanas(req, res) {
        try {
            const { search } = req.query;
            const cabanas = await Cabana.getAll(search);
            res.json(cabanas);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al listar cabañas', 
                details: error.message 
            });
        }
    },

    async getCabanaById(req, res) {
        try {
            const cabana = await Cabana.getById(req.params.IDCabana);
            if (!cabana) {
                return res.status(404).json({ error: 'Cabaña no encontrada' });
            }
            res.json(cabana);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al obtener cabaña', 
                details: error.message 
            });
        }
    },

    async createCabana(req, res) {
        try {
            const nuevaCabana = await Cabana.create(req.body);
            res.status(201).json(nuevaCabana);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al crear cabaña', 
                details: error.message 
            });
        }
    },

    async updateCabana(req, res) {
        try {
            const actualizado = await Cabana.update(req.params.IDCabana, req.body);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cabaña no encontrada' });
            }
            res.json({ message: 'Cabaña actualizada correctamente' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al actualizar cabaña', 
                details: error.message 
            });
        }
    },

    async deleteCabana(req, res) {
        try {
            const eliminado = await Cabana.delete(req.params.IDCabana);
            if (!eliminado) {
                return res.status(404).json({ error: 'Cabaña no encontrada' });
            }
            res.json({ message: 'Cabaña eliminada correctamente' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al eliminar cabaña', 
                details: error.message 
            });
        }
    },

    async updateEstadoCabana(req, res) {
        try {
            const { Estado } = req.body;
            const actualizado = await Cabana.updateEstado(req.params.IDCabana, Estado);
            if (!actualizado) {
                return res.status(404).json({ error: 'Cabaña no encontrada' });
            }
            res.json({ message: 'Estado de cabaña actualizado' });
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al actualizar estado', 
                details: error.message 
            });
        }
    },

    async getHabitacionesByCabana(req, res) {
        try {
            const habitaciones = await Cabana.getHabitaciones(req.params.IDCabana);
            res.json(habitaciones);
        } catch (error) {
            res.status(500).json({ 
                error: 'Error al listar habitaciones', 
                details: error.message 
            });
        }
    }
};

module.exports = CabanasController;