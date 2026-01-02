
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

  const handleReadAll = () => {
    const medList = analysis.medicines.map(m => `${m.name}, ${m.dosage}, taken in the ${m.timing.join(' and ')}. ${m.instructions}`).join('. ');
    const fullText = `Here is your full schedule. ${analysis.summary}. Your medicines are: ${medList}.`;
    speak(fullText);
    onSetReminders('notification');
  };

  const getSlotTime = (slot: TimeOfDay) => {
    switch (slot) {
      case TimeOfDay.MORNING: return "8:00 AM";
      case TimeOfDay.AFTERNOON: return "2:00 PM";
      case TimeOfDay.EVENING: return "6:00 PM";
      case TimeOfDay.NIGHT: return "9:00 PM";
      default: return "your scheduled time";
    }
  };

  const toggleSchedule = (slot: TimeOfDay) => {
    const newScheduled = new Set(scheduledSlots);
    if (newScheduled.has(slot)) {
      newScheduled.delete(slot);
      const cancelText = `Okay, I've turned off the ${slot.toLowerCase()} call. You'll need to remember this one on your own.`;
      speak(cancelText);
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        text: cancelText,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    } else {
      newScheduled.add(slot);
      const slotMeds = analysis.medicines.filter(m => m.timing.includes(slot));
      const medNames = slotMeds.map(m => m.name).join(' and ');
      const timeStr = getSlotTime(slot);
      
      const confirmationText = slotMeds.length > 0 
        ? `I will call you at ${timeStr} for your ${slot.toLowerCase()} medicines: ${medNames}.`
        : `I will check in with a call at ${timeStr}.`;
      
      speak(confirmationText);
      const aiMsg: ChatMessage = {
        id: Date.now().toString(),
        text: confirmationText,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }
    setScheduledSlots(newScheduled);
    onSetReminders('voice');
  };

  // Get all slots that actually have medicines in them
  const relevantSlots = [
    TimeOfDay.MORNING,
    TimeOfDay.AFTERNOON,
    TimeOfDay.EVENING,
    TimeOfDay.NIGHT
  ].filter(slot => analysis.medicines.some(m => m.timing.includes(slot)));

  useEffect(() => {
    const welcome = `Hello! I've studied your prescription. ${analysis.summary}. I am your ${patientInfo?.condition} assistant. How can I help you today?`;
    setMessages([{
      id: 'welcome',
      text: welcome,
      sender: 'ai',
      timestamp: new Date()
    }]);
    if (autoSpeak) speak(welcome);
  }, [analysis, patientInfo]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: text,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsTyping(true);

    try {
      const aiResponse = await geminiService.askQuestion(text, analysis.medicines, patientInfo);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMsg]);
      if (autoSpeak) speak(aiResponse);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'err',
        text: "I am sorry, I missed that. Could you say it one more time?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const getMentionedMedicine = (text: string): Medicine | undefined => {
    return analysis.medicines.find(m => 
      text.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
    );
  };

  const quickReplies = [
    { label: "What is next?", icon: "⏰" },
    { label: "Check dose", icon: "💊" },
    { label: "Is it safe?", icon: "🛡️" },
    { label: "Explain again", icon: "🔁" }
  ];

  return (
    <div className="bg-white rounded-[3.5rem] border-4 border-blue-100 shadow-2xl overflow-hidden flex flex-col mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="p-8 bg-blue-600 text-white flex items-center justify-between border-b-4 border-blue-700/30">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className={`w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-4xl shadow-xl transition-all duration-500 ${isSpeaking ? 'scale-110 ring-4 ring-white/50' : ''}`}>
              🤖
            </div>
            {isSpeaking && (
              <span className="absolute -top-2 -right-2 flex h-6 w-6">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black leading-tight tracking-tight">Care Companion</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <p className="text-blue-100 text-sm font-black uppercase tracking-widest">
                {patientInfo?.condition} Specialist
              </p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setAutoSpeak(!autoSpeak);
            if (!autoSpeak) speak("Voice help enabled.");
            else window.speechSynthesis.cancel();
          }}
          className={`p-4 rounded-2xl transition-all border-2 ${autoSpeak ? 'bg-white text-blue-600 border-white' : 'bg-blue-700 text-blue-200 border-blue-500'}`}
        >
          {autoSpeak ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          )}
        </button>
      </div>

      <div ref={scrollRef} className="p-8 space-y-10 h-[500px] overflow-y-auto bg-slate-50/50 custom-scrollbar">
        {messages.map(msg => {
          const med = msg.sender === 'ai' ? getMentionedMedicine(msg.text) : undefined;
          return (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-4 duration-300`}>
              <div className={`max-w-[85%] p-8 rounded-[2.5rem] text-2xl font-bold shadow-lg relative ${
                msg.sender === 'ai' 
                  ? 'bg-white text-slate-800 border-2 border-slate-100 rounded-tl-none' 
                  : 'bg-blue-600 text-white rounded-tr-none shadow-blue-200'
              }`}>
                {msg.text}
                {med && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl border-2 border-slate-200 flex items-center gap-4 animate-in zoom-in duration-500">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-100 text-blue-600">
                      <span className="text-2xl">💊</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">{med.name}</p>
                      <p className="text-lg text-slate-700">{med.dosage} - {med.timing.join(', ')}</p>
                    </div>
                  </div>
                )}
              </div>
              <span className="mt-2 text-xs font-black text-slate-400 uppercase tracking-widest px-4">
                {msg.sender === 'ai' ? 'Assistant' : 'You'}
              </span>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 flex gap-3">
              <span className="w-4 h-4 bg-blue-400 rounded-full animate-bounce"></span>
              <span className="w-4 h-4 bg-blue-400 rounded-full animate-bounce delay-150"></span>
              <span className="w-4 h-4 bg-blue-400 rounded-full animate-bounce delay-300"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t-4 border-slate-100">
        <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
          {quickReplies.map((reply) => (
            <button
              key={reply.label}
              onClick={() => handleSendMessage(reply.label)}
              className="flex-shrink-0 px-6 py-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-lg border-2 border-blue-100 hover:bg-blue-100 transition-all flex items-center gap-3 active:scale-95"
            >
              <span className="text-2xl">{reply.icon}</span>
              {reply.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="flex gap-4">
          <input 
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 px-8 py-6 rounded-3xl bg-slate-100 border-4 border-transparent focus:border-blue-500 focus:bg-white outline-none text-2xl font-bold transition-all placeholder:text-slate-300 shadow-inner"
          />
          <button 
            type="submit"
            disabled={!userInput.trim() || isTyping}
            className="bg-blue-600 text-white px-10 rounded-3xl font-black text-2xl hover:bg-blue-700 active:scale-95 transition-all shadow-xl disabled:opacity-50"
          >
            SEND
          </button>
        </form>

        <div className="mt-8 border-t pt-8 space-y-6">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Call Reminders</h3>
             <button 
              onClick={handleReadAll}
              className="px-6 py-3 bg-indigo-50 text-indigo-700 rounded-2xl font-black text-sm flex items-center gap-2 border-2 border-indigo-100 hover:bg-indigo-100 transition-all"
             >
               <span>🗣️</span> Read All
             </button>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {relevantSlots.map(slot => {
               const isSet = scheduledSlots.has(slot);
               return (
                 <button 
                   key={slot}
                   onClick={() => toggleSchedule(slot)}
                   className={`p-6 rounded-[2rem] font-black text-lg flex flex-col items-center justify-center gap-2 transition-all border-4 ${
                     isSet 
                       ? 'bg-emerald-500 text-white border-emerald-300 shadow-xl' 
                       : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-emerald-300'
                   }`}
                 >
                   <span className="text-4xl">{isSet ? '✅' : '📞'}</span>
                   <span className="leading-tight">{slot} <br/><span className="text-xs opacity-70 uppercase">{isSet ? 'Set' : 'Off'}</span></span>
                 </button>
               );
             })}
           </div>
           
           {relevantSlots.length === 0 && (
             <p className="text-center text-slate-400 font-bold py-4">No specific times found in prescription.</p>
           )}
        </div>
      </div>
    </div>
  );
};

export default SmartChatbot;
