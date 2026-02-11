
import React, { useState, useEffect, useCallback } from 'react';
import { Medicine, TimeOfDay, Language } from '../types';

interface VoiceCommandCenterProps {
  medicines: Medicine[];
  currentTime: TimeOfDay;
  onMarkTaken: (id: string, time: TimeOfDay) => void;
  lang: Language;
}

const VoiceCommandCenter: React.FC<VoiceCommandCenterProps> = ({ medicines, currentTime, onMarkTaken, lang }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const processCommand = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    // Support for group marking: "Take all morning pills"
    const slots: { [key: string]: TimeOfDay } = {
        'morning': TimeOfDay.MORNING,
        'afternoon': TimeOfDay.AFTERNOON,
        'evening': TimeOfDay.EVENING,
        'night': TimeOfDay.NIGHT,
        'subah': TimeOfDay.MORNING,
        'dopahar': TimeOfDay.AFTERNOON,
        'shaam': TimeOfDay.EVENING,
        'raat': TimeOfDay.NIGHT,
    };

    let matchedSlot: TimeOfDay | null = null;
    for (const [key, val] of Object.entries(slots)) {
        if (lowerText.includes(key)) {
            matchedSlot = val;
            break;
        }
    }

    if (matchedSlot && (lowerText.includes('all') || lowerText.includes('sari') || lowerText.includes('pills') || lowerText.includes('medicine'))) {
        const slotMeds = medicines.filter(m => m.timing.includes(matchedSlot!));
        if (slotMeds.length > 0) {
            slotMeds.forEach(m => onMarkTaken(m.id, matchedSlot!));
            const msg = lang === 'hi' ? `${matchedSlot} की सभी दवाएं ले ली गई हैं।` : `Marked all ${matchedSlot} medications as taken.`;
            setFeedback(msg);
            speak(msg);
            return;
        }
    }

    // Command: "Mark [Pill Name] as taken"
    if (lowerText.includes('take') || lowerText.includes('took') || lowerText.includes('done') || lowerText.includes('li gayi') || lowerText.includes('khali')) {
      const foundMed = medicines.find(m => {
          const name = m.name.toLowerCase();
          return lowerText.includes(name) || name.split(' ').some(word => word.length > 3 && lowerText.includes(word));
      });

      if (foundMed) {
        onMarkTaken(foundMed.id, currentTime);
        const msg = lang === 'hi' ? `${foundMed.name} को रिकॉर्ड कर लिया गया है।` : `Marked ${foundMed.name} as taken.`;
        setFeedback(msg);
        speak(msg);
        return;
      }
    }

    // Command: "What's next?"
    if (lowerText.includes('next') || lowerText.includes('agla') || lowerText.includes('kya hai')) {
      const msg = lang === 'hi' ? `आपकी अगली खुराक डैशबोर्ड पर दिखाई गई है।` : `Your next dose is visible on the dashboard.`;
      setFeedback(msg);
      speak(msg);
      return;
    }

    const errorMsg = lang === 'hi' ? "क्षमा करें, मुझे समझ नहीं आया।" : "Sorry, I didn't catch that command.";
    setFeedback(errorMsg);
    speak(errorMsg);
  }, [medicines, currentTime, onMarkTaken, lang]);

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice commands not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'hi' ? 'hi-IN' : lang === 'te' ? 'te-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      processCommand(result);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="fixed bottom-24 right-8 z-[60] flex flex-col items-end gap-4">
      {feedback && (
        <div className="bg-white px-6 py-4 rounded-3xl shadow-2xl border-2 border-blue-100 animate-in slide-in-from-right-4 max-w-xs">
          <p className="text-blue-600 font-black text-sm">{feedback}</p>
        </div>
      )}
      
      {transcript && (
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-xl text-xs font-bold opacity-80">
          "{transcript}"
        </div>
      )}

      <button
        onClick={toggleListening}
        aria-label="Toggle Voice Assistant"
        className={`w-20 h-20 rounded-full flex items-center justify-center shadow-3xl transition-all active:scale-90 border-4 ${
          isListening 
            ? 'bg-red-500 border-red-300 animate-pulse scale-110 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
            : 'bg-blue-600 border-blue-400 hover:scale-110 shadow-[0_0_30px_rgba(37,99,235,0.4)]'
        }`}
      >
        {isListening ? (
          <div className="flex gap-1 items-end h-8">
            <div className="w-1.5 bg-white rounded-full animate-voice-pulse h-4" style={{animationDelay: '0s'}}></div>
            <div className="w-1.5 bg-white rounded-full animate-voice-pulse h-8" style={{animationDelay: '0.2s'}}></div>
            <div className="w-1.5 bg-white rounded-full animate-voice-pulse h-6" style={{animationDelay: '0.4s'}}></div>
          </div>
        ) : (
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>
      
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-100">
        {isListening ? 'Listening...' : 'Voice Command'}
      </span>
    </div>
  );
};

export default VoiceCommandCenter;
