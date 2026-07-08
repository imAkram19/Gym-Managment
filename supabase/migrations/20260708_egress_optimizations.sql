-- 1. Helper function to compute attendance streak for a member
CREATE OR REPLACE FUNCTION compute_member_streak(p_member_id UUID)
RETURNS integer AS $$
DECLARE
    v_streak integer := 0;
    v_curr_date date := CURRENT_DATE;
    v_exists boolean;
BEGIN
    -- Check if they checked in today
    SELECT EXISTS (SELECT 1 FROM attendance WHERE member_id = p_member_id AND date = v_curr_date) INTO v_exists;
    IF NOT v_exists THEN
        -- Check if they checked in yesterday
        v_curr_date := v_curr_date - 1;
        SELECT EXISTS (SELECT 1 FROM attendance WHERE member_id = p_member_id AND date = v_curr_date) INTO v_exists;
    END IF;
    
    WHILE v_exists LOOP
        v_streak := v_streak + 1;
        v_curr_date := v_curr_date - 1;
        SELECT EXISTS (SELECT 1 FROM attendance WHERE member_id = p_member_id AND date = v_curr_date) INTO v_exists;
    END LOOP;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- 2. Helper function to compute preferred time slot for a member
CREATE OR REPLACE FUNCTION compute_preferred_time(p_member_id UUID)
RETURNS text AS $$
DECLARE
    v_morning integer := 0;
    v_afternoon integer := 0;
    v_evening integer := 0;
    r record;
BEGIN
    FOR r IN SELECT check_in_time FROM attendance WHERE member_id = p_member_id LOOP
        IF r.check_in_time IS NOT NULL THEN
            DECLARE
                v_hour integer := split_part(r.check_in_time, ':', 1)::integer;
            BEGIN
                IF v_hour >= 5 AND v_hour < 12 THEN
                    v_morning := v_morning + 1;
                ELSIF v_hour >= 12 AND v_hour < 17 THEN
                    v_afternoon := v_afternoon + 1;
                ELSE
                    v_evening := v_evening + 1;
                END IF;
            END;
        END IF;
    END LOOP;
    
    IF v_morning = 0 AND v_afternoon = 0 AND v_evening = 0 THEN
        RETURN 'Morning';
    END IF;
    
    IF v_afternoon > v_morning AND v_afternoon > v_evening THEN
        RETURN 'Afternoon';
    ELSIF v_evening > v_morning AND v_evening > v_afternoon THEN
        RETURN 'Evening';
    ELSE
        RETURN 'Morning';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. RPC function to calculate member attendance metrics on the database side
CREATE OR REPLACE FUNCTION get_member_attendance_metrics_rpc()
RETURNS TABLE (
    "memberId" UUID,
    "fullName" TEXT,
    "imageUrl" TEXT,
    "phone" TEXT,
    "status" TEXT,
    "totalVisits" integer,
    "visitsThisMonth" integer,
    "visitsThisWeek" integer,
    "lastCheckIn" TEXT,
    "daysSinceLastVisit" integer,
    "currentStreak" integer,
    "avgVisitsPerWeek" numeric,
    "preferredTime" TEXT,
    "recentDates" text[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id AS "memberId",
        m.full_name AS "fullName",
        m.image_url AS "imageUrl",
        m.phone AS "phone",
        m.status AS "status",
        COALESCE(count(a.id), 0)::integer AS "totalVisits",
        COALESCE(count(a.id) FILTER (WHERE a.date >= date_trunc('month', CURRENT_DATE)::date), 0)::integer AS "visitsThisMonth",
        COALESCE(count(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 6), 0)::integer AS "visitsThisWeek",
        max(a.date)::text AS "lastCheckIn",
        (CURRENT_DATE - max(a.date))::integer AS "daysSinceLastVisit",
        compute_member_streak(m.id) AS "currentStreak",
        COALESCE(ROUND(count(a.id) FILTER (WHERE a.date >= CURRENT_DATE - 27)::numeric / 4.0, 1), 0.0) AS "avgVisitsPerWeek",
        compute_preferred_time(m.id) AS "preferredTime",
        COALESCE(array_agg(a.date::text ORDER BY a.date DESC) FILTER (WHERE a.date >= CURRENT_DATE - 29), '{}'::text[]) AS "recentDates"
    FROM members m
    LEFT JOIN attendance a ON m.id = a.member_id
    WHERE m.deleted_at IS NULL
    GROUP BY m.id, m.full_name, m.image_url, m.phone, m.status, m.join_date;
END;
$$ LANGUAGE plpgsql;

-- 4. RPC function to get total collections (sum of payments)
CREATE OR REPLACE FUNCTION get_total_collections()
RETURNS numeric AS $$
  SELECT COALESCE(sum(amount), 0) FROM payments;
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Database view to fetch inactive members (> 10 days since last check-in or join date)
CREATE OR REPLACE VIEW view_inactive_members AS
SELECT 
    m.id,
    m.full_name as name,
    m.phone,
    m.join_date as "joinDate",
    (SELECT max(a.date)::text FROM attendance a WHERE a.member_id = m.id) as "lastCheckIn"
FROM members m
WHERE m.status = 'active'
  AND m.deleted_at IS NULL
  AND (
      (NOT EXISTS (SELECT 1 FROM attendance a WHERE a.member_id = m.id) AND m.join_date < CURRENT_DATE - INTERVAL '10 days')
      OR
      ((SELECT max(a.date) FROM attendance a WHERE a.member_id = m.id) < CURRENT_DATE - INTERVAL '10 days')
  );
