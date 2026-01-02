
import React, { useEffect, useState } from 'react';

interface IncomingCallUIProps {
  onAccept: () => void;
  onDecline: () => void;
  callerName: string;
  medicineInfo: string;
}

const IncomingCallUI: React.FC<IncomingCallUIProps> = ({ onAccept, onDecline, callerName, medicineInfo }) => {
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isAnswered) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isAnswered]);

  const handleAccept = () => {
    setIsAnswered(true);
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between py-24 animate-in fade-in duration-500">
      {/* Visual background pulse */}
      {!isAnswered && (
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-64 h-64 bg-blue-500/20 rounded-full animate-ping"></div>
        </div>
      )}

      <div className="text-center space-y-6">
        <div className="w-32 h-32 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-5xl shadow-2xl border-4 border-blue-400">
          🤖
        </div>
        <div>
          <h2 className="text-4xl font-black text-white">{callerName}</h2>
          <p className="text-blue-300 text-xl font-bold uppercase tracking-widest mt-2">
            {isAnswered ? `Care Session • ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : 'Incoming Voice Reminder...'}
          </p>
        </div>
      </div>

      {isAnswered && (
        <div className="max-w-md w-full px-8 animate-in zoom-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[3rem] border border-white/20 text-center">
            <p className="text-blue-100 text-sm font-black uppercase mb-4">Instructions</p>
            <p className="text-white text-2xl font-bold leading-relaxed italic">
              "Please listen carefully. It is time for your medicine..."
            </p>
          </div>
        </div>
      )}

      <div className="w-full max-w-sm px-12">
        {!isAnswered ? (
          <div className="flex justify-between items-center">
            <button onClick={onDecline} className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:bg-red-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <span className="text-white font-black">Ignore</span>
            </button>
            <button onClick={handleAccept} className="flex flex-col items-center gap-4 group">
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl group-hover:bg-emerald-600 animate-bounce">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              </div>
              <span className="text-white font-black">Accept</span>
            </button>
          </div>
        ) : (
          <button onClick={onDecline} className="w-full py-6 bg-red-600 text-white text-2xl font-black rounded-3xl shadow-xl">
            End Call
          </button>
        )}
      </div>
    </div>
  );
};

export default IncomingCallUI;
