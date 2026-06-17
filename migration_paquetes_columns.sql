-- Migración para añadir las columnas faltantes requeridas por el servicio de paquetes
ALTER TABLE `paquetes`
ADD COLUMN `IDCabana` INT(11) NULL DEFAULT NULL AFTER `IDHabitacion`,
ADD COLUMN `Descuento` FLOAT NULL DEFAULT 0 AFTER `precio`,
ADD COLUMN `TipoDescuento` VARCHAR(50) NULL DEFAULT 'porcentaje' AFTER `Descuento`;
