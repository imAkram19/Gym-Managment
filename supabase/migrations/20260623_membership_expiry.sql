-- Create Postgres Function for Membership Expiry Synchronization
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
END;
$$ LANGUAGE plpgsql;
