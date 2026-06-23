-- Migración: agregar CapacidadPersonas a la tabla habitacion
ALTER TABLE `habitacion`
ADD COLUMN `CapacidadPersonas` INT NOT NULL DEFAULT 1 AFTER `Costo`;
