-- Migration to add logs JSONB column to appointment table
ALTER TABLE public.appointment ADD COLUMN IF NOT EXISTS logs JSONB;
