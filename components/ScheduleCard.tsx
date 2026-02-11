
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
    en: { items: "Doses", clear: "Clear", nothing: "Resting Period", verified: "Taken", before: "Before Food", after: "After Food", with: "With Food", empty: "Empty Stomach" },
    hi: { items: "खुराक", clear: "कोई दवा नहीं", nothing: "विश्राम का समय", verified: "ली गई", before: "खाने से पहले", after: "खाने के बाद", with: "खाने के साथ", empty: "खाली पेट" },
    te: { items: "మోతాదులు", clear: "ఖాళీ", nothing: "విశ్రాంతి సమయం", verified: "తీసుకున్నారు", before: "భోజనానికి ముందు", after: "భోజనం తర్వాత", with: "భోజనంతో పాటు", empty: "ఖాళీ కడుపుతో" }
  }[lang] || { items: "Items Due", clear: "Clear", nothing: "Nothing scheduled", verified: "Taken" };

  const getMealLabel = (instr?: string) => {
    if (!instr || instr === 'None') return '';
    switch(instr) {
      case 'Before Food': return labels.before;
      case 'After Food': return labels.after;
      case 'With Food': return labels.with;
      case 'Empty Stomach': return labels.empty;
      default: return instr;
    }
  };

  const theme = getTheme(time);

  return (
    <div className={`p-8 rounded-[3rem] border-2 ${theme.split(' text')[0]} flex flex-col transition-all hover:shadow-2xl hover:-translate-y-2`}>
      <div className="flex items-center gap-5 mb-8 px-1">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg text-3xl">
          {TIME_ICONS[time]}
        </div>
        <div>
          <h3 className={`font-black uppercase tracking-[0.25em] text-[13px] ${theme.split(' border')[2]}`}>
            {time}
          </h3>
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">
            {medicines.length > 0 ? `${medicines.length} ${labels.items}` : labels.clear}
          </p>
        </div>
      </div>

      <div className="space-y-5 flex-1">
        {medicines.length > 0 ? (
          medicines.map((med) => {
            const isTaken = takenKeys.has(`${med.id}-${time}`);
            const mealLabel = getMealLabel(med.mealInstruction);
            
            return (
              <div key={med.id} className={`bg-white p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-4 ${isTaken ? 'opacity-30 grayscale border-emerald-100' : 'border-white shadow-xl hover:border-blue-200'}`}>
                <div className="flex justify-between items-start gap-4">
                   <div className="flex items-center gap-4 truncate">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner shrink-0">
                        {getMedIcon(med.name)}
                      </div>
                      <div className="flex flex-col truncate">
                         <span className="text-lg font-black text-slate-900 truncate leading-tight tracking-tight">{med.name}</span>
                         <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{med.dosage}</span>
                           {med.specificTime && (
                             <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{med.specificTime}</span>
                           )}
                         </div>
                      </div>
                   </div>
                   <button 
                    onClick={() => !isTaken && onMarkTaken(med.id, time)}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 border-2 ${isTaken ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 text-slate-300 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white border-slate-100 shadow-sm'}`}
                   >
                     {isTaken ? '✓' : ''}
                   </button>
                </div>
                
                {!isTaken && (
                  <div className="space-y-3">
                    {mealLabel && (
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                        <span className="text-amber-600">🍽️</span>
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{mealLabel}</span>
                      </div>
                    )}
                    <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                        "{med.instructions}"
                      </p>
                    </div>
                  </div>
                )}
                
                {isTaken && (
                  <div className="flex items-center gap-2 px-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">{labels.verified}</span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 border-4 border-dashed border-slate-200/40 rounded-[3rem]">
            <span className="text-4xl mb-4 opacity-50">🌙</span>
            <span className="text-[11px] font-black text-slate-300 uppercase tracking-[0.3em] italic text-center px-8 leading-loose">
              {labels.nothing}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
