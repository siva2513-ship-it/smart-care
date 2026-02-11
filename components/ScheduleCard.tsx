
import React from 'react';
import { Medicine, TimeOfDay, Language } from '../types';
import { TIME_ICONS } from '../constants';

interface ScheduleCardProps {
  time: TimeOfDay;
  medicines: Medicine[];
  takenKeys: Set<string>;
  onMarkTaken: (medId: string, time: TimeOfDay) => void;
  lang?: Language;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ time, medicines, takenKeys, onMarkTaken, lang = 'en' }) => {
  const getTheme = (time: TimeOfDay) => {
    switch (time) {
      case TimeOfDay.MORNING: return 'bg-amber-50 border-amber-200 text-amber-700';
      case TimeOfDay.AFTERNOON: return 'bg-orange-50 border-orange-200 text-orange-700';
      case TimeOfDay.EVENING: return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case TimeOfDay.NIGHT: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const getMedIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('pill') || lower.includes('tablet')) return '💊';
    if (lower.includes('capsule')) return '💊';
    if (lower.includes('liquid') || lower.includes('syrup')) return '🧪';
    if (lower.includes('inhaler') || lower.includes('spray')) return '🌬️';
    if (lower.includes('injection')) return '💉';
    return '💊';
  };

  const labels = {
    en: { items: "Items Due", clear: "Clear", nothing: "Nothing scheduled for this time", verified: "Verified Taken" },
    hi: { items: "दवाएं शेष", clear: "कोई दवा नहीं", nothing: "इस समय के लिए कुछ भी निर्धारित नहीं है", verified: "दवा ले ली गई है" },
    te: { items: "మందులు ఉన్నాయి", clear: "ఖాళీ", nothing: "ఈ సమయానికి ఏమీ షెడ్యూల్ చేయబడలేదు", verified: "మందులు తీసుకున్నారు" }
  }[lang] || { items: "Items Due", clear: "Clear", nothing: "Nothing scheduled", verified: "Taken" };

  const theme = getTheme(time);

  return (
    <div className={`p-6 rounded-[2.5rem] border-2 ${theme.split(' text')[0]} flex flex-col transition-all hover:shadow-xl hover:-translate-y-1`}>
      <div className="flex items-center gap-4 mb-6 px-1">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md text-2xl">
          {TIME_ICONS[time]}
        </div>
        <div>
          <h3 className={`font-black uppercase tracking-[0.2em] text-[12px] ${theme.split(' border')[2]}`}>
            {time}
          </h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
            {medicines.length > 0 ? `${medicines.length} ${labels.items}` : labels.clear}
          </p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        {medicines.length > 0 ? (
          medicines.map((med) => {
            const isTaken = takenKeys.has(`${med.id}-${time}`);
            return (
              <div key={med.id} className={`bg-white p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 ${isTaken ? 'opacity-30 border-emerald-100' : 'border-white shadow-md hover:border-blue-100'}`}>
                <div className="flex justify-between items-start gap-3">
                   <div className="flex items-center gap-3 truncate">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0">
                        {getMedIcon(med.name)}
                      </div>
                      <div className="flex flex-col truncate">
                         <span className="text-sm font-black text-slate-900 truncate leading-tight">{med.name}</span>
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{med.dosage}</span>
                      </div>
                   </div>
                   <button 
                    onClick={() => !isTaken && onMarkTaken(med.id, time)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all flex-shrink-0 border-2 ${isTaken ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 text-slate-300 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white border-slate-100'}`}
                   >
                     {isTaken ? '✓' : ''}
                   </button>
                </div>
                {!isTaken && (
                  <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <p className="text-[11px] font-bold text-slate-600 leading-snug italic opacity-90">
                      "{med.instructions}"
                    </p>
                  </div>
                )}
                {isTaken && (
                  <div className="flex items-center gap-1.5 px-2">
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">{labels.verified}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200/50 rounded-[2rem]">
            <span className="text-2xl mb-2">✨</span>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic text-center px-4">
              {labels.nothing}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
