-- Migración: agregar NumeroPersonas a la tabla paquetes
ALTER TABLE `paquetes`
ADD COLUMN `NumeroPersonas` INT NULL DEFAULT NULL AFTER `TipoDescuento`;
