
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { PrescriptionAnalysis, TimeOfDay, ReminderPreference, PatientInfo, User } from './types';
import { geminiService } from './services/geminiService';
import { MOCK_PRESCRIPTION_DATA } from './constants';
import PrescriptionUpload from './components/PrescriptionUpload';
import ScheduleCard from './components/ScheduleCard';
import VoiceAssistant from './components/VoiceAssistant';
import SmartChatbot from './components/SmartChatbot';
import IncomingCallUI from './components/IncomingCallUI';

// --- AUTH MOCK ---
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

// --- API KEY GUARD ---
const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Extremely defensive check for window.aistudio
      const win = window as any;
      if (!win.aistudio || typeof win.aistudio.hasSelectedApiKey !== 'function') {
        console.debug("aistudio utility not available in this environment");
        setHasKey(true);
        return;
      }

      try {
        const selected = await win.aistudio.hasSelectedApiKey();
        setHasKey(selected);
      } catch (e) {
        console.warn("API key check failed:", e);
        setHasKey(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const win = window as any;
    if (win.aistudio && typeof win.aistudio.openSelectKey === 'function') {
      try {
        await win.aistudio.openSelectKey();
      } catch (e) {
        console.error("Failed to open key selector:", e);
      }
    }
    setHasKey(true);
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-16 h-16 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8">🔐</div>
          <h2 className="text-3xl font-black text-slate-900 mb-4">Connect Gemini</h2>
          <p className="text-slate-500 font-medium mb-8">
            To provide medical OCR and voice guidance, this app requires an API Key.
          </p>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-blue-600 font-bold block mb-8 underline">
            Learn about API billing
          </a>
          <button 
            onClick={handleSelectKey}
            className="w-full py-6 bg-blue-600 text-white rounded-2xl text-xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95"
          >
            Select API Key
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// --- NAVIGATION ---
const Nav: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => (
  <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">S</div>
        <span className="text-2xl font-black text-slate-800 tracking-tighter">SmartCare</span>
      </Link>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="font-bold text-slate-600 hover:text-blue-600 transition-colors text-sm">How it Works</a>
          <a href="#support" className="font-bold text-slate-600 hover:text-blue-600 transition-colors text-sm">Support</a>
        </div>
        
        {user ? (
          <div className="flex items-center gap-4 pl-8 border-l border-slate-200">
            <p className="hidden sm:block text-sm font-black text-slate-900">{user.name}</p>
            <button 
              onClick={onLogout}
              className="px-4 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-lg hover:bg-red-50 hover:text-red-600 transition-all"
            >
              Log Out
            </button>
          </div>
        ) : (
          <Link to="/login" className="px-6 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-md text-sm">
            Sign In
          </Link>
        )}
      </div>
    </div>
  </nav>
);

// --- DASHBOARD ---
const MainDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [step, setStep] = useState<'onboarding' | 'upload' | 'dashboard'>('onboarding');
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: 'Alzheimer\'s' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<PrescriptionAnalysis | null>(null);
  const [reminderPref, setReminderPref] = useState<ReminderPreference | null>(null);
  const [takenKeys, setTakenKeys] = useState<Set<string>>(new Set());
  const [showCallUI, setShowCallUI] = useState(false);

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const result = await geminiService.analyzePrescription(source, patientInfo);
      setAnalysis(result);
      setStep('dashboard');
    } catch (err: any) {
      console.error("AI Error:", err);
      const win = window as any;
      if ((err.message?.includes("API key not found") || err.message?.includes("Requested entity was not found")) && win.aistudio) {
        await win.aistudio.openSelectKey();
        return;
      }
      setAnalysis(MOCK_PRESCRIPTION_DATA);
      setStep('dashboard');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCallAccepted = () => {
    const medList = analysis?.medicines.map(m => `${m.dosage} of ${m.name}`).join(' and ');
    const text = `Hello. It is time for your medicine. You should take ${medList}. I'll stay on the line until you confirm.`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.75;
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="min-h-screen pb-24">
      {showCallUI && (
        <IncomingCallUI 
          callerName="Smart Care Assistant"
          medicineInfo={analysis ? `${analysis.medicines[0].dosage} of ${analysis.medicines[0].name}` : "Your Daily Dose"}
          onAccept={handleCallAccepted}
          onDecline={() => setShowCallUI(false)}
        />
      )}

      <div className="container mx-auto px-6 py-12">
        {step === 'onboarding' && (
          <div className="max-w-2xl mx-auto bg-white p-14 rounded-[4.5rem] shadow-3xl border-8 border-blue-50 animate-in zoom-in duration-500">
            <h2 className="text-5xl font-black text-center mb-10 tracking-tight">Create Profile</h2>
            <div className="space-y-10">
              <div>
                <label className="block text-2xl font-black text-slate-700 mb-4">Patient Age</label>
                <input 
                  type="number" 
                  className="w-full px-10 py-7 rounded-3xl bg-slate-50 border-4 border-slate-100 text-3xl font-black focus:border-blue-600 focus:bg-white outline-none transition-all shadow-inner"
                  value={patientInfo.age}
                  onChange={e => setPatientInfo({...patientInfo, age: e.target.value})}
                  placeholder="e.g. 75"
                />
              </div>
              <div>
                <label className="block text-2xl font-black text-slate-700 mb-4">Primary Condition</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {['Alzheimer\'s', 'Dementia', 'Vision Loss', 'General Aging'].map(c => (
                    <button 
                      key={c}
                      onClick={() => setPatientInfo({...patientInfo, condition: c})}
                      className={`py-6 rounded-3xl text-2xl font-black border-4 transition-all ${patientInfo.condition === c ? 'bg-blue-600 text-white border-blue-400 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setStep('upload')}
                disabled={!patientInfo.age}
                className="w-full py-8 bg-blue-600 text-white text-3xl font-black rounded-[2.5rem] shadow-2xl hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                Let's Continue
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-6xl font-black mb-16 tracking-tighter">Scan Prescription</h2>
            <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />
          </div>
        )}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-12">
              <div className="p-14 rounded-[4.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-3xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-20">
                   <svg className="w-48 h-48" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/></svg>
                </div>
                <h2 className="text-5xl font-black mb-8 tracking-tight">Daily Care Plan</h2>
                <p className="text-blue-50 text-2xl font-bold leading-relaxed opacity-95 mb-12 max-w-2xl">{analysis.summary}</p>
                <VoiceAssistant text={analysis.summary} />
              </div>

              <SmartChatbot 
                analysis={analysis} 
                onSetReminders={setReminderPref} 
                activePreference={reminderPref} 
                patientInfo={patientInfo} 
                onTriggerCall={() => setShowCallUI(true)}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING, TimeOfDay.NIGHT].map(time => (
                  <ScheduleCard 
                    key={time} 
                    time={time} 
                    medicines={analysis.medicines.filter(m => m.timing.includes(time))} 
                    takenKeys={takenKeys}
                    onMarkTaken={(id, t) => setTakenKeys(prev => new Set(prev).add(`${id}-${t}`))}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-10">
              <div className="bg-white p-12 rounded-[4rem] border-8 border-slate-50 shadow-2xl">
                <h4 className="text-2xl font-black mb-10 text-slate-400 uppercase tracking-widest">Support Desk</h4>
                <div className="space-y-6">
                  <button onClick={() => setShowCallUI(true)} className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-between group shadow-xl active:scale-95 transition-all">
                    <span>Quick Call</span>
                    <span className="text-4xl group-hover:animate-bounce">📞</span>
                  </button>
                  <button onClick={() => setStep('upload')} className="w-full p-8 bg-blue-50 text-blue-700 rounded-[2.5rem] font-black text-2xl flex items-center justify-between hover:bg-blue-100 transition-all border-4 border-blue-100/50">
                    <span>New Scan</span>
                    <span className="text-4xl">📸</span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-400 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
                <h4 className="text-3xl font-black mb-6 tracking-tight">Family View</h4>
                <p className="font-black text-amber-950 text-xl leading-relaxed opacity-80 mb-8">
                  Daughter Rose and Caretaker Sam are active and watching.
                </p>
                <div className="flex -space-x-4">
                  <div className="w-16 h-16 rounded-3xl bg-white border-4 border-amber-400 flex items-center justify-center font-black text-xl shadow-lg transition-transform hover:-translate-y-2">R</div>
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 border-4 border-amber-400 flex items-center justify-center font-black text-xl text-blue-600 shadow-lg transition-transform hover:-translate-y-2">S</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <h1 className="text-7xl md:text-[8rem] font-black text-slate-900 leading-[0.9] tracking-tighter mb-10">
              Clear Care. <br />
              <span className="text-blue-600 italic">No Confusion.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-500 mb-14 font-medium leading-relaxed max-w-2xl">
              SmartCare uses Gemini Pro to turn complex doctor notes into friendly voice reminders for your loved ones.
            </p>
            <button 
              onClick={() => navigate('/app')}
              className="px-14 py-7 bg-blue-600 text-white text-2xl font-black rounded-[2.5rem] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
            >
              Start Care Session
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

const LoginPage: React.FC<{ onLogin: (name: string) => void }> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name);
      navigate('/app');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-3xl border-4 border-blue-50 text-center animate-in zoom-in duration-500">
        <h2 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h2>
        <p className="text-slate-500 font-bold mb-12">Sign in to manage your health schedule.</p>
        <form onSubmit={handleLogin} className="space-y-6">
          <input 
            type="text" 
            required 
            placeholder="What's your name?" 
            className="w-full px-8 py-6 rounded-2xl bg-slate-50 border-4 border-slate-100 text-2xl font-bold focus:border-blue-600 focus:bg-white outline-none transition-all placeholder:text-slate-300 shadow-inner"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <button className="w-full py-7 bg-blue-600 text-white text-2xl font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all active:scale-95">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <Router>
      <ApiKeyGuard>
        <div className="min-h-screen flex flex-col">
          <Nav user={user} onLogout={logout} />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route 
              path="/app" 
              element={isAuthenticated ? <MainDashboard user={user!} /> : <Navigate to="/login" />} 
            />
          </Routes>
        </div>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
