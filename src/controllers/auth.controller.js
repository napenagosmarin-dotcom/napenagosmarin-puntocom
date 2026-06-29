const authService = require('../services/auth.service');
const { sendVerificationEmail } = require('../services/email.service');

const login = async (req, res, next) => {
  try {
    const { Email, Contrasena } = req.body;

    if (!Email || !Contrasena) {
      return res.status(400).json({ message: 'Email y Contrasena son requeridos' });
    }

    const user = await authService.login(Email, Contrasena);

    if (!user) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos' });
    }

    res.status(200).json({ message: 'Login exitoso', user });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error al procesar el login', details: error.message, stack: error.stack });
  }
};

const register = async (req, res, next) => {
  try {
    const {
      NombreUsuario, Contrasena, Apellido, Email,
      TipoDocumento, NumeroDocumento, Telefono,
      Pais, Direccion, Departamento, Municipio
    } = req.body;

    if (!NombreUsuario || !Contrasena || !Email) {
      return res.status(400).json({ message: 'Nombre, correo electrónico y contraseña son requeridos.' });
    }

    const result = await authService.register({
      NombreUsuario, Contrasena, Apellido, Email,
      TipoDocumento, NumeroDocumento, Telefono,
      Pais, Direccion, Departamento, Municipio
    });

    try {
      const verificationToken = authService.createVerificationToken(Email);
      await sendVerificationEmail(Email, verificationToken);
    } catch (emailErr) {
      console.error('Email de verificación no enviado:', emailErr.message);
    }

    res.status(201).json({ message: 'Usuario registrado exitosamente. Revisa tu correo para verificar tu cuenta.', userId: result.id });

  } catch (error) {
    console.error('Register error:', error);

    // Errores de negocio con código HTTP explícito
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    // Correo ya registrado
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una cuenta registrada con ese correo electrónico.' });
    }

    res.status(500).json({ message: 'Ocurrió un error al crear la cuenta. Intenta nuevamente.' });
  }
};

module.exports = { login, register };