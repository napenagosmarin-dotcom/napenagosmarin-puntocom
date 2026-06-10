// services/reservation.service.js

const db = require('../config/db');
const usuariosService = require('./usuarios.service');
const emailService = require('./email.service');

// Obtener todas las reservas (con paginación opcional)
const getAllReservations = async (page = null, limit = null) => {
  try {
    let sql = `SELECT r.*, u.NombreUsuario, u.NumeroDocumento AS NroDocumentoCliente, 
                        e.NombreEstadoReserva, m.NomMetodoPago,
                         p.IDPaquete, p.nombre AS NombrePaquete, p.precio AS PrecioPaquete,
                         COALESCE(h_direct.IDHabitacion, h_paq.IDHabitacion) AS IDHabitacion,
                         COALESCE(h_direct.NombreHabitacion, h_paq.NombreHabitacion) AS NombreHabitacion,
                         COALESCE(h_direct.precio, h_paq.precio) AS CostoHabitacion,
                         c.NombreCabana, c.PrecioNoche AS PrecioCabana,
                         r.IdEstadoReserva AS Estado
                 FROM reserva r
                 JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
                 LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
                 LEFT JOIN metodopago m ON r.MetodoPago = m.IdMetodoPago
                 LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IdReserva
                 LEFT JOIN habitacion h_direct ON drh.IDHabitacion = h_direct.IDHabitacion
                 LEFT JOIN detallereservapaquetes drp ON drp.IDReserva = r.IdReserva
                 LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
                 LEFT JOIN habitacion h_paq ON p.IDHabitacion = h_paq.IDHabitacion
                 LEFT JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
                 LEFT JOIN cabanas c ON drc.IDCabana = c.IDCabana
                 ORDER BY r.IdReserva DESC`;

    // Si hay paginación
    if (page !== null && limit !== null) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
      
      const [results] = await db.query(sql);
      const [countResult] = await db.query('SELECT COUNT(*) as total FROM reserva');
      
      // Obtener counts para KPIs rápidos
      const [pendientesResult] = await db.query('SELECT COUNT(*) as count FROM reserva WHERE IdEstadoReserva = 1'); // 1 = Pendiente
      const [confirmadasResult] = await db.query('SELECT COUNT(*) as count FROM reserva WHERE IdEstadoReserva = 2'); // 2 = Confirmada
      const [montoResult] = await db.query('SELECT SUM(MontoTotal) as total FROM reserva');

      return {
        data: results,
        total: countResult[0].total,
        pendientes: pendientesResult[0].count,
        confirmadas: confirmadasResult[0].count,
        montoTotal: montoResult[0].total || 0
      };
    }

    const [results] = await db.query(sql);
    return results;
  } catch (error) {
    throw error;
  }
};

// Obtener reserva por ID
const getReservationById = async (id) => {
  try {
    const sql = `SELECT r.*, u.NombreUsuario, u.NumeroDocumento AS NroDocumentoCliente, 
                        e.NombreEstadoReserva, m.NomMetodoPago,
                         p.IDPaquete, p.nombre AS NombrePaquete, p.precio AS PrecioPaquete,
                         COALESCE(h_direct.IDHabitacion, h_paq.IDHabitacion) AS IDHabitacion,
                         COALESCE(h_direct.NombreHabitacion, h_paq.NombreHabitacion) AS NombreHabitacion,
                         COALESCE(h_direct.precio, h_paq.precio) AS CostoHabitacion,
                         c.NombreCabana, c.PrecioNoche AS PrecioCabana,
                         r.IdEstadoReserva AS Estado
                 FROM reserva r
                 JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
                 LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
                 LEFT JOIN metodopago m ON r.MetodoPago = m.IdMetodoPago
                 LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IdReserva
                 LEFT JOIN habitacion h_direct ON drh.IDHabitacion = h_direct.IDHabitacion
                 LEFT JOIN detallereservapaquetes drp ON drp.IDReserva = r.IdReserva
                 LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
                 LEFT JOIN habitacion h_paq ON p.IDHabitacion = h_paq.IDHabitacion
                 LEFT JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
                 LEFT JOIN cabanas c ON drc.IDCabana = c.IDCabana
                 WHERE r.IdReserva = ?`;

    const [results] = await db.query(sql, [id]);
    const reservation = results[0];
    if (!reservation) return null;

    const servicioSql = `SELECT s.IDServicio, s.nombre AS NombreServicio, drs.Cantidad, drs.Precio AS PrecioUnitario,
                                (drs.Cantidad * drs.Precio) AS Subtotal
                         FROM detallereservaservicio drs
                         JOIN servicios s ON drs.IDServicio = s.IDServicio
                         WHERE drs.IDReserva = ?`;

    const [servicioResults] = await db.query(servicioSql, [id]);
    return { ...reservation, servicios: servicioResults || [] };
  } catch (error) {
    throw error;
  }
};

// Obtener reservas por usuario
const getReservationsByUser = async (userId) => {
  try {
    const parsedUserId = Number(userId);
    if (!Number.isInteger(parsedUserId)) return [];
 
    const sql = `SELECT r.*, u.NombreUsuario, u.NumeroDocumento AS NroDocumentoCliente, 
                        e.NombreEstadoReserva, m.NomMetodoPago,
                         p.IDPaquete, p.nombre AS NombrePaquete, p.precio AS PrecioPaquete,
                         COALESCE(h_direct.IDHabitacion, h_paq.IDHabitacion) AS IDHabitacion,
                         COALESCE(h_direct.NombreHabitacion, h_paq.NombreHabitacion) AS NombreHabitacion,
                         COALESCE(h_direct.precio, h_paq.precio) AS CostoHabitacion,
                         c.NombreCabana, c.PrecioNoche AS PrecioCabana,
                         r.IdEstadoReserva AS Estado
                 FROM reserva r
                 JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
                 LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
                 LEFT JOIN metodopago m ON r.MetodoPago = m.IdMetodoPago
                 LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IdReserva
                 LEFT JOIN habitacion h_direct ON drh.IDHabitacion = h_direct.IDHabitacion
                 LEFT JOIN detallereservapaquetes drp ON drp.IDReserva = r.IdReserva
                 LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
                 LEFT JOIN habitacion h_paq ON p.IDHabitacion = h_paq.IDHabitacion
                 LEFT JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
                 LEFT JOIN cabanas c ON drc.IDCabana = c.IDCabana
                 WHERE r.UsuarioIdusuario = ?`;
    const [results] = await db.query(sql, [parsedUserId]);
    return results;
  } catch (error) {
    throw error;
  }
};

const getPackagePrice = async (IDPaquete) => {
  try {
    if (!IDPaquete) return 0;
    const [results] = await db.query('SELECT Precio FROM paquetes WHERE IDPaquete = ?', [IDPaquete]);
    if (!results.length) throw new Error('Paquete no encontrado');
    return Number(results[0].Precio) || 0;
  } catch (error) {
    throw error;
  }
};

const getHabitacionPrice = async (IDHabitacion) => {
  try {
    if (!IDHabitacion) return 0;
    const [results] = await db.query('SELECT precio FROM habitacion WHERE IDHabitacion = ?', [IDHabitacion]);
    if (!results.length) throw new Error('Habitación no encontrada');
    return Number(results[0].precio) || 0;
  } catch (error) {
    throw error;
  }
};

const getCabanaPrice = async (IDCabana) => {
  try {
    if (!IDCabana) return 0;
    const [results] = await db.query('SELECT PrecioNoche FROM cabanas WHERE IDCabana = ?', [IDCabana]);
    if (!results.length) throw new Error('Cabaña no encontrada');
    return Number(results[0].PrecioNoche) || 0;
  } catch (error) {
    throw error;
  }
};

const getServicesPrices = async (serviceRows) => {
  try {
    if (!Array.isArray(serviceRows) || serviceRows.length === 0) return [];
    const servicioIds = serviceRows
      .map(item => Number(item?.IDServicio ?? item))
      .filter(id => Number.isInteger(id) && id > 0);
    if (servicioIds.length === 0) return [];
    const [results] = await db.query('SELECT IDServicio, precio AS Costo FROM servicios WHERE IDServicio IN (?)', [servicioIds]);
    return results.map(r => ({ IDServicio: r.IDServicio, Costo: Number(r.Costo) || 0 }));
  } catch (error) {
    throw error;
  }
};

const insertPackageDetail = async (connection, reservaId, IDPaquete, precio) => {
  try {
    if (!IDPaquete) return;
    const data = {
      IDReserva: reservaId,
      IDPaquete,
      Cantidad: 1,
      Precio: precio,
      Estado: 1
    };
    await connection.query('INSERT INTO detallereservapaquetes SET ?', data);
  } catch (error) {
    throw error;
  }
};



const insertHabitacionDetail = async (connection, reservaId, IDHabitacion, precio) => {
  try {
    if (!IDHabitacion) return;
    const data = {
      IDReserva: reservaId,
      IDHabitacion,
      Cantidad: 1,
      precio,
      Estado: 1
    };
    await connection.query('INSERT INTO detallereservahabitacion SET ?', data);
  } catch (error) {
    throw error;
  }
};

const insertCabanaDetail = async (connection, reservaId, IDCabana, precio) => {
  try {
    if (!IDCabana) return;
    const data = {
      IDReserva: reservaId,
      IDCabana,
      Cantidad: 1,
      Precio: precio,
      Estado: 1
    };
    await connection.query('INSERT INTO detallereservacabana SET ?', data);
  } catch (error) {
    throw error;
  }
};

const insertServiceDetails = async (connection, reservaId, serviceRows) => {
  try {
    if (!Array.isArray(serviceRows) || serviceRows.length === 0) return;
    const inserts = serviceRows.map(servicio => [
      reservaId,
      servicio.IDServicio,
      Number(servicio.Cantidad || 1),
      Number(servicio.Costo || servicio.Precio || 0),
      1
    ]);
    await connection.query(
      'INSERT INTO detallereservaservicio (IDReserva, IDServicio, Cantidad, Precio, Estado) VALUES ?',
      [inserts]
    );
  } catch (error) {
    throw error;
  }
};

const calculateTotals = async (IDPaquete, IDHabitacion, IDCabana, servicioRows, FechaInicio = null, FechaFinalizacion = null) => {
  // Calcular número de noches
  let noches = 1;
  if (FechaInicio && FechaFinalizacion) {
    const inicio = new Date(FechaInicio);
    const fin = new Date(FechaFinalizacion);
    const diffMs = fin - inicio;
    noches = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
  }

  const paquetePrecioNoche = await getPackagePrice(IDPaquete);
  const habitacionPrecioNoche = await getHabitacionPrice(IDHabitacion);
  const cabanaPrecioNoche = await getCabanaPrice(IDCabana);
  const servicioPrecios = await getServicesPrices(servicioRows);
  
  // Multiplicar por número de noches para alojamiento
  const paquetePrecio = paquetePrecioNoche * noches;
  const habitacionPrecio = habitacionPrecioNoche * noches;
  const cabanaPrecio = cabanaPrecioNoche * noches;
  
  const servicios = Array.isArray(servicioRows)
    ? servicioRows.map(row => {
        const IDServicio = Number(row?.IDServicio ?? row);
        const precioBase = servicioPrecios.find(s => Number(s.IDServicio) === IDServicio)?.Costo || 0;
        return {
          IDServicio,
          Cantidad: Number(row?.Cantidad || 1),
          Costo: precioBase
        };
      })
    : [];
  const totalServicios = servicios.reduce((sum, servicio) => sum + (servicio.Costo * servicio.Cantidad), 0);
  const subtotal = paquetePrecio + habitacionPrecio + cabanaPrecio + totalServicios;
  const iva = parseFloat((subtotal * 0.19).toFixed(2));
  const total = parseFloat((subtotal + iva).toFixed(2));
  return {
    paquetePrecio,
    habitacionPrecio,
    cabanaPrecio,
    servicios,
    subtotal,
    iva,
    total,
    noches
  };
};

// Crear nueva reserva
const createReservation = async (data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const servicioIds = Array.isArray(data.serviciosAdicionales) ? data.serviciosAdicionales : [];
    const totals = await calculateTotals(data.IDPaquete, data.IDHabitacion, data.IDCabana, servicioIds, data.FechaInicio, data.FechaFinalizacion);

    // reservaData NO incluye IDPaquete ni IDHabitacion — se guardan en tablas de detalle
    const reservaData = {
      FechaReserva: data.FechaReserva || new Date(),
      FechaInicio: data.FechaInicio || null,
      FechaFinalizacion: data.FechaFinalizacion || null,
      SubTotal: totals.subtotal,
      Descuento: 0,
      IVA: totals.iva,
      MontoTotal: totals.total,
      MetodoPago: data.MetodoPago || null,
      IdEstadoReserva: data.IdEstadoReserva || 1,
      UsuarioIdusuario: data.UsuarioIdusuario || null
    };

    const [result] = await connection.query('INSERT INTO reserva SET ?', reservaData);
    const reservaId = result.insertId;

    // Guardar habitación o paquete en su tabla de detalle
    if (data.IDHabitacion) {
      await insertHabitacionDetail(connection, reservaId, data.IDHabitacion, totals.habitacionPrecio);
    } else if (data.IDCabana) {
      await insertCabanaDetail(connection, reservaId, data.IDCabana, totals.cabanaPrecio);
    } else if (data.IDPaquete) {
      await insertPackageDetail(connection, reservaId, data.IDPaquete, totals.paquetePrecio);
    }
    
    await insertServiceDetails(connection, reservaId, totals.servicios);

    await connection.commit();
    // Intentar obtener la reserva completa para enviar el correo de confirmación
    try {
      const fullReservation = await getReservationById(reservaId);
      const user = reservaData.UsuarioIdusuario ? await usuariosService.getById(reservaData.UsuarioIdusuario) : null;
      if (user && user.Email) {
        // No hacemos que falle la creación si el envío de correo falla; solo registramos el error
        try {
          await emailService.sendReservationConfirmationEmail(user.Email, fullReservation || {});
        } catch (err) {
          console.error('Error enviando email de confirmación de reserva:', err.message);
        }
      }
    } catch (err) {
      console.error('Error preparando/obteniendo datos para envío de email:', err.message);
    }

    return { id: reservaId, ...reservaData };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Actualizar reserva
const updateReservation = async (id, data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Si SOLO viene IdEstadoReserva, hacemos un update rápido y salimos
    const keys = Object.keys(data);
    if (keys.length === 1 && keys[0] === 'IdEstadoReserva') {
      await connection.query('UPDATE reserva SET IdEstadoReserva = ? WHERE IdReserva = ?', [data.IdEstadoReserva, id]);
      await connection.commit();
      return { id, ...data };
    }

    // 2. Si es un update completo (desde formulario)
    const servicioIds = Array.isArray(data.serviciosAdicionales) ? data.serviciosAdicionales : [];
    const totals = await calculateTotals(data.IDPaquete, data.IDHabitacion, data.IDCabana, servicioIds, data.FechaInicio, data.FechaFinalizacion);

    const reservaData = {};
    if (data.FechaInicio) reservaData.FechaInicio = data.FechaInicio;
    if (data.FechaFinalizacion) reservaData.FechaFinalizacion = data.FechaFinalizacion;
    if (data.MetodoPago) reservaData.MetodoPago = data.MetodoPago;
    if (data.IdEstadoReserva) reservaData.IdEstadoReserva = data.IdEstadoReserva;
    
    // Totales siempre se actualizan si es un update completo
    reservaData.SubTotal = totals.subtotal;
    reservaData.Descuento = 0;
    reservaData.IVA = totals.iva;
    reservaData.MontoTotal = totals.total;

    const [result] = await connection.query('UPDATE reserva SET ? WHERE IdReserva = ?', [reservaData, id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    // Si se enviaron detalles (Habitación/Cabaña/Paquete/Servicios), los refrescamos
    if (data.IDHabitacion || data.IDCabana || data.IDPaquete || servicioIds.length > 0) {
      await connection.query('DELETE FROM detallereservahabitacion WHERE IDReserva = ?', [id]);
      await connection.query('DELETE FROM detallereservacabana WHERE IDReserva = ?', [id]);
      await connection.query('DELETE FROM detallereservapaquetes WHERE IDReserva = ?', [id]);
      await connection.query('DELETE FROM detallereservaservicio WHERE IDReserva = ?', [id]);

      if (data.IDHabitacion) {
        await insertHabitacionDetail(connection, id, data.IDHabitacion, totals.habitacionPrecio);
      } else if (data.IDCabana) {
        await insertCabanaDetail(connection, id, data.IDCabana, totals.cabanaPrecio);
      } else if (data.IDPaquete) {
        await insertPackageDetail(connection, id, data.IDPaquete, totals.paquetePrecio);
      }
      await insertServiceDetails(connection, id, totals.servicios);
    }

    await connection.commit();
    return { id, ...reservaData };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Eliminar reserva
const deleteReservation = async (id) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query('DELETE FROM detallereservaservicio WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM detallereservapaquetes WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM detallereservahabitacion WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM reserva WHERE IdReserva = ?', [id]);

    await connection.commit();
    return { message: 'Reserva eliminada' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Obtener reservas confirmadas para cálculo de disponibilidad
const getConfirmedReservations = async () => {
  try {
    const sql = `SELECT 
                    r.IdReserva,
                    r.FechaInicio,
                    r.FechaFinalizacion,
                    r.IdEstadoReserva,
                    COALESCE(h.IDHabitacion, p.IDHabitacion, c.IDCabana) AS IDAccommodation,
                    'habitacion' AS accommodation_type
                 FROM reserva r
                 LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IDReserva
                 LEFT JOIN habitacion h ON drh.IDHabitacion = h.IDHabitacion
                 LEFT JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
                 LEFT JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
                 LEFT JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
                 LEFT JOIN cabanas c ON drc.IDCabana = c.IDCabana
                 WHERE r.IdEstadoReserva = 2 
                 AND r.FechaInicio IS NOT NULL 
                 AND r.FechaFinalizacion IS NOT NULL
                 ORDER BY r.FechaInicio ASC`;
    
    const [results] = await db.query(sql);
    return results;
  } catch (error) {
    throw error;
  }
};

// Obtener reservas confirmadas para una habitación/cabaña/paquete específico
const getConfirmedReservationsByAccommodation = async (accommodationId, type = 'habitacion') => {
  try {
    let sql = '';
    
    if (type === 'paquete') {
      // Para paquetes, obtener la habitación asociada
      sql = `SELECT 
                r.IdReserva,
                r.FechaInicio,
                r.FechaFinalizacion,
                p.IDHabitacion
             FROM reserva r
             JOIN detallereservapaquetes drp ON r.IdReserva = drp.IDReserva
             JOIN paquetes p ON drp.IDPaquete = p.IDPaquete
             WHERE p.IDPaquete = ? 
             AND r.IdEstadoReserva = 2
             AND r.FechaInicio IS NOT NULL 
             AND r.FechaFinalizacion IS NOT NULL
             ORDER BY r.FechaInicio ASC`;
    } else if (type === 'cabana') {
      sql = `SELECT 
                r.IdReserva,
                r.FechaInicio,
                r.FechaFinalizacion,
                c.IDCabana
             FROM reserva r
             JOIN detallereservacabana drc ON r.IdReserva = drc.IDReserva
             JOIN cabanas c ON drc.IDCabana = c.IDCabana
             WHERE c.IDCabana = ? 
             AND r.IdEstadoReserva = 2
             AND r.FechaInicio IS NOT NULL 
             AND r.FechaFinalizacion IS NOT NULL
             ORDER BY r.FechaInicio ASC`;
    } else {
      // Por defecto, habitación
      sql = `SELECT 
                r.IdReserva,
                r.FechaInicio,
                r.FechaFinalizacion,
                h.IDHabitacion
             FROM reserva r
             JOIN detallereservahabitacion drh ON r.IdReserva = drh.IDReserva
             JOIN habitacion h ON drh.IDHabitacion = h.IDHabitacion
             WHERE h.IDHabitacion = ? 
             AND r.IdEstadoReserva = 2
             AND r.FechaInicio IS NOT NULL 
             AND r.FechaFinalizacion IS NOT NULL
             ORDER BY r.FechaInicio ASC`;
    }
    
    const [results] = await db.query(sql, [accommodationId]);
    return results;
  } catch (error) {
    throw error;
  }
};

// Actualizar solo el estado de una reserva
const updateReservationStatus = async (id, newStatus) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.query(
      'UPDATE reserva SET IdEstadoReserva = ? WHERE IdReserva = ?',
      [newStatus, id]
    );
    await connection.commit();
    if (result.affectedRows === 0) return null;
    return { id, IdEstadoReserva: newStatus };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  getAllReservations,
  getReservationById,
  getReservationsByUser,
  createReservation,
  updateReservation,
  updateReservationStatus,
  deleteReservation,
  getConfirmedReservations,
  getConfirmedReservationsByAccommodation
};