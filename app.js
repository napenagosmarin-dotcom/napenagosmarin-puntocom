const express = require('express');
const app = express();

// Importar rutas
const serviciosRoutes = require('./routes/serviciosRoutes');
const authRoutes = require('./routes/auth.routes');

app.use(express.json());

// Rutas
app.use('/api/servicios', serviciosRoutes);
app.use('/auth', authRoutes);

app.listen(3001, () => console.log('Servidor corriendo en puerto 3001'));