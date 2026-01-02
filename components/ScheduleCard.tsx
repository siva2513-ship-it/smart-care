
import React from 'react';
import { Medicine, TimeOfDay } from '../types';
import { TIME_ICONS } from '../constants';

interface ScheduleCardProps {
  time: TimeOfDay;
  medicines: Medicine[];
  takenKeys: Set<string>;
  onMarkTaken: (medId: string, time: TimeOfDay) => void;
}

const ScheduleCard: React.FC<ScheduleCardProps> = ({ time, medicines, takenKeys, onMarkTaken }) => {
  const getTheme = (time: TimeOfDay) => {
    switch (time) {
      case TimeOfDay.MORNING: return 'bg-amber-50 border-amber-200 text-amber-700';
      case TimeOfDay.AFTERNOON: return 'bg-orange-50 border-orange-200 text-orange-700';
      case TimeOfDay.EVENING: return 'bg-indigo-50 border-indigo-200 text-indigo-700';
      case TimeOfDay.NIGHT: return 'bg-slate-100 border-slate-300 text-slate-800';
    }
  };

  const theme = getTheme(time);

  return (
    <div className={`p-5 rounded-[2rem] border-2 ${theme.split(' text')[0]} flex flex-col transition-all hover:shadow-md`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-lg">
          {TIME_ICONS[time]}
        </div>
        <div>
          <h3 className={`font-black uppercase tracking-widest text-[10px] ${theme.split(' border')[2]}`}>
            {time}
          </h3>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
            {medicines.length} Pills
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {medicines.length > 0 ? (
          medicines.map((med) => {
            const isTaken = takenKeys.has(`${med.id}-${time}`);
            return (
              <div key={med.id} className={`bg-white/80 p-3 rounded-2xl border-2 transition-all flex flex-col gap-2 ${isTaken ? 'opacity-40 border-emerald-100' : 'border-white shadow-sm hover:border-blue-100'}`}>
                <div className="flex justify-between items-start">
                   <div className="flex flex-col truncate pr-2">
                      <span className="text-[11px] font-black text-slate-900 truncate">{med.name}</span>
                      <span className="text-[8px] font-black text-slate-400 uppercase">{med.dosage}</span>
                   </div>
                   <button 
                    onClick={() => !isTaken && onMarkTaken(med.id, time)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] transition-all ${isTaken ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-300 hover:bg-emerald-500 hover:text-white border border-slate-100'}`}
                   >
                     {isTaken ? '✓' : ''}
                   </button>
                </div>
                {!isTaken && (
                  <p className="text-[9px] font-bold text-slate-500 leading-tight italic">
                    "{med.instructions}"
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex items-center justify-center py-6">
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">All Set</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
