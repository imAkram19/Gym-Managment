import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Fingerprint,
  ExternalLink,
  Edit2,
  PlusCircle,
  CalendarPlus,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
} from 'lucide-react';
import { getMemberById, getMemberHistory } from '../../lib/api/members';
import {
  getEnrollmentByMemberId,
  enrollMemberBiometrics,
  deleteBiometricEnrollment,
} from '../../lib/api/biometrics';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/toast';
import { Badge, memberStatusToBadge } from '../ui/Badge';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { FilterChips } from '../ui/FilterChips';
import { EmptyState } from '../ui/EmptyState';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { EditMemberModal } from './EditMemberModal';
import { ExtendMembershipModal } from './ExtendMembershipModal';
import { DeleteMemberModal } from './DeleteMemberModal';
import type { Member, Subscription, Payment, Attendance, BiometricEnrollment } from '../../types';
import { clsx } from 'clsx';

interface MemberDetailSheetProps {
  memberId: string;
  onClose: () => void;
  onRefreshList?: () => void;
}

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({
  memberId,
  onClose,
  onRefreshList,
}) => {
  const [member, setMember] = useState<Member | null>(null);
  const [history, setHistory] = useState<{
    subscriptions: Subscription[];
    payments: Payment[];
    attendance: Attendance[];
  }>({ subscriptions: [], payments: [], attendance: [] });
  const [enrollment, setEnrollment] = useState<BiometricEnrollment | null>(null);
  const [loading, setLoading] = useState(true);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'subscriptions' | 'payments' | 'attendance'>(
    'profile'
  );

  // Modals
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmForceExpire, setConfirmForceExpire] = useState(false);
  const [confirmActivate, setConfirmActivate] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Biometrics inline enrollment state
  const [deviceUserIdInput, setDeviceUserIdInput] = useState('');
  const [biometricLoading, setBiometricLoading] = useState(false);

  const loadData = async () => {
    if (!memberId) return;
    setLoading(true);
    try {
      const [memberData, historyData, enrollData] = await Promise.all([
        getMemberById(memberId),
        getMemberHistory(memberId),
        getEnrollmentByMemberId(memberId),
      ]);
      setMember(memberData);
      setHistory(historyData);
      setEnrollment(enrollData);
    } catch (err: any) {
      console.error('Failed to load member detail in SlideOver:', err);
      notify.error(err.message || 'Failed to load member profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [memberId]);

  // Force Expire action
  const handleForceExpire = async () => {
    setActionLoading(true);
    try {
      const { error: memberError } = await supabase
        .from('members')
        .update({ status: 'expired' })
        .eq('id', memberId);
      if (memberError) throw memberError;

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      await supabase
        .from('subscriptions')
        .update({ is_active: false, end_date: yesterdayStr })
        .eq('member_id', memberId)
        .eq('is_active', true);

      await supabase.rpc('sync_member_statuses');

      notify.memberUpdated(member?.fullName || 'Member');
      setConfirmForceExpire(false);
      await loadData();
      onRefreshList?.();
    } catch (err: any) {
      notify.error(err.message || 'Failed to force expire membership');
    } finally {
      setActionLoading(false);
    }
  };

  // Activate action
  const handleActivate = async () => {
    setActionLoading(true);
    try {
      const { error: memberError } = await supabase
        .from('members')
        .update({ status: 'active' })
        .eq('id', memberId);
      if (memberError) throw memberError;

      const latestSub = history.subscriptions[0];
      const today = new Date();
      if (latestSub) {
        let newEndDate = latestSub.endDate;
        if (new Date(latestSub.endDate) < today) {
          const futureDate = new Date();
          futureDate.setMonth(futureDate.getMonth() + 1);
          newEndDate = futureDate.toISOString().split('T')[0];
        }
        await supabase
          .from('subscriptions')
          .update({
            is_active: true,
            end_date: newEndDate,
            start_date: today.toISOString().split('T')[0],
          })
          .eq('id', latestSub.id);
      } else {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 1);
        await supabase.from('subscriptions').insert([
          {
            member_id: memberId,
            plan_name: 'Monthly',
            price: 1000,
            start_date: today.toISOString().split('T')[0],
            end_date: futureDate.toISOString().split('T')[0],
            is_active: true,
          },
        ]);
      }

      await supabase.rpc('sync_member_statuses');

      notify.subRenewed(member?.fullName || 'Member', 'Active Plan');
      setConfirmActivate(false);
      await loadData();
      onRefreshList?.();
    } catch (err: any) {
      notify.error(err.message || 'Failed to activate membership');
    } finally {
      setActionLoading(false);
    }
  };

  // Biometric Enroll
  const handleEnrollBiometric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceUserIdInput) return;
    setBiometricLoading(true);
    try {
      await enrollMemberBiometrics(memberId, Number(deviceUserIdInput));
      setDeviceUserIdInput('');
      notify.deviceSyncing();
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Failed to enroll biometrics');
    } finally {
      setBiometricLoading(false);
    }
  };

  // Biometric Remove
  const handleRemoveBiometric = async () => {
    if (!enrollment) return;
    setBiometricLoading(true);
    try {
      await deleteBiometricEnrollment(enrollment.id);
      notify.memberUpdated(member?.fullName || 'Member');
      await loadData();
    } catch (err: any) {
      notify.error(err.message || 'Failed to remove biometric enrollment');
    } finally {
      setBiometricLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-slate-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 rounded w-1/2" />
            <div className="h-4 bg-slate-200 rounded w-1/3" />
          </div>
        </div>
        <div className="h-10 bg-slate-200 rounded-xl" />
        <div className="h-32 bg-slate-200 rounded-xl" />
      </div>
    );
  }

  if (!member) {
    return (
      <EmptyState
        variant="error"
        title="Member Not Found"
        description="The requested member could not be loaded."
      />
    );
  }

  const latestSub = history.subscriptions[0];
  const daysLeft = latestSub
    ? Math.ceil(
        (new Date(latestSub.endDate).setHours(0, 0, 0, 0) -
          new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  return (
    <div className="space-y-6">
      {/* ── MEMBER HERO SUMMARY ── */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 font-bold text-xl flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm border border-blue-200">
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
          <div className="min-w-0">
            <h3 className="text-base font-bold text-slate-900 tracking-tight truncate">
              {member.fullName}
            </h3>
            <p className="text-xs text-slate-500 capitalize">
              {member.gender || 'Not specified'} · Joined {member.joinDate}
            </p>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant={memberStatusToBadge(member.status, daysLeft)} />
              {daysLeft !== null && (
                <span
                  className={clsx(
                    'text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border',
                    daysLeft < 0
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : daysLeft <= 7
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  )}
                >
                  {daysLeft < 0
                    ? `Expired ${Math.abs(daysLeft)}d ago`
                    : `${daysLeft}d remaining`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Deep-link to full member page */}
        <Link
          to={`/members/${member.id}`}
          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors flex-shrink-0 border border-transparent hover:border-slate-200 shadow-2xs"
          title="Open full page"
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      {/* ── QUICK ACTION BUTTONS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setIsRenewModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer shadow-sm shadow-blue-500/20"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Renew</span>
        </button>

        {latestSub && (
          <button
            type="button"
            onClick={() => setIsExtendModalOpen(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-blue-600" />
            <span>Extend</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5 text-slate-500" />
          <span>Edit</span>
        </button>

        {member.status === 'active' ? (
          <button
            type="button"
            onClick={() => setConfirmForceExpire(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Expire</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmActivate(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Activate</span>
          </button>
        )}
      </div>

      {/* ── TABS (Profile, Subscriptions, Payments, Attendance) ── */}
      <FilterChips
        size="sm"
        value={activeTab}
        onChange={(val) => setActiveTab(val as any)}
        options={[
          { value: 'profile', label: 'Profile' },
          {
            value: 'subscriptions',
            label: 'Plans',
            count: history.subscriptions.length,
          },
          {
            value: 'payments',
            label: 'Payments',
            count: history.payments.length,
          },
          {
            value: 'attendance',
            label: 'Attendance',
            count: history.attendance.length,
          },
        ]}
      />

      {/* ── TAB CONTENT ── */}
      <div className="space-y-4">
        {/* 1. PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Contact & Personal details card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Contact & Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">Phone</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-medium text-slate-800">
                      {member.phone || 'No phone'}
                    </span>
                    {member.phone && (
                      <a
                        href={`https://web.whatsapp.com/send?phone=91${member.phone.replace(
                          /\D/g,
                          ''
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 p-1 bg-emerald-50 border border-emerald-200 rounded"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-xs text-slate-400 block">Date of Birth</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.dateOfBirth || '—'}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-xs text-slate-400 block">Address</span>
                  <span className="font-medium text-slate-800 mt-0.5 block">
                    {member.address || '—'}
                  </span>
                </div>

                {member.info && (
                  <div className="sm:col-span-2 p-3 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                    <span className="font-bold block mb-0.5">Medical / Fitness Notes:</span>
                    <p className="line-clamp-4">{member.info}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Biometrics Card */}
            <div className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
                  Biometric Terminal
                </h4>
                {enrollment && <Badge variant="online" />}
              </div>

              {enrollment ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 block">Device User ID</span>
                    <span className="font-mono font-bold text-slate-900">
                      #{enrollment.deviceUserId}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={biometricLoading}
                    onClick={handleRemoveBiometric}
                    className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleEnrollBiometric}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="number"
                    placeholder="Enter Device User ID"
                    value={deviceUserIdInput}
                    onChange={(e) => setDeviceUserIdInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    type="submit"
                    disabled={!deviceUserIdInput || biometricLoading}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                  >
                    Enroll
                  </button>
                </form>
              )}
            </div>

            {/* Danger / Archive Area */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive / Delete Member</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. SUBSCRIPTIONS TAB */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-3">
            {history.subscriptions.length === 0 ? (
              <EmptyState
                variant="subscriptions"
                title="No Subscriptions Recorded"
                description="This member doesn't have any subscription plans yet."
              />
            ) : (
              history.subscriptions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900">
                        {sub.planName}
                      </span>
                      {sub.isActive ? (
                        <Badge variant="active" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          Past
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 font-mono">
                      {sub.startDate} → {sub.endDate}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm text-slate-900">
                    ₹{sub.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="space-y-3">
            {history.payments.length === 0 ? (
              <EmptyState
                variant="payments"
                title="No Payments Recorded"
                description="No payment transactions found for this member."
              />
            ) : (
              history.payments.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {p.method}
                      </span>
                      <span className="text-xs text-slate-500">{p.date}</span>
                    </div>
                    {p.adminNote && (
                      <p className="text-xs text-slate-500 mt-1 italic">
                        {p.adminNote}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-bold text-sm text-emerald-700">
                    ₹{p.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* 4. ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <div className="space-y-3">
            {history.attendance.length === 0 ? (
              <EmptyState
                variant="attendance"
                title="No Check-Ins Yet"
                description="This member hasn't logged any gym check-ins."
              />
            ) : (
              history.attendance.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-medium text-slate-900">{att.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500">
                      {att.checkInTime}
                    </span>
                    <span className="capitalize px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      {att.method}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── MODALS ── */}
      {/* 1. Add Subscription (Renew) */}
      <AddSubscriptionModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        memberId={memberId}
        onSuccess={() => {
          setIsRenewModalOpen(false);
          loadData();
          onRefreshList?.();
        }}
      />

      {/* 2. Extend Subscription */}
      {latestSub && (
        <ExtendMembershipModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          subscriptionId={latestSub.id}
          currentEndDate={latestSub.endDate}
          onSuccess={() => {
            setIsExtendModalOpen(false);
            loadData();
            onRefreshList?.();
          }}
        />
      )}

      {/* 3. Edit Member */}
      <EditMemberModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        member={member}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadData();
          onRefreshList?.();
        }}
      />

      {/* 4. Delete / Archive Member */}
      <DeleteMemberModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        member={member}
        enrollment={enrollment}
        onSuccess={() => {
          setIsDeleteModalOpen(false);
          onClose();
          onRefreshList?.();
        }}
      />

      {/* 5. Force Expire Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmForceExpire}
        variant="danger"
        title="Force Expire Membership?"
        description="Are you sure you want to FORCE EXPIRE this membership immediately? This will disable gym floor access and revoke active status."
        confirmLabel="Expire Now"
        isLoading={actionLoading}
        onClose={() => setConfirmForceExpire(false)}
        onConfirm={handleForceExpire}
      />

      {/* 6. Activate Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmActivate}
        variant="primary"
        title="Activate Membership?"
        description="Are you sure you want to activate this membership? If expired, this will renew gym access."
        confirmLabel="Activate"
        isLoading={actionLoading}
        onClose={() => setConfirmActivate(false)}
        onConfirm={handleActivate}
      />
    </div>
  );
};
