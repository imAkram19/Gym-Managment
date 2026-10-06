import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Plus, Search, MessageSquare, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { AddMemberModal } from '../components/members/AddMemberModal';
import { ExportMembersModal } from '../components/members/ExportMembersModal';
import { SlideOver } from '../components/ui/SlideOver';
import { MemberDetailSheet } from '../components/members/MemberDetailSheet';
import { DataTable, type ColumnDef } from '../components/ui/DataTable';
import { FilterChips } from '../components/ui/FilterChips';
import { Badge, memberStatusToBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ExtendMembershipModal } from '../components/members/ExtendMembershipModal';
import { useKeyboardShortcut } from '../hooks/useKeyboardShortcut';
import { getMembers } from '../lib/api/members';
import { supabase } from '../lib/supabase';
import { notify } from '../lib/toast';
import { pluralize } from '../lib/formatters';
import type { Member } from '../types';
import { clsx } from 'clsx';

interface MemberWithSubInfo extends Member {
  remainingDays: number | null;
  subscriptionEndDate: string | null;
  activeSubscriptionId?: string;
  planName?: string;
  price?: number;
}

const mapMember = (data: any): Member => ({
  id: data.id,
  fullName: data.full_name,
  email: data.email,
  phone: data.phone,
  gender: data.gender,
  dateOfBirth: data.date_of_birth,
  address: data.address,
  info: data.info,
  joinDate: data.join_date,
  status: data.status,
  imageUrl: data.image_url,
  deletedAt: data.deleted_at,
});

const MembersList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const searchInputRef = useRef<HTMLInputElement>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(() => searchParams.get('action') === 'add');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Extend modal trigger from table shortcut
  const [extendSubTarget, setExtendSubTarget] = useState<{
    subId: string;
    endDate: string;
  } | null>(null);

  const [members, setMembers] = useState<MemberWithSubInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expiring' | 'expired' | 'inactive' | 'archived'>(() => {
    if (filterParam === 'expiring') return 'expiring';
    if (filterParam === 'expired') return 'expired';
    if (filterParam === 'active') return 'active';
    if (filterParam === 'archived') return 'archived';
    if (filterParam === 'inactive') return 'inactive';
    return 'all';
  });

  // '/' keyboard shortcut to focus search input
  useKeyboardShortcut('/', () => {
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  });

  const fetchMembersData = async () => {
    setLoading(true);
    try {
      let fetchedMembers: Member[] = [];
      if (statusFilter === 'expiring') {
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];

        const { data: expiringSubs } = await supabase
          .from('subscriptions')
          .select('member_id')
          .eq('is_active', true)
          .lte('end_date', sevenDaysStr)
          .gte('end_date', todayStr);

        const memberIds = expiringSubs?.map((s) => s.member_id) || [];

        if (memberIds.length === 0) {
          fetchedMembers = [];
        } else {
          let query = supabase.from('members').select('*').in('id', memberIds);
          if (search) {
            query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
          }
          const { data, error } = await query;
          if (error) throw error;
          fetchedMembers = (data || []).map(mapMember);
        }
      } else {
        fetchedMembers = await getMembers(search, statusFilter);
      }

      // Fetch subscriptions for these members
      if (fetchedMembers.length > 0) {
        const memberIds = fetchedMembers.map((m) => m.id);
        const { data: subs, error: subsError } = await supabase
          .from('subscriptions')
          .select('id, member_id, end_date, plan_name, price, is_active')
          .in('member_id', memberIds)
          .order('end_date', { ascending: false });

        if (subsError) throw subsError;

        const subsMap: Record<
          string,
          { id: string; endDate: string; remainingDays: number; isActive: boolean; planName?: string; price?: number }
        > = {};

        subs?.forEach((sub: any) => {
          const existing = subsMap[sub.member_id];
          const endDate = new Date(sub.end_date);
          const today = new Date();
          endDate.setHours(0, 0, 0, 0);
          today.setHours(0, 0, 0, 0);
          const diffTime = endDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (!existing || (sub.is_active && !existing.isActive)) {
            subsMap[sub.member_id] = {
              id: sub.id,
              endDate: sub.end_date,
              remainingDays: diffDays,
              isActive: sub.is_active,
              planName: sub.plan_name,
              price: sub.price,
            };
          }
        });

        const enriched: MemberWithSubInfo[] = fetchedMembers.map((m) => ({
          ...m,
          remainingDays: subsMap[m.id]?.remainingDays ?? null,
          subscriptionEndDate: subsMap[m.id]?.endDate ?? null,
          activeSubscriptionId: subsMap[m.id]?.id,
          planName: subsMap[m.id]?.planName,
          price: subsMap[m.id]?.price,
        }));

        setMembers(enriched);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch members:', error);
      notify.error('Failed to load members list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(fetchMembersData, 250);
    return () => clearTimeout(debounce);
  }, [search, statusFilter]);

  // Handle table row keyboard shortcut actions ('e' to extend, 'c' to check in)
  const handleRowAction = async (member: MemberWithSubInfo, action: 'extend' | 'checkin') => {
    if (action === 'extend') {
      if (member.activeSubscriptionId && member.subscriptionEndDate) {
        setExtendSubTarget({
          subId: member.activeSubscriptionId,
          endDate: member.subscriptionEndDate,
        });
      } else {
        setSelectedMemberId(member.id);
      }
    } else if (action === 'checkin') {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const { error } = await supabase.from('attendance').insert([
          {
            member_id: member.id,
            date: todayStr,
            check_in_time: timeStr,
            method: 'manual',
          },
        ]);

        if (error) throw error;
        notify.checkInSuccess(member.fullName);
      } catch (err: any) {
        notify.error(err.message || 'Check-in failed');
      }
    }
  };

  // Table Columns Definition
  const columns: ColumnDef<MemberWithSubInfo>[] = useMemo(
    () => [
      {
        key: 'fullName',
        header: 'Member',
        sortable: true,
        accessor: (row) => row.fullName,
        render: (row) => (
          <Link
            to={`/members/${row.id}`}
            className="flex items-center gap-3 min-w-0 group"
            onClick={(e) => e.stopPropagation()}
            title="View member profile"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center overflow-hidden flex-shrink-0 border border-blue-200 shadow-2xs">
              {row.imageUrl ? (
                <img
                  src={row.imageUrl}
                  alt={row.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                row.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block"
                title={row.fullName}
              >
                {row.fullName}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {row.gender || 'Member'}
              </span>
            </div>
          </Link>
        ),
      },
      {
        key: 'phone',
        header: 'WhatsApp',
        align: 'center',
        width: '100px',
        render: (row) => {
          if (!row.phone) {
            return <span className="text-slate-300 font-mono text-xs">—</span>;
          }

          let cleanPhone = row.phone.replace(/\D/g, '');
          if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

          const msg =
            row.status === 'expired'
              ? `🚨 *Hi ${row.fullName},*\n\n*Your Iron Gym membership has expired.*\n\n💪 *Renew today to keep crushing your workouts!*\n\n📞 *Reply or visit front desk to renew.*\n\n🔥 *Iron Gym Team*`
              : `⚡ *Hi ${row.fullName},*\n\n🚨 *Your Iron Gym membership will expire soon.*\n\n🏋️‍♂️ *Renew now to avoid workout interruptions.*\n\n🔥 *Iron Gym Team*`;

          const waUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;

          return (
            <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Send WhatsApp message to ${row.phone}`}
                className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            </div>
          );
        },
      },
      {
        key: 'remainingDays',
        header: 'Plan & Days Left',
        sortable: true,
        align: 'center',
        width: '160px',
        accessor: (row) => row.remainingDays ?? -9999,
        render: (row) => {
          if (row.remainingDays === null) {
            return <span className="text-slate-400 text-xs">No Plan</span>;
          }
          return (
            <div className="flex flex-col items-center gap-1">
              <span
                className={clsx(
                  'px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold inline-flex items-center border whitespace-nowrap shadow-2xs',
                  row.remainingDays < 0
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : row.remainingDays <= 7
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                )}
              >
                {row.remainingDays < 0
                  ? `Expired (${Math.abs(row.remainingDays)}d ago)`
                  : `${row.remainingDays} days left`}
              </span>
              {row.planName && (
                <span className="text-[11px] font-medium text-slate-500 truncate max-w-[150px]" title={row.planName}>
                  {row.planName}{row.price ? ` • ₹${row.price.toLocaleString('en-IN')}` : ''}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'joinDate',
        header: 'Join Date',
        sortable: true,
        align: 'center',
        width: '120px',
        accessor: (row) => row.joinDate,
        render: (row) => (
          <span className="font-mono text-xs text-slate-600">{row.joinDate}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        align: 'center',
        width: '110px',
        accessor: (row) => (row.deletedAt ? 'archived' : row.status),
        render: (row) => (
          <Badge
            variant={
              row.deletedAt
                ? 'inactive'
                : memberStatusToBadge(row.status, row.remainingDays)
            }
          />
        ),
      },
      {
        key: 'actions',
        header: 'Action',
        align: 'right',
        width: '140px',
        className: 'whitespace-nowrap',
        render: (row) => (
          <div className="flex items-center justify-end whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setSelectedMemberId(row.id)}
              className="whitespace-nowrap px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs active:scale-95 shrink-0"
              title="Quick View"
              aria-label={`Quick view for ${row.fullName}`}
            >
              <span className="whitespace-nowrap">Quick View</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const renderMemberMobileCard = (member: MemberWithSubInfo) => {
    let cleanPhone = (member.phone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    const msg =
      member.status === 'expired'
        ? `🚨 *Hi ${member.fullName},*\n\n*Your Iron Gym membership has expired.*\n\n💪 *Renew today to keep crushing your workouts!*\n\n📞 *Reply or visit front desk to renew.*\n\n🔥 *Iron Gym Team*`
        : `⚡ *Hi ${member.fullName},*\n\n🚨 *Your Iron Gym membership will expire soon.*\n\n🏋️‍♂️ *Renew now to avoid workout interruptions.*\n\n🔥 *Iron Gym Team*`;

    const waUrl = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`
      : null;
    const isSelected = selectedMemberId === member.id;

    return (
      <div
        className={clsx(
          'bg-white rounded-2xl p-4 border transition-all duration-200 shadow-2xs',
          isSelected
            ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/20'
            : 'border-slate-200/90 hover:border-slate-300'
        )}
      >
        {/* Top Header: Avatar + Full Name + Status Badge */}
        <div className="flex items-start justify-between gap-3">
          <Link
            to={`/members/${member.id}`}
            className="flex items-center gap-3 min-w-0 group hover:opacity-95 flex-1"
            title="View member profile"
          >
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 overflow-hidden border border-blue-200 shadow-2xs text-sm">
              {member.imageUrl ? (
                <img
                  src={member.imageUrl}
                  alt={member.fullName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                member.fullName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold text-slate-900 leading-snug break-words group-hover:text-blue-600 transition-colors">
                {member.fullName}
              </h3>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                {member.phone || 'No phone'}
              </p>
            </div>
          </Link>

          <div className="shrink-0">
            <Badge
              variant={
                member.deletedAt
                  ? 'inactive'
                  : memberStatusToBadge(member.status, member.remainingDays)
              }
            />
          </div>
        </div>

        {/* Meta / Subscription Details */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
          <div className="bg-slate-50/80 rounded-xl p-2.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Membership
            </span>
            {member.remainingDays === null ? (
              <span className="text-slate-400 font-medium mt-0.5 block">No Active Plan</span>
            ) : (
              <span
                className={clsx(
                  'font-mono font-semibold mt-0.5 block',
                  member.remainingDays < 0
                    ? 'text-red-600'
                    : member.remainingDays <= 7
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                )}
              >
                {member.remainingDays < 0
                  ? `Expired (${Math.abs(member.remainingDays)}d ago)`
                  : `${member.remainingDays} days left`}
              </span>
            )}
          </div>

          <div className="bg-slate-50/80 rounded-xl p-2.5">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
              Member Since
            </span>
            <span className="font-mono text-slate-700 font-medium mt-0.5 block">
              {member.joinDate}
            </span>
          </div>
        </div>

        {/* Action Buttons (Touch targets >= 44px) */}
        <div className="flex items-center gap-2 mt-3 pt-2">
          {/* WhatsApp Button */}
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              className="flex-1 min-h-[44px] px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/90 rounded-xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp</span>
            </a>
          ) : (
            <span
              className="flex-1 min-h-[44px] px-3 bg-slate-50 text-slate-400 border border-slate-200/60 rounded-xl text-xs font-medium inline-flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span>No Phone</span>
            </span>
          )}

          {/* Profile Link Arrow Button */}
          <Link
            to={`/members/${member.id}`}
            title="View member profile"
            aria-label={`View member profile for ${member.fullName}`}
            className="w-12 min-h-[44px] bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 rounded-xl inline-flex items-center justify-center transition-colors active:scale-[0.98]"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Members Directory
          </h1>
          <p className="text-sm text-slate-500">
            Manage profiles, active subscriptions, and biometrics.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all cursor-pointer shadow-sm shadow-emerald-600/20 active:scale-[0.98] text-sm"
            title="Export members to Excel (.csv)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all cursor-pointer shadow-sm shadow-blue-500/20 active:scale-[0.98] text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ── */}
      <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs">
        <div className="bg-white rounded-[15px] p-4 flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by member name or phone... (Press '/' to focus)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50/50 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white border border-slate-200 absolute right-3 top-2.5">
              /
            </kbd>
          </div>

          {/* Filter Chips & Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
            <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
              <FilterChips
                size="sm"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as any)}
                options={[
                  { value: 'all', label: 'All Members', count: members.length },
                  { value: 'active', label: 'Active' },
                  { value: 'expiring', label: 'Expiring Soon' },
                  { value: 'expired', label: 'Expired' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
            <span className="hidden sm:inline-block text-xs font-mono text-slate-400 whitespace-nowrap pl-2">
              {pluralize(members.length, 'member')}
            </span>
          </div>
        </div>
      </div>

      {/* ── DATA TABLE (TanStack Virtualized + Keyboard Navigation) ── */}
      <DataTable
        data={members}
        columns={columns}
        rowKey={(row) => row.id}
        isLoading={loading}
        selectedId={selectedMemberId || undefined}
        onRowClick={(row) => setSelectedMemberId(row.id)}
        onRowAction={handleRowAction}
        renderMobileCard={renderMemberMobileCard}
        emptyState={
          <EmptyState
            variant={statusFilter === 'expiring' ? 'expiring' : 'members'}
            title={
              search
                ? `No members matching "${search}"`
                : statusFilter === 'expiring'
                ? 'No memberships expiring soon'
                : 'No members in this category'
            }
            description="Try switching the filter chips or search keywords."
          />
        }
      />

      {/* ── KEYBOARD SHORTCUTS LEGEND ── */}
      <div className="hidden lg:flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] mr-1">
              ↑
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] mr-1">
              ↓
            </kbd>
            Navigate rows
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] mr-1">
              ↵
            </kbd>
            Open detail drawer
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] mr-1">
              E
            </kbd>
            Extend plan
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] mr-1">
              C
            </kbd>
            Check in member
          </span>
        </div>
        <span>Iron Gym V2 Members Hub</span>
      </div>

      {/* ── SLIDEOVER MEMBER DETAIL DRAWER ── */}
      <SlideOver
        isOpen={!!selectedMemberId}
        onClose={() => setSelectedMemberId(null)}
        title="Member Details"
        subtitle="Quick overview & subscription management"
      >
        {selectedMemberId && (
          <MemberDetailSheet
            memberId={selectedMemberId}
            onClose={() => setSelectedMemberId(null)}
            onRefreshList={fetchMembersData}
          />
        )}
      </SlideOver>

      {/* ── ADD MEMBER MULTI-STEP MODAL ── */}
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false);
          fetchMembersData();
        }}
      />

      {/* ── EXPORT MEMBERS TO EXCEL MODAL ── */}
      <ExportMembersModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* ── EXTEND MEMBERSHIP MODAL (triggered via 'E' shortcut) ── */}
      {extendSubTarget && (
        <ExtendMembershipModal
          isOpen={true}
          subscriptionId={extendSubTarget.subId}
          currentEndDate={extendSubTarget.endDate}
          onClose={() => setExtendSubTarget(null)}
          onSuccess={() => {
            setExtendSubTarget(null);
            fetchMembersData();
          }}
        />
      )}
    </div>
  );
};

export default MembersList;
