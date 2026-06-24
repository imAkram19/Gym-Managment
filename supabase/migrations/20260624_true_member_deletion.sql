-- 1. Create pending_device_deletions table
CREATE TABLE IF NOT EXISTS pending_device_deletions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_user_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and add public full access policy
ALTER TABLE pending_device_deletions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public full access pending_device_deletions" ON pending_device_deletions;
CREATE POLICY "Public full access pending_device_deletions" ON pending_device_deletions FOR ALL USING (true) WITH CHECK (true);

-- 2. Drop the old permanent delete trigger on biometric_enrollments (if exists)
DROP TRIGGER IF EXISTS tr_biometric_sync_permanent_delete ON biometric_enrollments;
DROP FUNCTION IF EXISTS tr_func_delete_member_after_biometric_sync();

-- 3. Create the new delete trigger on biometric_enrollments
CREATE OR REPLACE FUNCTION tr_func_on_biometric_enrollment_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into pending_device_deletions so the sync agent can clean it up from ZK hardware
    INSERT INTO pending_device_deletions (device_user_id)
    VALUES (OLD.device_user_id);

    -- Clean up biometric attendance logs for this device_user_id
    DELETE FROM biometric_attendance_logs
    WHERE device_user_id = OLD.device_user_id;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_biometric_enrollment_delete ON biometric_enrollments;
CREATE TRIGGER tr_biometric_enrollment_delete
BEFORE DELETE ON biometric_enrollments
FOR EACH ROW
EXECUTE FUNCTION tr_func_on_biometric_enrollment_delete();

-- 4. Update the sync_member_statuses() database function to transition members from 'inactive' to 'expired' if they have no active subscriptions (restored visibility fix)
CREATE OR REPLACE FUNCTION sync_member_statuses()
RETURNS VOID AS $$
BEGIN
  -- Deactivate subscriptions whose end_date is in the past and are currently marked active
  UPDATE subscriptions
  SET is_active = false
  WHERE end_date < CURRENT_DATE AND is_active = true;

  -- Mark members as 'expired' if they have no active subscriptions and are currently 'active' or 'inactive'
  UPDATE members m
  SET status = 'expired'
  WHERE status IN ('active', 'inactive')
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.member_id = m.id AND s.is_active = true AND s.end_date >= CURRENT_DATE
    );

  -- Mark members as 'active' if they have an active subscription but are currently 'expired' or 'inactive'
  UPDATE members m
  SET status = 'active'
  WHERE status IN ('expired', 'inactive')
    AND EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.member_id = m.id AND s.is_active = true AND s.end_date >= CURRENT_DATE
    );

  -- Automatically flag biometric enrollments for deletion if members are expired or inactive
  UPDATE biometric_enrollments be
  SET sync_status = 'needs_deletion'
  FROM members m
  WHERE be.member_id = m.id
    AND m.status IN ('expired', 'inactive')
    AND be.sync_status = 'synced';

  -- Automatically flag biometric enrollments for re-enrollment if they were deleted but the member is now active again
  UPDATE biometric_enrollments be
  SET sync_status = 'needs_enrollment'
  FROM members m
  WHERE be.member_id = m.id
    AND m.status = 'active'
    AND be.sync_status IN ('needs_deletion', 'deleted');
END;
$$ LANGUAGE plpgsql;

-- 5. Create reset_biometric_test_data RPC
CREATE OR REPLACE FUNCTION reset_biometric_test_data(keep_members BOOLEAN)
RETURNS VOID AS $$
BEGIN
    DELETE FROM biometric_enrollments;
    DELETE FROM biometric_attendance_logs;
    DELETE FROM pending_device_deletions;
    
    IF NOT keep_members THEN
        DELETE FROM members;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 6. Create diagnostic views
CREATE OR REPLACE VIEW view_duplicate_device_ids AS
SELECT device_user_id, count(*), array_agg(member_id) as member_ids
FROM biometric_enrollments
GROUP BY device_user_id
HAVING count(*) > 1;

CREATE OR REPLACE VIEW view_orphaned_mappings AS
SELECT be.id, be.member_id, be.device_user_id
FROM biometric_enrollments be
LEFT JOIN members m ON be.member_id = m.id
WHERE m.id IS NULL;

CREATE OR REPLACE VIEW view_deleted_members_mapped AS
SELECT be.id, be.member_id, be.device_user_id, m.full_name, m.deleted_at
FROM biometric_enrollments be
JOIN members m ON be.member_id = m.id
WHERE m.deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW view_expired_members_mapped AS
SELECT be.id, be.member_id, be.device_user_id, m.full_name, m.status, be.sync_status
FROM biometric_enrollments be
JOIN members m ON be.member_id = m.id
WHERE m.status = 'expired' AND be.sync_status = 'synced';

-- 7. Immediately delete existing stale mappings for soft-deleted members to free up locked Device User IDs
DELETE FROM biometric_enrollments be
USING members m
WHERE be.member_id = m.id AND m.deleted_at IS NOT NULL;
