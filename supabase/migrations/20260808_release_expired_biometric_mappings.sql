-- Migration: 20260808_release_expired_biometric_mappings.sql
-- Description: Release biometric/device user IDs when fingerprint deletion is confirmed and prevent auto-re-enrollment of expired members.

-- 1. Update sync_member_statuses() function
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

  -- Automatically restore biometric enrollments to 'synced' ONLY IF they were pending deletion ('needs_deletion')
  -- but the member became active again BEFORE hardware deletion occurred.
  -- Exclude 'deleted' status so expired members whose hardware fingerprint was deleted never auto-recover their old ID.
  UPDATE biometric_enrollments be
  SET sync_status = 'synced'
  FROM members m
  WHERE be.member_id = m.id
    AND m.status = 'active'
    AND be.sync_status = 'needs_deletion';
END;
$$ LANGUAGE plpgsql;

-- 2. Update tr_func_sync_member_and_enrollment() trigger function
CREATE OR REPLACE FUNCTION tr_func_sync_member_and_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
    v_has_active BOOLEAN;
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_member_id := OLD.member_id;
    ELSE
        v_member_id := NEW.member_id;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE member_id = v_member_id
          AND is_active = true
          AND end_date >= CURRENT_DATE
    ) INTO v_has_active;

    SELECT status INTO v_old_status FROM members WHERE id = v_member_id;

    IF v_has_active THEN
        v_new_status := 'active';
    ELSE
        v_new_status := 'expired';
    END IF;

    IF v_old_status IS DISTINCT FROM v_new_status THEN
        UPDATE members
        SET status = v_new_status
        WHERE id = v_member_id;
    END IF;

    IF v_new_status = 'active' THEN
        UPDATE biometric_enrollments
        SET sync_status = 'synced'
        WHERE member_id = v_member_id
          AND sync_status = 'needs_deletion';
    ELSE
        UPDATE biometric_enrollments
        SET sync_status = 'needs_deletion'
        WHERE member_id = v_member_id
          AND sync_status = 'synced';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 3. Update tr_func_sync_enrollment_on_member_change() trigger function
CREATE OR REPLACE FUNCTION tr_func_sync_enrollment_on_member_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('expired', 'inactive') AND OLD.status = 'active' THEN
        UPDATE biometric_enrollments
        SET sync_status = 'needs_deletion'
        WHERE member_id = NEW.id
          AND sync_status = 'synced';
    ELSIF NEW.status = 'active' AND OLD.status IN ('expired', 'inactive') THEN
        UPDATE biometric_enrollments
        SET sync_status = 'synced'
        WHERE member_id = NEW.id
          AND sync_status = 'needs_deletion';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Clean up legacy 'deleted' enrollment rows to immediately release locked device user IDs for existing expired members
DELETE FROM biometric_enrollments
WHERE sync_status = 'deleted';
