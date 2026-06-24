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
  const connection = await db.getConnection();
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, Estado } = data;
    const rolFinal = IDRol || 1;
    const estadoFinal = Estado || 1;

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Contrasena, salt);

    const [result] = await connection.query(
      'INSERT INTO usuarios (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, Estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [NombreUsuario, hashedPassword, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, rolFinal, estadoFinal]
    );

    // Si el rol es CLIENTE (1), sincronizar en la tabla clientes
    if (rolFinal === 1 || rolFinal === '1') {
      await connection.query(
        `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol)
         SELECT ?, ?, ?, ?, ?, ?, ?, 1
         FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE Email = ?)`,
        [NumeroDocumento || null, NombreUsuario, Apellido, Direccion || null, Email, Telefono || null, estadoFinal, Email]
      );
    }

    await connection.commit();
    return getById(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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
    const { NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado, Contrasena } = data;

    if (Contrasena && Contrasena.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(Contrasena.trim(), salt);
      await db.query(
        'UPDATE usuarios SET NombreUsuario=?, Apellido=?, Email=?, Telefono=?, Pais=?, IDRol=?, Estado=?, Contrasena=? WHERE IDUsuario=?',
        [NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado || 1, hashedPassword, id]
      );
    } else {
      await db.query(
        'UPDATE usuarios SET NombreUsuario=?, Apellido=?, Email=?, Telefono=?, Pais=?, IDRol=?, Estado=? WHERE IDUsuario=?',
        [NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado || 1, id]
      );
    }

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

const getByDocumento = async (numero) => {
  try {
    const [results] = await db.query(
      'SELECT IDUsuario, NombreUsuario, Apellido, Email, NumeroDocumento, Telefono FROM usuarios WHERE NumeroDocumento = ? AND Estado = 1 AND IDRol = 1 LIMIT 1',
      [numero]
    );
    return results[0] || null;
  } catch (error) {
    throw error;
  }
};

module.exports = { getAll, getById, create, update, updateStatus, remove, getByDocumento };
