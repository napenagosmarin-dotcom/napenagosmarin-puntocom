const { getAll, getById, create, update, remove, updateStatus } = require('../services/paquete.service.js');

const getAllPaquetes = async (req, res) => {
    try {
        const paquetes = await getAll();
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getPaqueteById = async (req, res) => {
    try {
        const paquete = await getById(req.params.id);
        res.json(paquete);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createPaquete = async (req, res) => {
    try {
        const paquete = await create(req.body);
        res.status(201).json(paquete);
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({ message: "¡Error! Ya existe un paquete con ese nombre." });
        }
        res.status(500).json({ error: error.message });
    }
};

const updatePaquete = async (req, res) => {
    try {
        const paquete = await update(req.params.id, req.body);
        res.json(paquete);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deletePaquete = async (req, res) => {
    try {
        await remove(req.params.id);
        res.json({ message: "Paquete eliminado correctamente" });
    } catch (error) {
        if (error.statusCode === 409) {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: error.message });
    }
};

const updatePaqueteStatus = async (req, res) => {
    try {
        const { Estado } = req.body;
        await updateStatus(req.params.id, Estado);
        res.json({ message: "Estado de paquete actualizado" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllPaquetes,
    getPaqueteById,
    createPaquete,
    updatePaquete,
    deletePaquete,
    updatePaqueteStatus
};