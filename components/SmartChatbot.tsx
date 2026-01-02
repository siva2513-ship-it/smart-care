
import React, { useEffect, useState, useRef } from 'react';
import { ChatMessage, PrescriptionAnalysis, ReminderPreference, PatientInfo, Medicine } from '../types';
import { geminiService } from '../services/geminiService';

interface SmartChatbotProps {
  analysis: PrescriptionAnalysis;
  onSetReminders: (pref: ReminderPreference) => void;
  activePreference: ReminderPreference | null;
  patientInfo?: PatientInfo;
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
    utterance.rate = 0.9;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const welcome = `I've analyzed the prescription. It contains ${analysis.medicines.length} items. Should I set up automatic Voice Calls or Read-Aloud reminders for these pills?`;
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
    speak(welcome);
  }, [analysis]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSetPreference = (pref: ReminderPreference) => {
    onSetReminders(pref);
    const msg = pref === 'voice' 
      ? "Understood. I've activated Guardian Mode. I will CALL you specifically at the scheduled time for each medication."
      : "Excellent. Assistant Mode is active. I will read your instructions aloud automatically whenever a pill is due.";
    
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
      setMessages(prev => [...prev, { id: 'err', text: "Connection error. Please contact medical services if this is an emergency.", sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[4rem] border-4 border-blue-100 shadow-2xl overflow-hidden flex flex-col">
      <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl transition-all ${isSpeaking ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.8)]' : ''}`}>🤖</div>
          <div>
            <h2 className="text-2xl font-black">Care Companion</h2>
            <p className="text-blue-200 text-sm font-black uppercase tracking-widest">Always Watching</p>
          </div>
        </div>
        {isSpeaking && (
          <button 
            onClick={stopSpeaking}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg"
          >
            <span className="transform rotate-[135deg]">📞</span>
            Hang Up
          </button>
        )}
      </div>

      <div ref={scrollRef} className="p-8 space-y-8 h-[350px] overflow-y-auto bg-slate-50/50 custom-scrollbar scroll-smooth">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-xl font-bold shadow-lg ${msg.sender === 'ai' ? 'bg-white text-slate-800 rounded-bl-none border-2 border-slate-100' : 'bg-blue-600 text-white rounded-br-none'}`}>
              {msg.text}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {msg.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black truncate max-w-[150px]">
                      {s.web.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex items-center gap-3 px-6 animate-pulse">
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full [animation-delay:0.2s]"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full [animation-delay:0.4s]"></div>
            <span className="text-blue-600 font-black text-sm uppercase ml-2 tracking-widest">Verifying safety...</span>
          </div>
        )}
      </div>

      <div className="p-6 bg-white border-t-4 border-slate-50">
         <div className="flex flex-col gap-4">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] px-2">Choose Reminder Sync Mode:</p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleSetPreference('voice')}
                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-[2rem] font-black transition-all border-4 ${activePreference === 'voice' ? 'bg-blue-600 text-white border-blue-400 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-blue-200'}`}
              >
                <span className="text-3xl">📞</span>
                <span>Voice Call</span>
              </button>
              <button 
                onClick={() => handleSetPreference('notification')}
                className={`flex-1 flex flex-col items-center gap-2 p-6 rounded-[2rem] font-black transition-all border-4 ${activePreference === 'notification' ? 'bg-amber-500 text-white border-amber-400 shadow-xl' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-amber-200'}`}
              >
                <span className="text-3xl">🗣️</span>
                <span>Read Aloud</span>
              </button>
            </div>
         </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="p-8 bg-slate-50 flex gap-4">
        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask about safety..." className="flex-1 px-8 py-5 rounded-[2rem] bg-white border-4 border-transparent focus:border-blue-600 outline-none text-xl font-bold shadow-sm" />
        <button className="bg-blue-600 text-white px-8 rounded-[2rem] font-black hover:bg-blue-700 shadow-xl active:scale-95 transition-all">Send</button>
      </form>
    </div>
  );
};

export default SmartChatbot;
