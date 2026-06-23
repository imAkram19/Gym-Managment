-- 1. Trigger function on Subscriptions to sync Member Status and Biometric Enrollment Status
CREATE OR REPLACE FUNCTION tr_func_sync_member_and_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_member_id UUID;
    v_has_active BOOLEAN;
    v_old_status TEXT;
    v_new_status TEXT;
BEGIN
    -- Determine which member is affected
    IF TG_OP = 'DELETE' THEN
        v_member_id := OLD.member_id;
    ELSE
        v_member_id := NEW.member_id;
    END IF;

    -- Check if this member has any active subscription
    SELECT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE member_id = v_member_id
          AND is_active = true
          AND end_date >= CURRENT_DATE
    ) INTO v_has_active;

    -- Get current status of the member
    SELECT status INTO v_old_status FROM members WHERE id = v_member_id;

    -- Determine new member status
    IF v_has_active THEN
        v_new_status := 'active';
    ELSE
        v_new_status := 'expired';
    END IF;

    -- Update member status if changed
    IF v_old_status IS DISTINCT FROM v_new_status THEN
        UPDATE members
        SET status = v_new_status
        WHERE id = v_member_id;
    END IF;

    -- Update biometric enrollment sync status based on new status
    IF v_new_status = 'active' THEN
        UPDATE biometric_enrollments
        SET sync_status = 'needs_enrollment'
        WHERE member_id = v_member_id
          AND sync_status IN ('needs_deletion', 'deleted');
    ELSE
        UPDATE biometric_enrollments
        SET sync_status = 'needs_deletion'
        WHERE member_id = v_member_id
          AND sync_status = 'synced';
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to subscriptions table
DROP TRIGGER IF EXISTS tr_sync_member_subscription ON subscriptions;
CREATE TRIGGER tr_sync_member_subscription
AFTER INSERT OR UPDATE OR DELETE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION tr_func_sync_member_and_enrollment();


-- 2. Trigger function on Members (in case status is updated directly) to sync Biometric Enrollment Status
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
        SET sync_status = 'needs_enrollment'
        WHERE member_id = NEW.id
          AND sync_status IN ('needs_deletion', 'deleted');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to members table
DROP TRIGGER IF EXISTS tr_sync_member_biometrics ON members;
CREATE TRIGGER tr_sync_member_biometrics
AFTER UPDATE OF status ON members
FOR EACH ROW
EXECUTE FUNCTION tr_func_sync_enrollment_on_member_change();
