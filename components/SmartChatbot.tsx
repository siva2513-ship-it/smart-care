
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
  const [messages, setMessages] = useState<(ChatMessage & { sources?: any[] })[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = (en: string, hi: string, te: string) => {
    if (patientInfo.language === 'hi') return hi;
    if (patientInfo.language === 'te') return te;
    return en;
  };

  const QUICK_CHIPS = [
    { label: t("Side Effects", "दुष्प्रभाव", "దుష్ప్రభావాలు"), query: t("What are the side effects of these medicines?", "इन दवाओं के दुष्प्रभाव क्या हैं?", "ఈ మందుల వల్ల కలిగే దుష్ప్రభావాలు ఏమిటి?") },
    { label: t("Missed Dose?", "खुराक छूट गई?", "డోస్ మిస్ అయ్యారా?"), query: t("What should I do if I miss a dose?", "अगर मेरी खुराक छूट जाए तो मुझे क्या करना चाहिए?", "నేను డోస్ మిస్ అయితే ఏమి చేయాలి?") },
    { label: t("Diet Rules", "आहार नियम", "ఆహార నియమాలు"), query: t("Are there any food restrictions for these pills?", "क्या इन गोलियों के लिए कोई भोजन प्रतिबंध हैं?", "ఈ మాత్రల కోసం ఏవైనా ఆహార నియమాలు ఉన్నాయా?") }
  ];

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    switch (patientInfo.language) {
      case 'hi': utterance.lang = 'hi-IN'; break;
      case 'te': utterance.lang = 'te-IN'; break;
      default: utterance.lang = 'en-US'; break;
    }

    utterance.rate = 0.95;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let welcome = "";
    if (patientInfo.language === 'hi') {
      welcome = `नमस्ते, मैं आपका स्मार्टकेयर असिस्टेंट हूँ। मैंने आपके पर्चे में ${analysis.medicines.length} दवाएं देखी हैं। क्या आप इनके बारे में कुछ पूछना चाहते हैं?`;
    } else if (patientInfo.language === 'te') {
      welcome = `నమస్కారం, నేను మీ స్మార్ట్‌కేర్ అసిస్టెంట్‌ని. మీ ప్రిస్క్రిప్షన్‌లో ${analysis.medicines.length} మందులను నేను చూశాను. మీరు వీటి గురించి ఏదైనా అడగాలనుకుంటున్నారా?`;
    } else {
      welcome = `Hello, I'm your SmartCare assistant. I've noted ${analysis.medicines.length} medications in your prescription. How can I help you stay safe today?`;
    }
    
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
    speak(welcome);
  }, [analysis, patientInfo.language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const newUserMessage: ChatMessage = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsTyping(true);
    stopSpeaking();

    try {
      const result = await geminiService.askQuestion(text, analysis.medicines, currentHistory, patientInfo);
      setMessages(prev => [...prev, { 
        id: (Date.now() + 1).toString(), 
        text: result.text, 
        sources: result.sources, 
        sender: 'ai', 
        timestamp: new Date() 
      }]);
      speak(result.text);
    } catch (err) {
      const errorMsg = t("I'm having trouble connecting. Please check your internet.", "कनेक्शन में समस्या आ रही है।", "కనెక్షన్ సమస్య ఉంది.");
      setMessages(prev => [...prev, { id: 'err', text: errorMsg, sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[600px] transition-all">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20">🤖</div>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight">{t('Health AI Assistant', 'स्वास्थ्य एआई सहायक', 'ఆరోగ్య AI సహాయకుడు')}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{t('Always Online', 'हमेशा ऑनलाइन', 'ఎల్లప్పుడూ ఆన్‌లైన్')}</span>
            </div>
          </div>
        </div>
        {isSpeaking && (
           <button onClick={stopSpeaking} className="flex items-center gap-3 px-4 py-2 bg-red-600/10 border border-red-500/30 rounded-xl hover:bg-red-600 transition-all group">
              <div className="flex gap-1 h-3 items-end">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-1 bg-red-500 animate-voice-pulse" style={{ height: `${40 + Math.random()*60}%`, animationDelay: `${i*0.1}s` }}></div>
                ))}
              </div>
              <span className="text-[10px] font-black uppercase text-red-500 group-hover:text-white">{t('Mute', 'चुप करें', 'మ్యూట్')}</span>
           </button>
        )}
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 p-6 space-y-6 overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'} group animate-in slide-in-from-bottom-2 duration-300`}>
            {msg.sender === 'ai' && (
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">{t('Assistant', 'सहायक', 'సహాయకుడు')}</span>
            )}
            <div className={`max-w-[85%] p-5 rounded-3xl text-[13px] font-bold leading-relaxed shadow-sm transition-all ${
              msg.sender === 'ai' 
                ? 'bg-white text-slate-800 rounded-bl-none border border-slate-200' 
                : 'bg-blue-600 text-white rounded-br-none shadow-blue-200'
            }`}>
              {msg.text}
              
              {/* Citations / Grounding */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('Medical Evidence', 'चिकित्सा प्रमाण', 'వైద్య ఆధారాలు')}</p>
                  <div className="flex flex-col gap-1.5">
                    {msg.sources.map((s, i) => s.web && (
                      <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-300 hover:bg-white transition-all">
                        <span className="text-[10px] font-black text-slate-600 truncate mr-4">{s.web.title}</span>
                        <span className="text-[10px] text-blue-600 shrink-0">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1.5 px-4 animate-pulse">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-200 rounded-full"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">{t('AI is thinking...', 'AI सोच रहा है...', 'AI ఆలోచిస్తోంది...')}</span>
          </div>
        )}
      </div>

      {/* Quick Action Chips */}
      <div className="px-6 py-3 bg-white border-t border-slate-100">
         <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_CHIPS.map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(chip.query)}
                disabled={isTyping}
                className="whitespace-nowrap px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100 hover:bg-blue-600 hover:text-white transition-all active:scale-90 shrink-0"
              >
                ✨ {chip.label}
              </button>
            ))}
         </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} 
          className="relative flex items-center"
        >
          <input 
            type="text" 
            value={userInput} 
            onChange={(e) => setUserInput(e.target.value)} 
            placeholder={t('Ask about side effects, safety...', 'दुष्प्रभाव, सुरक्षा के बारे में पूछें...', 'దుష్ప్రభావాలు, భద్రత గురించి అడగండి...')} 
            className="w-full pl-6 pr-16 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 outline-none text-sm font-bold focus:border-blue-600 transition-all placeholder:text-slate-300" 
            disabled={isTyping}
          />
          <button 
            type="submit"
            disabled={!userInput.trim() || isTyping}
            className={`absolute right-2 p-3 rounded-xl transition-all ${
              !userInput.trim() || isTyping 
                ? 'bg-slate-100 text-slate-300' 
                : 'bg-slate-900 text-white hover:bg-blue-600 shadow-lg active:scale-90'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="text-[8px] font-bold text-slate-300 mt-4 text-center uppercase tracking-widest">{t('AI may provide incorrect medical advice. Consult your doctor.', 'एआई गलत सलाह दे सकता है। डॉक्टर से सलाह लें।', 'AI తప్పుడు సలహా ఇవ్వవచ్చు. వైద్యుడిని సంప్రదించండి.')}</p>
      </div>
    </div>
  );
};

export default SmartChatbot;
