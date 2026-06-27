const crypto = require('crypto');
const db = require('../config/db');

const verificationTokens = new Map();
const resetTokens = new Map();

const bcrypt = require('bcryptjs');

const login = async (Email, Contrasena) => {
  try {
    const sql = `SELECT IDUsuario, NombreUsuario, Apellido, Email, Contrasena,
                        IDRol, Telefono, Pais 
                 FROM usuarios 
                 WHERE Email = ?`;
    const [results] = await db.query(sql, [Email]);
    const user = results[0];

    if (!user) return null;

    let match = false;
    try {
      match = await bcrypt.compare(Contrasena, user.Contrasena);
    } catch (e) {
      match = false;
    }

    // Fallback: si no coincide con bcrypt, verificamos texto plano
    if (!match && (user.Contrasena === Contrasena)) {
      match = true;
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Contrasena, salt);
        const updateSql = `UPDATE usuarios SET Contrasena = ? WHERE IDUsuario = ?`;
        await db.query(updateSql, [hashedPassword, user.IDUsuario]);
      } catch (updateErr) {
        console.error('Error migrando contraseña a hash:', updateErr);
      }
    }

    if (!match) return null;

    delete user.Contrasena;
    return user;
  } catch (error) {
    throw error;
  }
};

const register = async (data) => {
  const connection = await db.getConnection();
  try {
    const { NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, Departamento, Municipio } = data;

    await connection.beginTransaction();

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Contrasena, salt);

    const sqlUsuario = `INSERT INTO usuarios
      (NombreUsuario, Contrasena, Apellido, Email, TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion, Departamento, Municipio, IDRol, EmailVerificado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;

    const [result] = await connection.query(sqlUsuario, [
      NombreUsuario, hashedPassword, Apellido, Email,
      TipoDocumento, NumeroDocumento, Telefono, Pais, Direccion,
      Departamento || null, Municipio || null,
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

const markEmailVerified = async (email) => {
  await db.query('UPDATE usuarios SET EmailVerificado = 1 WHERE LOWER(Email) = LOWER(?)', [email]);
};

const updatePassword = async (Email, newPassword) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const sql = `UPDATE usuarios SET Contrasena = ? WHERE Email = ?`;
    await db.query(sql, [hashedPassword, Email]);
    return true;
  } catch (error) {
    throw error;
  }
};

const createPasswordResetToken = (email) => {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  resetTokens.set(token, { email, expiresAt });
  return token;
};

const validateAndConsumeResetToken = (token) => {
  const record = resetTokens.get(token);
  if (!record || Date.now() > record.expiresAt) return null;
  resetTokens.delete(token);
  return record.email;
};

module.exports = { login, register, createVerificationToken, verifyEmailToken, markEmailVerified, updatePassword, createPasswordResetToken, validateAndConsumeResetToken };