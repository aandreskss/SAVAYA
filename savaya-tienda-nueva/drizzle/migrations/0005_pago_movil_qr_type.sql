-- Migration 0005: add pago_movil_qr to payment_method_type enum
-- Run manually in Neon SQL console if drizzle-kit push is unavailable

ALTER TYPE payment_method_type ADD VALUE IF NOT EXISTS 'pago_movil_qr';
