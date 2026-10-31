import React, { useState } from 'react';
import { Dumbbell, Lock, Menu, X, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GYM_DETAILS } from '../clientData';

interface ClientNavbarProps {
  onOpenStaffModal?: () => void;
}

export const ClientNavbar: React.FC<ClientNavbarProps> = ({ onOpenStaffModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Coach', href: '#coach' },
    { label: 'Accolades', href: '#achievements' },
    { label: 'Leaderboard', href: '#leaderboard' },
    { label: 'Equipment', href: '#legacy' },
    { label: 'Passes', href: '#plans' },
    { label: 'Hours', href: '#location' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const whatsappUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappMessage)}`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200/90 font-sans transition-all pt-[env(safe-area-inset-top,0px)]">
      {/* ── Top Announcement Banner (Desktop only) ── */}
      <div className="hidden sm:flex bg-slate-900 text-slate-300 py-1.5 px-4 text-xs font-normal items-center justify-center gap-2 border-b border-slate-800">
        <span>1-Day trial pass available on inquiry.</span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-slate-200 underline font-medium inline-flex items-center gap-1 transition-colors"
        >
          <span>Message on WhatsApp</span>
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* ── Main Navigation Bar ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex items-center justify-between">
          
          {/* Brand Logo: Clean matte dark mark, calm typography */}
          <a href="#hero" className="flex items-center gap-2 active:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white flex-shrink-0">
              <Dumbbell className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm sm:text-base tracking-tight text-slate-900 leading-tight">
                IRON GYM
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wider -mt-0.5">
                WARANGAL
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors inline-flex items-center justify-center"
            >
              Book 1-Day Trial
            </a>

            {onOpenStaffModal ? (
              <button
                type="button"
                onClick={onOpenStaffModal}
                title="Staff Portal"
                className="h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Staff</span>
              </button>
            ) : (
              <Link
                to="/admin"
                title="Staff Portal"
                className="h-9 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Staff</span>
              </Link>
            )}
          </div>

          {/* Mobile Phone Navigation Toggle (Strict 40px+ Touch Target) */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={onOpenStaffModal}
              title="Staff Portal"
              className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Lock className="w-4 h-4 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer/Menu (Touch friendly 44px link heights) */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100 px-4 pt-2 pb-6 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="flex items-center h-11 px-2 text-sm font-medium text-slate-800 active:bg-slate-50 rounded-lg transition-colors border-b border-slate-100/60"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white text-xs font-medium active:scale-[0.98] transition-transform shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Book 1-Day Trial on WhatsApp</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
