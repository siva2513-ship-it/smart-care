
import React, { useEffect, useState, useRef } from 'react';
import { ChatMessage, PrescriptionAnalysis, ReminderPreference, PatientInfo, Medicine, TimeOfDay } from '../types';
import { geminiService } from '../services/geminiService';

interface SmartChatbotProps {
  analysis: PrescriptionAnalysis;
  onSetReminders: (pref: ReminderPreference) => void;
  activePreference: ReminderPreference | null;
  patientInfo?: PatientInfo;
  onTriggerCall?: () => void;
}

const SmartChatbot: React.FC<SmartChatbotProps> = ({ analysis, onSetReminders, activePreference, patientInfo, onTriggerCall }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [scheduledSlots, setScheduledSlots] = useState<Set<TimeOfDay>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const speak = (text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  };

  const toggleSchedule = (slot: TimeOfDay) => {
    const newScheduled = new Set(scheduledSlots);
    if (newScheduled.has(slot)) {
      newScheduled.delete(slot);
      speak(`I've cancelled your ${slot.toLowerCase()} call.`);
    } else {
      newScheduled.add(slot);
      const slotMeds = analysis.medicines.filter(m => m.timing.includes(slot));
      const medNames = slotMeds.map(m => m.name).join(' and ');
      speak(`Great. I will call you for your ${slot.toLowerCase()} ${medNames}.`);
    }
    setScheduledSlots(newScheduled);
    onSetReminders('voice');
  };

  const relevantSlots = [
    TimeOfDay.MORNING,
    TimeOfDay.AFTERNOON,
    TimeOfDay.EVENING,
    TimeOfDay.NIGHT
  ].filter(slot => analysis.medicines.some(m => m.timing.includes(slot)));

  useEffect(() => {
    const welcome = `Hello! I've studied your prescription. ${analysis.summary}. I am your ${patientInfo?.condition} assistant. How can I help you?`;
    setMessages([{
      id: 'welcome',
      text: welcome,
      sender: 'ai',
      timestamp: new Date()
    }]);
    if (autoSpeak) speak(welcome);
  }, [analysis]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);
    try {
      const aiResponse = await geminiService.askQuestion(text, analysis.medicines, patientInfo);
      const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      if (autoSpeak) speak(aiResponse);
    } catch (err) {
      setMessages(prev => [...prev, { id: 'err', text: "I missed that. Can you repeat?", sender: 'ai', timestamp: new Date() }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] border-4 border-blue-100 shadow-2xl overflow-hidden flex flex-col mb-10">
      <div className="p-8 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className={`w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl transition-all ${isSpeaking ? 'scale-110' : ''}`}>🤖</div>
          <div>
            <h2 className="text-2xl font-black">Care Companion</h2>
            <p className="text-blue-200 text-sm font-bold uppercase tracking-widest">{patientInfo?.condition} Guide</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="p-8 space-y-8 h-[400px] overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {messages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-6 rounded-[2rem] text-xl font-bold shadow-lg ${msg.sender === 'ai' ? 'bg-white text-slate-800' : 'bg-blue-600 text-white'}`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-8 bg-white border-t-4 border-slate-50">
        <div className="mb-8">
           <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Voice Schedule</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {relevantSlots.map(slot => (
               <button 
                 key={slot}
                 onClick={() => toggleSchedule(slot)}
                 className={`relative w-full p-8 rounded-[2.5rem] border-4 transition-all active:scale-95 flex flex-col items-center justify-center gap-2 group ${
                   scheduledSlots.has(slot) 
                     ? 'bg-emerald-50 border-emerald-500 shadow-emerald-100' 
                     : 'bg-white border-slate-100 hover:border-blue-200 shadow-lg'
                 }`}
               >
                 <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 flex items-center justify-center text-2xl transition-transform ${scheduledSlots.has(slot) ? 'scale-125' : 'group-hover:rotate-12'}`}>
                       {scheduledSlots.has(slot) ? '✅' : (
                         <img src="https://img.icons8.com/3d-fluency/94/phone-disconnected.png" alt="phone" className="w-10 h-10 drop-shadow-md" />
                       )}
                    </div>
                    <span className="text-2xl font-black text-slate-800">Schedule {slot} Call</span>
                 </div>
                 {scheduledSlots.has(slot) && (
                   <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">Active Reminder</span>
                 )}
               </button>
             ))}
           </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="flex gap-4">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 px-8 py-5 rounded-3xl bg-slate-100 border-4 border-transparent focus:border-blue-600 outline-none text-xl font-bold transition-all"
          />
          <button className="bg-blue-600 text-white px-8 rounded-3xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all">Send</button>
        </form>
      </div>
    </div>
  );
};

export default SmartChatbot;
