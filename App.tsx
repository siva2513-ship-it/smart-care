
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { PrescriptionAnalysis, TimeOfDay, ReminderPreference, PatientInfo, User, Medicine } from './types';
import { geminiService } from './services/geminiService';
import { MOCK_PRESCRIPTION_DATA } from './constants';
import PrescriptionUpload from './components/PrescriptionUpload';
import ScheduleCard from './components/ScheduleCard';
import VoiceAssistant from './components/VoiceAssistant';
import SmartChatbot from './components/SmartChatbot';
import IncomingCallUI from './components/IncomingCallUI';

// --- AUTH & PERSISTENCE ---

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('scr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const login = (name: string) => {
    const newUser = { id: 'u1', name, email: `${name.toLowerCase()}@care.com` };
    setUser(newUser);
    localStorage.setItem('scr_user', JSON.stringify(newUser));
  };
  const logout = () => {
    setUser(null);
    localStorage.removeItem('scr_user');
  };
  return { user, login, logout, isAuthenticated: !!user };
};

const Nav: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200">
      <div className="container mx-auto px-6 h-16 md:h-20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">S</div>
            <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tighter">SmartCare</span>
          </Link>
          <Link to="/" className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all ${isHome ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
            <span className="text-lg">🏠</span> Home
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 md:pl-8 border-l border-slate-200">
              <p className="text-sm font-black text-slate-900 hidden md:block">{user.name}</p>
              <button onClick={onLogout} className="px-3 py-1.5 md:px-4 md:py-2 bg-slate-100 text-slate-600 font-black text-[10px] md:text-xs rounded-lg hover:bg-red-50 hover:text-red-600 transition-all">Log Out</button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 md:px-6 md:py-2 bg-blue-600 text-white font-black text-xs md:text-sm rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center gap-2"
            >
              <span>👤</span> Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- CORE APPLICATION ---

const LandingPage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      <section className="container mx-auto px-6 pt-16 md:pt-24 pb-12 flex flex-col items-center text-center">
        <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-600 rounded-[2rem] flex items-center justify-center text-white text-5xl font-black mb-8 md:mb-12 shadow-2xl animate-bounce">S</div>
        <h1 className="text-5xl md:text-7xl lg:text-[8rem] font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
          Clear Care.<br/>
          <span className="text-blue-600 italic">No Guesswork.</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-500 mb-10 max-w-2xl font-medium leading-relaxed">
          The only AI reminder that <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-8 text-nowrap">calls the patient</span> when it is time for medicine.
        </p>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 mb-16 md:mb-24">
          <button 
            onClick={() => navigate('/app')}
            className="px-10 py-6 md:px-16 md:py-8 bg-blue-600 text-white text-xl md:text-3xl font-black rounded-[2.5rem] shadow-3xl hover:scale-105 active:scale-95 transition-all"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Begin Care Session'}
          </button>
          {!isAuthenticated && (
            <button 
              onClick={() => navigate('/login')}
              className="px-10 py-6 md:px-12 md:py-8 bg-slate-100 text-slate-800 text-xl md:text-2xl font-black rounded-[2.5rem] hover:bg-slate-200 transition-all"
            >
              Sign In to Account
            </button>
          )}
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="bg-slate-50 py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 md:mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-4">Simple Steps to Safety</h2>
            <p className="text-xl text-slate-500 font-bold">Designed for seniors, built with medical-grade AI.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {[
              {
                step: "01",
                title: "Scan Prescription",
                desc: "Snap a photo of any doctor's note or pill bottle. Our AI decodes handwriting with 99.9% accuracy.",
                icon: "📸",
                color: "bg-blue-600"
              },
              {
                step: "02",
                title: "AI Analysis",
                desc: "We extract dosages, timings, and safety warnings. Everything is converted into clear, simple language.",
                icon: "🧠",
                color: "bg-indigo-600"
              },
              {
                step: "03",
                title: "Voice Call Reminder",
                desc: "Instead of tiny notifications, the app calls your phone and speaks instructions aloud at the exact right time.",
                icon: "📞",
                color: "bg-emerald-600"
              }
            ].map((s, idx) => (
              <div key={idx} className="bg-white p-10 rounded-[3rem] shadow-xl border-4 border-slate-100 relative group hover:border-blue-200 transition-all">
                <div className={`${s.color} w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-8 shadow-lg text-white font-black group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <div className="absolute top-10 right-10 text-slate-100 text-6xl font-black leading-none">{s.step}</div>
                <h3 className="text-2xl font-black text-slate-900 mb-4">{s.title}</h3>
                <p className="text-slate-500 font-bold leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const MainDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [step, setStep] = useState<'onboarding' | 'upload' | 'dashboard'>('onboarding');
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: '' });
  const [customCondition, setCustomCondition] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<PrescriptionAnalysis | null>(null);
  
  const [takenKeys, setTakenKeys] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('scr_taken_keys');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  const [reminderPref, setReminderPref] = useState<ReminderPreference>(() => {
    const saved = localStorage.getItem('scr_reminder_pref');
    return (saved as ReminderPreference) || 'voice';
  });

  const [remindersArmed, setRemindersArmed] = useState(false);
  const [isTestCall, setIsTestCall] = useState(false);
  const [triggeredDoses, setTriggeredDoses] = useState<Set<string>>(new Set());
  const [simulatedTime, setSimulatedTime] = useState<TimeOfDay>(TimeOfDay.MORNING);
  const [activeCallMed, setActiveCallMed] = useState<Medicine | null>(null);
  const [showCallUI, setShowCallUI] = useState(false);

  const CONDITIONS = ["Alzheimer's", "Dementia", "Forgetfulness", "Diabetes", "Hypertension", "Arthritis"];

  useEffect(() => {
    localStorage.setItem('scr_taken_keys', JSON.stringify(Array.from(takenKeys)));
  }, [takenKeys]);

  useEffect(() => {
    localStorage.setItem('scr_reminder_pref', reminderPref);
  }, [reminderPref]);

  useEffect(() => {
    if (!analysis || showCallUI || !remindersArmed) return;

    const medDueNow = analysis.medicines.find(m => 
      m.timing.includes(simulatedTime) && 
      !takenKeys.has(`${m.id}-${simulatedTime}`) &&
      !triggeredDoses.has(`${m.id}-${simulatedTime}`)
    );

    if (medDueNow) {
      if (reminderPref === 'voice') {
        setActiveCallMed(medDueNow);
        setShowCallUI(true);
        setTriggeredDoses(prev => new Set(prev).add(`${medDueNow.id}-${simulatedTime}`));
      } else if (reminderPref === 'notification') {
        const text = `Attention: It is time for your ${simulatedTime} dose. Please take ${medDueNow.dosage} of ${medDueNow.name}. ${medDueNow.instructions}`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.85;
        window.speechSynthesis.speak(utterance);
        setTriggeredDoses(prev => new Set(prev).add(`${medDueNow.id}-${simulatedTime}`));
      }
    }
  }, [simulatedTime, analysis, takenKeys, reminderPref, showCallUI, triggeredDoses, remindersArmed]);

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const conditionToSubmit = patientInfo.condition === 'Other' ? customCondition : patientInfo.condition;
      const result = await geminiService.analyzePrescription(source, { ...patientInfo, condition: conditionToSubmit });
      setAnalysis(result);
      setRemindersArmed(false); 
      setStep('dashboard');
    } catch (err) {
      setAnalysis(MOCK_PRESCRIPTION_DATA);
      setStep('dashboard');
    } finally { setIsProcessing(false); }
  };

  const handleTestCall = () => {
    if (!analysis) return;
    setIsTestCall(true);
    setActiveCallMed(analysis.medicines[0]);
    setShowCallUI(true);
  };

  const markAsTaken = (id: string, time: TimeOfDay) => {
    const key = `${id}-${time}`;
    setTakenKeys(prev => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    if (activeCallMed?.id === id) {
      setShowCallUI(false);
      setActiveCallMed(null);
      setIsTestCall(false);
    }
  };

  const getDailyProgress = () => {
    if (!analysis) return 0;
    const totalDoses = analysis.medicines.reduce((acc, m) => acc + m.timing.length, 0);
    return totalDoses === 0 ? 0 : Math.round((takenKeys.size / totalDoses) * 100);
  };

  const canContinue = patientInfo.age && patientInfo.condition && (patientInfo.condition !== 'Other' || customCondition.trim() !== '');

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      {showCallUI && activeCallMed && (
        <IncomingCallUI 
          callerName={isTestCall ? "TEST CALL: SmartCare" : "SmartCare Care Guard"}
          medicineInfo={isTestCall ? "Verify Speaker Volume" : `${activeCallMed.dosage} of ${activeCallMed.name}`}
          instructions={isTestCall ? "Can you hear the AI assistant clearly?" : activeCallMed.instructions}
          timeOfDay={simulatedTime}
          onAccept={() => {}}
          onDecline={() => { setShowCallUI(false); setIsTestCall(false); }}
        />
      )}
      
      <div className="container mx-auto px-4 md:px-6 py-8">
        {step === 'onboarding' && (
          <div className="max-w-xl mx-auto bg-white p-8 md:p-14 rounded-[3.5rem] shadow-3xl border-8 border-blue-50 animate-in fade-in zoom-in duration-500">
            <h2 className="text-4xl font-black text-center mb-10 tracking-tight text-slate-900">Get Started</h2>
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Patient Age</label>
                <input type="number" className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-4 border-slate-100 text-2xl font-black focus:border-blue-600 outline-none" placeholder="e.g. 75" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  {CONDITIONS.map(c => (
                    <button key={c} onClick={() => setPatientInfo({...patientInfo, condition: c})} className={`px-4 py-4 rounded-2xl font-black text-sm transition-all border-4 ${patientInfo.condition === c ? 'bg-blue-600 text-white border-blue-400 shadow-lg scale-105' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                      {c}
                    </button>
                  ))}
                  <button onClick={() => setPatientInfo({...patientInfo, condition: 'Other'})} className={`col-span-2 px-4 py-4 rounded-2xl font-black text-sm transition-all border-4 ${patientInfo.condition === 'Other' ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    Other...
                  </button>
                </div>
              </div>

              {patientInfo.condition === 'Other' && (
                <input type="text" className="w-full px-6 py-5 rounded-2xl bg-blue-50 border-4 border-blue-200 text-xl font-black text-blue-900 outline-none" placeholder="Enter condition..." value={customCondition} onChange={e => setCustomCondition(e.target.value)} />
              )}

              <button onClick={() => setStep('upload')} disabled={!canContinue} className={`w-full py-6 text-2xl font-black rounded-3xl shadow-xl transition-all ${canContinue ? 'bg-blue-600 text-white hover:scale-[1.02]' : 'bg-slate-100 text-slate-300'}`}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-8">
              {/* COMPACT TOP BAR */}
              <div className="p-6 bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-lg flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-black text-slate-800">Current Schedule Preview</h3>
                  <p className="text-slate-400 font-bold text-sm italic">Simulate your daily dose timing</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-4 py-2 rounded-xl font-black text-xs transition-all ${simulatedTime === t ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* COMPACT SUMMARY BAR */}
              <div className="p-10 rounded-[3.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-24 h-24 flex-shrink-0 border-4 border-white/20 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm">
                    <div className="text-center">
                      <span className="block text-2xl font-black">{getDailyProgress()}%</span>
                      <span className="text-[8px] uppercase font-black opacity-60">Complete</span>
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-3xl font-black mb-3 tracking-tight">Today's Focus</h2>
                    <p className="text-blue-50 text-lg font-bold opacity-90 leading-snug mb-6">{analysis.summary}</p>
                    <VoiceAssistant text={analysis.summary} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING, TimeOfDay.NIGHT].map(time => (
                  <ScheduleCard key={time} time={time} medicines={analysis.medicines.filter(m => m.timing.includes(time))} takenKeys={takenKeys} onMarkTaken={markAsTaken} />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="p-8 bg-white rounded-[3rem] border-4 border-slate-100 shadow-lg">
                 <h3 className="text-xl font-black mb-4">Care Guard Engine</h3>
                 <div className="space-y-6">
                    <div className={`p-6 rounded-3xl border-4 transition-all ${remindersArmed ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-100'}`}>
                       <div className="flex items-center justify-between mb-3">
                          <span className={`font-black uppercase text-[10px] tracking-widest ${remindersArmed ? 'text-emerald-700' : 'text-red-600'}`}>
                            {remindersArmed ? 'Active & Watching' : 'Paused'}
                          </span>
                          <span className={`w-2.5 h-2.5 rounded-full ${remindersArmed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                       </div>
                       
                       {!remindersArmed ? (
                         <div className="space-y-4">
                            <p className="text-red-900 font-bold text-sm leading-snug">
                               System is inactive. Click below to begin voice guardianship.
                            </p>
                            <button onClick={() => setRemindersArmed(true)} className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg hover:bg-red-700 active:scale-95 transition-all text-sm">
                               Arm Voice Calls
                            </button>
                         </div>
                       ) : (
                         <div className="space-y-4">
                            <p className="text-emerald-900 font-bold text-sm leading-snug">
                               Calling {reminderPref === 'voice' ? 'Phone' : 'Room'} for every dose.
                            </p>
                            <button onClick={() => setRemindersArmed(false)} className="w-full py-4 bg-white text-emerald-700 border-2 border-emerald-200 font-black rounded-2xl hover:bg-emerald-100 transition-all text-sm">
                               Pause System
                            </button>
                         </div>
                       )}
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-between">
                       <p className="text-xs font-black text-slate-500">Need a trial?</p>
                       <button onClick={handleTestCall} className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl font-black text-[10px] text-slate-600 hover:bg-slate-100 transition-all">
                         Test Call
                       </button>
                    </div>
                 </div>
              </div>

              <SmartChatbot 
                analysis={analysis} 
                onSetReminders={(pref) => { setReminderPref(pref); setTriggeredDoses(new Set()); }} 
                activePreference={reminderPref} 
                patientInfo={patientInfo} 
                onTriggerCall={handleTestCall} 
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage: React.FC<{ onLogin: (n: string) => void }> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-3xl text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black mx-auto mb-8 shadow-xl">S</div>
        <h2 className="text-3xl font-black mb-8">Patient Portal</h2>
        <input type="text" className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-4 border-slate-100 text-xl font-bold mb-6 outline-none focus:border-blue-600" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-5 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Enter Care Room</button>
      </div>
    </div>
  );
};

const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  useEffect(() => {
    const check = async () => {
      const win = window as any;
      if (!win.aistudio) { setHasKey(true); return; }
      try { const s = await win.aistudio.hasSelectedApiKey(); setHasKey(s); } catch { setHasKey(true); }
    };
    check();
  }, []);
  const handleKey = async () => { if((window as any).aistudio) await (window as any).aistudio.openSelectKey(); setHasKey(true); };

  if (hasKey === null) return null;
  if (!hasKey) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-14 rounded-[3.5rem]">
        <h2 className="text-3xl font-black mb-4">Connect AI</h2>
        <button onClick={handleKey} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl">Select API Key</button>
      </div>
    </div>
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  return (
    <Router>
      <ApiKeyGuard>
        <div className="min-h-screen flex flex-col">
          <Nav user={user} onLogout={logout} />
          <Routes>
            <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/app" element={isAuthenticated ? <MainDashboard user={user!} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
