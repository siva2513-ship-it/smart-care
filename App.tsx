
import React, { useState, useEffect } from 'react';
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
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
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Elderly Care Companion</span>
        </div>
        <h1 className="text-6xl md:text-[7rem] font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
          Care that <span className="text-blue-600">Speaks</span><br/>
          for itself.
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl font-medium leading-relaxed">
          The only AI prescription tool that decodes doctor handwriting and <strong>calls the patient</strong> to explain their medication in plain English.
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-14 py-8 bg-blue-600 text-white text-2xl font-black rounded-[2.5rem] shadow-2xl hover:scale-105 active:scale-95 transition-all mb-24"
        >
          {isAuthenticated ? 'Enter Dashboard' : 'Start Free Session'}
        </button>

        {/* Simplified "How it Works" - High Visual Impact */}
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: "📸", 
                title: "Scan", 
                desc: "Prescription Scan", 
                sub: "Take a photo of any prescription note.",
                color: "bg-blue-600" 
              },
              { 
                icon: "🧠", 
                title: "Analyze", 
                desc: "AI Medical Safety", 
                sub: "AI decodes handwriting and checks for safety.",
                color: "bg-indigo-600" 
              },
              { 
                icon: "📞", 
                title: "Remind", 
                desc: "Voice Call Alert", 
                sub: "The app calls your phone when it's time to take your pill.",
                color: "bg-emerald-600" 
              }
            ].map((step, idx) => (
              <div key={idx} className="relative p-10 rounded-[3.5rem] bg-slate-50 border-2 border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-2xl transition-all">
                <div className={`${step.color} w-24 h-24 rounded-[2rem] flex items-center justify-center text-5xl mb-8 shadow-xl group-hover:rotate-6 transition-transform mx-auto md:mx-0`}>
                  {step.icon}
                </div>
                <h3 className="text-3xl font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-blue-600 font-black uppercase text-[11px] tracking-[0.2em] mb-4">{step.desc}</p>
                <p className="text-slate-500 font-bold leading-snug">{step.sub}</p>
                {idx < 2 && (
                  <div className="hidden md:block absolute right-[-40px] top-1/2 -translate-y-1/2 text-slate-200 text-4xl font-black z-10">→</div>
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
  const [simulatedTime, setSimulatedTime] = useState<TimeOfDay>(TimeOfDay.MORNING);
  const [activeCallMed, setActiveCallMed] = useState<Medicine | null>(null);
  const [showCallUI, setShowCallUI] = useState(false);

  const CONDITIONS = ["Alzheimer's", "Dementia", "Forgetfulness", "Diabetes", "Hypertension"];

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

  const triggerCall = (med: Medicine) => {
    setActiveCallMed(med);
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
          callerName="SmartCare Safety Guard"
          medicineInfo={`${activeCallMed.dosage} of ${activeCallMed.name}`}
          instructions={activeCallMed.instructions}
          timeOfDay={simulatedTime}
          onAccept={() => {}}
          onDecline={() => setShowCallUI(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-8">
        {step === 'onboarding' && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-blue-50 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">Who is this for?</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Patient Age</label>
                <input type="number" className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-slate-100 text-2xl font-black focus:border-blue-600 outline-none" placeholder="e.g. 82" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Primary Concern</label>
                <select className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-slate-100 text-xl font-black focus:border-blue-600 outline-none appearance-none" value={patientInfo.condition} onChange={e => setPatientInfo({...patientInfo, condition: e.target.value})}>
                  <option value="">Select Condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  <option value="Other">Other...</option>
                </select>
              </div>
              <button 
                onClick={() => setStep('upload')} 
                disabled={!patientInfo.age || !patientInfo.condition} 
                className="w-full py-6 bg-blue-600 text-white text-2xl font-black rounded-[2rem] shadow-xl disabled:opacity-20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Scan Prescription
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
            {/* Dashboard: Left Column (Schedule - Compact) */}
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] border-4 border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Patient Dashboard</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Care Session</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl border-2 border-slate-200">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${simulatedTime === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
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

            {/* Dashboard: Right Column (Controls & AI - Compact) */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-[3rem] shadow-xl">
                 <h4 className="text-lg font-black mb-4 flex items-center gap-2">
                   <span className="text-2xl">🧠</span> AI Health Summary
                 </h4>
                 <p className="text-blue-50 text-base font-bold leading-relaxed mb-6 opacity-90">{analysis.summary}</p>
                 <VoiceAssistant text={analysis.summary} />
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border-4 border-slate-100 shadow-sm">
                 <div className="flex items-center justify-between mb-4 px-2">
                    <h4 className="font-black text-slate-900 text-sm">Guard Mode</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${remindersArmed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{remindersArmed ? 'Armed' : 'Inactive'}</span>
                    </div>
                 </div>
                 <button 
                  onClick={() => setRemindersArmed(!remindersArmed)}
                  className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${remindersArmed ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-blue-600 text-white shadow-lg shadow-blue-200'}`}
                 >
                   {remindersArmed ? 'Stop Guard' : 'Start Voice Guard'}
                 </button>
                 <button 
                   onClick={() => triggerCall(analysis.medicines[0])}
                   className="w-full mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                 >
                   Test Emergency Call
                 </button>
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
      <div className="max-w-sm w-full bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border-4 border-blue-50">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-8 shadow-xl">S</div>
        <h2 className="text-3xl font-black mb-8 tracking-tighter">Enter Care Room</h2>
        <input type="text" className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-bold mb-6 outline-none focus:border-blue-600" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-5 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all">Sign In</button>
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
      <div className="max-w-md bg-white p-14 rounded-[4rem]">
        <h2 className="text-3xl font-black mb-6">Connect Healthcare AI</h2>
        <button onClick={handleKey} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl shadow-xl">Activate API Key</button>
        <p className="mt-6 text-slate-400 font-bold">This enables medical-grade handwriting analysis.</p>
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
