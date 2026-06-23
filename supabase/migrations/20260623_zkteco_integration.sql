-- 1. Create Biometric Devices Table
CREATE TABLE IF NOT EXISTS biometric_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    port INTEGER DEFAULT 4370,
    status TEXT DEFAULT 'offline',
    last_ping TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Biometric Enrollments Table (Maps Gym Members to Device IDs)
CREATE TABLE IF NOT EXISTS biometric_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    device_user_id INTEGER NOT NULL UNIQUE, -- User ID entered on the K40 keypad (e.g. 101, 102)
    enrolled_at TIMESTAMPTZ DEFAULT now()
);

-- Add Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_biometric_enrollments_device_user_id ON biometric_enrollments(device_user_id);

-- 3. Create Biometric Attendance Logs Table (Audit Trail)
CREATE TABLE IF NOT EXISTS biometric_attendance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES biometric_devices(id) ON DELETE SET NULL,
    device_user_id INTEGER NOT NULL,
    scan_timestamp TIMESTAMPTZ NOT NULL,
    processed BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' -- e.g., 'success', 'denied_no_plan', 'unknown_user', 'failed'
);
