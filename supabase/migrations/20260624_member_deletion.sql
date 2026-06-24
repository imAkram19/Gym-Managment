-- Add soft delete (archiving) columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE members ADD COLUMN IF NOT EXISTS pending_permanent_deletion BOOLEAN DEFAULT FALSE;

-- Recreate foreign key constraints to ON DELETE CASCADE
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_member_id_fkey;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_member_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_member_id_fkey;
ALTER TABLE attendance ADD CONSTRAINT attendance_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE biometric_enrollments DROP CONSTRAINT IF EXISTS biometric_enrollments_member_id_fkey;
ALTER TABLE biometric_enrollments ADD CONSTRAINT biometric_enrollments_member_id_fkey 
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

-- Create function to physically delete member after biometrics are removed from hardware
CREATE OR REPLACE FUNCTION tr_func_delete_member_after_biometric_sync()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.sync_status = 'deleted' THEN
        IF EXISTS (
            SELECT 1 FROM members 
            WHERE id = NEW.member_id AND pending_permanent_deletion = TRUE
        ) THEN
            DELETE FROM members WHERE id = NEW.member_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger
DROP TRIGGER IF EXISTS tr_biometric_sync_permanent_delete ON biometric_enrollments;
CREATE TRIGGER tr_biometric_sync_permanent_delete
AFTER UPDATE OF sync_status ON biometric_enrollments
FOR EACH ROW
EXECUTE FUNCTION tr_func_delete_member_after_biometric_sync();
