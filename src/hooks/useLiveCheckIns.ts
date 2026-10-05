import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/toast';

export interface LiveCheckInItem {
  id: string;
  memberId: string;
  memberName: string;
  memberImage?: string;
  date: string;
  checkInTime: string;
  method: 'manual' | 'qr' | 'fingerprint';
  status?: 'active' | 'expiring' | 'expired';
}

/**
 * useLiveCheckIns — Real-time attendance check-in subscription
 * Connects to Supabase Realtime WebSocket on the `attendance` table.
 * Zero database polling — updates push directly via Postgres CDC.
 */
export function useLiveCheckIns(limit = 20) {
  const [checkIns, setCheckIns] = useState<LiveCheckInItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch initial today's check-ins on mount
  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('attendance')
          .select(`
            id,
            member_id,
            date,
            check_in_time,
            method,
            members:member_id (
              full_name,
              image_url,
              status
            )
          `)
          .eq('date', todayStr)
          .order('check_in_time', { ascending: false })
          .limit(limit);

        if (!error && data && isMounted) {
          const formatted: LiveCheckInItem[] = data.map((item: any) => ({
            id: item.id,
            memberId: item.member_id,
            memberName: item.members?.full_name || 'Member',
            memberImage: item.members?.image_url,
            date: item.date,
            checkInTime: item.check_in_time,
            method: item.method || 'fingerprint',
            status: item.members?.status || 'active',
          }));
          setCheckIns(formatted);
        }
      } catch (err) {
        console.error('Failed to load initial live check-ins:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [limit]);

  // 2. Real-time subscription to INSERT events on attendance table
  useEffect(() => {
    const channel = supabase
      .channel('live-attendance-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'attendance',
        },
        async (payload) => {
          const newAtt = payload.new as any;
          if (!newAtt) return;

          // Fetch member details for the newly inserted record
          let memberName = 'Member';
          let memberImage: string | undefined;
          let memberStatus: 'active' | 'expiring' | 'expired' = 'active';

          try {
            const { data: mData } = await supabase
              .from('members')
              .select('full_name, image_url, status')
              .eq('id', newAtt.member_id)
              .single();

            if (mData) {
              memberName = mData.full_name;
              memberImage = mData.image_url;
              memberStatus = mData.status;
            }
          } catch (err) {
            console.error('Error fetching member for realtime checkin:', err);
          }

          const newItem: LiveCheckInItem = {
            id: newAtt.id,
            memberId: newAtt.member_id,
            memberName,
            memberImage,
            date: newAtt.date,
            checkInTime: newAtt.check_in_time,
            method: newAtt.method || 'fingerprint',
            status: memberStatus,
          };

          setCheckIns((prev) => [newItem, ...prev.filter((c) => c.id !== newItem.id)].slice(0, limit));
          notify.checkInSuccess(memberName);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { checkIns, isLoading };
}
