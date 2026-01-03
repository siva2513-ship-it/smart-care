
import React, { useEffect, useState, useRef } from 'react';
import { ChatMessage, PrescriptionAnalysis, ReminderPreference, PatientInfo, Medicine, Language } from '../types';
import { geminiService } from '../services/geminiService';

interface SmartChatbotProps {
  analysis: PrescriptionAnalysis;
  onSetReminders: (pref: ReminderPreference) => void;
  activePreference: ReminderPreference | null;
  patientInfo: PatientInfo;
  onTriggerCall?: () => void;
}

const SmartChatbot: React.FC<SmartChatbotProps> = ({ analysis, onSetReminders, activePreference, patientInfo, onTriggerCall }) => {
  const [messages, setMessages] = useState<(ChatMessage & { sources?: any[], errorType?: 'key' | 'safety' | 'network' | 'quota' })[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [welcomeSpoken, setWelcomeSpoken] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string, te: string) => {
    if (patientInfo.language === 'hi') return hi;
    if (patientInfo.language === 'te') return te;
    return en;
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
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
      `Hi! I'm your SmartCare AI. I've analyzed your ${analysis.medicines.length} medicines. Ask me anything about them!`,
      `नमस्ते! मैं आपका स्मार्टकेयर एआई हूँ। मैंने आपकी ${analysis.medicines.length} दवाओं का विश्लेषण किया है।`,
      `హలో! నేను మీ స్మార్ట్‌కేర్ AI. మీ ${analysis.medicines.length} మందులను విశ్లేషించాను.`
    );
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
  }, [analysis, patientInfo.language]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleReconnectKey = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const win = window as any;
    if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
      await win.aistudio.openSelectKey();
      handleSendMessage(t("The key is re-connected. Please answer my previous question.", "कुंजी पुनः कनेक्ट हो गई है। कृपया मेरे पिछले प्रश्न का उत्तर दें।", "కీ మళ్లీ కనెక్ట్ చేయబడింది. దయచేసి నా మునుపటి ప్రశ్నకు సమాధానం ఇవ్వండి."));
    }
  };

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
      let errorType: any = 'network';
      let displayMsg = t("I'm having trouble connecting to the healthcare server.", "सर्वर से जुड़ने में समस्या हो रही है।", "సర్వర్‌కు కనెక్ట్ చేయడంలో సమస్య ఉంది.");

      if (errorMsg.includes("Requested entity was not found") || errorMsg.includes("API_KEY_INVALID")) {
        errorType = 'key';
        displayMsg = t("Your AI key has disconnected. Please reconnect to continue our medical session.", "आपकी एआई कुंजी डिस्कनेक्ट हो गई है। कृपया पुनः कनेक्ट करें।", "మీ AI కీ డిస్‌కనెక్ట్ అయింది. దయచేసి మళ్లీ కనెక్ట్ చేయండి.");
      }

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: displayMsg, 
        sender: 'ai', 
        timestamp: new Date(), 
        errorType: errorType 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[650px] transition-all">
      <div className="p-7 bg-slate-900 text-white flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/20 relative">
             🤖
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">{t('Health Safety Assistant', 'स्वास्थ्य सुरक्षा सहायक', 'ఆరోగ్య రక్షణ సహాయకుడు')}</h2>
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('Clinical AI Active', 'क्लिनिकल एआई सक्रिय', 'క్లినికల్ AI సక్రియంగా ఉంది')}</span>
          </div>
        </div>
        {isSpeaking && (
           <button onClick={() => window.speechSynthesis.cancel()} className="w-10 h-10 bg-red-600/20 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 animate-pulse">✕</button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-2`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] text-[14px] font-bold leading-relaxed shadow-sm ${
              msg.sender === 'ai' ? (msg.errorType === 'key' ? 'bg-red-50 text-red-900 border-red-200' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none') : 'bg-blue-600 text-white rounded-br-none'
            }`}>
              {msg.text}
              
              {msg.errorType === 'key' && (
                <button 
                  onClick={handleReconnectKey}
                  className="mt-4 w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95"
                >
                  Reconnect Key 🔑
                </button>
              )}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="text-sm">🔍</span> {t('Verified Sources', 'सत्यापित स्रोत', 'ధృవీకరించబడిన మూలాధారాలు')}
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {msg.sources.map((s, i) => s.web && (
                      <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-white transition-all group">
                        <span className="text-[11px] font-black text-slate-600 truncate">{s.web.title}</span>
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
          <div className="flex items-center gap-2 px-4 animate-pulse">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Consulting Database...', 'डेटाबेस परामर्श...', 'డేటాబేస్ సంప్రదిస్తోంది...')}</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {[
            { l: t('Side Effects', 'दुष्प्रभाव', 'దుష్ప్రభావాలు'), q: 'What are common side effects?' },
            { l: t('Interactions', 'पारस्परिक क्रिया', 'పరస్పర చర్యలు'), q: 'Do these medicines interact?' },
            { l: t('Diet', 'आहार', 'ఆహారం'), q: 'Any food restrictions?' }
          ].map((chip, i) => (
            <button key={i} onClick={() => handleSendMessage(chip.q)} className="whitespace-nowrap px-5 py-2.5 bg-blue-50 text-blue-600 rounded-full text-[11px] font-black uppercase tracking-wider border border-blue-100 hover:bg-blue-600 hover:text-white transition-all">✨ {chip.l}</button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="relative">
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            placeholder={t('Ask about your meds...', 'अपनी दवाओं के बारे में पूछें...', 'మీ మందుల గురించి అడగండి...')} 
            className="w-full pl-6 pr-16 py-5 rounded-[1.8rem] bg-slate-50 border-2 border-slate-200 outline-none font-bold text-sm focus:border-blue-600 transition-all" 
          />
          <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-slate-900 text-white rounded-2xl hover:bg-blue-600 transition-all">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
          </button>
        </form>
        <p className="text-[9px] font-bold text-slate-300 mt-4 text-center tracking-widest uppercase">{t('Always verify AI medical advice with your provider', 'हमेशा अपने डॉक्टर से एआई सलाह सत्यापित करें', 'AI సలహాను ఎల్లప్పుడూ వైద్యుడితో ధృవీకరించుకోండి')}</p>
      </div>
    </div>
  );
};

export default SmartChatbot;
