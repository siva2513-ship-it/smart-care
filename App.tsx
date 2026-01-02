
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
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md group-hover:rotate-12 transition-transform">S</div>
            <span className="text-xl font-black text-slate-800 tracking-tighter">SmartCare</span>
          </Link>
          <Link to="/" className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${isHome ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
            🏠 Home
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <p className="text-xs font-black text-slate-900 hidden sm:block">{user.name}</p>
              <button onClick={onLogout} className="px-3 py-1.5 bg-slate-100 text-slate-600 font-black text-[10px] rounded-lg hover:bg-red-50 hover:text-red-600 transition-all">Log Out</button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="px-4 py-1.5 bg-blue-600 text-white font-black text-xs rounded-xl hover:bg-blue-700 shadow-sm transition-all"
            >
              Sign In
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
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Medical AI Companion</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black text-slate-900 leading-[0.95] tracking-tighter mb-8">
          Healthcare <span className="text-blue-600">Simpler</span><br/>
          than a Phone Call.
        </h1>
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-xl font-medium leading-relaxed">
          The only prescription reminder that <strong>calls the patient</strong> to speak instructions aloud. No more missed doses or confusion.
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-12 py-6 bg-blue-600 text-white text-xl font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all mb-20"
        >
          {isAuthenticated ? 'Go to My Dashboard' : 'Start Your Free Session'}
        </button>

        {/* SIMPLIFIED HOW IT WORKS */}
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📸", title: "Scan", desc: "Prescription Scan", color: "bg-blue-600" },
              { icon: "🧠", title: "Analyze", desc: "AI Safety Logic", color: "bg-indigo-600" },
              { icon: "📞", title: "Remind", desc: "Voice Call Alert", color: "bg-emerald-600" }
            ].map((step, idx) => (
              <div key={idx} className="flex flex-col items-center p-8 rounded-[3rem] bg-slate-50 border-2 border-slate-100 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xl group">
                <div className={`${step.color} w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl mb-6 shadow-xl group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">{step.desc}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 text-slate-200 text-4xl">→</div>
                )}
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
  const [reminderPref, setReminderPref] = useState<ReminderPreference>('voice');
  const [remindersArmed, setRemindersArmed] = useState(false);
  const [isTestCall, setIsTestCall] = useState(false);
  const [simulatedTime, setSimulatedTime] = useState<TimeOfDay>(TimeOfDay.MORNING);
  const [activeCallMed, setActiveCallMed] = useState<Medicine | null>(null);
  const [showCallUI, setShowCallUI] = useState(false);

  const CONDITIONS = ["Alzheimer's", "Dementia", "Diabetes", "Hypertension", "Arthritis"];

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const conditionToSubmit = patientInfo.condition === 'Other' ? customCondition : patientInfo.condition;
      const result = await geminiService.analyzePrescription(source, { ...patientInfo, condition: conditionToSubmit });
      setAnalysis(result);
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
    setTakenKeys(prev => {
      const next = new Set(prev);
      next.add(`${id}-${time}`);
      return next;
    });
  };

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      {showCallUI && activeCallMed && (
        <IncomingCallUI 
          callerName={isTestCall ? "TEST: Care Assistant" : "SmartCare Guard"}
          medicineInfo={`${activeCallMed.dosage} of ${activeCallMed.name}`}
          instructions={activeCallMed.instructions}
          timeOfDay={simulatedTime}
          onAccept={() => {}}
          onDecline={() => { setShowCallUI(false); setIsTestCall(false); }}
        />
      )}
      
      <div className="container mx-auto px-4 py-6">
        {step === 'onboarding' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3.5rem] shadow-2xl border-4 border-blue-50">
            <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">Step 1: Context</h2>
            <div className="space-y-6">
              <input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold outline-none" placeholder="Patient Age (e.g. 80)" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              <select className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold outline-none appearance-none" value={patientInfo.condition} onChange={e => setPatientInfo({...patientInfo, condition: e.target.value})}>
                <option value="">Select Primary Condition</option>
                {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="Other">Other...</option>
              </select>
              <button onClick={() => setStep('upload')} disabled={!patientInfo.age || !patientInfo.condition} className="w-full py-5 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-xl disabled:opacity-30">Next Step</button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            {/* COMPACT LEFT COLUMN */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">📋</div>
                  <div>
                    <h3 className="font-black text-slate-900 leading-tight">Patient Dashboard</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{analysis.medicines.length} Active Meds</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${simulatedTime === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING, TimeOfDay.NIGHT].map(time => (
                  <ScheduleCard 
                    key={time} 
                    time={time} 
                    medicines={analysis.medicines.filter(m => m.timing.includes(time))} 
                    takenKeys={takenKeys} 
                    onMarkTaken={markAsTaken} 
                  />
                ))}
              </div>
            </div>

            {/* COMPACT RIGHT COLUMN */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-[2.5rem] shadow-xl">
                <h4 className="text-lg font-black mb-3">AI Briefing</h4>
                <p className="text-blue-50 text-sm font-bold leading-snug mb-4 opacity-90">{analysis.summary}</p>
                <VoiceAssistant text={analysis.summary} />
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-sm">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-slate-900">Safety Guard</h4>
                    <span className={`w-2 h-2 rounded-full ${remindersArmed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                 </div>
                 <button 
                  onClick={() => setRemindersArmed(!remindersArmed)}
                  className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${remindersArmed ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-blue-600 text-white shadow-lg'}`}
                 >
                   {remindersArmed ? 'Guard Active' : 'Enable Voice Guard'}
                 </button>
                 <button onClick={handleTestCall} className="w-full mt-3 py-3 text-slate-400 font-black text-[10px] uppercase hover:text-blue-600 transition-colors">Run Test Call</button>
              </div>

              <SmartChatbot 
                analysis={analysis} 
                onSetReminders={setReminderPref} 
                activePreference={reminderPref} 
                patientInfo={patientInfo} 
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center border-4 border-blue-50">
        <h2 className="text-2xl font-black mb-6">Patient Portal</h2>
        <input type="text" className="w-full px-6 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-lg font-bold mb-4 outline-none" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg">Enter Care Room</button>
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-xs bg-white p-10 rounded-[3rem] text-center">
        <h2 className="text-2xl font-black mb-6">Connect AI</h2>
        <button onClick={handleKey} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black">Select API Key</button>
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
        <Nav user={user} onLogout={logout} />
        <Routes>
          <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="/app" element={isAuthenticated ? <MainDashboard user={user!} /> : <Navigate to="/login" />} />
        </Routes>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
