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
    const estadoFinal = Estado ?? 1;

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Contrasena, salt);

    const [result] = await connection.query(
      'INSERT INTO usuarios (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol, Estado, EmailVerificado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
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
        [NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado ?? 1, hashedPassword, id]
      );
    } else {
      await db.query(
        'UPDATE usuarios SET NombreUsuario=?, Apellido=?, Email=?, Telefono=?, Pais=?, IDRol=?, Estado=? WHERE IDUsuario=?',
        [NombreUsuario, Apellido, Email, Telefono, Pais, IDRol, Estado ?? 1, id]
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

const changeRole = async (id, nuevoRol) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [[usuario]] = await connection.query('SELECT IDUsuario, Email, NombreUsuario, Apellido, Telefono, NumeroDocumento, Direccion, IDRol FROM usuarios WHERE IDUsuario = ?', [id]);
    if (!usuario) {
      const err = new Error('Usuario no encontrado');
      err.statusCode = 404;
      throw err;
    }
    if (usuario.IDRol === nuevoRol) {
      await connection.rollback();
      return { id, IDRol: nuevoRol, message: 'El usuario ya tiene ese rol' };
    }

    await connection.query('UPDATE usuarios SET IDRol = ? WHERE IDUsuario = ?', [nuevoRol, id]);

    if (nuevoRol === 1) {
      // Promover a cliente: asegurarse de que exista en la tabla clientes
      await connection.query(
        `INSERT INTO clientes (NroDocumento, Nombre, Apellido, Email, Telefono, Direccion, Estado, IDRol)
         SELECT ?, ?, ?, ?, ?, ?, 1, 1
         FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE LOWER(Email) = LOWER(?))`,
        [usuario.NumeroDocumento || null, usuario.NombreUsuario, usuario.Apellido || null,
         usuario.Email, usuario.Telefono || null, usuario.Direccion || null, usuario.Email]
      );
      // Si ya existe, actualizar su rol
      await connection.query(
        'UPDATE clientes SET IDRol = 1 WHERE LOWER(Email) = LOWER(?)',
        [usuario.Email]
      );
    } else {
      // Promover a admin: actualizar IDRol en clientes (se mantiene el historial)
      await connection.query(
        'UPDATE clientes SET IDRol = 2 WHERE LOWER(Email) = LOWER(?)',
        [usuario.Email]
      );
    }

    await connection.commit();
    return getById(id);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
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

module.exports = { getAll, getById, create, update, updateStatus, changeRole, remove, getByDocumento };
