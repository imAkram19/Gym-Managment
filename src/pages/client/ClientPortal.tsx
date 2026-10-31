import React, { useState } from 'react';
import { ClientNavbar } from './components/ClientNavbar';
import { HeroSection } from './components/HeroSection';
import { CoachSpotlight } from './components/CoachSpotlight';
import { AchievementsSection } from './components/AchievementsSection';
import { MemberRankFinder } from './components/MemberRankFinder';
import { GymFeatures } from './components/GymFeatures';
import { MembershipPlans } from './components/MembershipPlans';
import { LocationAndHours } from './components/LocationAndHours';
import { ClientFooter } from './components/ClientFooter';
import { MessageCircle, X, Lock, ArrowRight } from 'lucide-react';
import { GYM_DETAILS } from './clientData';
import { useNavigate } from 'react-router-dom';

export const ClientPortal: React.FC = () => {
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedUsername = import.meta.env.VITE_APP_USERNAME || '123';
    const expectedPassword = import.meta.env.VITE_APP_PASSWORD || '123';

    if (username === expectedUsername && password === expectedPassword) {
      sessionStorage.setItem('irongym_logged_in', 'true');
      setShowStaffModal(false);
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
  };

  const floatingWhatsAppUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent(GYM_DETAILS.whatsappMessage)}`;

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Main Navbar */}
      <ClientNavbar onOpenStaffModal={() => setShowStaffModal(true)} />

      {/* Main Sections */}
      <main>
        <HeroSection />
        <CoachSpotlight />
        <AchievementsSection />
        <MemberRankFinder />
        <GymFeatures />
        <MembershipPlans />
        <LocationAndHours />
      </main>

      {/* Footer */}
      <ClientFooter />

      {/* Floating WhatsApp Action Button (Mobile Safe Area Inset) */}
      <aside aria-label="Quick Actions">
        <a
          href={floatingWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Direct WhatsApp Desk"
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 sm:right-6 z-40 w-12 h-12 rounded-full bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 group touch-manipulation"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="sr-only">Chat on WhatsApp</span>
          <span className="hidden sm:inline-block absolute right-14 px-2.5 py-1 rounded-md bg-slate-900 text-white text-xs font-normal whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-sm">
            WhatsApp Desk
          </span>
        </a>
      </aside>

      {/* Quick Staff Login Modal (16px font inputs to prevent iOS zoom) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-sm rounded-xl bg-white border border-slate-200 p-5 sm:p-6 shadow-xl">
            <button
              onClick={() => {
                setShowStaffModal(false);
                setError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded cursor-pointer active:scale-90"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center mx-auto mb-2.5">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-base font-medium text-slate-900">Reception & Staff Desk</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to access the gym administration dashboard
              </p>
            </div>

            {error && (
              <div className="p-2.5 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Staff username"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:border-slate-900 focus:bg-white outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Staff password"
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-base sm:text-xs focus:border-slate-900 focus:bg-white outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-transform active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Log in to Desk</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
