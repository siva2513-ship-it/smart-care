
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

    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let welcome = "";
    if (patientInfo.language === 'hi') {
      welcome = `मैंने पर्चे का विश्लेषण कर लिया है। इसमें ${analysis.medicines.length} दवाएं हैं। क्या मुझे इन गोलियों के लिए स्वचालित वॉयस कॉल या जोर से पढ़ने वाले रिमाइंडर सेट करने चाहिए?`;
    } else if (patientInfo.language === 'te') {
      welcome = `నేను ప్రిస్క్రిప్షన్‌ను విశ్లేషించాను. ఇందులో ${analysis.medicines.length} మందులు ఉన్నాయి. నేను ఈ మందుల కోసం ఆటోమేటిక్ వాయిస్ కాల్‌లు లేదా రిమైండర్‌లను సెట్ చేయాలా?`;
    } else {
      welcome = `I've analyzed the prescription. It contains ${analysis.medicines.length} items. Should I set up automatic Voice Calls or Read-Aloud reminders for these pills?`;
    }
    
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
    speak(welcome);
  }, [analysis, patientInfo.language]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSetPreference = (pref: ReminderPreference) => {
    onSetReminders(pref);
    let msg = "";
    if (patientInfo.language === 'hi') {
      msg = pref === 'voice' 
        ? "समझ गया। मैंने गार्डियन मोड सक्रिय कर दिया है। मैं प्रत्येक दवा के निर्धारित समय पर आपको विशेष रूप से कॉल करूँगा।"
        : "बहुत बढ़िया। असिस्टेंट मोड सक्रिय है। जब भी कोई गोली खानी होगी, मैं आपके निर्देश स्वतः ही जोर से पढ़ूँगा।";
    } else if (patientInfo.language === 'te') {
      msg = pref === 'voice' 
        ? "అర్థమైంది. నేను గార్డియన్ మోడ్‌ని యాక్టివేట్ చేసాను. ప్రతి మందు కోసం షెడ్యూల్ చేసిన సమయానికి నేను మీకు ప్రత్యేకంగా కాల్ చేస్తాను."
        : "చాలా బాగుంది. అసిస్టెంట్ మోడ్ యాక్టివ్‌గా ఉంది. ఏదైనా మందు తీసుకోవలసినప్పుడు నేను మీ సూచనలను స్వయంచాలకంగా బిగ్గరగా చదువుతాను.";
    } else {
      msg = pref === 'voice' 
        ? "Understood. I've activated Guardian Mode. I will CALL you specifically at the scheduled time for each medication."
        : "Excellent. Assistant Mode is active. I will read your instructions aloud automatically whenever a pill is due.";
    }
    
    setMessages(prev => [...prev, { id: Date.now().toString(), text: msg, sender: 'ai', timestamp: new Date() }]);
    speak(msg);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const newUserMessage: ChatMessage = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    const currentHistory = [...messages];
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsTyping(true);

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
      const errorMsg = patientInfo.language === 'hi' ? "कनेक्शन त्रुटि।" : patientInfo.language === 'te' ? "కనెక్షన్ లోపం." : "Connection error.";
      setMessages(prev => [...prev, { id: 'err', text: errorMsg, sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  const t = (en: string, hi: string, te: string) => {
    if (patientInfo.language === 'hi') return hi;
    if (patientInfo.language === 'te') return te;
    return en;
  };

  return (
    <div className="bg-white rounded-[2.5rem] border-4 border-blue-100 shadow-xl overflow-hidden flex flex-col">
      <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl">🤖</div>
          <div>
            <h2 className="text-sm font-black">{t('Care Companion', 'केयर साथी', 'కేర్ కంపానియన్')}</h2>
            <p className="text-blue-200 text-[8px] font-black uppercase tracking-widest">{t('Always Watching', 'हमेशा चौकस', 'ఎల్లప్పుడూ గమనిస్తూ')}</p>
          </div>
        </div>
        {isSpeaking && (
          <button 
            onClick={stopSpeaking}
            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest transition-all flex items-center gap-1 shadow-md"
          >
            <span className="transform rotate-[135deg]">📞</span>
            {t('Hang Up', 'फोन काटें', 'ఫోన్ ఆపు')}
          </button>
        )}
      </div>

      <div ref={scrollRef} className="p-4 space-y-4 h-[250px] overflow-y-auto bg-slate-50/50 custom-scrollbar scroll-smooth">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-bold shadow-sm ${msg.sender === 'ai' ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100' : 'bg-blue-600 text-white rounded-br-none'}`}>
              {msg.text}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                  {msg.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="text-[7px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-black truncate max-w-[100px]">
                      {s.web.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-1.5 px-2 animate-pulse">
            <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full [animation-delay:0.2s]"></div>
            <div className="w-1 h-1 bg-blue-600 rounded-full [animation-delay:0.4s]"></div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
         <div className="flex flex-col gap-2">
            <p className="text-slate-400 font-black text-[7px] uppercase tracking-widest px-1">{t('Reminder Mode:', 'रिमाइंडर मोड:', 'రిమైండర్ మోడ్:')}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSetPreference('voice')}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl font-black text-[9px] transition-all border ${activePreference === 'voice' ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
              >
                <span className="text-lg">📞</span>
                <span>{t('Voice Call', 'वॉयस कॉल', 'వాయిస్ కాల్')}</span>
              </button>
              <button 
                onClick={() => handleSetPreference('notification')}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl font-black text-[9px] transition-all border ${activePreference === 'notification' ? 'bg-amber-500 text-white border-amber-400 shadow-md' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
              >
                <span className="text-lg">🗣️</span>
                <span>{t('Read Aloud', 'ज़ोर से बोलें', 'గట్టిగా చదువు')}</span>
              </button>
            </div>
         </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="p-3 bg-slate-50 flex gap-2">
        <input 
          type="text" 
          value={userInput} 
          onChange={(e) => setUserInput(e.target.value)} 
          placeholder={t('Ask a question...', 'एक प्रश्न पूछें...', 'ఒక ప్రశ్న అడగండి...')} 
          className="flex-1 px-4 py-2 rounded-xl bg-white border border-slate-200 outline-none text-xs font-bold" 
        />
        <button className="bg-blue-600 text-white px-4 rounded-xl font-black text-xs hover:bg-blue-700 active:scale-95 transition-all">Send</button>
      </form>
    </div>
  );
};

export default SmartChatbot;
