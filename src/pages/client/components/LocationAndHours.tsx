import React from 'react';
import { MapPin, Clock, Phone, Navigation, MessageCircle, ExternalLink } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const LocationAndHours: React.FC = () => {
  const whatsappUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent('Hi Iron Gym, I would like directions to the gym!')}`;

  return (
    <section id="location" className="py-12 sm:py-20 bg-white relative overflow-hidden border-t border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] sm:text-xs font-semibold mb-2 sm:mb-3">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            <span>VISIT THE GYM</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Location & <span className="text-blue-600">Timings</span>
          </h2>
          <p className="mt-1 text-slate-600 text-xs sm:text-sm">
            Pochamma Maidan, Sherpura, Warangal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          {/* Address & Timings Details Card */}
          <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
            {/* Address Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 flex-shrink-0">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Gym Address</h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {GYM_DETAILS.address}
                  </p>
                  <div className="mt-3">
                    <a
                      href={GYM_DETAILS.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Google Maps Directions</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Training Shifts</h3>
                  
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs sm:text-sm">
                      <span className="text-slate-600 font-medium">Mon – Sat (Morning)</span>
                      <span className="text-blue-700 font-bold font-sans">5:30 AM – 10:30 AM</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-200 text-xs sm:text-sm">
                      <span className="text-slate-600 font-medium">Mon – Sat (Evening)</span>
                      <span className="text-blue-700 font-bold font-sans">4:30 PM – 10:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-xs sm:text-sm pt-0.5">
                      <span className="text-slate-500 font-medium">Sunday</span>
                      <span className="text-slate-400 font-semibold font-sans">Closed</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Instant Action Card */}
          <div className="lg:col-span-6 p-4 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase">Direct Contact</h3>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Walk-ins welcome during training hours. Message or call reception for queries:
              </p>

              <div className="mt-4 space-y-2.5">
                <a
                  href={`tel:${GYM_DETAILS.phone}`}
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-all text-slate-900 shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium">Reception Desk Call</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">{GYM_DETAILS.phoneDisplay}</div>
                  </div>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 transition-all text-slate-900 shadow-sm"
                >
                  <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700 flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] text-slate-500 font-medium">WhatsApp Support</div>
                    <div className="text-xs sm:text-sm font-bold text-emerald-700 truncate">Chat With Iron Gym</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="mt-5 pt-3.5 border-t border-slate-200">
              <a
                href={GYM_DETAILS.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs uppercase tracking-wider transition-all shadow-sm"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>Navigate to Max, Pochamma Maidan</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
