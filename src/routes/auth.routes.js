const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authService = require('../services/auth.service');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../services/email.service');

// Temporal en memoria
const resetTokens = new Map();

router.post('/login', authController.login);
router.post('/register', authController.register);

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hora

    resetTokens.set(token, { email, expiresAt });

    await sendPasswordResetEmail(email, token);

    res.json({ message: 'Si el correo existe, recibirás un enlace en breve.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al procesar la solicitud.', details: error.message });
  }
});

// POST /auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const token = authService.createVerificationToken(email);
    await sendVerificationEmail(email, token);
    res.json({ message: 'Correo de verificación reenviado. Revisa tu bandeja.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al reenviar el correo de verificación.' });
  }
});

// GET /auth/verify-email
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect('/src/pages/verify-email.html?status=failed');
  }

  const email = authService.verifyEmailToken(token);

  if (!email) {
    return res.redirect('/src/pages/verify-email.html?status=failed');
  }

  return res.redirect('/src/pages/verify-email.html?status=success');
});

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  const record = resetTokens.get(token);

  if (!record || Date.now() > record.expiresAt) {
    return res.status(400).json({ error: 'Token inválido o expirado.' });
  }

  try {
    await authService.updatePassword(record.email, newPassword);
    resetTokens.delete(token);
    res.json({ message: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar la contraseña.' });
  }
});

module.exports = router;