-- Add last_seen column to biometric_devices table for health monitoring
ALTER TABLE public.biometric_devices ADD COLUMN IF NOT EXISTS last_seen timestamp with time zone;
