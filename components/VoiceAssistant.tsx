
import React, { useState, useEffect } from 'react';
import { Language } from '../types';

interface VoiceAssistantProps {
  text: string;
  lang?: Language;
  onComplete?: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ text, lang = 'en', onComplete }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Sorry, your browser doesn't support text to speech!");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set appropriate locale
    switch (lang) {
      case 'hi': utterance.lang = 'hi-IN'; break;
      case 'te': utterance.lang = 'te-IN'; break;
      default: utterance.lang = 'en-US'; break;
    }

    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => {
      setIsPlaying(false);
      onComplete?.();
    };
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex gap-4">
      <button
        onClick={speak}
        disabled={isPlaying}
        className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 shadow-md flex-1 ${
          isPlaying 
            ? 'bg-amber-100 text-amber-700 cursor-default' 
            : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 active:scale-95'
        }`}
      >
        <div className={`relative ${isPlaying ? 'animate-pulse' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </div>
        <span className="text-xs font-black uppercase tracking-wider">
          {isPlaying ? (lang === 'en' ? 'Reading...' : lang === 'hi' ? 'पढ़ रहा है...' : 'చదువుతోంది...') : (lang === 'en' ? 'Read Aloud' : lang === 'hi' ? 'ज़ोर से पढ़ें' : 'బిగ్గరగా చదవండి')}
        </span>
      </button>

      {isPlaying && (
        <button
          onClick={stop}
          className="px-6 bg-red-600 text-white rounded-full font-black text-xs uppercase hover:bg-red-700 shadow-md transition-all active:scale-90 flex items-center gap-2"
        >
          <span className="transform rotate-[135deg] text-lg">📞</span>
          {lang === 'en' ? 'Stop' : lang === 'hi' ? 'रोकें' : 'ఆపు'}
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
