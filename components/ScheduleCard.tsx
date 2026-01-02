
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
  const getBgColor = (time: TimeOfDay) => {
    switch (time) {
      case TimeOfDay.MORNING: return 'bg-amber-50 border-amber-200';
      case TimeOfDay.AFTERNOON: return 'bg-orange-50 border-orange-200';
      case TimeOfDay.EVENING: return 'bg-indigo-50 border-indigo-200';
      case TimeOfDay.NIGHT: return 'bg-slate-100 border-slate-300';
    }
  };

  const getHeadingColor = (time: TimeOfDay) => {
    switch (time) {
      case TimeOfDay.MORNING: return 'text-amber-700';
      case TimeOfDay.AFTERNOON: return 'text-orange-700';
      case TimeOfDay.EVENING: return 'text-indigo-700';
      case TimeOfDay.NIGHT: return 'text-slate-800';
    }
  };

  return (
    <div className={`p-6 rounded-[3rem] border-4 ${getBgColor(time)} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4 mb-8 pl-2">
        <div className="p-4 bg-white rounded-2xl shadow-sm">
          {TIME_ICONS[time]}
        </div>
        <div>
          <h3 className={`text-3xl font-black ${getHeadingColor(time)} uppercase tracking-tighter`}>
            {time}
          </h3>
          <p className="text-slate-500 font-black text-sm uppercase tracking-widest">
            {medicines.length > 0 ? `${medicines.length} Pills` : 'Clear'}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {medicines.length > 0 ? (
          medicines.map((med: any) => {
            const isTaken = takenKeys.has(`${med.id}-${time}`);
            return (
              <div key={med.id} className={`bg-white p-6 rounded-[2.5rem] border-4 transition-all duration-300 flex flex-col gap-5 shadow-sm ${isTaken ? 'opacity-50 border-emerald-200 grayscale-[0.5]' : 'border-slate-50 hover:border-blue-100'}`}>
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center text-3xl ${isTaken ? 'bg-emerald-100 text-emerald-600' : `bg-blue-50 text-blue-600`}`}>
                    {isTaken ? '✅' : '💊'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <h4 className={`text-2xl font-black leading-none mb-1 ${isTaken ? 'text-emerald-900' : 'text-slate-900'}`}>
                          {med.name}
                        </h4>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{med.drugClass || 'Medication'}</span>
                      </div>
                      <span className={`text-sm font-black px-4 py-2 rounded-xl uppercase ${isTaken ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                        {med.dosage}
                      </span>
                    </div>
                  </div>
                </div>

                {med.confidenceNote && !isTaken && (
                  <div className="bg-amber-50 border-2 border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                     <span className="text-xl">🧐</span>
                     <p className="text-xs font-bold text-amber-800 leading-tight italic">
                       {med.confidenceNote}
                     </p>
                  </div>
                )}

                {!isTaken && med.sideEffects && (
                  <div className="flex flex-wrap gap-2">
                    {med.sideEffects.slice(0, 2).map((effect: string, i: number) => (
                      <span key={i} className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-lg border border-red-100 uppercase">
                        ⚠️ {effect}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2">
                  <p className={`text-xl font-bold leading-snug mb-6 ${isTaken ? 'text-emerald-700 italic' : 'text-slate-600'}`}>
                    "{med.instructions}"
                  </p>
                  <button 
                    onClick={() => !isTaken && onMarkTaken(med.id, time)}
                    className={`w-full py-5 rounded-[2rem] font-black text-xl transition-all ${
                      isTaken 
                        ? 'bg-emerald-50 text-emerald-800' 
                        : 'bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 active:scale-95'
                    }`}
                  >
                      {isTaken ? 'Taken' : 'Confirm Taken'}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center bg-white/40 border-4 border-dashed border-slate-200 rounded-[3rem]">
            <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No Meds</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
