-- 1. Add sync_status to biometric_enrollments
ALTER TABLE biometric_enrollments 
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' 
CHECK (sync_status IN ('synced', 'needs_deletion', 'deleted', 'needs_enrollment'));

-- 2. Re-define sync_member_statuses() function to handle enrollment synchronization state
CREATE OR REPLACE FUNCTION sync_member_statuses()
RETURNS void AS $$
BEGIN
  -- 1. Deactivate subscriptions whose end_date is in the past and are currently marked active
  UPDATE subscriptions
  SET is_active = false
  WHERE end_date < CURRENT_DATE AND is_active = true;

  -- 2. Mark members as 'expired' if they have no active subscriptions and are currently 'active'
  UPDATE members m
  SET status = 'expired'
  WHERE status = 'active'
    AND NOT EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.member_id = m.id AND s.is_active = true AND s.end_date >= CURRENT_DATE
    );

  -- 3. Mark members as 'active' if they have an active subscription but are currently 'expired' or 'inactive'
  UPDATE members m
  SET status = 'active'
  WHERE status IN ('expired', 'inactive')
    AND EXISTS (
      SELECT 1 FROM subscriptions s
      WHERE s.member_id = m.id AND s.is_active = true AND s.end_date >= CURRENT_DATE
    );

  -- 4. Automatically flag biometric enrollments for deletion if members are expired or inactive
  UPDATE biometric_enrollments be
  SET sync_status = 'needs_deletion'
  FROM members m
  WHERE be.member_id = m.id
    AND m.status IN ('expired', 'inactive')
    AND be.sync_status = 'synced';

  -- 5. Automatically flag biometric enrollments for re-enrollment if they were deleted but the member is now active again
  UPDATE biometric_enrollments be
  SET sync_status = 'needs_enrollment'
  FROM members m
  WHERE be.member_id = m.id
    AND m.status = 'active'
    AND be.sync_status IN ('needs_deletion', 'deleted');
END;
$$ LANGUAGE plpgsql;
