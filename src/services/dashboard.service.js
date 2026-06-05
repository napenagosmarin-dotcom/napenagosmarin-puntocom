// services/dashboard.service.js

const db = require('../config/db');

const getDashboardStats = async () => {
  try {
    const data = {};

    // 1. Total Ingresos
    const [ingresosResult] = await db.query('SELECT SUM(MontoTotal) as total FROM reserva WHERE IdEstadoReserva IN (2, 4)'); // 2: Confirmada, 4: Completada
    data.totalIngresos = ingresosResult[0].total || 0;

    // 2. Reservas Activas (Pendientes 1, Confirmadas 2, Procesando 5)
    const [reservasActivasResult] = await db.query('SELECT COUNT(*) as total FROM reserva WHERE IdEstadoReserva IN (1, 2, 5)');
    data.reservasActivas = reservasActivasResult[0].total || 0;

    // 3. Tasa de ocupación
    // En la base de datos las cabañas utilizan Estado=5 para 'Disponible'.
    // Calculamos ocupadas = total - disponibles y devolvemos % (0-100).
    const [cabanasTotal] = await db.query('SELECT COUNT(*) as total FROM cabanas');
    const [cabanasDisponibles] = await db.query('SELECT COUNT(*) as disponibles FROM cabanas WHERE Estado = 5');
    const totalC = cabanasTotal[0].total || 0; // evitar division por 0
    const disp = cabanasDisponibles[0].disponibles || 0;
    const ocupC = Math.max(0, totalC - disp);
    data.tasaOcupacion = totalC === 0 ? 0 : Math.round((ocupC / totalC) * 100);

    // 4. Clientes Activos
    const [clientesActivos] = await db.query('SELECT COUNT(*) as total FROM clientes WHERE Estado = 1');
    data.clientesActivos = clientesActivos[0].total || 0;

    // 5. Estado de cabañas (Para Doughnut)
    const [estadoCabanas] = await db.query('SELECT Estado, COUNT(*) as count FROM cabanas GROUP BY Estado');
    data.estadoCabanas = estadoCabanas;

    // 6. Cabañas más alquiladas (Top 5)
    const [cabanasAlquiladas] = await db.query(`
      SELECT c.NombreCabana, COUNT(*) as reservas 
      FROM detallereservacabana drc
      JOIN cabanas c ON drc.IDCabana = c.IDCabana
      GROUP BY c.IDCabana, c.NombreCabana
      ORDER BY reservas DESC 
      LIMIT 5
    `);
    data.cabanasMasAlquiladas = cabanasAlquiladas;

    // 7. Cabañas con mayor ingreso (Top 5)
    const [cabanasIngreso] = await db.query(`
      SELECT c.NombreCabana, SUM(drc.Precio) as totalIngreso
      FROM detallereservacabana drc
      JOIN cabanas c ON drc.IDCabana = c.IDCabana
      GROUP BY c.IDCabana, c.NombreCabana
      ORDER BY totalIngreso DESC
      LIMIT 5
    `);
    data.cabanasMayorIngreso = cabanasIngreso;

    // 8. Paquetes más comprados (Top 5)
    const [paquetesComprados] = await db.query(`
      SELECT p.nombre, SUM(drp.Cantidad) as totalComprados
      FROM detallereservapaquetes drp
      JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
      GROUP BY p.IDPaquete, p.nombre
      ORDER BY totalComprados DESC
      LIMIT 5
    `);
    data.paquetesMasComprados = paquetesComprados;

    // 9. Servicios más solicitados (Top 5)
    const [serviciosSolicitados] = await db.query(`
      SELECT s.nombre, SUM(drs.Cantidad) as totalSolicitados
      FROM detallereservaservicio drs
      JOIN servicios s ON drs.IDServicio = s.IDServicio
      GROUP BY s.IDServicio, s.nombre
      ORDER BY totalSolicitados DESC
      LIMIT 5
    `);
    data.serviciosMasSolicitados = serviciosSolicitados;

    // 10. Reservas por mes (últimos 6 meses)
    const [reservasMes] = await db.query(`
      SELECT 
        DATE_FORMAT(FechaReserva, '%Y-%m') as mes,
        COUNT(*) as totalReservas
      FROM reserva
      WHERE FechaReserva >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY mes
      ORDER BY mes ASC
    `);
    data.reservasPorMes = reservasMes;

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getDashboardStats
};
