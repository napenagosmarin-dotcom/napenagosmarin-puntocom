SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- Estructura de tabla para la tabla `cabanas`
CREATE TABLE IF NOT EXISTS `cabanas` (
  `IDCabana` int(11) NOT NULL AUTO_INCREMENT,
  `NombreCabana` varchar(100) DEFAULT NULL,
  `Descripcion` varchar(500) DEFAULT NULL,
  `CapacidadPersonas` int(11) DEFAULT NULL,
  `PrecioNoche` float DEFAULT NULL,
  `ImagenCabana` varchar(500) DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `NumeroHabitaciones` int(11) DEFAULT 1,
  PRIMARY KEY (`IDCabana`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=6;

INSERT IGNORE INTO `cabanas` (`IDCabana`, `NombreCabana`, `Descripcion`, `CapacidadPersonas`, `PrecioNoche`, `ImagenCabana`, `Estado`, `NumeroHabitaciones`) VALUES
(1, 'Cabaña Familiar Bosque Verde', 'Amplia cabaña familiar ideal para disfrutar en grupo, rodeada de naturaleza.', 6, 120000, 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/622764182.jpg?k=f6e684052528eed8cfa20a7a5ded7b4bb77693fe7a39d9a42e2276d4b67f3277&o=', 1, 1),
(3, 'Cabaña La Montaña', 'Refugio de montaña con decoración rústica, estufa de leña y acceso a senderos ecológicos.', 8, 250000, 'https://images.trvl-media.com/lodging/95000000/94800000/94797300/94797261/f6069e1e.jpg?impolicy=fcrop&w=357&h=201&p=1&q=medium', 1, 1),
(4, 'Cabaña Los Cedros', 'Espaciosa cabaña familiar con tres habitaciones, barbacoa exterior y jardín privado.', 10, 320000, NULL, 1, 1),
(5, 'Cabaña_zzz', 'Pa dormir y descansar.', 4, 500000, NULL, 1, 1);

-- Estructura de tabla para la tabla `roles`
CREATE TABLE IF NOT EXISTS `roles` (
  `IDRol` int(11) NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) DEFAULT NULL,
  `Estado` varchar(50) DEFAULT NULL,
  `IsActive` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`IDRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=3;

INSERT IGNORE INTO `roles` (`IDRol`, `Nombre`, `Estado`, `IsActive`) VALUES
(1, 'cliente', 'activo', 0),
(2, 'administrador', 'activo', 1);

-- Estructura de tabla para la tabla `clientes`
CREATE TABLE IF NOT EXISTS `clientes` (
  `IDCliente` int(11) NOT NULL AUTO_INCREMENT,
  `NroDocumento` varchar(50) NOT NULL,
  `Nombre` varchar(50) DEFAULT NULL,
  `Apellido` varchar(50) DEFAULT NULL,
  `Direccion` varchar(100) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Telefono` varchar(20) DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `IDRol` int(11) DEFAULT NULL,
  PRIMARY KEY (`IDCliente`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=20;

INSERT IGNORE INTO `clientes` (`IDCliente`, `NroDocumento`, `Nombre`, `Apellido`, `Direccion`, `Email`, `Telefono`, `Estado`, `IDRol`) VALUES
(3, '456789123', 'Carlos', 'Rodríguez', 'Av. Siempre Viva 742', 'carlos.r@email.com', '3205556677', 0, 1),
(14, '1017252434', 'Diego ', 'Atehortua ', 'cll90 50d-07', 'godienser@gmail.com', '+57 3017323063', 1, 1),
(19, '1051540390', 'David', 'penagos', 'cll 56_98', 'godienser@gmail.com', '+57 3124644698', 1, 1);

-- Estructura de tabla para la tabla `estadosreserva`
CREATE TABLE IF NOT EXISTS `estadosreserva` (
  `IdEstadoReserva` int(11) NOT NULL AUTO_INCREMENT,
  `NombreEstadoReserva` varchar(15) DEFAULT NULL,
  PRIMARY KEY (`IdEstadoReserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=5;

INSERT IGNORE INTO `estadosreserva` (`IdEstadoReserva`, `NombreEstadoReserva`) VALUES
(1, 'Pendiente'),
(2, 'Confirmada'),
(3, 'Cancelada'),
(4, 'Completada');

-- Estructura de tabla para la tabla `habitacion`
CREATE TABLE IF NOT EXISTS `habitacion` (
  `IDHabitacion` int(11) NOT NULL AUTO_INCREMENT,
  `NombreHabitacion` varchar(50) NOT NULL,
  `tipo` varchar(50) DEFAULT NULL,
  `numero` int(11) DEFAULT NULL,
  `Descripcion` varchar(500) DEFAULT NULL,
  `precio` float DEFAULT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `Costo` decimal(10,2) DEFAULT NULL,
  `IDCabana` int(11) DEFAULT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`IDHabitacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=11;

INSERT IGNORE INTO `habitacion` (`IDHabitacion`, `NombreHabitacion`, `tipo`, `numero`, `Descripcion`, `precio`, `imagen`, `Costo`, `IDCabana`, `Estado`) VALUES
(5, 'Matrimonial', 'Premium', NULL, 'Tienda con cama king y vista panorámica', 280000, '', NULL, NULL, 1),
(6, 'Doble', 'Doble', NULL, 'Habitacion con dos camas individuales', 180000, 'https://hotelflamingoinn.com.mx/wp-content/uploads/2021/05/habitacion-ejecuiva-doble-e1632169810237.jpg', NULL, NULL, 1),
(7, 'Familiar', 'Familiar', NULL, '', 300000, 'https://cdn.easy-rez.com/production/hotels/8700696094450c97c00b7f5c1e216f47/uploads/.rooms/0627388001658265921.jpg', NULL, NULL, 1),
(8, 'Universitaria', 'Universitaria', NULL, 'Camarotes sencillos', 350000, 'https://2viajando.com/wp-content/uploads/wood-house-floor-home-cottage-property-1065759-pxhere.com_.jpg', NULL, NULL, 1),
(9, 'Premium', 'Premium', NULL, 'Habitacion full confort', 600000, 'https://travelytips.com/wp-content/uploads/2021/04/bio-habitat-1.jpg', NULL, NULL, 1),
(10, 'Habitacion Japonesa', NULL, NULL, 'Habitacion zen tematica asiatica', 480000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQbmV443G-hfPHEgAwO-8n2WVIwSCDfG5RndQ&s', NULL, NULL, 1);

-- Estructura de tabla para la tabla `metodopago`
CREATE TABLE IF NOT EXISTS `metodopago` (
  `IdMetodoPago` int(11) NOT NULL AUTO_INCREMENT,
  `NomMetodoPago` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`IdMetodoPago`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=5;

INSERT IGNORE INTO `metodopago` (`IdMetodoPago`, `NomMetodoPago`) VALUES
(1, 'Transferencia'),
(2, 'Tarjeta de Crédito'),
(3, 'Tarjeta de Débito'),
(4, 'Efectivo');

-- Estructura de tabla para la tabla `servicios`
CREATE TABLE IF NOT EXISTS `servicios` (
  `IDServicio` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) DEFAULT NULL,
  `Descripcion` varchar(255) NOT NULL DEFAULT '',
  `precio` decimal(10,2) DEFAULT NULL,
  `Duracion` varchar(50) DEFAULT NULL,
  `CantidadMaximaPersonas` int(11) DEFAULT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT 1,
  `Costo` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`IDServicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=12;

INSERT IGNORE INTO `servicios` (`IDServicio`, `nombre`, `Descripcion`, `precio`, `Duracion`, `CantidadMaximaPersonas`, `imagen`, `Estado`, `Costo`) VALUES
(5, 'Masaje Relajante', 'Experiencia mágica bajo las estrellas con malvaviscos y chocolate caliente.', 120000.00, '1 hora', 1, '', 1, NULL),
(7, 'Servicio Infantil', 'Técnica milenaria para equilibrar cuerpo y mente con aceites esenciales.', 80000.00, '', NULL, 'https://media.istockphoto.com/id/1209739507/es/foto/todo-lo-que-necesitas-camarera-en-uniforme-entrega-de-bandeja-con-comida.jpg', 1, NULL),
(8, 'Masaje Chino', 'Enfoque terapéutico para mejorar el rendimiento y aliviar dolores musculares.', 430000.00, '2 horas', 3, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSfs9-q-lEcUjFQgDSEkfJ259j5inSQ7kXcKg&s', 1, NULL),
(9, 'Masaje Deportivo', 'Ambiente exclusivo con velas, menú gourmet y una selección de vinos finos.', 80000.00, '', NULL, 'https://ecopostural.com/wp-content/uploads/2024/02/Beneficios_masaje_deportivo-Ecopostural.jpg', 1, NULL),
(10, 'Cena Romántica', 'Circuito completo de relajación con sauna, turco y exfoliación corporal.', 150000.00, '', 2, 'https://i.pinimg.com/736x/c1/29/7f/c1297f095d5dc0cd72c32c93713d5a48.jpg', 1, NULL),
(11, 'Spa Premium', 'Servicio completo de spa', 500000.00, '', 1, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQf2sOIDjDMTjB7lPFBDjcILH9Xs2OOA9FeQw&s', 1, NULL);

-- Estructura de tabla para la tabla `paquetes`
CREATE TABLE IF NOT EXISTS `paquetes` (
  `IDPaquete` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `Descripcion` text NOT NULL DEFAULT '',
  `IDHabitacion` int(11) DEFAULT NULL,
  `IDServicio` int(11) DEFAULT NULL,
  `precio` float DEFAULT NULL,
  `imagen` varchar(500) DEFAULT NULL,
  `Estado` tinyint(1) NOT NULL DEFAULT 1,
  `IDCabana` int(11) DEFAULT NULL,
  `Descuento` float DEFAULT 0,
  `TipoDescuento` varchar(50) DEFAULT 'porcentaje',
  PRIMARY KEY (`IDPaquete`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=9;

INSERT IGNORE INTO `paquetes` (`IDPaquete`, `nombre`, `Descripcion`, `IDHabitacion`, `IDServicio`, `precio`, `imagen`, `Estado`, `IDCabana`, `Descuento`, `TipoDescuento`) VALUES
(5, 'Paquete Relax', 'Tienda de lujo con masaje y jacuzzi', 5, 5, 470000, '', 1, NULL, 0, 'porcentaje'),
(6, 'Paquete El Venado', 'Toro mecánico incluido', NULL, NULL, 1900000, 'https://thumbs.dreamstime.com/b/venado-masculino-realista-388456964.jpg', 1, NULL, 0, 'porcentaje'),
(7, 'Toro Mecánico', 'Paquete con toro mecánico', NULL, NULL, 700000, 'https://www.pobladomedieval.es/wp-content/uploads/2022/09/toromecanico.jpg', 1, NULL, 0, 'porcentaje'),
(8, 'Paquete Viajero', 'Paquete económico para viajeros', NULL, NULL, 500000, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDsdJCm65xFMI3V0L1hxo2_3kUYQ3Aw7f5DA&s', 1, NULL, 0, 'porcentaje');

-- Estructura de tabla para la tabla `reserva`
CREATE TABLE IF NOT EXISTS `reserva` (
  `IdReserva` int(11) NOT NULL AUTO_INCREMENT,
  `IDCliente` int(11) DEFAULT NULL,
  `FechaReserva` datetime DEFAULT NULL,
  `FechaInicio` date DEFAULT NULL,
  `FechaFinalizacion` date DEFAULT NULL,
  `SubTotal` float DEFAULT NULL,
  `Descuento` float DEFAULT NULL,
  `IVA` float DEFAULT NULL,
  `MontoTotal` float DEFAULT NULL,
  `MetodoPago` int(11) DEFAULT NULL,
  `IdEstadoReserva` int(11) DEFAULT NULL,
  `UsuarioIdusuario` int(11) DEFAULT NULL,
  `FechaCancelacion` datetime DEFAULT NULL,
  `TipoCancelacion` varchar(20) DEFAULT NULL,
  `PorcentajePenalizacion` decimal(5,2) DEFAULT 0.00,
  `ValorPenalizacion` decimal(10,2) DEFAULT 0.00,
  `ValorReembolso` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`IdReserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=141;

INSERT IGNORE INTO `reserva` (`IdReserva`, `IDCliente`, `FechaReserva`, `FechaInicio`, `FechaFinalizacion`, `SubTotal`, `Descuento`, `IVA`, `MontoTotal`, `MetodoPago`, `IdEstadoReserva`, `UsuarioIdusuario`, `FechaCancelacion`, `TipoCancelacion`, `PorcentajePenalizacion`, `ValorPenalizacion`, `ValorReembolso`) VALUES
(134, 14, '2026-06-15 00:00:00', '2026-06-20', '2026-06-25', 120000, 0, 0, 120000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00),
(135, 14, '2026-06-16 00:00:00', '2026-06-21', '2026-06-22', 400000, 0, 0, 400000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00),
(136, 14, '2026-06-16 00:00:00', '2026-06-23', '2026-06-25', 300000, 0, 0, 300000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00),
(137, 14, '2026-06-17 00:00:00', '2026-06-26', '2026-06-28', 1500000, 0, 0, 1620000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00),
(139, 14, '2026-06-17 00:00:00', '2026-06-29', '2026-06-30', 480000, 0, 0, 480000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00),
(140, 14, '2026-06-17 00:00:00', '2026-07-01', '2026-07-03', 1200000, 0, 0, 1320000, 1, 2, NULL, NULL, NULL, 0.00, 0.00, 0.00);

-- Estructura de tabla para la tabla `detallereservacabana`
CREATE TABLE IF NOT EXISTS `detallereservacabana` (
  `IDReserva` int(11) NOT NULL,
  `IDCabana` int(11) NOT NULL,
  `Cantidad` int(11) DEFAULT 1,
  `Precio` decimal(10,2) DEFAULT 0.00,
  `Estado` int(11) DEFAULT 1,
  PRIMARY KEY (`IDReserva`,`IDCabana`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `detallereservacabana` (`IDReserva`, `IDCabana`, `Cantidad`, `Precio`, `Estado`) VALUES
(134, 1, 1, 120000.00, 1);

-- Estructura de tabla para la tabla `detallereservahabitacion`
CREATE TABLE IF NOT EXISTS `detallereservahabitacion` (
  `IDReserva` int(11) NOT NULL,
  `IDHabitacion` int(11) NOT NULL,
  `Cantidad` int(11) DEFAULT 1,
  `precio` decimal(10,2) DEFAULT 0.00,
  `Estado` int(11) DEFAULT 1,
  PRIMARY KEY (`IDReserva`,`IDHabitacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO `detallereservahabitacion` (`IDReserva`, `IDHabitacion`, `Cantidad`, `precio`, `Estado`) VALUES
(135, 8, 1, 400000.00, 1),
(136, 7, 1, 300000.00, 1),
(137, 7, 1, 1500000.00, 1),
(139, 10, 1, 480000.00, 1),
(140, 9, 1, 1200000.00, 1);

-- Estructura de tabla para la tabla `detallereservaservicio`
CREATE TABLE IF NOT EXISTS `detallereservaservicio` (
  `IDDetalleReservaServicio` int(11) NOT NULL AUTO_INCREMENT,
  `IDReserva` int(11) DEFAULT NULL,
  `Cantidad` int(11) DEFAULT NULL,
  `precio` float DEFAULT NULL,
  `Estado` tinyint(1) DEFAULT NULL,
  `IDServicio` int(11) DEFAULT NULL,
  PRIMARY KEY (`IDDetalleReservaServicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci AUTO_INCREMENT=77;

INSERT IGNORE INTO `detallereservaservicio` (`IDDetalleReservaServicio`, `IDReserva`, `Cantidad`, `precio`, `Estado`, `IDServicio`) VALUES
(74, 137, 1, 120000, 1, 5),
(76, 140, 1, 120000, 1, 5);

COMMIT;

-- Asegurar rol de administrador para godienser@gmail.com
UPDATE usuarios SET IDRol = 2 WHERE Email = 'godienser@gmail.com';
