-- Database Migration: Purge Obsolete Device Records for Iron Gym Hyderabad K40
-- Date: 2026-09-14

DO $$
DECLARE
    v_canonical_id UUID;
    v_repointed_logs_count INTEGER := 0;
    v_deleted_devices_count INTEGER := 0;
    rec RECORD;
BEGIN
    -- 1. Identify canonical Iron Gym K40 device ID
    SELECT id INTO v_canonical_id
    FROM biometric_devices
    WHERE name = 'Iron Gym K40' AND ip_address = '192.168.1.201' AND port = 4370
    ORDER BY last_ping DESC NULLS LAST, last_seen DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- If canonical device doesn't exist yet, pick or preserve earliest
    IF v_canonical_id IS NULL THEN
        SELECT id INTO v_canonical_id
        FROM biometric_devices
        WHERE ip_address = '192.168.1.201' AND port = 4370
        ORDER BY created_at ASC
        LIMIT 1;
    END IF;

    IF v_canonical_id IS NOT NULL THEN
        -- 2. Re-point attendance log references from obsolete/pro/duplicate devices to canonical device ID
        WITH logs_to_update AS (
            SELECT id FROM biometric_attendance_logs
            WHERE device_id IN (
                SELECT id FROM biometric_devices
                WHERE (name = 'Iron Gym K40 Pro' OR name = 'Simulated Dev ZKTeco K40' OR (ip_address = '192.168.1.201' AND port = 4370))
                  AND id != v_canonical_id
            )
        )
        UPDATE biometric_attendance_logs
        SET device_id = v_canonical_id
        WHERE id IN (SELECT id FROM logs_to_update);

        GET DIAGNOSTICS v_repointed_logs_count = ROW_COUNT;

        -- 3. Delete obsolete Iron Gym K40 Pro and stale test device records
        DELETE FROM biometric_devices
        WHERE (name = 'Iron Gym K40 Pro' OR name = 'Simulated Dev ZKTeco K40' OR (ip_address = '192.168.1.201' AND port = 4370))
          AND id != v_canonical_id;

        GET DIAGNOSTICS v_deleted_devices_count = ROW_COUNT;

        RAISE NOTICE 'Canonical Device ID: %', v_canonical_id;
        RAISE NOTICE 'Attendance logs re-pointed: %', v_repointed_logs_count;
        RAISE NOTICE 'Obsolete devices purged: %', v_deleted_devices_count;
    END IF;
END $$;

-- 4. Ensure composite unique constraint on (name, ip_address, port) is enforced
ALTER TABLE public.biometric_devices 
DROP CONSTRAINT IF EXISTS biometric_devices_name_ip_port_key;

ALTER TABLE public.biometric_devices 
ADD CONSTRAINT biometric_devices_name_ip_port_key UNIQUE (name, ip_address, port);
