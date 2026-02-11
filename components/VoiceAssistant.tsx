
import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types';

interface VoiceAssistantProps {
  text: string;
  lang?: Language;
  onComplete?: () => void;
  variedIntro?: boolean;
}

const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ text, lang = 'en', onComplete, variedIntro = true }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [visualizerHeights, setVisualizerHeights] = useState<number[]>(new Array(8).fill(20));

  // Natural conversational fillers based on language
  const intros = useMemo(() => ({
    en: [
      "Here is your medication summary.",
      "I've analyzed your schedule, let me read it to you.",
      "Certainly, here's what you need to know about your meds.",
      "Scanning complete. Here is the summary."
    ],
    hi: [
      "यहाँ आपकी दवाओं का सारांश है।",
      "मैंने आपके शेड्यूल का विश्लेषण किया है, सुनिए।",
      "ज़रूर, यहाँ आपकी दवाओं के बारे में जानकारी है।",
      "स्कैन पूरा हुआ। यहाँ सारांश है।"
    ],
    te: [
      "ఇక్కడ మీ మందుల సారాంశం ఉంది.",
      "నేను మీ షెడ్యూల్‌ను విశ్లేషించాను, వినండి.",
      "ఖచ్చితంగా, మీ మందుల గురించి మీరు తెలుసుకోవలసినది ఇక్కడ ఉంది.",
      "స్కానింగ్ పూర్తయింది. ఇక్కడ సారాంశం ఉంది."
    ]
  }), []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setVisualizerHeights(new Array(8).fill(0).map(() => 20 + Math.random() * 60));
      }, 100);
    } else {
      setVisualizerHeights(new Array(8).fill(20));
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
    
    // Choose a random intro if variedIntro is enabled
    const introList = intros[lang] || intros.en;
    const randomIntro = variedIntro ? introList[Math.floor(Math.random() * introList.length)] : "";
    const fullText = randomIntro ? `${randomIntro} ${text}` : text;

    const utterance = new SpeechSynthesisUtterance(fullText);
    
    switch (lang) {
      case 'hi': utterance.lang = 'hi-IN'; break;
      case 'te': utterance.lang = 'te-IN'; break;
      default: utterance.lang = 'en-US'; break;
    }

    utterance.rate = 0.9;
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
    <div className="flex flex-col gap-4 w-full">
      <div className="flex gap-4">
        <button
          onClick={speak}
          disabled={isPlaying}
          className={`group flex items-center justify-between gap-4 px-8 py-4 rounded-[2rem] transition-all duration-500 shadow-xl flex-1 relative overflow-hidden ${
            isPlaying 
              ? 'bg-blue-600 text-white cursor-default' 
              : 'bg-white text-slate-900 hover:bg-slate-50 hover:scale-[1.02] active:scale-95 border-2 border-slate-100'
          }`}
        >
          <div className="flex items-center gap-3 relative z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-white/20' : 'bg-blue-50'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${isPlaying ? 'text-white' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <span className="text-sm font-black uppercase tracking-[0.15em]">
              {isPlaying ? (lang === 'en' ? 'Speaking...' : lang === 'hi' ? 'बोल रहा है...' : 'మాట్లాడుతున్నారు...') : (lang === 'en' ? 'Play Summary' : lang === 'hi' ? 'सारांश सुनें' : 'సారాంశం వినండి')}
            </span>
          </div>

          {/* Real-time Visualizer Bars */}
          <div className="flex items-end gap-1 h-6 shrink-0 relative z-10">
            {visualizerHeights.map((h, i) => (
              <div 
                key={i} 
                className={`w-1 rounded-full transition-all duration-150 ${isPlaying ? 'bg-white' : 'bg-blue-200'}`} 
                style={{ height: `${h}%` }}
              ></div>
            ))}
          </div>

          {isPlaying && (
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
          )}
        </button>

        {isPlaying && (
          <button
            onClick={stop}
            className="w-16 h-16 bg-red-600 text-white rounded-full font-black text-xl hover:bg-red-700 shadow-xl transition-all active:scale-90 flex items-center justify-center border-4 border-red-500/30"
          >
            ✕
          </button>
        )}
      </div>
      
      {isPlaying && (
        <div className="px-6 py-3 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-2">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest text-center">AI Audio Sync Active</p>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;
