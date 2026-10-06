import React, { useState } from 'react';
import { Dumbbell, Lock, Menu, X, MessageCircle, Flame } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GYM_DETAILS } from '../clientData';

interface ClientNavbarProps {
  onOpenStaffModal?: () => void;
}

export const ClientNavbar: React.FC<ClientNavbarProps> = ({ onOpenStaffModal }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'The Legacy', href: '#legacy' },
    { label: 'Coach Waheed', href: '#coach' },
    { label: 'Championships', href: '#achievements' },
    { label: 'Leaderboard', href: '#leaderboard' },
    { label: 'Passes', href: '#plans' },
    { label: 'Location', href: '#location' },
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm font-sans transition-all">
      {/* ── Top Announcement Banner (Visible on Desktop, hidden on Mobile) ── */}
      <div className="hidden sm:flex bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white py-2 px-4 text-center text-xs font-semibold tracking-wide items-center justify-center gap-2 border-b border-blue-800">
        <Flame className="w-3.5 h-3.5 fill-amber-300 text-amber-300 flex-shrink-0" />
        <span>
          1-DAY TRIAL FREE ON INQUIRY &bull; HOME OF CHAMPIONS
        </span>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 underline font-bold hover:text-amber-200 transition-colors"
        >
          Claim on WhatsApp &rarr;
        </a>
      </div>

      {/* ── Main Navigation Bar ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <a href="#hero" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
              <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-black text-lg sm:text-xl tracking-tight text-slate-900 uppercase font-sans">
              IRON GYM
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors tracking-normal"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right CTAs */}
          <div className="hidden sm:flex items-center gap-3">
            {/* WhatsApp Trial CTA */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Book 1-Day Trial</span>
            </a>

            {/* Staff / Receptionist Portal discreet link */}
            {onOpenStaffModal ? (
              <button
                type="button"
                onClick={onOpenStaffModal}
                title="Reception & Staff Portal"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Staff</span>
              </button>
            ) : (
              <Link
                to="/admin"
                title="Reception & Staff Portal"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden md:inline">Staff</span>
              </Link>
            )}
          </div>

          {/* Mobile Menu Hamburger (Visually Clear & High-Contrast Navigation) */}
          <div className="flex sm:hidden items-center gap-2">
            <Link
              to="/admin"
              title="Staff Portal"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 active:scale-95 transition-all flex items-center justify-center"
            >
              <Lock className="w-4 h-4 text-blue-600" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer ${
                mobileMenuOpen
                  ? 'bg-slate-900 text-white border border-slate-900'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 ring-2 ring-blue-100'
              }`}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? (
                <>
                  <X className="w-4 h-4 stroke-[2.5]" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4 stroke-[2.5]" />
                  <span>Menu</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t border-slate-100 px-4 pt-3 pb-6 space-y-3 shadow-lg">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 border-b border-slate-100"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-sm"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Claim Free 1-Day Trial (WhatsApp)</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
