-- Migración: agregar Departamento y Municipio a la tabla usuarios
ALTER TABLE `usuarios`
ADD COLUMN `Departamento` VARCHAR(100) NULL DEFAULT NULL AFTER `Pais`,
ADD COLUMN `Municipio` VARCHAR(100) NULL DEFAULT NULL AFTER `Departamento`;
