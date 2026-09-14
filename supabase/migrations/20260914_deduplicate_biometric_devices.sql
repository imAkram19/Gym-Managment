-- Database Migration: Deduplicate Biometric Devices and Enforce Unique Hardware Identity
-- Date: 2026-09-14

-- 1. Identify canonical device ID per (name, ip_address, port) group and re-point attendance logs
DO $$
DECLARE
    rec RECORD;
    v_canonical_id UUID;
BEGIN
    FOR rec IN 
        SELECT name, ip_address, port, COUNT(*) 
        FROM biometric_devices 
        GROUP BY name, ip_address, port 
        HAVING COUNT(*) > 1
    LOOP
        -- Pick canonical device ID (the one with the latest last_ping/last_seen or created_at)
        SELECT id INTO v_canonical_id
        FROM biometric_devices
        WHERE name = rec.name AND ip_address = rec.ip_address AND port = rec.port
        ORDER BY last_ping DESC NULLS LAST, last_seen DESC NULLS LAST, created_at DESC
        LIMIT 1;

        IF v_canonical_id IS NOT NULL THEN
            -- Re-point any attendance logs referencing duplicate IDs to the canonical ID
            UPDATE biometric_attendance_logs
            SET device_id = v_canonical_id
            WHERE device_id IN (
                SELECT id FROM biometric_devices
                WHERE name = rec.name AND ip_address = rec.ip_address AND port = rec.port
                  AND id != v_canonical_id
            );

            -- Delete duplicate device rows except canonical
            DELETE FROM biometric_devices
            WHERE name = rec.name AND ip_address = rec.ip_address AND port = rec.port
              AND id != v_canonical_id;
        END IF;
    END LOOP;
END $$;

-- 2. Add Composite Unique Constraint on (name, ip_address, port) to make device registration 100% idempotent
ALTER TABLE public.biometric_devices 
DROP CONSTRAINT IF EXISTS biometric_devices_name_ip_port_key;

ALTER TABLE public.biometric_devices 
ADD CONSTRAINT biometric_devices_name_ip_port_key UNIQUE (name, ip_address, port);
