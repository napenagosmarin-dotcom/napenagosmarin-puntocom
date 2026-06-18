

-- Tabla usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    IDUsuario INT AUTO_INCREMENT PRIMARY KEY,
    NombreUsuario VARCHAR(255) NOT NULL,
    Apellido VARCHAR(255),
    Email VARCHAR(255) UNIQUE,
    Contrasena VARCHAR(255) NOT NULL,
    TipoDocumento VARCHAR(50),
    NumeroDocumento VARCHAR(50),
    Telefono VARCHAR(50),
    Pais VARCHAR(100),
    Departamento VARCHAR(100),
    Municipio VARCHAR(100),
    Direccion TEXT,
    IDRol INT DEFAULT 1,
    Estado INT DEFAULT 1
);

-- Tabla estadosreserva
CREATE TABLE IF NOT EXISTS estadosreserva (
    IdEstadoReserva INT AUTO_INCREMENT PRIMARY KEY,
    NombreEstadoReserva VARCHAR(255) NOT NULL
);

-- Tabla cabanas
CREATE TABLE IF NOT EXISTS cabanas (
    IDCabana INT AUTO_INCREMENT PRIMARY KEY,
    NombreCabana VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    CapacidadPersonas INT,
    PrecioNoche DECIMAL(10,2),
    Estado INT DEFAULT 1,
    ImagenCabana VARCHAR(255),
    NumeroHabitaciones INT
);

-- Tabla clientes
CREATE TABLE IF NOT EXISTS clientes (
    IDCliente INT AUTO_INCREMENT PRIMARY KEY,
    NroDocumento VARCHAR(50) UNIQUE,
    Nombre VARCHAR(255),
    Apellido VARCHAR(255),
    Direccion TEXT,
    Email VARCHAR(255),
    Telefono VARCHAR(50),
    Estado INT DEFAULT 1,
    IDRol INT DEFAULT 1
);

-- Tabla metodopago
CREATE TABLE IF NOT EXISTS metodopago (
    IdMetodoPago INT AUTO_INCREMENT PRIMARY KEY,
    NomMetodoPago VARCHAR(255) NOT NULL
);

-- Tabla habitacion
CREATE TABLE IF NOT EXISTS habitacion (
    IDHabitacion INT AUTO_INCREMENT PRIMARY KEY,
    NombreHabitacion VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2),
    descripcion TEXT,
    Estado INT DEFAULT 1,
    numero INT,
    imagen VARCHAR(255),
    Costo DECIMAL(10,2),
    IDCabana INT,
    FOREIGN KEY (IDCabana) REFERENCES cabanas(IDCabana)
);

-- Tabla paquetes
CREATE TABLE IF NOT EXISTS paquetes (
    IDPaquete INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    Precio DECIMAL(10,2),
    Descripcion TEXT,
    Estado INT DEFAULT 1,
    imagen VARCHAR(255),
    IDHabitacion INT,
    IDCabana INT,
    IDServicio VARCHAR(255),
    Descuento DECIMAL(10,2) DEFAULT 0,
    TipoDescuento VARCHAR(50) DEFAULT 'porcentaje',
    NumeroPersonas INT DEFAULT NULL,
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion),
    FOREIGN KEY (IDCabana) REFERENCES cabanas(IDCabana)
);

-- Tabla reserva
CREATE TABLE IF NOT EXISTS reserva (
    IdReserva INT AUTO_INCREMENT PRIMARY KEY,
    UsuarioIdusuario INT,
    IdEstadoReserva INT,
    MetodoPago INT,
    FechaReserva DATE,
    FechaInicio DATE,
    FechaFinalizacion DATE,
    SubTotal DECIMAL(10,2),
    Descuento DECIMAL(10,2) DEFAULT 0,
    IVA DECIMAL(10,2),
    MontoTotal DECIMAL(10,2),
    FOREIGN KEY (UsuarioIdusuario) REFERENCES usuarios(IDUsuario),
    FOREIGN KEY (IdEstadoReserva) REFERENCES estadosreserva(IdEstadoReserva),
    FOREIGN KEY (MetodoPago) REFERENCES metodopago(IdMetodoPago)
);

-- Tabla detallereservapaquetes
CREATE TABLE IF NOT EXISTS detallereservapaquetes (
    IDReserva INT,
    IDPaquete INT,
    Cantidad INT DEFAULT 1,
    Precio DECIMAL(10,2),
    Estado INT DEFAULT 1,
    PRIMARY KEY (IDReserva, IDPaquete),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDPaquete) REFERENCES paquetes(IDPaquete)
);

-- Tabla servicios
CREATE TABLE IF NOT EXISTS servicios (
    IDServicio INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    precio DECIMAL(10,2),
    Descripcion TEXT,
    Estado INT DEFAULT 1,
    imagen VARCHAR(255),
    Costo DECIMAL(10,2),
    Duracion VARCHAR(100),
    CantidadMaximaPersonas INT
);

-- Tabla detallereservaservicio
CREATE TABLE IF NOT EXISTS detallereservaservicio (
    IDReserva INT,
    IDServicio INT,
    Cantidad INT DEFAULT 1,
    Precio DECIMAL(10,2),
    Estado INT DEFAULT 1,
    PRIMARY KEY (IDReserva, IDServicio),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDServicio) REFERENCES servicios(IDServicio)
);

-- Tabla detallereservahabitacion
CREATE TABLE IF NOT EXISTS detallereservahabitacion (
    IDReserva INT,
    IDHabitacion INT,
    Cantidad INT DEFAULT 1,
    precio DECIMAL(10,2),
    Estado INT DEFAULT 1,
    PRIMARY KEY (IDReserva, IDHabitacion),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDHabitacion) REFERENCES habitacion(IDHabitacion)
);

-- Tabla detallereservacabana
CREATE TABLE IF NOT EXISTS detallereservacabana (
    IDReserva INT,
    IDCabana INT,
    Cantidad INT DEFAULT 1,
    Precio DECIMAL(10,2),
    Estado INT DEFAULT 1,
    PRIMARY KEY (IDReserva, IDCabana),
    FOREIGN KEY (IDReserva) REFERENCES reserva(IdReserva),
    FOREIGN KEY (IDCabana) REFERENCES cabanas(IDCabana)
);

-- Insertar datos de ejemplo
INSERT INTO usuarios (NombreUsuario, Apellido, Email, Contrasena, IDRol) VALUES
('Admin', 'Sistema', 'admin@example.com', 'password', 2),
('User1', 'Prueba', 'user1@example.com', 'password', 1);

INSERT INTO estadosreserva (NombreEstadoReserva) VALUES
('Pendiente'),
('Confirmada'),
('Cancelada'),
('Completada');

INSERT INTO metodopago (NomMetodoPago) VALUES
('Efectivo'),
('Tarjeta'),
('Transferencia'),
('PayPal');

INSERT INTO habitacion (NombreHabitacion, precio, descripcion, Estado, numero, imagen, Costo) VALUES
('Habitación Simple', 50.00, 'Habitación básica', 1, 101, '', 50.00),
('Habitación Doble', 80.00, 'Habitación para dos', 1, 102, '', 80.00);

INSERT INTO paquetes (nombre, Precio, IDHabitacion) VALUES
('Paquete Básico', 100.00, 1),
('Paquete Premium', 150.00, 2);

INSERT INTO servicios (nombre, precio, Descripcion, Estado, imagen, Costo, Duracion, CantidadMaximaPersonas) VALUES
('Desayuno Campestre', 25000.00, 'Desayuno completo con productos frescos de la región.', 1, '', 25000.00, '20-30 min', 1),
('Lavandería Express', 18000.00, 'Lavado y planchado de prendas ligeras con entrega el mismo día.', 1, '', 18000.00, '8-12 horas', 1),
('Cabalgata Guiada', 60000.00, 'Cabalgata por senderos seguros con guía local y equipo de protección.', 1, '', 60000.00, '2 horas', 6),
('Tour Guiado', 85000.00, 'Recorrido con guía experto por los mejores puntos del destino.', 1, '', 85000.00, '4 horas', 8),
('Masaje Relajante', 72000.00, 'Masaje individual con aceites naturales para liberar tensiones.', 1, '', 72000.00, '60 minutos', 4),
('Decoración Romántica', 120000.00, 'Ambientación romántica con pétalos, velas y detalles especiales.', 1, '', 120000.00, '30 minutos', 2),
('Botella de Vino', 80000.00, 'Botella de vino espumoso nacional para celebrar la estancia.', 1, '', 80000.00, 'N/A', 4),
('Traslado Aeropuerto', 90000.00, 'Traslado privado desde o hacia el aeropuerto para hasta 4 personas.', 1, '', 90000.00, 'Variable', 4),
('Spa Privado', 120000.00, 'Acceso a circuito de spa con jacuzzi y vapor para relajación completa.', 1, '', 120000.00, '90 minutos', 2),
('Wifi Premium', 15000.00, 'Internet de alta velocidad para todo el alojamiento.', 1, '', 15000.00, '24 horas', 10);

-- Promover usuario a admin
UPDATE usuarios SET IDRol = 2 WHERE Email = 'godienser@gmail.com';
