const crypto = require('crypto');
const db = require('../config/db');

const verificationTokens = new Map();

const login = async (Email, Contrasena) => {
  try {
    const sql = `SELECT IDUsuario, NombreUsuario, Apellido, Email, 
                        IDRol, Telefono, Pais 
                 FROM usuarios 
                 WHERE Email = ? AND Contrasena = ?`;
    const [results] = await db.query(sql, [Email, Contrasena]);
    return results[0] || null;
  } catch (error) {
    throw error;
  }
};

const register = async (data) => {
  const connection = await db.getConnection();
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion } = data;

    await connection.beginTransaction();

    const sqlUsuario = `INSERT INTO usuarios 
      (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, IDRol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const [result] = await connection.query(sqlUsuario, [
      NombreUsuario, Contrasena, Apellido, Email,
      TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion,
      1
    ]);

    const sqlCliente = `INSERT INTO clientes 
      (NroDocumento, Nombre, Apellido, Direccion, Email, Telefono, Estado, IDRol) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

    await connection.query(sqlCliente, [
      NumeroDocumento, NombreUsuario, Apellido,
      Direccion, Email, Telefono, 1, 1
    ]);

    await connection.commit();
    return { id: result.insertId, email: Email };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const createVerificationToken = (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora
  verificationTokens.set(token, { email, expiresAt });
  return token;
};

const verifyEmailToken = (token) => {
  const record = verificationTokens.get(token);
  if (!record || Date.now() > record.expiresAt) {
    return null;
  }
  verificationTokens.delete(token);
  return record.email;
};

const updatePassword = async (Email, newPassword) => {
  try {
    const sql = `UPDATE usuarios SET Contrasena = ? WHERE Email = ?`;
    await db.query(sql, [newPassword, Email]);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = { login, register, createVerificationToken, verifyEmailToken, updatePassword };