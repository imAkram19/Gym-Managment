-- Create missing indexes to speed up lookups, joins, and filters
CREATE INDEX IF NOT EXISTS idx_attendance_member_date ON attendance(member_id, date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_member_active_end ON subscriptions(member_id, is_active, end_date);
CREATE INDEX IF NOT EXISTS idx_payments_member_date ON payments(member_id, date);
CREATE INDEX IF NOT EXISTS idx_members_status_deleted ON members(status, deleted_at);
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_member ON biometric_enrollments(member_id);
