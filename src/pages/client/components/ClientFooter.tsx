import React from 'react';
import { Dumbbell, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClientFooter: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200/80 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] text-slate-500 text-xs font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
              <Dumbbell className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-900 tracking-tight text-xs sm:text-sm">
                IRON GYM
              </span>
              <span className="text-slate-300">/</span>
              <span className="text-[10px] sm:text-[11px] text-slate-500">
                Warangal, Telangana
              </span>
            </div>
          </div>

          {/* Copyright & Staff Desk Link */}
          <div className="flex items-center gap-3 text-[11px] sm:text-xs">
            <span className="text-slate-400">© {new Date().getFullYear()} Iron Gym.</span>
            <Link
              to="/admin"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 active:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
              title="Reception & Staff Desk Login"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Staff Portal</span>
            </Link>
          </div>

        </div>
      </div>
    </footer>
  );
};
