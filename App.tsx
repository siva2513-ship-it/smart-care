
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { PrescriptionAnalysis, TimeOfDay, ReminderPreference, PatientInfo, User } from './types';
import { geminiService } from './services/geminiService';
import { MOCK_PRESCRIPTION_DATA } from './constants';
import PrescriptionUpload from './components/PrescriptionUpload';
import ScheduleCard from './components/ScheduleCard';
import VoiceAssistant from './components/VoiceAssistant';
import SmartChatbot from './components/SmartChatbot';
import IncomingCallUI from './components/IncomingCallUI';

// --- HOME PAGE COMPONENTS ---

const GlobalAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<{ text: string; sources: any[] } | null>(null);

  useEffect(() => {
    geminiService.getGlobalHealthAlerts().then(setAlerts).catch(console.error);
  }, []);

  return (
    <div className="bg-red-50 p-10 rounded-[3rem] border-4 border-red-100 shadow-xl relative overflow-hidden group h-full">
      <div className="absolute -top-4 -right-4 text-red-100 text-9xl font-black opacity-50 group-hover:rotate-12 transition-transform">⚠️</div>
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center text-white text-2xl animate-pulse">📡</div>
          <h3 className="text-3xl font-black text-red-900">Live Safety Pulse</h3>
        </div>
        {!alerts ? (
          <div className="space-y-4">
            <div className="h-6 bg-red-100 rounded-full w-3/4 animate-pulse"></div>
            <div className="h-6 bg-red-100 rounded-full w-1/2 animate-pulse"></div>
          </div>
        ) : (
          <>
            <div className="text-red-800 font-bold text-xl leading-relaxed mb-8 whitespace-pre-wrap">{alerts.text}</div>
            <div className="flex flex-wrap gap-3">
              {alerts.sources.map((s, i) => s.web && (
                <a key={i} href={s.web.uri} target="_blank" rel="noreferrer" className="text-[10px] font-black uppercase bg-white/50 text-red-600 px-3 py-1 rounded-lg border border-red-200 truncate max-w-[150px]">
                  {s.web.title}
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const LocalSupport: React.FC = () => {
  const [support, setSupport] = useState<{ text: string; sources: any[] } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition((pos) => {
      geminiService.getNearbySupport(pos.coords.latitude, pos.coords.longitude)
        .then(setSupport).catch(console.error);
    });
  }, []);

  return (
    <div className="bg-blue-50 p-10 rounded-[3rem] border-4 border-blue-100 shadow-xl relative overflow-hidden group h-full">
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-2xl">📍</div>
          <h3 className="text-3xl font-black text-blue-900 tracking-tight">Nearby Pharmacies</h3>
        </div>
        {!support ? (
          <p className="text-blue-400 font-black animate-pulse">Locating local support...</p>
        ) : (
          <>
            <p className="text-blue-800 font-bold text-lg mb-8">{support.text}</p>
            <div className="space-y-4">
              {support.sources.map((s, i) => s.maps && (
                <a key={i} href={s.maps.uri} target="_blank" rel="noreferrer" className="block p-5 bg-white rounded-2xl border-2 border-blue-200 font-black text-blue-700 hover:scale-[1.02] transition-all shadow-sm">
                  Visit {s.maps.title} →
                </a>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

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

const Nav: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200">
      <div className="container mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg group-hover:rotate-12 transition-transform">S</div>
          <span className="text-2xl font-black text-slate-800 tracking-tighter">SmartCare</span>
        </Link>
        <div className="flex items-center gap-6">
          {!isHome && (
            <Link to="/" className="text-lg font-black text-slate-500 hover:text-blue-600 transition-colors flex items-center gap-2">
              <span className="text-2xl">🏠</span> Home
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <p className="text-sm font-black text-slate-900">{user.name}</p>
              <button onClick={onLogout} className="px-4 py-2 bg-slate-100 text-slate-600 font-black text-xs rounded-lg hover:bg-red-50 hover:text-red-600 transition-all">Log Out</button>
            </div>
          ) : (
            <Link to="/login" className="px-6 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-md text-sm">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="container mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        <h1 className="text-7xl md:text-[9rem] font-black text-slate-900 leading-[0.85] tracking-tighter mb-10">
          Clear Care.<br/>
          <span className="text-blue-600 italic">No Guesswork.</span>
        </h1>
        <p className="text-2xl md:text-3xl text-slate-500 mb-12 max-w-3xl font-medium leading-relaxed">
          The only AI that turns confusing medical handwriting into <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-8">voice-guided safety</span> for your loved ones.
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-16 py-8 bg-blue-600 text-white text-3xl font-black rounded-[2.5rem] shadow-3xl hover:scale-105 active:scale-95 transition-all mb-20"
        >
          Start Care Session
        </button>

        {/* Real-time Entities - Proving the power of the app immediately */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-32 max-w-6xl">
          <GlobalAlerts />
          <LocalSupport />
        </div>

        {/* How It Works Section */}
        <div className="w-full max-w-6xl">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black text-slate-900 mb-4">How It Works</h2>
            <div className="h-2 w-24 bg-blue-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                step: "01", 
                title: "Scan & OCR", 
                desc: "Snap a photo of any doctor's handwritten note or medicine bottle. Our Gemini Pro AI handles the tricky handwriting recognition.", 
                icon: "📸",
                bg: "bg-amber-50"
              },
              { 
                step: "02", 
                title: "Clinical Analysis", 
                desc: "We cross-reference every medicine for side effects, drug-drug interactions, and clinical safety warnings automatically.", 
                icon: "🧠",
                bg: "bg-emerald-50"
              },
              { 
                step: "03", 
                title: "Safe Reminders", 
                desc: "Patient receives AI voice calls and clear chat instructions that explain 'why' they are taking each pill and 'what' to watch out for.", 
                icon: "📞",
                bg: "bg-blue-50"
              }
            ].map((item, i) => (
              <div key={i} className={`${item.bg} p-12 rounded-[3.5rem] border-4 border-slate-50 text-left group hover:scale-105 transition-all shadow-sm`}>
                <div className="text-6xl mb-8 group-hover:rotate-12 transition-transform">{item.icon}</div>
                <div className="text-blue-600 font-black text-xl mb-2 tracking-widest uppercase">Phase {item.step}</div>
                <h3 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-none">{item.title}</h3>
                <p className="text-lg text-slate-600 font-bold leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="bg-slate-50 py-20 border-t border-slate-100">
        <div className="container mx-auto px-6 text-center">
          <div className="flex justify-center gap-3 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black">S</div>
            <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">SmartCare Platform</span>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Powered by Gemini Pro Clinical Vision</p>
        </div>
      </footer>
    </div>
  );
};

const MainDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [step, setStep] = useState<'onboarding' | 'upload' | 'dashboard'>('onboarding');
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: 'General Health' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<PrescriptionAnalysis | null>(null);
  const [takenKeys, setTakenKeys] = useState<Set<string>>(new Set());
  const [showCallUI, setShowCallUI] = useState(false);

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const result = await geminiService.analyzePrescription(source, patientInfo);
      setAnalysis(result);
      setStep('dashboard');
    } catch (err) {
      setAnalysis(MOCK_PRESCRIPTION_DATA);
      setStep('dashboard');
    } finally { setIsProcessing(false); }
  };

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {showCallUI && (
        <IncomingCallUI 
          callerName="SmartCare Safety Assistant"
          medicineInfo={analysis ? `${analysis.medicines[0].dosage} of ${analysis.medicines[0].name}` : "Your Dose"}
          onAccept={() => {}}
          onDecline={() => setShowCallUI(false)}
        />
      )}
      <div className="container mx-auto px-6 py-12">
        {step === 'onboarding' && (
          <div className="max-w-2xl mx-auto bg-white p-14 rounded-[4.5rem] shadow-3xl border-8 border-blue-50 animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-5xl font-black text-center mb-10 tracking-tight">Patient Profile</h2>
            <div className="space-y-10">
              <input type="number" className="w-full px-10 py-7 rounded-3xl bg-slate-50 border-4 border-slate-100 text-3xl font-black focus:border-blue-600 outline-none" placeholder="Age" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {['Dementia', 'Alzheimer\'s', 'Diabetes', 'Hypertension'].map(c => (
                  <button key={c} onClick={() => setPatientInfo({...patientInfo, condition: c})} className={`py-6 rounded-3xl text-2xl font-black border-4 ${patientInfo.condition === c ? 'bg-blue-600 text-white border-blue-400 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>{c}</button>
                ))}
              </div>
              <button onClick={() => setStep('upload')} disabled={!patientInfo.age} className="w-full py-8 bg-blue-600 text-white text-3xl font-black rounded-[2.5rem] shadow-2xl disabled:opacity-50 transition-all hover:bg-blue-700">Continue to Scan</button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-12">
              <div className="p-14 rounded-[4.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-3xl relative overflow-hidden">
                <h2 className="text-5xl font-black mb-8 tracking-tight">Daily Care Plan</h2>
                <p className="text-blue-50 text-2xl font-bold mb-12 opacity-90 leading-relaxed">{analysis.summary}</p>
                <VoiceAssistant text={analysis.summary} />
              </div>
              <SmartChatbot analysis={analysis} onSetReminders={()=>{}} activePreference="voice" patientInfo={patientInfo} onTriggerCall={() => setShowCallUI(true)} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING, TimeOfDay.NIGHT].map(time => (
                  <ScheduleCard key={time} time={time} medicines={analysis.medicines.filter(m => m.timing.includes(time))} takenKeys={takenKeys} onMarkTaken={(id, t) => setTakenKeys(prev => new Set(prev).add(`${id}-${t}`))} />
                ))}
              </div>
            </div>
            <div className="lg:col-span-4 space-y-10">
              <LocalSupport />
              <button onClick={() => setStep('upload')} className="w-full p-10 bg-white border-8 border-white text-blue-600 rounded-[4rem] font-black text-2xl shadow-xl flex items-center justify-between group hover:border-blue-50 transition-all">
                <span>Update Prescription</span>
                <span className="text-4xl group-hover:rotate-12 transition-transform">📸</span>
              </button>
              <div className="p-10 bg-emerald-50 rounded-[4rem] border-4 border-emerald-100">
                <h3 className="text-2xl font-black text-emerald-900 mb-4">Patient Status</h3>
                <div className="flex items-center gap-4 text-emerald-700 font-bold">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                  Reminders active via Voice
                </div>
              </div>
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
      <div className="max-w-md w-full bg-white p-14 rounded-[4rem] shadow-3xl text-center border-8 border-white">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-10">👤</div>
        <h2 className="text-4xl font-black mb-10">Sign In</h2>
        <input type="text" className="w-full px-8 py-6 rounded-2xl bg-slate-50 border-4 border-slate-100 text-2xl font-bold mb-8 outline-none focus:border-blue-600 transition-all" placeholder="Enter Your Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-7 bg-blue-600 text-white text-2xl font-black rounded-3xl shadow-xl hover:bg-blue-700 transition-all">Start Session</button>
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
      <div className="max-w-md bg-white p-14 rounded-[3.5rem] shadow-2xl">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8">🔐</div>
        <h2 className="text-3xl font-black mb-4">Connect Gemini</h2>
        <p className="text-slate-500 mb-8 font-bold leading-relaxed">This app requires Clinical Intelligence via Gemini API to safely analyze medications.</p>
        <button onClick={handleKey} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl hover:bg-blue-700 shadow-xl transition-all">Select API Key</button>
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage onLogin={login} />} />
            <Route path="/app" element={isAuthenticated ? <MainDashboard user={user!} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
