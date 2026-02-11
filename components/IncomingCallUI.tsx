import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [visualizerBars, setVisualizerBars] = useState<number[]>(new Array(20).fill(15));

  const recognitionRef = useRef<any>(null);
  // FIX #6: Use refs for stable callback identities to break circular dep chains
  const isHangingUpRef = useRef(isHangingUp);
  const isAnsweredRef = useRef(isAnswered);
  isHangingUpRef.current = isHangingUp;
  isAnsweredRef.current = isAnswered;

  // FIX #4: Memoize translation object so it doesn't change on every render
  const translations = useMemo(() => ({
    en: {
      incoming: "Priority Health Call",
      answered: "Secure Medical Line",
      decline: "Reject",
      answer: "Accept",
      hangup: "End Call",
      doseReminder: "Action Required",
      schedule: "Patient Instructions",
      aiFinish: "Updating logs...",
      listening: "Awaiting confirmation...",
      confMsg: "Excellent. Dose recorded. Stay healthy.",
      ask: "Please say 'Yes' or 'Done' once taken.",
      speak: (med: string, inst: string) =>
        `Hello, I am assistant and please take ${med}. My specific instruction is: ${inst}. Please say 'Yes' or 'Done' once taken.`
    },
    hi: {
      incoming: "ज़रूरी स्वास्थ्य कॉल",
      answered: "सुरक्षित सत्र",
      decline: "काटें",
      answer: "बात करें",
      hangup: "फोन रखें",
      doseReminder: "दवा का समय",
      schedule: "रोगी निर्देश",
      aiFinish: "रिकॉर्ड अपडेट हो रहे हैं...",
      listening: "पुष्टि का इंतज़ार...",
      confMsg: "बहुत अच्छा। दवा दर्ज की गई।",
      ask: "दवा लेने के बाद 'हाँ' कहें।",
      speak: (med: string, inst: string) =>
        `नमस्ते, मैं आपका सहायक हूँ और कृपया ${med} लें। निर्देश है: ${inst}। दवा लेने के बाद हाँ कहें।`
    },
    te: {
      incoming: "ముఖ్యమైన కాల్",
      answered: "సురక్షిత సెషన్",
      decline: "వద్దు",
      answer: "మాట్లాడండి",
      hangup: "ముగించు",
      doseReminder: "మందుల సమయం",
      schedule: "రోగి మార్గదర్శకాలు",
      aiFinish: "అప్‌డేట్ అవుతోంది...",
      listening: "నిర్ధారణ కోసం...",
      confMsg: "చాలా బాగుంది. రికార్డ్ చేసాను.",
      ask: "తీసుకున్న తర్వాత 'అవును' అనండి.",
      speak: (med: string, inst: string) =>
        `నమస్కారం, నేను మీ సహాయకుడిని మరియు దయచేసి ${med} తీసుకోండి. సూచన: ${inst}. తీసుకున్న తర్వాత అవును అనండి.`
    }
  }), []); // stable — no deps needed, purely static data

  const t = translations[lang as keyof typeof translations] || translations.en;

  const getLocale = useCallback(() => {
    if (lang === 'hi') return 'hi-IN';
    if (lang === 'te') return 'te-IN';
    return 'en-US';
  }, [lang]);

  const forceStopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const handleHangup = useCallback(() => {
    setIsHangingUp(true);
    forceStopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      // FIX #8: Clear the ref after stopping
      recognitionRef.current = null;
    }
    setTimeout(() => {
      onDecline();
    }, 1200);
  }, [onDecline, forceStopSpeech]);

  // FIX #6: Keep handleHangup in a ref so speakConfirmation doesn't need it as a dep
  const handleHangupRef = useRef(handleHangup);
  handleHangupRef.current = handleHangup;

  const speakConfirmation = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(t.confMsg);
      utterance.lang = getLocale();
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // FIX #6: Call via ref — no dep on handleHangup directly
        handleHangupRef.current();
      };
      window.speechSynthesis.speak(utterance);
    }
  }, [t.confMsg, getLocale]); // handleHangup removed from deps

  // FIX #6: Keep speakConfirmation in a ref so startListening doesn't need it as a dep
  const speakConfirmationRef = useRef(speakConfirmation);
  speakConfirmationRef.current = speakConfirmation;

  // FIX #1 & #2: Removed isListening and isAnswered from deps (used refs instead)
  // FIX #3: recognition.onend now restarts on silence rather than being a no-op
  const startListening = useCallback(() => {
    // FIX #10: Removed non-existent `webkitRecognition` from the fallback chain
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = getLocale();
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        const keywords = ['yes', 'taken', 'done', 'ok', 'haan', 'le li', 'ji', 'avunu', 'teesukunna', 'pills'];
        if (keywords.some(k => transcript.includes(k))) {
          setIsListening(false);
          speakConfirmationRef.current();
        }
        // If no keyword matched, onend will fire and restart automatically (FIX #3)
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      // FIX #3: Actually restart on silence/no-match instead of dead no-op
      recognition.onend = () => {
        setIsListening(false);
        if (!isHangingUpRef.current && isAnsweredRef.current) {
          try {
            recognition.start();
          } catch (e) {}
        }
      };

      recognition.start();
    } catch (e) {
      console.error('Speech Recognition failed to start', e);
    }
  }, [getLocale]); // FIX #1: isListening, isAnswered, isHangingUp removed — using refs

  // Visualizer Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      if (isAnswered && !isHangingUp) {
        setVisualizerBars(prev =>
          prev.map(() => {
            if (isSpeaking) return 20 + Math.random() * 80;
            if (isListening) return 10 + Math.random() * 40;
            return 5 + Math.random() * 10;
          })
        );
      }
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, [isAnswered, isHangingUp, isSpeaking, isListening]);

  // Speech + Timer effect
  // FIX #2: startListening called via ref so it's not a dep here
  // FIX #4: t replaced with lang as the dep (t is now stable via useMemo anyway)
  // FIX #5: cleanup only cancels speech — does not re-trigger on every dep change
  useEffect(() => {
    if (!isAnswered || isHangingUp) return;

    const interval = setInterval(() => setTimer(prev => prev + 1), 1000); // FIX #7: renamed to prev

    if ('speechSynthesis' in window) {
      forceStopSpeech();
      const speechText = t.speak(medicineName, instructions);
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.lang = getLocale();
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // FIX #2: Call via ref — startListening identity won't affect this effect
        if (!isHangingUpRef.current) {
          startListening();
        }
      };
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      clearInterval(interval);
      // FIX #5: Only cancel speech here, not on every dep change
      forceStopSpeech();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        // FIX #8: Clear the ref
        recognitionRef.current = null;
      }
    };
  }, [isAnswered, isHangingUp]); // FIX #2 & #4: startListening and t removed from deps

  const handleAccept = () => {
    setIsAnswered(true);
    onAccept();
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between py-10 md:py-16 transition-all duration-700 overflow-hidden ${
        isHangingUp ? 'opacity-0 scale-95 blur-lg' : 'opacity-100'
      }`}
    >
      {/* Immersive Background Effects */}
      {!isAnswered && !isHangingUp && (
        <div className="absolute inset-0 flex items-center justify-center -z-10 overflow-hidden">
          <div className="w-[140%] h-[140%] bg-blue-600/5 rounded-full animate-ping-slow"></div>
          <div className="absolute w-[100%] h-[100%] bg-blue-500/10 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Header Info */}
      <div className="text-center space-y-4 relative z-10 px-6 w-full max-w-lg">
        <div
          className={`w-24 h-24 md:w-32 md:h-32 bg-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl md:text-6xl shadow-[0_0_50px_rgba(37,99,235,0.4)] border-4 border-white/20 transition-all duration-700 ${
            isAnswered ? 'scale-75 opacity-60' : 'animate-bounce'
          }`}
        >
          {isHangingUp ? '💊' : '🤖'}
        </div>
        <div className="space-y-1">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter">
            {isHangingUp
              ? 'Finishing...'
              : isAnswered
              ? callerName
              : 'Priority Health Alert'}
          </h2>
          <p className="text-blue-400 text-sm md:text-base font-black uppercase tracking-[0.3em] opacity-90">
            {isAnswered && !isHangingUp
              ? `${t.answered} • ${Math.floor(timer / 60)}:${(timer % 60)
                  .toString()
                  .padStart(2, '0')}`
              : isHangingUp
              ? t.aiFinish
              : t.doseReminder}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-6 md:px-12 max-w-2xl overflow-hidden py-4">
        {isAnswered && !isHangingUp ? (
          <div className="w-full animate-in zoom-in-95 fade-in duration-700 text-center flex flex-col gap-6">
            {/* Medicine Info Card */}
            <div className="bg-white/5 backdrop-blur-3xl p-6 md:p-10 rounded-[3rem] border border-white/10 shadow-2xl space-y-6 md:space-y-8">
              <div className="space-y-2">
                <p className="text-blue-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] opacity-70">
                  {t.schedule}
                </p>
                <p className="text-white text-2xl md:text-4xl font-black tracking-tight">
                  {medicineName}
                </p>
                <p className="text-white/60 text-sm md:text-base">{dosage}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 text-left">
                <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Instructions</p>
                <p className="text-white/90 text-sm md:text-base leading-relaxed">{instructions}</p>
              </div>

              {/* Audio Visualizer */}
              <div className="flex items-end justify-center gap-1 h-16">
                {visualizerBars.map((height, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-75 ${
                      isSpeaking
                        ? 'bg-blue-400'
                        : isListening
                        ? 'bg-green-400'
                        : 'bg-white/20'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                ))}
              </div>

              {/* Status Label */}
              <p className="text-white/50 text-xs md:text-sm uppercase tracking-widest">
                {isSpeaking ? '🔊 Speaking...' : isListening ? `🎙️ ${t.listening}` : t.ask}
              </p>
            </div>
          </div>
        ) : !isHangingUp ? (
          /* Incoming call card */
          <div className="w-full text-center flex flex-col gap-4">
            <div className="bg-white/5 backdrop-blur-3xl p-6 rounded-[2rem] border border-white/10">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">{t.incoming}</p>
              <p className="text-white text-xl font-bold">{callerName}</p>
              <p className="text-blue-400 text-sm mt-1">{medicineName} — {dosage}</p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-8 md:gap-16 relative z-10 w-full px-6">
        {!isAnswered && !isHangingUp && (
          <>
            {/* Decline */}
            <button
              onClick={handleHangup}
              className="flex flex-col items-center gap-2 group"
              aria-label={t.decline}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-200 group-hover:scale-110 active:scale-95">
                📵
              </div>
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                {t.decline}
              </span>
            </button>

            {/* Accept */}
            <button
              onClick={handleAccept}
              className="flex flex-col items-center gap-2 group"
              aria-label={t.answer}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-[0_0_30px_rgba(34,197,94,0.4)] transition-all duration-200 group-hover:scale-110 active:scale-95 animate-pulse">
                📞
              </div>
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                {t.answer}
              </span>
            </button>
          </>
        )}

        {isAnswered && !isHangingUp && (
          <button
            onClick={handleHangup}
            className="flex flex-col items-center gap-2 group"
            aria-label={t.hangup}
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center text-2xl md:text-3xl shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all duration-200 group-hover:scale-110 active:scale-95">
              📵
            </div>
            <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">
              {t.hangup}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default IncomingCallUI;