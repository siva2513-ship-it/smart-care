
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { ChatMessage, PrescriptionAnalysis, ReminderPreference, PatientInfo, Medicine, Language, UserRole } from '../types';
import { geminiService } from '../services/geminiService';

interface SmartChatbotProps {
  analysis: PrescriptionAnalysis;
  onSetReminders: (pref: ReminderPreference) => void;
  activePreference: ReminderPreference | null;
  patientInfo: PatientInfo;
  role: UserRole;
  lastCallEndedAt?: number | null;
  onTriggerCall?: () => void;
}

const SmartChatbot: React.FC<SmartChatbotProps> = ({ 
  analysis, 
  onSetReminders, 
  activePreference, 
  patientInfo, 
  role,
  lastCallEndedAt,
  onTriggerCall 
}) => {
  const [messages, setMessages] = useState<(ChatMessage & { sources?: any[], errorType?: 'key' | 'network' })[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string, te: string) => {
    if (patientInfo.language === 'hi') return hi;
    if (patientInfo.language === 'te') return te;
    return en;
  };

  const forceStopSpeech = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    forceStopSpeech();
    const utterance = new SpeechSynthesisUtterance(text);
    const locale = patientInfo.language === 'hi' ? 'hi-IN' : patientInfo.language === 'te' ? 'te-IN' : 'en-US';
    utterance.lang = locale;
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const unverifiedCount = analysis.medicines.filter(m => m.verificationStatus !== 'verified').length;
    
    let welcome = t(
      `Hi! I'm SmartCare AI. I've analyzed your medications. How can I help today?`,
      `नमस्ते! मैं स्मार्टकेयर एआई हूँ। मैंने आपकी दवाओं का विश्लेषण किया है। मैं आज आपकी क्या मदद कर सकता हूँ?`,
      `హలో! నేను స్మార్ట్‌కేర్ AI. మీ మందులను విశ్లేషించాను. నేను ఈరోజు ఎలా సహాయం చేయగలను?`
    );

    if (unverifiedCount > 0) {
      welcome += "\n\n⚠️ " + t(
        `Note: ${unverifiedCount} medications were partially illegible. Please check the actual packets carefully before consumption.`,
        `नोट: ${unverifiedCount} दवाएं आंशिक रूप से अपठनीय थीं। कृपया उपयोग करने से पहले दवा के पैकेट की जांच करें।`,
        `గమనిక: ${unverifiedCount} మందులు సరిగ్గా చదవబడలేదు. దయచేసి మందు వేసుకునే ముందు ప్యాకెట్ తనిఖీ చేయండి.`
      );
    }

    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
  }, [analysis, patientInfo.language]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() }]);
    setUserInput('');
    setIsTyping(true);

    try {
      const result = await geminiService.askQuestion(text, analysis.medicines, messages, patientInfo);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: result.text, sources: result.sources, sender: 'ai', timestamp: new Date() }]);
      speak(result.text);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      let errorType: 'key' | 'network' = 'network';
      let displayMsg = t("Connection failed.", "कनेक्शन विफल रहा।", "కనెక్షన్ విఫలమైంది.");

      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API_KEY_INVALID")) {
        errorType = 'key';
        displayMsg = t("AI session expired. Reconnect key.", "एआई सत्र समाप्त हो गया।", "AI సెషన్ గడువు ముగిసింది.");
      }

      setMessages(prev => [...prev, { id: Date.now().toString(), text: displayMsg, sender: 'ai', timestamp: new Date(), errorType }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[700px] transition-all">
      <div className="p-8 bg-slate-900 text-white flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-4xl shadow-2xl relative">
             🤖
             <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight">{t('Care AI', 'केयर एआई', 'కేర్ AI')}</h2>
            <div className="flex items-center gap-1.5">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{t('Safety Protocol Active', 'सुरक्षा प्रोटोकॉल सक्रिय', 'భద్రతా ప్రోటోకాల్ యాక్టివ్')}</span>
            </div>
          </div>
        </div>
        {isSpeaking && (
           <button onClick={forceStopSpeech} className="w-12 h-12 bg-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 animate-pulse">✕</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/30 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[90%] p-6 rounded-[2.5rem] text-[15px] font-bold whitespace-pre-wrap leading-relaxed shadow-sm ${
              msg.sender === 'ai' 
                ? (msg.errorType === 'key' ? 'bg-red-50 text-red-900 border-2 border-red-200' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none') 
                : 'bg-blue-600 text-white rounded-br-none'
            }`}>
              {msg.text}
              
              {msg.errorType === 'key' && (
                <button onClick={async () => await (window as any).aistudio?.openSelectKey()} className="mt-5 w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95">
                  Reconnect System 🔑
                </button>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 px-6 animate-pulse">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Processing query...</span>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="relative">
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            placeholder={t('Ask about your medication...', 'अपनी दवा के बारे में पूछें...', 'మీ మందుల గురించి అడగండి...')} 
            className="w-full pl-8 pr-20 py-6 rounded-[2rem] bg-slate-50 border-2 border-slate-200 outline-none font-bold text-lg focus:border-blue-600 transition-all shadow-inner" 
          />
          <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center shadow-lg">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SmartChatbot;
