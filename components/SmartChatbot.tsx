
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
    const welcome = t(
      `Hi! I'm SmartCare AI. I've analyzed your ${analysis.medicines.length} medications. How can I help?`,
      `नमस्ते! मैं स्मार्टकेयर एआई हूँ। मैंने आपकी ${analysis.medicines.length} दवाओं का विश्लेषण किया है।`,
      `హలో! నేను స్మార్ట్‌కేర్ AI. మీ ${analysis.medicines.length} మందులను విశ్లేషించాను.`
    );
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
  }, [analysis, patientInfo.language]);

  // Handle call end trigger
  useEffect(() => {
    if (lastCallEndedAt) {
      forceStopSpeech();
      const callEndMsg = t(
        "I've updated your logs after our call. Is there anything else you'd like to ask about your medication?",
        "हमारी कॉल के बाद मैंने आपके लॉग अपडेट कर दिए हैं। क्या आप अपनी दवा के बारे में कुछ और पूछना चाहेंगे?",
        "మా కాల్ తర్వాత నేను మీ లాగ్‌లను అప్‌డేట్ చేసాను. మీ మందుల గురించి మీరు ఇంకా ఏమైనా అడగాలనుకుంటున్నారా?"
      );
      setMessages(prev => [...prev, { id: `call-end-${lastCallEndedAt}`, text: callEndMsg, sender: 'ai', timestamp: new Date() }]);
    }
  }, [lastCallEndedAt, t, forceStopSpeech]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleReconnectKey = async () => {
    const win = window as any;
    if (win.aistudio?.openSelectKey) {
      await win.aistudio.openSelectKey();
      handleSendMessage(t("System reconnected. Ready.", "सिस्टम पुनः कनेक्ट हो गया।", "సిస్టమ్ మళ్లీ కనెక్ట్ చేయబడింది."));
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    // Access Check - Child cannot see prescription details/diagnosis
    const lowerText = text.toLowerCase();
    if (role === 'CHILD' && (lowerText.includes('prescription') || lowerText.includes('diagnosis') || lowerText.includes('doctor notes'))) {
      const restrictedMsg = "I'm sorry, but this information is restricted based on your access level.";
      setMessages(prev => [...prev, 
        { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() },
        { id: (Date.now() + 1).toString(), text: restrictedMsg, sender: 'ai', timestamp: new Date() }
      ]);
      return;
    }

    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() }]);
    setUserInput('');
    setIsTyping(true);

    try {
      const filteredMeds = role === 'CHILD' ? [] : analysis.medicines;
      const result = await geminiService.askQuestion(text, filteredMeds, messages, patientInfo);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: result.text, sources: result.sources, sender: 'ai', timestamp: new Date() }]);
      speak(result.text);
    } catch (err: any) {
      const errorMsg = err?.message || String(err);
      let errorType: 'key' | 'network' = 'network';
      let displayMsg = t("Connection failed. Try again.", "कनेक्शन विफल रहा।", "కనెక్షన్ విఫలమైంది.");

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
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('Clinical Support Active', 'क्लिनिकल सहायता सक्रिय', 'క్లినికల్ సపోర్ట్ యాక్టివ్')}</span>
          </div>
        </div>
        {isSpeaking && (
           <button onClick={forceStopSpeech} className="w-12 h-12 bg-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 animate-pulse">✕</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-8 space-y-8 overflow-y-auto bg-slate-50/30 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[90%] p-6 rounded-[2.5rem] text-[15px] font-bold leading-relaxed shadow-sm ${
              msg.sender === 'ai' 
                ? (msg.errorType === 'key' ? 'bg-red-50 text-red-900 border-2 border-red-200' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none') 
                : 'bg-blue-600 text-white rounded-br-none'
            }`}>
              {msg.text}
              
              {msg.errorType === 'key' && (
                <button onClick={handleReconnectKey} className="mt-5 w-full py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl active:scale-95">
                  Reconnect System 🔑
                </button>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <span className="text-sm">🛡️</span> {t('Clinical Evidence', 'नैदानिक प्रमाण', 'క్లినికల్ సాక్ష్యం')}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.sources.map((s, i) => s.web && (
                      <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:bg-white transition-all group">
                        <span className="text-xs font-black text-slate-600 truncate">{s.web.title}</span>
                        <span className="text-blue-600 group-hover:translate-x-1 transition-transform">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
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
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Verifying health data...</span>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-slate-100">
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="relative">
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            placeholder={t('Ask a health question...', 'स्वास्थ्य संबंधी प्रश्न पूछें...', 'ఆరోగ్య ప్రశ్న అడగండి...')} 
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
