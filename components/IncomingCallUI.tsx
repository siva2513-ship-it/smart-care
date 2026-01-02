
import React, { useEffect, useState } from 'react';
import { TimeOfDay, Language } from '../types';

interface IncomingCallUIProps {
  onAccept: () => void;
  onDecline: () => void;
  callerName: string;
  medicineName: string;
  dosage: string;
  instructions: string;
  timeOfDay: TimeOfDay;
  lang?: Language;
}

const IncomingCallUI: React.FC<IncomingCallUIProps> = ({ 
  onAccept, 
  onDecline, 
  callerName, 
  medicineName,
  dosage,
  instructions,
  timeOfDay,
  lang = 'en'
}) => {
  const [isAnswered, setIsAnswered] = useState(false);
  const [timer, setTimer] = useState(0);

  const t = {
    en: {
      incoming: "Incoming Call",
      answered: "Voice Session",
      decline: "Decline",
      answer: "Answer",
      hangup: "Hang Up",
      doseReminder: "Dose Reminder",
      schedule: "Schedule",
      aiFinish: "AI will finish the session now",
      speak: (med: string, dose: string, inst: string) => 
        `This is your care assistant. It is time for your medication: ${dose} of ${med}. My records say: ${inst}. Please take your medicine now.`
    },
    hi: {
      incoming: "आने वाली कॉल",
      answered: "वॉयस सेशन",
      decline: "काटें",
      answer: "उठाएं",
      hangup: "फोन रखें",
      doseReminder: "दवा की याद दिलाना",
      schedule: "समय सारणी",
      aiFinish: "एआई अब सत्र समाप्त करेगा",
      speak: (med: string, dose: string, inst: string) => 
        `नमस्ते। यह आपका केयर असिस्टेंट है। आपकी दवा का समय हो गया है: ${med} की ${dose}। निर्देश हैं: ${inst}। कृपया अपनी दवा अभी लें।`
    },
    te: {
      incoming: "వస్తున్న కాల్",
      answered: "వాయిస్ సెషన్",
      decline: "తిరస్కరించు",
      answer: "సమాధానం",
      hangup: "కాల్ ఆపు",
      doseReminder: "మందుల రిమైండర్",
      schedule: "షెడ్యూల్",
      aiFinish: "AI సెషన్‌ను ముగిస్తుంది",
      speak: (med: string, dose: string, inst: string) => 
        `నమస్కారం. ఇది మీ కేర్ అసిస్టెంట్. మీ మందుల సమయం అయింది. మందు పేరు: ${med}, మోతాదు: ${dose}. నా రికార్డులు ఇలా చెబుతున్నాయి: ${inst}. దయచేసి ఇప్పుడే మీ మందు తీసుకోండి.`
    }
  }[lang];

  useEffect(() => {
    let interval: any;
    if (isAnswered) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
      
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        
        const locale = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
        const speechText = t.speak(medicineName, dosage, instructions);

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = locale;
        utterance.rate = 0.8; // Slightly slower for better clarity
        window.speechSynthesis.speak(utterance);
      }
    }
    
    return () => {
      clearInterval(interval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isAnswered, medicineName, dosage, instructions, lang, t]);

  const handleAccept = () => {
    setIsAnswered(true);
    onAccept();
  };

  const handleHangup = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onDecline();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-between py-20 animate-in fade-in duration-500 overflow-hidden font-sans">
      {!isAnswered && (
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-96 h-96 bg-blue-500/10 rounded-full animate-ping-slow"></div>
          <div className="absolute w-64 h-64 bg-blue-500/20 rounded-full animate-pulse"></div>
        </div>
      )}

      <div className="text-center space-y-6 relative z-10">
        <div className={`w-32 h-32 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-5xl shadow-2xl border-4 border-blue-400 transition-all ${isAnswered ? 'animate-pulse' : ''}`}>
          🤖
        </div>
        <div>
          <h2 className="text-4xl font-black text-white">{callerName}</h2>
          <p className="text-blue-300 text-xl font-bold uppercase tracking-widest mt-2">
            {isAnswered ? `${t.answered} • ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : `${t.doseReminder}`}
          </p>
        </div>
      </div>

      {isAnswered ? (
        <div className="max-w-md w-full px-8 animate-in zoom-in slide-in-from-bottom-8 duration-500 text-center flex-1 flex flex-col justify-center">
          <div className="bg-white/10 backdrop-blur-xl p-10 rounded-[4rem] border border-white/20 shadow-2xl mb-12">
            <p className="text-blue-200 text-sm font-black uppercase tracking-widest mb-6">{t.schedule}</p>
            <div className="space-y-6">
              <p className="text-white text-3xl font-black leading-tight">
                {medicineName} ({dosage})
              </p>
              <div className="flex justify-center items-end gap-1.5 h-16">
                {[...Array(8)].map((_, i) => (
                   <span 
                    key={i} 
                    className="w-1.5 bg-blue-500 rounded-full animate-voice-pulse" 
                    style={{ 
                      height: `${20 + Math.random() * 80}%`,
                      animationDelay: `${i * 0.1}s`
                    }}
                   ></span>
                ))}
              </div>
              <p className="text-slate-300 font-bold italic leading-relaxed text-lg">
                "{instructions}"
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-12 text-center flex-1 flex flex-col justify-center">
            <p className="text-slate-400 font-black text-lg uppercase tracking-widest mb-2">{t.incoming}</p>
            <p className="text-white text-4xl font-black">{medicineName}</p>
            <p className="text-blue-300 text-xl font-bold mt-2">{dosage}</p>
        </div>
      )}

      <div className="w-full max-w-sm px-12 relative z-10 pb-8">
        {!isAnswered ? (
          <div className="flex justify-between items-center">
            <button 
              onClick={handleHangup} 
              className="flex flex-col items-center gap-4 group"
              aria-label="Decline Call"
            >
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:bg-red-700 transition-all hover:scale-110 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-red-400 font-black uppercase text-xs tracking-widest">{t.decline}</span>
            </button>
            <button 
              onClick={handleAccept} 
              className="flex flex-col items-center gap-4 group"
              aria-label="Answer Call"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl group-hover:bg-emerald-600 animate-bounce transition-all hover:scale-110 active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-emerald-400 font-black uppercase text-xs tracking-widest">{t.answer}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8">
            <button 
              onClick={handleHangup} 
              className="flex flex-col items-center gap-4 group"
              aria-label="Hang Up Call"
            >
              <div className="w-28 h-28 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.4)] group-hover:bg-red-700 transition-all hover:scale-110 active:scale-90 border-4 border-red-500/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.45 2.33.69 3.58.69a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.24 2.46.69 3.58a1 1 0 01-.27 1.11l-2.3 2.3z" />
                </svg>
              </div>
              <span className="text-red-400 font-black uppercase text-sm tracking-[0.2em] animate-pulse">{t.hangup}</span>
            </button>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-60">{t.aiFinish}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingCallUI;
