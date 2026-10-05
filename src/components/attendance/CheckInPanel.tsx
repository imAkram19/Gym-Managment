import React, { useState } from 'react';
import { UserCheck, Search, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { notify } from '../../lib/toast';
import type { Member } from '../../types';
import { clsx } from 'clsx';

interface CheckInPanelProps {
  members: Member[];
  onCheckInSuccess?: () => void;
}

export const CheckInPanel: React.FC<CheckInPanelProps> = ({
  members,
  onCheckInSuccess,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [method, setMethod] = useState<'manual' | 'qr' | 'fingerprint'>('manual');
  const [loading, setLoading] = useState(false);

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(searchMember.toLowerCase()) ||
    (m.phone && m.phone.includes(searchMember))
  );

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      notify.error('Please select a member to check in.');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const { error } = await supabase.from('attendance').insert([
        {
          member_id: selectedMemberId,
          date: todayStr,
          check_in_time: timeStr,
          method: method,
        },
      ]);

      if (error) throw error;

      const member = members.find((m) => m.id === selectedMemberId);
      notify.checkInSuccess(member?.fullName || 'Member');
      setSelectedMemberId('');
      setSearchMember('');
      onCheckInSuccess?.();
    } catch (err: any) {
      console.error('Check-in error:', err);
      notify.error(err.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-px rounded-2xl bg-slate-200/80 shadow-xs overflow-hidden">
      <div className="bg-white rounded-[15px] p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Reception Manual Check-In
            </h3>
            <p className="text-xs text-slate-500">
              Record a member entry directly without fingerprint hardware
            </p>
          </div>
        </div>

        <form onSubmit={handleCheckIn} className="space-y-4">
          {/* Member Search & Select */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Member <span className="text-red-500">*</span>
            </label>
            <div className="relative mb-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Type member name or phone to filter..."
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choose member from list ({filteredMembers.length} available) --</option>
              {filteredMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.fullName} {m.phone ? `(${m.phone})` : ''} — {m.status}
                </option>
              ))}
            </select>
          </div>

          {/* Check-In Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Entry Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['manual', 'qr', 'fingerprint'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={clsx(
                    'py-2 px-3 text-xs font-bold capitalize rounded-lg border transition-all cursor-pointer text-center',
                    method === m
                      ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!selectedMemberId || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm shadow-emerald-500/20 active:scale-[0.98]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Record Check-In</span>
          </button>
        </form>
      </div>
    </div>
  );
};
