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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Main Navbar & Announcement Banner (Sticky & Integrated) */}
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

      {/* Floating WhatsApp Action Button (Bottom Right) */}
      <aside aria-label="Quick Actions">
        <a
          href={floatingWhatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Instant WhatsApp Support"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 hover:scale-105 active:scale-95 transition-all group"
        >
          <MessageCircle className="w-7 h-7 fill-current" />
          <span className="sr-only">Chat on WhatsApp</span>
          <span className="absolute right-16 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg pointer-events-none">
            Chat with Iron Gym 💬
          </span>
        </a>
      </aside>

      {/* Quick Staff Login Modal (Light Mode) */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-2xl bg-white border border-slate-200 p-7 shadow-2xl">
            <button
              onClick={() => {
                setShowStaffModal(false);
                setError('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Reception & Staff Desk</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter your credentials to manage check-ins and member records
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs text-center font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleStaffLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Staff username"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-blue-600 focus:bg-white outline-none transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Staff password"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:border-blue-600 focus:bg-white outline-none transition-all font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/20"
              >
                <span>Unlock Reception</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
