-- Create PostgreSQL function to aggregate attendance traffic by hour
CREATE OR REPLACE FUNCTION get_hourly_traffic(p_days_ago integer)
RETURNS TABLE (hour_number integer, check_in_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        split_part(check_in_time, ':', 1)::integer AS hour_number,
        count(*)::bigint AS check_in_count
    FROM attendance
    WHERE date >= CURRENT_DATE - p_days_ago
      AND check_in_time IS NOT NULL
      AND split_part(check_in_time, ':', 1) ~ '^[0-9]+$'
    GROUP BY hour_number
    ORDER BY hour_number;
END;
$$ LANGUAGE plpgsql;
