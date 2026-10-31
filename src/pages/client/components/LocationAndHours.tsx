import React from 'react';
import { MapPin, Clock, Phone, Navigation, MessageCircle, ExternalLink } from 'lucide-react';
import { GYM_DETAILS } from '../clientData';

export const LocationAndHours: React.FC = () => {
  const whatsappUrl = `https://wa.me/${GYM_DETAILS.phone.replace('+', '')}?text=${encodeURIComponent('Hi Iron Gym, I would like directions to the gym!')}`;

  return (
    <section id="location" className="py-10 sm:py-24 bg-[#fafafa] border-b border-slate-200/80 font-sans">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-xl mb-8 sm:mb-12">
          <div className="text-[10px] sm:text-xs font-mono text-slate-500 uppercase tracking-wider mb-1.5 sm:mb-2">
            Location & Hours
          </div>
          <h2 className="text-xl sm:text-4xl font-medium tracking-tight text-slate-900 leading-tight">
            Training shifts and facility address.
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Walk-ins are welcome during regular morning and evening training shifts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
          
          {/* Address & Timings Column */}
          <div className="lg:col-span-6 space-y-4 sm:space-y-6 flex flex-col justify-between">
            
            {/* Address Card */}
            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200/90">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-900 mb-1">Facility Address</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {GYM_DETAILS.address}
                  </p>
                  <div className="mt-3 sm:mt-4">
                    <a
                      href={GYM_DETAILS.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto h-10 sm:h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Open Google Maps</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 text-slate-400" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Timings Card */}
            <div className="p-4 sm:p-6 rounded-xl bg-white border border-slate-200/90">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-medium text-slate-900 mb-1.5 sm:mb-2">Training Shifts</h3>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-100">
                      <span className="text-slate-600">Mon – Sat (Morning)</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">5:30 AM – 10:30 AM</span>
                    </div>
                    <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-slate-100">
                      <span className="text-slate-600">Mon – Sat (Evening)</span>
                      <span className="font-mono font-medium text-slate-900 tabular-nums">4:30 PM – 10:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500 pt-0.5">
                      <span>Sunday</span>
                      <span className="font-mono text-slate-400">Closed (Maintenance)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Contact Column on Mobile: Native list items */}
          <div className="lg:col-span-6 p-4 sm:p-6 rounded-xl bg-white border border-slate-200/90 flex flex-col justify-between">
            <div>
              <h3 className="text-xs sm:text-sm font-medium text-slate-900 mb-1">Direct Inquiries</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4 sm:mb-6">
                Have questions regarding memberships, training batches, or contest preparation? Contact the desk:
              </p>

              <div className="space-y-2.5 sm:space-y-3">
                <a
                  href={`tel:${GYM_DETAILS.phone}`}
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-lg bg-slate-50 active:bg-slate-100 border border-slate-200 transition-colors text-slate-900"
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Reception Phone</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-900 tabular-nums">{GYM_DETAILS.phoneDisplay}</div>
                  </div>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 sm:p-3.5 rounded-lg bg-slate-50 active:bg-slate-100 border border-slate-200 transition-colors text-slate-900"
                >
                  <div className="w-8 h-8 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">WhatsApp Desk</div>
                    <div className="text-xs sm:text-sm font-medium text-slate-900">Message on WhatsApp</div>
                  </div>
                </a>
              </div>
            </div>

            <div className="pt-4 sm:pt-6 border-t border-slate-100 mt-4 sm:mt-6 text-[11px] sm:text-xs text-slate-500">
              Personal visits are encouraged during shift hours to tour the lifting equipment.
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
