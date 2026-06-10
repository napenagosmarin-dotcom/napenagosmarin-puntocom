const db = require('../config/db');

const bcrypt = require('bcryptjs');

const getAll = async () => {
  try {
    const [results] = await db.query('SELECT * FROM usuarios');
    return results;
  } catch (error) {
    throw error;
  }
};

const create = async (data) => {
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, Estado } = data;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Contrasena, salt);
    const [result] = await db.query(
      'INSERT INTO usuarios (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [NombreUsuario, hashedPassword, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol || 1, Estado || 1]
    );
    return getById(result.insertId);
  } catch (error) {
    throw error;
  }
};

const getById = async (id) => {
  try {
    const [results] = await db.query('SELECT * FROM usuarios WHERE IDUsuario = ?', [id]);
    return results[0];
  } catch (error) {
    throw error;
  }
};

const update = async (id, data) => {
  try {
    const { NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado } = data;
    await db.query(
      'UPDATE usuarios SET NombreUsuario=?, Apellido=?, Email=?, Telefono=?, Pais=?, IDRol=?, Estado=? WHERE IDUsuario=?',
      [NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado || 1, id]
    );
    return getById(id);
  } catch (error) {
    throw error;
  }
};

const updateStatus = async (id, estado) => {
  try {
    await db.query('UPDATE usuarios SET Estado = ? WHERE IDUsuario = ?', [estado, id]);
    return { id, estado };
  } catch (error) {
    throw error;
  }
};

const remove = async (id) => {
  try {
    await db.query('DELETE FROM usuarios WHERE IDUsuario = ?', [id]);
  } catch (error) {
    throw error;
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove };
