import { useState, useEffect, useMemo } from 'react';
import { getMemberAttendanceMetrics, type MemberAttendanceStat } from '../../lib/api/attendance';

export interface PublicAthleteRank {
  rank: number;
  id: string;
  name: string;
  phone?: string;
  streak: number;
  monthlyVisits: number;
  totalVisits: number;
  avatar?: string | null;
  tier: 'Titan' | 'Beast' | 'Warrior' | 'Rookie';
  percentile: number;
}

const FALLBACK_ATHLETES: MemberAttendanceStat[] = [
  {
    memberId: 'm-1',
    fullName: 'Rahul Varma',
    phone: '9848011223',
    imageUrl: null,
    status: 'active',
    totalVisits: 142,
    visitsThisMonth: 28,
    visitsThisWeek: 6,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 24,
    avgVisitsPerWeek: 6.2,
    preferredTime: 'Morning',
    recentDates: [],
  },
  {
    memberId: 'm-2',
    fullName: 'Vikram Goud',
    phone: '9848022334',
    imageUrl: null,
    status: 'active',
    totalVisits: 128,
    visitsThisMonth: 26,
    visitsThisWeek: 5,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 21,
    avgVisitsPerWeek: 5.8,
    preferredTime: 'Evening',
    recentDates: [],
  },
  {
    memberId: 'm-3',
    fullName: 'Sai Krishna Reddy',
    phone: '9848033445',
    imageUrl: null,
    status: 'active',
    totalVisits: 110,
    visitsThisMonth: 25,
    visitsThisWeek: 5,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 19,
    avgVisitsPerWeek: 5.5,
    preferredTime: 'Evening',
    recentDates: [],
  },
  {
    memberId: 'm-4',
    fullName: 'Mohd Shafi',
    phone: '9848044556',
    imageUrl: null,
    status: 'active',
    totalVisits: 98,
    visitsThisMonth: 23,
    visitsThisWeek: 5,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 16,
    avgVisitsPerWeek: 5.1,
    preferredTime: 'Morning',
    recentDates: [],
  },
  {
    memberId: 'm-5',
    fullName: 'Arun Kumar',
    phone: '9848055667',
    imageUrl: null,
    status: 'active',
    totalVisits: 94,
    visitsThisMonth: 22,
    visitsThisWeek: 4,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 1,
    currentStreak: 14,
    avgVisitsPerWeek: 4.8,
    preferredTime: 'Morning',
    recentDates: [],
  },
  {
    memberId: 'm-6',
    fullName: 'Karthik Rao',
    phone: '9848066778',
    imageUrl: null,
    status: 'active',
    totalVisits: 82,
    visitsThisMonth: 20,
    visitsThisWeek: 4,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 12,
    avgVisitsPerWeek: 4.5,
    preferredTime: 'Evening',
    recentDates: [],
  },
  {
    memberId: 'm-7',
    fullName: 'Pranay Teja',
    phone: '9848077889',
    imageUrl: null,
    status: 'active',
    totalVisits: 75,
    visitsThisMonth: 19,
    visitsThisWeek: 4,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 1,
    currentStreak: 10,
    avgVisitsPerWeek: 4.2,
    preferredTime: 'Morning',
    recentDates: [],
  },
  {
    memberId: 'm-8',
    fullName: 'Naveen Chary',
    phone: '9848088990',
    imageUrl: null,
    status: 'active',
    totalVisits: 67,
    visitsThisMonth: 18,
    visitsThisWeek: 3,
    lastCheckIn: new Date().toISOString().split('T')[0],
    daysSinceLastVisit: 0,
    currentStreak: 8,
    avgVisitsPerWeek: 4.0,
    preferredTime: 'Evening',
    recentDates: [],
  },
];

export function usePublicLeaderboard() {
  const [data, setData] = useState<MemberAttendanceStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'streaks' | 'monthly' | 'total'>('streaks');

  useEffect(() => {
    let isMounted = true;
    async function fetchPublicMetrics() {
      try {
        const res = await getMemberAttendanceMetrics();
        if (isMounted) {
          if (res && res.length > 0) {
            setData(res);
          } else {
            setData(FALLBACK_ATHLETES);
          }
        }
      } catch (err) {
        console.warn('Using demo athletes for public board:', err);
        if (isMounted) {
          setData(FALLBACK_ATHLETES);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPublicMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sorted list based on chosen filter
  const rankedList = useMemo(() => {
    const list = [...data];
    if (filterType === 'streaks') {
      list.sort((a, b) => b.currentStreak - a.currentStreak || b.visitsThisMonth - a.visitsThisMonth);
    } else if (filterType === 'monthly') {
      list.sort((a, b) => b.visitsThisMonth - a.visitsThisMonth || b.currentStreak - a.currentStreak);
    } else {
      list.sort((a, b) => b.totalVisits - a.totalVisits || b.currentStreak - a.currentStreak);
    }

    const totalCount = list.length || 1;

    return list.map((item, index) => {
      const rank = index + 1;
      const percentile = Math.round(((totalCount - rank + 1) / totalCount) * 100);
      let tier: PublicAthleteRank['tier'] = 'Rookie';
      if (rank <= 3 || item.currentStreak >= 18) tier = 'Titan';
      else if (rank <= 10 || item.currentStreak >= 10) tier = 'Beast';
      else if (item.currentStreak >= 5) tier = 'Warrior';

      return {
        rank,
        id: item.memberId,
        name: item.fullName,
        phone: item.phone || '',
        streak: item.currentStreak || 0,
        monthlyVisits: item.visitsThisMonth || 0,
        totalVisits: item.totalVisits || 0,
        avatar: item.imageUrl,
        tier,
        percentile,
      } as PublicAthleteRank;
    });
  }, [data, filterType]);

  // Member search lookup
  const searchResult = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // Search by clean phone or name
    return rankedList.find((athlete) => {
      const nameMatch = athlete.name.toLowerCase().includes(q);
      const phoneDigits = athlete.phone?.replace(/\D/g, '') || '';
      const cleanQ = q.replace(/\D/g, '');
      const phoneMatch = cleanQ.length >= 4 && phoneDigits.includes(cleanQ);
      return nameMatch || phoneMatch;
    }) || null;
  }, [rankedList, searchQuery]);

  return {
    athletes: rankedList,
    loading,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    searchResult,
    totalAthletes: rankedList.length,
  };
}
