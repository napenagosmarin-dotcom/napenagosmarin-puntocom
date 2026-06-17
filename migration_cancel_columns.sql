-- ─────────────────────────────────────────────────────────────────────────────
-- MIGRACIÓN: Columnas de cancelación en tabla reserva
-- Fecha: 2026-06-11
-- Descripción: Agrega campos de trazabilidad para el sistema de cancelación
--              de reservas con política de penalización configurable.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE reserva
  ADD COLUMN FechaCancelacion       DATETIME      NULL
             COMMENT 'Timestamp exacto en que se procesó la cancelación',

  ADD COLUMN TipoCancelacion        VARCHAR(20)   NULL
             COMMENT 'gratuita | penalizada — determina si hubo cargo',

  ADD COLUMN PorcentajePenalizacion DECIMAL(5,2)  NULL DEFAULT 0
             COMMENT 'Porcentaje cobrado (ej: 40.00). 0 si cancelación gratuita',

  ADD COLUMN ValorPenalizacion      DECIMAL(10,2) NULL DEFAULT 0
             COMMENT 'Valor en COP retenido como penalización',

  ADD COLUMN ValorReembolso         DECIMAL(10,2) NULL DEFAULT 0
             COMMENT 'Valor en COP a devolver al cliente (MontoTotal - ValorPenalizacion)';

-- Verificar la migración
DESCRIBE reserva;
