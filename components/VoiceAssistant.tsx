
import React, { useState, useEffect } from 'react';

interface VoiceAssistantProps {
  text: string;
  onComplete?: () => void;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ text, onComplete }) => {
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
    utterance.rate = 0.9;
    utterance.pitch = 1.1;
    
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
        className={`flex items-center gap-3 px-8 py-5 rounded-full transition-all duration-300 shadow-lg flex-1 ${
          isPlaying 
            ? 'bg-amber-100 text-amber-700 cursor-default' 
            : 'bg-amber-500 hover:bg-amber-600 text-white hover:scale-105 active:scale-95'
        }`}
      >
        <div className={`relative ${isPlaying ? 'animate-pulse' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          {isPlaying && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
          )}
        </div>
        <span className="text-xl font-black">
          {isPlaying ? 'Reading Schedule...' : 'Read Aloud Schedule'}
        </span>
      </button>

      {isPlaying && (
        <button
          onClick={stop}
          className="px-8 bg-red-600 text-white rounded-full font-black text-lg hover:bg-red-700 shadow-xl transition-all active:scale-90 flex items-center gap-3"
        >
          <span className="transform rotate-[135deg] text-2xl">📞</span>
          Hang Up
        </button>
      )}
    </div>
  );
};

export default VoiceAssistant;
