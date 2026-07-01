// services/reservation.service.js

const db = require('../config/db');
const usuariosService = require('./usuarios.service');
const emailService = require('./email.service');

// Obtener todas las reservas (con paginación opcional)
const getAllReservations = async (page = null, limit = null) => {
  try {
    let sql = `SELECT DISTINCT r.IdReserva, r.FechaReserva, r.FechaInicio, r.FechaFinalizacion,
                        r.SubTotal, r.Descuento, r.IVA, r.MontoTotal,
                        r.MetodoPago, r.IdEstadoReserva,
                        r.UsuarioIdusuario,
                        u.NombreUsuario, u.NumeroDocumento AS NroDocumentoCliente, 
                        e.NombreEstadoReserva, m.NomMetodoPago,
                        p.IDPaquete, p.nombre AS NombrePaquete, p.precio AS PrecioPaquete,
                        COALESCE(h_direct.IDHabitacion, h_paq.IDHabitacion) AS IDHabitacion,
                        COALESCE(h_direct.NombreHabitacion, h_paq.NombreHabitacion) AS NombreHabitacion,
                        COALESCE(h_direct.precio, h_paq.precio) AS CostoHabitacion,
                        c.NombreCabana, c.PrecioNoche AS PrecioCabana,
                        r.IdEstadoReserva AS Estado
                 FROM reserva r
                 LEFT JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
                 LEFT JOIN estadosreserva e ON r.IdEstadoReserva = e.IdEstadoReserva
                 LEFT JOIN metodopago m ON r.MetodoPago = m.IdMetodoPago
                 LEFT JOIN detallereservahabitacion drh ON r.IdReserva = drh.IDReserva
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
      const [pendientesResult]  = await db.query('SELECT COUNT(*) as count FROM reserva WHERE IdEstadoReserva = 1');
      const [confirmadasResult] = await db.query('SELECT COUNT(*) as count FROM reserva WHERE IdEstadoReserva = 2');
      const [enProcesoResult]   = await db.query('SELECT COUNT(*) as count FROM reserva WHERE IdEstadoReserva = 5');
      const [montoResult]       = await db.query('SELECT SUM(MontoTotal) as total FROM reserva');

      return {
        data: results,
        total: countResult[0].total,
        pendientes: pendientesResult[0].count,
        confirmadas: confirmadasResult[0].count,
        enProceso: enProcesoResult[0].count,
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
                         drc.IDCabana, c.NombreCabana, c.PrecioNoche AS PrecioCabana,
                         r.IdEstadoReserva AS Estado
                 FROM reserva r
                 LEFT JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
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
                 LEFT JOIN usuarios u ON r.UsuarioIdusuario = u.IDUsuario
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

// ─────────────────────────────────────────────────────────────────────────────
// REGLA 6: PRECIOS POR TEMPORADA
// Temporada alta  (×1.30): 15 dic – 15 ene   (Navidad / Año Nuevo)
// Temporada media (×1.25): 20 mar – 10 abr   (Semana Santa aproximada)
// Temporada vacaciones (×1.15): todo julio
// Si la estadía solapa cualquier día de temporada se aplica el mayor multiplicador.
// ─────────────────────────────────────────────────────────────────────────────
const getSeasonalInfo = (fechaInicio, fechaFin) => {
  if (!fechaInicio || !fechaFin) return { multiplicador: 1.0, temporada: null };
  const cur = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  let mult = 1.0;
  let temporada = null;
  while (cur < fin) {
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    if ((m === 12 && d >= 15) || (m === 1 && d <= 15)) {
      if (1.30 > mult) { mult = 1.30; temporada = 'Temporada Alta (Navidad / Año Nuevo)'; }
    } else if ((m === 3 && d >= 20) || (m === 4 && d <= 10)) {
      if (1.25 > mult) { mult = 1.25; temporada = 'Semana Santa'; }
    } else if (m === 7) {
      if (1.15 > mult) { mult = 1.15; temporada = 'Temporada de Vacaciones (Julio)'; }
    }
    cur.setDate(cur.getDate() + 1);
  }
  return { multiplicador: mult, temporada };
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

  const { multiplicador, temporada } = getSeasonalInfo(FechaInicio, FechaFinalizacion);

  const paquetePrecioNoche = await getPackagePrice(IDPaquete);
  const habitacionPrecioNoche = await getHabitacionPrice(IDHabitacion);
  const cabanaPrecioNoche = await getCabanaPrice(IDCabana);
  const servicioPrecios = await getServicesPrices(servicioRows);

  // Multiplicar por noches y por temporada (solo alojamiento, no servicios adicionales)
  const paquetePrecio    = parseFloat((paquetePrecioNoche    * noches * multiplicador).toFixed(2));
  const habitacionPrecio = parseFloat((habitacionPrecioNoche * noches * multiplicador).toFixed(2));
  const cabanaPrecio     = parseFloat((cabanaPrecioNoche     * noches * multiplicador).toFixed(2));

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
  const total = paquetePrecio + habitacionPrecio + cabanaPrecio + totalServicios;
  const subtotal = parseFloat((total / 1.19).toFixed(2));
  const iva = parseFloat((total - subtotal).toFixed(2));
  return {
    paquetePrecio,
    habitacionPrecio,
    cabanaPrecio,
    servicios,
    subtotal,
    iva,
    total,
    noches,
    temporada,
    multiplicadorTemporada: multiplicador
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// VERIFICACIÓN DE TRASLAPE DE FECHAS
// ─────────────────────────────────────────────────────────────────────────────
// Retorna true si el rango [fechaInicio, fechaFin) se traslapa con una reserva
// existente en estado Pendiente(1) o Confirmada(2) para la unidad indicada.
// excludeReservaId: excluir una reserva al actualizar (evitar auto-conflicto).
// Lógica de traslape: A solapa B si A.inicio < B.fin AND A.fin > B.inicio
// ─────────────────────────────────────────────────────────────────────────────
const checkDateOverlap = async (type, id, fechaInicio, fechaFin, excludeReservaId = null) => {
  if (!fechaInicio || !fechaFin || !id) return false;

  // Seleccionar la tabla de detalle y columna según el tipo de alojamiento
  const tableMap = {
    habitacion: { table: 'detallereservahabitacion', col: 'IDHabitacion' },
    cabana:     { table: 'detallereservacabana',     col: 'IDCabana'     },
    paquete:    { table: 'detallereservapaquetes',   col: 'IDPaquete'    }
  };
  const mapping = tableMap[type];
  if (!mapping) return false;

  // Traslape: la reserva existente empieza antes de que termine la nueva
  // Y termina después de que empieza la nueva
  let sql = `
    SELECT COUNT(*) AS cnt
    FROM reserva r
    JOIN ${mapping.table} d ON r.IdReserva = d.IDReserva
    WHERE d.${mapping.col} = ?
      AND r.IdEstadoReserva IN (1, 2, 5)
      AND r.FechaInicio IS NOT NULL
      AND r.FechaFinalizacion IS NOT NULL
      AND r.FechaInicio < ?
      AND r.FechaFinalizacion > ?
  `;
  const params = [id, fechaFin, fechaInicio];

  if (excludeReservaId) {
    sql += ' AND r.IdReserva != ?';
    params.push(excludeReservaId);
  }

  const [rows] = await db.query(sql, params);
  return rows[0].cnt > 0;
};

// Crear nueva reserva
const createReservation = async (data) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // ── REGLA 10: Email verificado ───────────────────────────────────────────
    if (data.UsuarioIdusuario) {
      const [[usuario]] = await connection.query(
        'SELECT EmailVerificado FROM usuarios WHERE IDUsuario = ?',
        [data.UsuarioIdusuario]
      );
      if (usuario && usuario.EmailVerificado === 0) {
        await connection.rollback();
        const err = new Error('Debes verificar tu correo electrónico antes de hacer una reserva. Revisa tu bandeja de entrada y haz clic en el enlace de verificación.');
        err.statusCode = 403;
        throw err;
      }
    }

    // ── REGLA 2: Máximo 3 reservas activas por cliente ───────────────────────
    if (data.UsuarioIdusuario) {
      const [[{ activeCount }]] = await connection.query(
        'SELECT COUNT(*) AS activeCount FROM reserva WHERE UsuarioIdusuario = ? AND IdEstadoReserva IN (1, 2, 5)',
        [data.UsuarioIdusuario]
      );
      if (activeCount >= 3) {
        await connection.rollback();
        const err = new Error('Ya tienes 3 reservas activas (Pendientes, Confirmadas o En Proceso). Cancela o completa alguna antes de crear una nueva.');
        err.statusCode = 409;
        throw err;
      }
    }

    // ── VALIDACIÓN: alojamiento no puede duplicar el incluido en el paquete ────
    if (data.IDPaquete && (data.IDHabitacion || data.IDCabana)) {
      const [[paquete]] = await connection.query(
        'SELECT IDHabitacion, IDCabana FROM paquetes WHERE IDPaquete = ?',
        [data.IDPaquete]
      );
      if (paquete) {
        if (paquete.IDHabitacion && String(paquete.IDHabitacion) === String(data.IDHabitacion)) {
          await connection.rollback();
          const err = new Error('No puedes agregar una habitación que ya está incluida en el paquete seleccionado.');
          err.statusCode = 400;
          throw err;
        }
        if (paquete.IDCabana && String(paquete.IDCabana) === String(data.IDCabana)) {
          await connection.rollback();
          const err = new Error('No puedes agregar una cabaña que ya está incluida en el paquete seleccionado.');
          err.statusCode = 400;
          throw err;
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const servicioIds = Array.isArray(data.serviciosAdicionales) ? data.serviciosAdicionales : [];
    const totals = await calculateTotals(data.IDPaquete, data.IDHabitacion, data.IDCabana, servicioIds, data.FechaInicio, data.FechaFinalizacion);

    // ── VALIDACIÓN DE TRASLAPE DE FECHAS (backend) ──────────────────────────
    // Se verifica antes de insertar para evitar doble reserva.
    // Los errores se lanzan con statusCode 409 para que el controller
    // los devuelva como HTTP 409 Conflict sin pasar por next(error).
    if (data.FechaInicio && data.FechaFinalizacion) {
      if (new Date(data.FechaFinalizacion) <= new Date(data.FechaInicio)) {
        const err = new Error('La fecha de finalización debe ser al menos el día siguiente al de inicio.');
        err.statusCode = 400;
        throw err;
      }

      if (data.IDHabitacion) {
        const overlap = await checkDateOverlap('habitacion', data.IDHabitacion, data.FechaInicio, data.FechaFinalizacion);
        if (overlap) {
          const err = new Error('La habitación ya está reservada en las fechas seleccionadas. Por favor elige otras fechas.');
          err.statusCode = 409;
          throw err;
        }
      }
      if (data.IDCabana) {
        const overlap = await checkDateOverlap('cabana', data.IDCabana, data.FechaInicio, data.FechaFinalizacion);
        if (overlap) {
          const err = new Error('La cabaña ya está reservada en las fechas seleccionadas. Por favor elige otras fechas.');
          err.statusCode = 409;
          throw err;
        }
      }
      if (data.IDPaquete) {
        const overlap = await checkDateOverlap('paquete', data.IDPaquete, data.FechaInicio, data.FechaFinalizacion);
        if (overlap) {
          const err = new Error('El paquete ya está reservado en las fechas seleccionadas. Por favor elige otras fechas.');
          err.statusCode = 409;
          throw err;
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    // reservaData NO incluye IDPaquete ni IDHabitacion — se guardan en tablas de detalle
    const reservaData = {
      FechaReserva: data.FechaReserva || new Date(),
      FechaInicio: data.FechaInicio || null,
      FechaFinalizacion: data.FechaFinalizacion || null,
      NumeroPersonas: data.NumeroPersonas ? parseInt(data.NumeroPersonas) : null,
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

    // ── REGLA 3: Expiración 2 horas para confirmar con anticipo ─────────────
    const estadoCreado = data.IdEstadoReserva || 1;
    if (estadoCreado === 1) {
      const expiracion = new Date(Date.now() + 2 * 60 * 60 * 1000);
      await connection.query('UPDATE reserva SET FechaExpiracion = ? WHERE IdReserva = ?', [expiracion, reservaId]);
    }

    // ── REGLA 8: Historial de creación ───────────────────────────────────────
    await connection.query(
      `INSERT INTO reserva_historial (IdReserva, EstadoAnterior, EstadoNuevo, ModificadoPor, Motivo)
       VALUES (?, NULL, ?, 'sistema', 'Reserva creada')`,
      [reservaId, estadoCreado]
    );

    // Guardar alojamiento: habitación y cabaña son mutuamente excluyentes;
    // el paquete es independiente y puede combinarse con cualquiera de los dos.
    if (data.IDHabitacion) {
      await insertHabitacionDetail(connection, reservaId, data.IDHabitacion, totals.habitacionPrecio);
    } else if (data.IDCabana) {
      await insertCabanaDetail(connection, reservaId, data.IDCabana, totals.cabanaPrecio);
    }
    if (data.IDPaquete) {
      await insertPackageDetail(connection, reservaId, data.IDPaquete, totals.paquetePrecio);
    }
    
    await insertServiceDetails(connection, reservaId, totals.servicios);

    await connection.commit();

    // ── PASO 1 del agente: enviar correo PENDIENTE DE PAGO al crear la reserva ──
    try {
      const fullReservation = await getReservationById(reservaId);
      const user = reservaData.UsuarioIdusuario ? await usuariosService.getById(reservaData.UsuarioIdusuario) : null;
      if (user && user.Email) {
        // No hacemos que falle la creación si el envío de correo falla; solo registramos el error
        try {
          await emailService.sendReservationPendingEmail(user.Email, fullReservation || {});
          console.log(`[reservas] Correo PENDIENTE enviado a ${user.Email} para reserva #${reservaId}`);
        } catch (err) {
          console.error('[reservas] Error enviando correo PENDIENTE:', err.message);
        }
      }
    } catch (err) {
      console.error('[reservas] Error preparando email post-creación:', err.message);
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

    // 0. Verificar que la reserva no esté Completada (historial inmutable)
    const [check] = await connection.query('SELECT IdEstadoReserva FROM reserva WHERE IdReserva = ?', [id]);
    if (check.length && check[0].IdEstadoReserva === ESTADO_COMPLETADO) {
      await connection.rollback();
      const err = new Error('No se pueden modificar reservas completadas. Esta reserva forma parte del historial.');
      err.statusCode = 400;
      throw err;
    }

    // 1. Si SOLO viene IdEstadoReserva, hacemos un update rápido y salimos
    const keys = Object.keys(data);
    if (keys.length === 1 && keys[0] === 'IdEstadoReserva') {
      await connection.query('UPDATE reserva SET IdEstadoReserva = ? WHERE IdReserva = ?', [data.IdEstadoReserva, id]);
      await connection.commit();
      return { id, ...data };
    }

    // 2. Si es un update completo (desde formulario)
    if (data.FechaInicio && data.FechaFinalizacion) {
      if (new Date(data.FechaFinalizacion) <= new Date(data.FechaInicio)) {
        const err = new Error('La fecha de finalización debe ser al menos el día siguiente al de inicio.');
        err.statusCode = 400;
        throw err;
      }
    }
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
      }
      if (data.IDPaquete) {
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
const deleteReservation = async (id, motivo = '') => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [check] = await connection.query(
      'SELECT IdEstadoReserva, UsuarioIdusuario, MontoTotal, FechaInicio, FechaFinalizacion, FechaReserva FROM reserva WHERE IdReserva = ?',
      [id]
    );
    if (!check.length) {
      await connection.rollback();
      return null;
    }

    const { IdEstadoReserva, UsuarioIdusuario } = check[0];
    const ESTADOS_ACTIVOS = [ESTADO_PENDIENTE, ESTADO_CONFIRMADO, ESTADO_EN_PROCESO];

    // Reservas Completadas: historial protegido
    if (IdEstadoReserva === ESTADO_COMPLETADO) {
      await connection.rollback();
      const err = new Error('No se pueden eliminar reservas completadas. Esta reserva forma parte del historial.');
      err.statusCode = 400;
      throw err;
    }

    // Reservas activas: requieren motivo y se cancelan (no se borran del historial)
    if (ESTADOS_ACTIVOS.includes(IdEstadoReserva)) {
      if (!motivo) {
        await connection.rollback();
        const err = new Error('Debes indicar el motivo de cancelación para esta reserva activa.');
        err.statusCode = 422;
        throw err;
      }

      const fechaCancelacion = new Date();
      await connection.query(
        `UPDATE reserva SET IdEstadoReserva = ?, FechaCancelacion = ?, TipoCancelacion = 'admin',
         PorcentajePenalizacion = 0, ValorPenalizacion = 0, ValorReembolso = MontoTotal
         WHERE IdReserva = ?`,
        [ESTADO_CANCELADO, fechaCancelacion, id]
      );
      // Regla 8: historial
      await connection.query(
        `INSERT INTO reserva_historial (IdReserva, EstadoAnterior, EstadoNuevo, ModificadoPor, Motivo)
         VALUES (?, ?, ?, 'admin', ?)`,
        [id, IdEstadoReserva, ESTADO_CANCELADO, motivo]
      ).catch(e => console.warn('[historial]', e.message));
      await connection.commit();

      // Enviar email de cancelación con el motivo (no bloquea si falla)
      try {
        const fullReservation = await getReservationById(id);
        const user = UsuarioIdusuario ? await usuariosService.getById(UsuarioIdusuario) : null;
        const email = user?.Email || fullReservation?.Email;
        if (email) {
          await emailService.sendReservationCancelledEmail(email, fullReservation || check[0], {
            tipoCancelacion: 'gratuita',
            porcentajePenalizacion: 0,
            valorPenalizacion: 0,
            valorReembolso: check[0].MontoTotal || 0,
            mensaje: 'La reserva fue cancelada por el administrador.',
            motivoAdmin: motivo,
            fechaCancelacion
          });
        }
      } catch (emailErr) {
        console.error(`[reservas] Error enviando correo de cancelación admin #${id}:`, emailErr.message);
      }

      return { message: 'Reserva cancelada por administrador' };
    }

    // Reservas ya canceladas: eliminación física del registro
    await connection.query('DELETE FROM detallereservaservicio WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM detallereservapaquetes WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM detallereservahabitacion WHERE IDReserva = ?', [id]);
    await connection.query('DELETE FROM detallereservacabana WHERE IDReserva = ?', [id]);
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

// ─────────────────────────────────────────────────────────────────────────────
// AGENTE DE GESTIÓN DE RESERVAS — Cambio de estado con lógica de negocio
// ─────────────────────────────────────────────────────────────────────────────
// ID de estados según schema.sql:
//   1 = Pendiente   2 = Confirmada   3 = Cancelada   4 = Completada   5 = En Proceso
//
// Flujo permitido (solo hacia adelante, sin retrocesos):
//   Pendiente  → Confirmada | Cancelada
//   Confirmada → En Proceso | Cancelada
//   En Proceso → Completada
//   Cancelada  → (terminal)
//   Completada → (terminal, historial inmutable)
// ─────────────────────────────────────────────────────────────────────────────
const ESTADO_PENDIENTE  = 1;
const ESTADO_CONFIRMADO = 2;
const ESTADO_CANCELADO  = 3;
const ESTADO_COMPLETADO = 4;
const ESTADO_EN_PROCESO = 5;

const NOMBRES_ESTADO = {
  [ESTADO_PENDIENTE]:  'Pendiente',
  [ESTADO_CONFIRMADO]: 'Confirmada',
  [ESTADO_CANCELADO]:  'Cancelada',
  [ESTADO_COMPLETADO]: 'Completada',
  [ESTADO_EN_PROCESO]: 'En Proceso',
};

// Transiciones válidas por estado actual
const TRANSICIONES_VALIDAS = {
  [ESTADO_PENDIENTE]:  [ESTADO_CONFIRMADO, ESTADO_CANCELADO],
  [ESTADO_CONFIRMADO]: [ESTADO_EN_PROCESO, ESTADO_CANCELADO],
  [ESTADO_EN_PROCESO]: [ESTADO_COMPLETADO],
  [ESTADO_CANCELADO]:  [],
  [ESTADO_COMPLETADO]: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// POLÍTICA DE CANCELACIÓN — Constantes configurables centralizadas
// Modificar aquí afecta toda la lógica sin tocar el código de negocio.
// ─────────────────────────────────────────────────────────────────────────────
/** Días mínimos de anticipación para que la cancelación sea gratuita */
const DIAS_CANCELACION_GRATIS  = 7;
/** Fracción del MontoTotal que se retiene si se cancela dentro del plazo de penalización (0.40 = 40%) */
const PORCENTAJE_PENALIZACION  = 0.40;

const updateReservationStatus = async (id, nuevoEstadoId, motivo = null) => {
  // 1. Obtener estado actual
  const [rows] = await db.query(
    'SELECT r.IdEstadoReserva, r.UsuarioIdusuario FROM reserva r WHERE r.IdReserva = ?',
    [id]
  );
  if (!rows.length) return null;

  const estadoActual = rows[0].IdEstadoReserva;
  const nuevoId      = Number(nuevoEstadoId);

  // 2. Validar transición según tabla de flujo permitido
  const permitidas = TRANSICIONES_VALIDAS[estadoActual] ?? [];
  if (!permitidas.includes(nuevoId)) {
    const from = NOMBRES_ESTADO[estadoActual] || estadoActual;
    const to   = NOMBRES_ESTADO[nuevoId]    || nuevoId;
    const esTerminal = permitidas.length === 0;
    const msg = esTerminal
      ? `La reserva en estado "${from}" no puede modificarse.`
      : `Transición no permitida: ${from} → ${to}. El flujo de reserva es unidireccional.`;
    const err = new Error(msg);
    err.statusCode = 409;
    throw err;
  }

  const timestamp = new Date().toISOString();

  // 3a. Cancelación: actualiza campos adicionales y registra motivo
  if (nuevoId === ESTADO_CANCELADO) {
    const fechaCancelacion = new Date();
    await db.query(
      `UPDATE reserva SET IdEstadoReserva = ?, FechaCancelacion = ?, TipoCancelacion = 'admin' WHERE IdReserva = ?`,
      [nuevoId, fechaCancelacion, id]
    );
    await db.query(
      `INSERT INTO reserva_historial (IdReserva, EstadoAnterior, EstadoNuevo, ModificadoPor, Motivo)
       VALUES (?, ?, ?, 'admin', ?)`,
      [id, estadoActual, nuevoId, motivo || 'Cancelado por administrador']
    ).catch(e => console.warn('[historial]', e.message));

    // Enviar correo de cancelación al cliente
    try {
      const fullReservation = await getReservationById(id);
      const userId = rows[0].UsuarioIdusuario;
      const user   = userId ? await usuariosService.getById(userId) : null;
      const email  = user?.Email || fullReservation?.Email;
      if (email) {
        await emailService.sendReservationCancelledEmail(email, fullReservation || {}, {
          tipoCancelacion: 'gratuita',
          porcentajePenalizacion: 0,
          valorPenalizacion: 0,
          valorReembolso: fullReservation?.MontoTotal || 0,
          mensaje: 'La reserva fue cancelada por el administrador.',
          motivoAdmin: motivo || 'Cancelado por administrador',
          fechaCancelacion,
        });
        console.log(`[reservas] Correo CANCELACIÓN enviado a ${email} para reserva #${id}`);
      }
    } catch (emailErr) {
      console.error(`[reservas] Error enviando correo de cancelación para #${id}:`, emailErr.message);
    }
  } else {
    // 3b. Cambio de estado regular
    await db.query('UPDATE reserva SET IdEstadoReserva = ? WHERE IdReserva = ?', [nuevoId, id]);
    await db.query(
      `INSERT INTO reserva_historial (IdReserva, EstadoAnterior, EstadoNuevo, ModificadoPor)
       VALUES (?, ?, ?, 'admin')`,
      [id, estadoActual, nuevoId]
    ).catch(e => console.warn('[historial]', e.message));
  }

  console.log(`[reservas] #${id} estado ${estadoActual} → ${nuevoId} | ${timestamp}`);

  // 4. Enviar correo según nuevo estado
  if (nuevoId === ESTADO_CONFIRMADO) {
    try {
      const fullReservation = await getReservationById(id);
      const userId = rows[0].UsuarioIdusuario;
      const user   = userId ? await usuariosService.getById(userId) : null;
      const email  = user?.Email || fullReservation?.Email;
      if (email) {
        await emailService.sendReservationConfirmedEmail(email, fullReservation || {});
        console.log(`[reservas] Correo CONFIRMADO enviado a ${email} para reserva #${id}`);
      } else {
        console.warn(`[reservas] No se encontró email para reserva #${id}. Correo no enviado.`);
      }
    } catch (emailErr) {
      console.error(`[reservas] Error enviando correo de confirmación para #${id}:`, emailErr.message);
    }
  }

  return { id, IdEstadoReserva: nuevoId, timestamp };
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
// ─────────────────────────────────────────────────────────────────────────────
// FIX: ahora incluye IdEstadoReserva IN (1, 2, 5) = Pendiente + Confirmada + En Proceso
// para que fechas con reservas PENDIENTES o EN PROCESO también aparezcan bloqueadas.
// ─────────────────────────────────────────────────────────────────────────────
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
             AND r.IdEstadoReserva IN (1, 2, 5)
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
             AND r.IdEstadoReserva IN (1, 2, 5)
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
             AND r.IdEstadoReserva IN (1, 2, 5)
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

// ─────────────────────────────────────────────────────────────────────────────
// OBTENER FECHAS BLOQUEADAS (para el date picker del formulario de reservas)
// ─────────────────────────────────────────────────────────────────────────────
// Retorna un arreglo de objetos { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }
// que el frontend puede usar directamente para deshabilitar rangos en el
// calendario. Incluye reservas Pendiente(1) + Confirmada(2).
// Uso: GET /api/reservations/availability/:type/:id
//   type: 'habitacion' | 'cabana' | 'paquete'
//   id  : ID de la unidad de alojamiento
// ─────────────────────────────────────────────────────────────────────────────
const getBlockedDates = async (type, id) => {
  try {
    const reservas = await getConfirmedReservationsByAccommodation(id, type);
    // Formateamos a ISO date string para evitar problemas de zona horaria
    return reservas.map(r => ({
      start: r.FechaInicio instanceof Date
        ? r.FechaInicio.toISOString().split('T')[0]
        : r.FechaInicio,
      end: r.FechaFinalizacion instanceof Date
        ? r.FechaFinalizacion.toISOString().split('T')[0]
        : r.FechaFinalizacion
    }));
  } catch (error) {
    throw error;
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// EVALUADOR DE POLÍTICA DE CANCELACIÓN
// ─────────────────────────────────────────────────────────────────────────────
// Función pura: recibe la reserva y retorna el resumen de la política aplicable.
// No modifica la BD — solo calcula. Se puede llamar para mostrar info al usuario
// antes de confirmar la cancelación.
//
// Retorna:
//   {
//     tipoCancelacion:        'gratuita' | 'penalizada',
//     porcentajePenalizacion: number,   // 0 o 40 (para mostrar como %)
//     valorPenalizacion:      number,   // valor en COP a retener
//     valorReembolso:         number,   // valor en COP a devolver al cliente
//     diasRestantes:          number,   // días entre hoy y FechaInicio
//     mensaje:                string,   // texto explicativo para el usuario
//   }
// ─────────────────────────────────────────────────────────────────────────────
const evaluarPoliticaCancelacion = (reservation) => {
  const montoTotal = Number(reservation.MontoTotal) || 0;

  // Calcular días entre hoy y la fecha de check-in
  const hoy       = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fechaInicio = reservation.FechaInicio
    ? new Date(reservation.FechaInicio)
    : null;

  // Si no hay fecha de inicio, aplicar penalización por seguridad
  if (!fechaInicio) {
    const valorPenalizacion = parseFloat((montoTotal * PORCENTAJE_PENALIZACION).toFixed(2));
    return {
      tipoCancelacion:        'penalizada',
      porcentajePenalizacion: PORCENTAJE_PENALIZACION * 100,
      valorPenalizacion,
      valorReembolso:         parseFloat((montoTotal - valorPenalizacion).toFixed(2)),
      diasRestantes:          0,
      mensaje: `La reserva no tiene fecha de inicio registrada. Se aplica una penalización del ${PORCENTAJE_PENALIZACION * 100}%.`
    };
  }

  fechaInicio.setHours(0, 0, 0, 0);
  const diffMs        = fechaInicio - hoy;
  const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // ── Cancelación GRATUITA ─────────────────────────────────────────────────
  if (diasRestantes >= DIAS_CANCELACION_GRATIS) {
    return {
      tipoCancelacion:        'gratuita',
      porcentajePenalizacion: 0,
      valorPenalizacion:      0,
      valorReembolso:         montoTotal,
      diasRestantes,
      mensaje: `Cancelación gratuita. Faltan ${diasRestantes} días para tu llegada (mínimo requerido: ${DIAS_CANCELACION_GRATIS} días). Se reembolsará el 100% del valor pagado.`
    };
  }

  // ── Cancelación CON PENALIZACIÓN ────────────────────────────────────────
  const valorPenalizacion = parseFloat((montoTotal * PORCENTAJE_PENALIZACION).toFixed(2));
  const valorReembolso    = parseFloat((montoTotal - valorPenalizacion).toFixed(2));

  let mensaje;
  if (diasRestantes < 0) {
    mensaje = `La fecha de llegada ya pasó hace ${Math.abs(diasRestantes)} día(s). Se aplica una penalización del ${PORCENTAJE_PENALIZACION * 100}% sobre el total de la reserva.`;
  } else {
    mensaje = `Faltan solo ${diasRestantes} día(s) para tu llegada. La cancelación con menos de ${DIAS_CANCELACION_GRATIS} días de anticipación genera una penalización del ${PORCENTAJE_PENALIZACION * 100}% sobre el total de la reserva.`;
  }

  return {
    tipoCancelacion:        'penalizada',
    porcentajePenalizacion: PORCENTAJE_PENALIZACION * 100,
    valorPenalizacion,
    valorReembolso,
    diasRestantes,
    mensaje
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// CANCELAR RESERVA — Función principal con flujo de 2 pasos
// ─────────────────────────────────────────────────────────────────────────────
// Flujo:
//   1er llamado (confirmarConPenalizacion=false):
//     - Si hay penalización → retorna { requiresConfirmation: true, politica }
//       para que el frontend muestre el modal de advertencia.
//     - Si es gratuita → cancela directamente.
//   2do llamado (confirmarConPenalizacion=true):
//     - El usuario ya vio y aceptó la penalización → cancela.
//
// Siempre:
//   - Actualiza IdEstadoReserva=3 y los campos de trazabilidad.
//   - Envía correo de cancelación al cliente (no bloquea si falla).
//   - NO elimina físicamente ningún registro (historial contable).
// ─────────────────────────────────────────────────────────────────────────────
const cancelReservation = async (id, { confirmarConPenalizacion = false } = {}) => {
  // 1. Obtener datos completos de la reserva
  const [rows] = await db.query(
    `SELECT r.IdReserva, r.IdEstadoReserva, r.MontoTotal, r.FechaInicio,
            r.FechaReserva, r.FechaFinalizacion, r.UsuarioIdusuario
     FROM reserva r WHERE r.IdReserva = ?`,
    [id]
  );

  if (!rows.length) {
    const err = new Error('Reserva no encontrada.');
    err.statusCode = 404;
    throw err;
  }

  const reserva = rows[0];

  // 2. Validar que el estado actual permita cancelación
  if (reserva.IdEstadoReserva === ESTADO_CANCELADO) {
    const err = new Error('Esta reserva ya fue cancelada anteriormente.');
    err.statusCode = 409;
    throw err;
  }
  if (reserva.IdEstadoReserva === ESTADO_COMPLETADO) {
    const err = new Error('No se puede cancelar una reserva que ya fue completada.');
    err.statusCode = 422;
    throw err;
  }

  // 3. Evaluar política de cancelación
  const politica = evaluarPoliticaCancelacion(reserva);

  // 4. Si hay penalización y el usuario aún no confirmó → solicitar confirmación
  if (politica.tipoCancelacion === 'penalizada' && !confirmarConPenalizacion) {
    return {
      requiresConfirmation: true,
      politica,
      reservaId: id,
      mensaje: politica.mensaje
    };
  }

  // 5. Ejecutar la cancelación en la BD (transacción para garantizar atomicidad)
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const fechaCancelacion = new Date();

    await connection.query(
      `UPDATE reserva SET
         IdEstadoReserva       = ?,
         FechaCancelacion      = ?,
         TipoCancelacion       = ?,
         PorcentajePenalizacion = ?,
         ValorPenalizacion     = ?,
         ValorReembolso        = ?
       WHERE IdReserva = ?`,
      [
        ESTADO_CANCELADO,
        fechaCancelacion,
        politica.tipoCancelacion,
        politica.porcentajePenalizacion,
        politica.valorPenalizacion,
        politica.valorReembolso,
        id
      ]
    );

    await connection.commit();

    console.log(
      `[reservas] #${id} CANCELADA | tipo=${politica.tipoCancelacion} | penalización=$${politica.valorPenalizacion} | reembolso=$${politica.valorReembolso} | ${fechaCancelacion.toISOString()}`
    );

    // 6. Enviar correo de cancelación (no bloquea si falla)
    try {
      const fullReservation = await getReservationById(id);
      const user = reserva.UsuarioIdusuario
        ? await usuariosService.getById(reserva.UsuarioIdusuario)
        : null;
      const email = user?.Email || fullReservation?.Email;

      if (email) {
        await emailService.sendReservationCancelledEmail(email, fullReservation || reserva, {
          ...politica,
          fechaCancelacion
        });
        console.log(`[reservas] Correo CANCELACIÓN enviado a ${email} para reserva #${id}`);
      } else {
        console.warn(`[reservas] No se encontró email para reserva #${id}. Correo de cancelación no enviado.`);
      }
    } catch (emailErr) {
      // El error de email NO revierte la cancelación
      console.error(`[reservas] Error enviando correo de cancelación para #${id}:`, emailErr.message);
    }

    // 7. Retornar resumen completo
    return {
      cancelado:     true,
      reservaId:     id,
      politica,
      fechaCancelacion,
      mensaje:       politica.mensaje
    };

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
  getConfirmedReservationsByAccommodation,
  // Disponibilidad y validación de fechas
  getBlockedDates,
  checkDateOverlap,
  // Sistema de cancelación con política de penalización
  cancelReservation,
  evaluarPoliticaCancelacion,
  DIAS_CANCELACION_GRATIS,
  PORCENTAJE_PENALIZACION
};
