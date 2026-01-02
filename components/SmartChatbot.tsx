
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
    const welcome = `I've analyzed your prescription. ${analysis.summary}. How are you feeling right now? Any new dizziness or headaches?`;
    setMessages([{ id: 'welcome', text: welcome, sender: 'ai', timestamp: new Date() }]);
    speak(welcome);
  }, [analysis]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() }]);
    setUserInput('');
    setIsTyping(true);
    try {
      const result = await geminiService.askQuestion(text, analysis.medicines, patientInfo);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: result.text, sources: result.sources, sender: 'ai', timestamp: new Date() }]);
      speak(result.text);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', text: "I'm having a little trouble connecting. Please check with your doctor if you're feeling unwell.", sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[4rem] border-4 border-blue-100 shadow-2xl overflow-hidden flex flex-col">
      <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-all ${isSpeaking ? 'scale-110' : ''}`}>🤖</div>
          <div>
            <h2 className="text-2xl font-black">Safety Companion</h2>
            <p className="text-blue-200 text-sm font-black uppercase tracking-widest">Always Active</p>
          </div>
        </div>
        <button onClick={onTriggerCall} className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-2xl font-black text-sm transition-all">Emergency Call</button>
      </div>

      <div ref={scrollRef} className="p-8 space-y-8 h-[450px] overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2.5rem] text-xl font-bold shadow-lg ${msg.sender === 'ai' ? 'bg-white text-slate-800 rounded-bl-none' : 'bg-blue-600 text-white rounded-br-none'}`}>
              {msg.text}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                  {msg.sources.map((s, i) => s.web && (
                    <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-black hover:bg-slate-200 truncate max-w-[150px]">
                      Source: {s.web.title}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-blue-600 font-black animate-pulse px-6 text-xl">Companion is checking sources...</div>}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="p-8 bg-white border-t-4 border-slate-50 flex gap-4">
        <input type="text" value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Ask about side effects or how to take this..." className="flex-1 px-8 py-6 rounded-3xl bg-slate-100 border-4 border-transparent focus:border-blue-600 outline-none text-xl font-bold transition-all shadow-inner" />
        <button className="bg-blue-600 text-white px-10 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all active:scale-95">Send</button>
      </form>
    </div>
  );
};

export default SmartChatbot;
