import React from 'react';
import { Dumbbell, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientFooter: React.FC = () => {
  return (
    <footer className="bg-slate-50 border-t border-slate-200 py-6 text-slate-500 text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
              <Dumbbell className="w-3.5 h-3.5" />
            </div>
            <span className="font-black text-slate-900 uppercase font-sans tracking-tight">
              IRON GYM
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              &bull; Warangal &bull; Founded by Waheed Khan
            </span>
          </div>

          {/* Copyright & Easy to Click Staff Button */}
          <div className="flex flex-col sm:flex-row items-center gap-3 text-[11px]">
            <span>© {new Date().getFullYear()} Iron Gym. All rights reserved.</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-95 border border-slate-800 hover:border-blue-500"
              title="Reception & Staff Desk Login"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>Staff Login &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
