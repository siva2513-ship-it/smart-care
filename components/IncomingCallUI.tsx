
import React, { useEffect, useState, useCallback } from 'react';
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
  const [isHangingUp, setIsHangingUp] = useState(false);

  const t = {
    en: {
      incoming: "Priority Health Call",
      answered: "Encrypted Session",
      decline: "Reject",
      answer: "Accept",
      hangup: "End Call",
      doseReminder: "Medicine Due Now",
      schedule: "Patient Directive",
      aiFinish: "Updating logs...",
      speak: (med: string, dose: string, inst: string) => 
        `Hello. This is your SmartCare safety assistant. It is time for your medication: ${dose} of ${med}. My records indicate: ${inst}. Please consume your medication immediately.`
    },
    hi: {
      incoming: "प्राथमिक स्वास्थ्य कॉल",
      answered: "सुरक्षित सत्र",
      decline: "काटें",
      answer: "स्वीकार करें",
      hangup: "समाप्त करें",
      doseReminder: "दवा का समय",
      schedule: "रोगी निर्देश",
      aiFinish: "रिकॉर्ड अपडेट हो रहे हैं...",
      speak: (med: string, dose: string, inst: string) => 
        `नमस्ते। यह आपका स्मार्टकेयर सुरक्षा सहायक है। आपकी दवा का समय हो गया है: ${med} की ${dose}। मेरे पास निर्देश हैं: ${inst}। कृपया अपनी दवा तुरंत लें।`
    },
    te: {
      incoming: "ముఖ్యమైన ఆరోగ్య కాల్",
      answered: "సురక్షిత సెషన్",
      decline: "తిరస్కరించు",
      answer: "స్వీకరించు",
      hangup: "ముగించు",
      doseReminder: "మందుల సమయం",
      schedule: "రోగి మార్గదర్శకాలు",
      aiFinish: "అప్‌డేట్ అవుతోంది...",
      speak: (med: string, dose: string, inst: string) => 
        `నమస్కారం. ఇది మీ స్మార్ట్‌కేర్ రక్షణ సహాయకుడిని. మీ మందుల సమయం అయింది. మందు పేరు: ${med}, మోతాదు: ${dose}. సూచనలు: ${inst}. దయచేసి ఇప్పుడే మీ మందు తీసుకోండి.`
    }
  }[lang] || {
    en: {
      incoming: "Priority Health Call",
      answered: "Encrypted Session",
      decline: "Reject",
      answer: "Accept",
      hangup: "End Call",
      doseReminder: "Medicine Due Now",
      schedule: "Patient Directive",
      aiFinish: "Updating logs...",
      speak: (med: string, dose: string, inst: string) => `Hello...`
    }
  };

  const forceStopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isAnswered && !isHangingUp) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
      
      if ('speechSynthesis' in window) {
        forceStopSpeech();
        const locale = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
        const speechText = t.speak(medicineName, dosage, instructions);
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = locale;
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
      }
    }
    
    return () => {
      clearInterval(interval);
      forceStopSpeech();
    };
  }, [isAnswered, isHangingUp, medicineName, dosage, instructions, lang, forceStopSpeech]);

  const handleAccept = () => {
    setIsAnswered(true);
    if (onAccept) onAccept();
  };

  const handleHangup = () => {
    setIsHangingUp(true);
    forceStopSpeech();
    // Small delay to allow visual transition before unmounting
    setTimeout(() => {
      onDecline();
    }, 500);
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between py-12 md:py-20 transition-all duration-500 overflow-hidden ${isHangingUp ? 'opacity-0 scale-95' : 'opacity-100'}`}>
      {!isAnswered && !isHangingUp && (
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <div className="w-[150%] h-[150%] bg-blue-500/10 rounded-full animate-ping-slow"></div>
          <div className="absolute w-[80%] h-[80%] bg-blue-400/10 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-6 relative z-10 px-6 shrink-0">
        <div className={`w-28 h-28 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl shadow-[0_0_40px_rgba(37,99,235,0.4)] border-4 border-white/20 transition-all ${isAnswered ? 'scale-90 opacity-80' : 'animate-bounce'}`}>
          {isHangingUp ? '👋' : '🤖'}
        </div>
        <div className="space-y-1">
          <h2 className="text-4xl font-black text-white tracking-tight">{isHangingUp ? 'Session Ended' : callerName}</h2>
          <p className="text-blue-400 text-lg font-black uppercase tracking-[0.2em] opacity-80">
            {isAnswered && !isHangingUp ? `${t.answered} • ${Math.floor(timer / 60)}:${(timer % 60).toString().padStart(2, '0')}` : isHangingUp ? t.aiFinish : t.doseReminder}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 overflow-hidden">
        {isAnswered && !isHangingUp ? (
          <div className="max-w-md w-full animate-in zoom-in-95 duration-500 text-center flex flex-col h-full max-h-[60%] justify-center">
            <div className="bg-white/10 backdrop-blur-2xl p-8 rounded-[3.5rem] border border-white/20 shadow-2xl space-y-6 overflow-y-auto custom-scrollbar">
              <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.4em] mb-4">{t.schedule}</p>
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-white text-3xl font-black leading-tight tracking-tight">
                    {medicineName}
                  </p>
                  <p className="text-blue-400 text-xl font-black">{dosage}</p>
                </div>
                <div className="flex justify-center items-end gap-1.5 h-16">
                  {[...Array(10)].map((_, i) => (
                     <span 
                      key={i} 
                      className="w-1.5 bg-blue-500 rounded-full animate-voice-pulse" 
                      style={{ 
                        height: `${30 + Math.random() * 70}%`,
                        animationDelay: `${i * 0.1}s`
                      }}
                     ></span>
                  ))}
                </div>
                <p className="text-slate-100 font-bold italic leading-relaxed text-lg px-4 py-3 bg-white/5 rounded-2xl">
                  "{instructions}"
                </p>
              </div>
            </div>
          </div>
        ) : !isHangingUp ? (
          <div className="text-center space-y-4">
              <p className="text-slate-400 font-black text-sm uppercase tracking-widest">{t.incoming}</p>
              <h3 className="text-white text-5xl font-black tracking-tighter">{medicineName}</h3>
              <p className="text-blue-400 text-2xl font-black">{dosage}</p>
          </div>
        ) : null}
      </div>

      {/* Action Controls - Fixed at Bottom */}
      <div className="w-full max-w-sm px-8 relative z-50 shrink-0">
        {!isAnswered ? (
          <div className="flex justify-around items-center">
            <button 
              onClick={handleHangup} 
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl group-hover:bg-red-700 transition-all hover:scale-110 active:scale-90 border-4 border-red-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className="text-red-500 font-black uppercase text-[10px] tracking-widest">{t.decline}</span>
            </button>
            <button 
              onClick={handleAccept} 
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.4)] group-hover:bg-emerald-600 animate-bounce transition-all hover:scale-110 active:scale-90 border-4 border-emerald-400/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">{t.answer}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-8 py-4 bg-slate-900/50 rounded-[3rem] border border-white/5">
            <button 
              onClick={handleHangup} 
              className="flex flex-col items-center gap-4 group"
            >
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.6)] group-hover:bg-red-700 transition-all hover:scale-105 active:scale-95 border-[6px] border-white/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white transform rotate-[135deg]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.15 15.15 0 006.59 6.59l2.2-2.2a1 1 0 011.11-.27c1.12.45 2.33.69 3.58.69a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.24 2.46.69 3.58a1 1 0 01-.27 1.11l-2.3 2.3z" />
                </svg>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-white font-black uppercase text-sm tracking-[0.4em] animate-pulse">{t.hangup}</span>
                <span className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-1">{t.aiFinish}</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingCallUI;
