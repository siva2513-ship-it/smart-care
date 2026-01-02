
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
    <div className={`p-6 rounded-3xl border-2 ${getBgColor(time)} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white rounded-2xl shadow-sm">
          {TIME_ICONS[time]}
        </div>
        <div>
          <h3 className={`text-2xl font-extrabold ${getHeadingColor(time)} uppercase tracking-wide`}>
            {time}
          </h3>
          <p className="text-slate-500 font-medium">
            {medicines.length > 0 ? `${medicines.length} Medicines` : 'No medicines scheduled'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {medicines.length > 0 ? (
          medicines.map((med) => {
            const isTaken = takenKeys.has(`${med.id}-${time}`);
            return (
              <div key={med.id} className={`bg-white p-5 rounded-2xl border transition-all duration-300 flex items-start gap-4 shadow-sm ${isTaken ? 'opacity-60 border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
                <div className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center ${isTaken ? 'bg-emerald-100 text-emerald-600' : `bg-${med.color}-100 text-${med.color}-600`}`}>
                  {isTaken ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`text-xl font-bold leading-tight ${isTaken ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                      {med.name}
                    </h4>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full uppercase ${isTaken ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {isTaken ? 'Done' : med.dosage}
                    </span>
                  </div>
                  <p className={`mt-2 text-lg italic leading-relaxed ${isTaken ? 'text-emerald-600/70' : 'text-slate-600'}`}>
                    "{med.instructions}"
                  </p>
                  <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => !isTaken && onMarkTaken(med.id, time)}
                        disabled={isTaken}
                        className={`flex-1 py-2 font-bold rounded-xl border transition-all ${
                          isTaken 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200 cursor-default' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 active:scale-95'
                        }`}
                      >
                          {isTaken ? 'Completed' : 'Mark as Taken'}
                      </button>
                      {!isTaken && (
                        <button className="flex-1 py-2 bg-slate-50 text-slate-400 font-bold rounded-xl border border-slate-100 hover:bg-slate-100 transition-colors">
                            Snooze
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center bg-white/50 border border-dashed border-slate-200 rounded-2xl">
            <p className="text-slate-400 font-medium">Enjoy your {time.toLowerCase()}!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleCard;
