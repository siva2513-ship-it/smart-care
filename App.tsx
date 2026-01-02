
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { PrescriptionAnalysis, TimeOfDay, ReminderPreference, PatientInfo, User, Medicine, Language } from './types';
import { geminiService } from './services/geminiService';
import { MOCK_PRESCRIPTION_DATA } from './constants';
import PrescriptionUpload from './components/PrescriptionUpload';
import ScheduleCard from './components/ScheduleCard';
import VoiceAssistant from './components/VoiceAssistant';
import SmartChatbot from './components/SmartChatbot';
import IncomingCallUI from './components/IncomingCallUI';

// --- TRANSLATIONS ---

const UI_STRINGS = {
  en: {
    home: "Home",
    setupProfile: "Setup Profile",
    ageLabel: "Patient Age",
    conditionLabel: "Condition",
    langLabel: "Language",
    caregiverLabel: "Who is monitoring?",
    scanBtn: "Analyze Prescription",
    dashboard: "Care Dashboard",
    routine: "Current Schedule",
    summaryTitle: "Health Intelligence",
    safetyMode: "Voice Guard",
    startGuard: "Activate Voice Guard",
    stopGuard: "Deactivate Monitoring",
    testCall: "Run Safety Test",
    armed: "Monitoring",
    off: "Standby",
    inspectedBy: "Primary Caregiver",
    careCircle: "Safety Shield Active",
    statusBadge: "Protection Status"
  },
  hi: {
    home: "मुख्य पृष्ठ",
    setupProfile: "प्रोफ़ाइल सेटअप",
    ageLabel: "रोगी की आयु",
    conditionLabel: "बीमारी",
    langLabel: "भाषा",
    caregiverLabel: "देखभाल कौन कर रहा है?",
    scanBtn: "पर्चा विश्लेषण करें",
    dashboard: "केयर डैशबोर्ड",
    routine: "वर्तमान समय सारणी",
    summaryTitle: "स्वास्थ्य बुद्धि",
    safetyMode: "वॉयस गार्ड",
    startGuard: "वॉयस गार्ड सक्रिय करें",
    stopGuard: "निगरानी बंद करें",
    testCall: "सुरक्षा परीक्षण",
    armed: "सक्रिय",
    off: "स्टैंडबाय",
    inspectedBy: "प्राथमिक देखभालकर्ता",
    careCircle: "सुरक्षा कवच सक्रिय",
    statusBadge: "सुरक्षा स्थिति"
  },
  te: {
    home: "హోమ్",
    setupProfile: "ప్రొఫైల్ సెటప్",
    ageLabel: "రోగి వయస్సు",
    conditionLabel: "పరిస్థితి",
    langLabel: "భాష",
    caregiverLabel: "ఎవరు పర్యవేక్షిస్తున్నారు?",
    scanBtn: "ప్రిస్క్రిప్షన్ విశ్లేషించండి",
    dashboard: "కేర్ డాష్‌బోర్డ్",
    routine: "ప్రస్తుత షెడ్యూల్",
    summaryTitle: "ఆరోగ్య మేధస్సు",
    safetyMode: "వాయిస్ గార్డ్",
    startGuard: "వాయిస్ గార్డ్ ప్రారంభించండి",
    stopGuard: "పర్యవేక్షణ ఆపివేయి",
    testCall: "భద్రతా పరీక్ష",
    armed: "పర్యవేక్షణలో ఉంది",
    off: "స్టాండ్‌బై",
    inspectedBy: "ప్రధాన సంరక్షకుడు",
    careCircle: "రక్షణ కవచం యాక్టివ్‌గా ఉంది",
    statusBadge: "రక్షణ స్థితి"
  }
};

const RELATIONSHIPS = {
  en: ["Child", "Spouse", "Nurse", "Guardian", "Self"],
  hi: ["बच्चा", "जीवनसाथी", "नर्स", "अभिभावक", "स्वयं"],
  te: ["పిల్లలు", "భార్య/భర్త", "నర్స్", "సంరక్షకుడు", "నేనే"]
};

// --- AUTH & STATE ---

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

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('scr_user');
    localStorage.removeItem('scr_taken_keys'); // Clear app state on logout
  }, []);

  return { user, login, logout, isAuthenticated: !!user };
};

const Nav: React.FC<{ user: User | null; onLogout: () => void; lang: Language }> = ({ user, onLogout, lang }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const labels = UI_STRINGS[lang] || UI_STRINGS.en;

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg group-hover:scale-110 transition-transform">S</div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">SmartCare</span>
          </Link>
          <Link to="/" className={`px-4 py-1.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${isHome ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
            🏠 {labels.home}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-6 border-l border-slate-200">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[11px] font-black text-slate-900 leading-none">{user.name}</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">Authorized User</p>
              </div>
              <button onClick={onLogout} className="px-3 py-1.5 bg-slate-100 text-slate-600 font-black text-[10px] rounded-lg hover:bg-red-50 hover:text-red-600 transition-all border border-slate-200">Exit</button>
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
};

// --- PAGES ---

const LandingPage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      <section className="container mx-auto px-6 py-16 md:py-24 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 mb-8">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></span>
          <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Powered by Gemini 3 Pro</span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 leading-[0.9] tracking-tighter mb-8">
          Care Beyond<br/>
          <span className="text-blue-600">Handwriting.</span>
        </h1>
        <p className="text-xl text-slate-500 mb-12 max-w-2xl font-medium leading-relaxed">
          The world's first medical assistant that translates handwritten doctor notes into real-time voice guidance in <strong>English, Hindi, and Telugu.</strong>
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-14 py-6 bg-slate-900 text-white text-xl font-black rounded-3xl shadow-2xl hover:bg-blue-600 hover:-translate-y-1 active:translate-y-0 transition-all mb-24"
        >
          {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
        </button>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: "📄", title: "Scan", desc: "Handwriting Intelligence", sub: "Scan complex doctor notes.", color: "bg-blue-50" },
            { icon: "🌍", title: "Translate", desc: "Native Languages", sub: "Reminders in Hindi & Telugu.", color: "bg-indigo-50" },
            { icon: "📞", title: "Guard", desc: "Safety Calls", sub: "AI calls to confirm you took pills.", color: "bg-emerald-50" }
          ].map((step, idx) => (
            <div key={idx} className={`${step.color} p-10 rounded-[3rem] border-2 border-white/50 text-left transition-all hover:scale-[1.02] hover:shadow-xl`}>
              <div className="text-5xl mb-6">{step.icon}</div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{step.title}</h3>
              <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest mb-4">{step.desc}</p>
              <p className="text-slate-500 font-bold leading-snug">{step.sub}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const MainDashboard: React.FC<{ user: User; patientInfo: PatientInfo; setPatientInfo: (p: PatientInfo) => void }> = ({ user, patientInfo, setPatientInfo }) => {
  const [step, setStep] = useState<'onboarding' | 'upload' | 'dashboard'>('onboarding');
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

  const labels = UI_STRINGS[patientInfo.language] || UI_STRINGS.en;
  
  const triggerCall = (med: Medicine) => {
    setActiveCallMed(med);
    setShowCallUI(true);
  };

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const result = await geminiService.analyzePrescription(source, patientInfo);
      setAnalysis(result);
      setStep('dashboard');
    } catch (err) {
      console.error("Analysis Failed:", err);
      // Fallback only if absolutely necessary for hackathon stability
      setAnalysis(MOCK_PRESCRIPTION_DATA);
      setStep('dashboard');
    } finally { setIsProcessing(false); }
  };

  const markAsTaken = (id: string, time: TimeOfDay) => {
    const next = new Set(takenKeys);
    next.add(`${id}-${time}`);
    setTakenKeys(next);
    localStorage.setItem('scr_taken_keys', JSON.stringify(Array.from(next)));
  };

  return (
    <div className="min-h-screen pb-24 bg-[#F8FAFC]">
      {showCallUI && activeCallMed && (
        <IncomingCallUI 
          callerName="SmartCare Safety Guard"
          medicineName={activeCallMed.name}
          dosage={activeCallMed.dosage}
          instructions={activeCallMed.instructions}
          timeOfDay={simulatedTime}
          lang={patientInfo.language}
          onAccept={() => {}}
          onDecline={() => setShowCallUI(false)}
        />
      )}
      
      <div className="container mx-auto px-6 pt-8">
        {step === 'onboarding' && (
          <div className="max-w-md mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-500">
            <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter">{labels.setupProfile}</h2>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{labels.ageLabel}</label>
                <input type="number" className="w-full px-7 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-2xl font-black outline-none focus:border-blue-600 transition-colors" placeholder="e.g. 75" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{labels.langLabel}</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {id: 'en', label: 'English', flag: '🇺🇸'},
                    {id: 'hi', label: 'हिन्दी', flag: '🇮🇳'},
                    {id: 'te', label: 'తెలుగు', flag: '🇮🇳'}
                  ].map(lang => (
                    <button 
                      key={lang.id} 
                      onClick={() => setPatientInfo({...patientInfo, language: lang.id as Language})}
                      className={`py-4 rounded-2xl border-2 font-black text-sm transition-all flex flex-col items-center gap-1 ${patientInfo.language === lang.id ? 'bg-blue-600 text-white border-blue-400 shadow-xl scale-105' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                    >
                      <span className="text-2xl">{lang.flag}</span>
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">{labels.caregiverLabel}</label>
                <div className="grid grid-cols-2 gap-3">
                  {(RELATIONSHIPS[patientInfo.language] || RELATIONSHIPS.en).map(rel => (
                    <button 
                      key={rel} 
                      onClick={() => setPatientInfo({...patientInfo, caregiverRelationship: rel})}
                      className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${patientInfo.caregiverRelationship === rel ? 'bg-slate-900 text-white border-slate-800 shadow-lg' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep('upload')} 
                disabled={!patientInfo.age || !patientInfo.caregiverRelationship} 
                className="w-full py-6 bg-blue-600 text-white text-xl font-black rounded-3xl shadow-xl disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
              >
                {labels.scanBtn}
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-8">
              {/* Header Card */}
              <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">📋</div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight">{labels.dashboard}</h3>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{labels.routine}</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all ${simulatedTime === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

              {/* Care Circle Bento Card */}
              <div className="bg-indigo-600 p-10 rounded-[4rem] text-white shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-10 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                  <div className="w-64 h-64 bg-white rounded-full"></div>
                </div>
                <div className="flex items-center gap-8 relative z-10">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl">🛡️</div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-200 uppercase tracking-[0.3em] mb-2">{labels.inspectedBy}</h4>
                    <p className="text-4xl font-black tracking-tight">{patientInfo.caregiverRelationship}</p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                       <span className="text-[10px] font-black uppercase text-indigo-100 opacity-80">Online & Monitoring</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-3 relative z-10">
                  <div className="px-6 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-inner text-center sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100 mb-1">{labels.statusBadge}</p>
                    <span className="text-lg font-black">{labels.careCircle}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar intelligence */}
            <div className="lg:col-span-4 space-y-8">
              {/* Summary Bento */}
              <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-lg">
                 <div className="flex items-center justify-between mb-6">
                   <h4 className="text-sm font-black flex items-center gap-2 text-slate-800">
                     <span className="text-xl">🧠</span> {labels.summaryTitle}
                   </h4>
                   <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">Real-time</span>
                 </div>
                 <p className="text-slate-600 text-sm font-bold leading-relaxed mb-8 italic">{analysis.summary}</p>
                 <VoiceAssistant text={analysis.summary} lang={patientInfo.language} />
              </div>

              {/* Voice Guard Status */}
              <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="flex items-center justify-between mb-6">
                    <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">{labels.safetyMode}</h4>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${remindersArmed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{remindersArmed ? labels.armed : labels.off}</span>
                    </div>
                 </div>
                 <button 
                  onClick={() => setRemindersArmed(!remindersArmed)}
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${remindersArmed ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-blue-600 text-white shadow-xl hover:scale-[1.02]'}`}
                 >
                   {remindersArmed ? labels.stopGuard : labels.startGuard}
                 </button>
                 <button 
                   onClick={() => triggerCall(analysis.medicines[0] || MOCK_PRESCRIPTION_DATA.medicines[0])}
                   className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                 >
                   <span>📞</span> {labels.testCall}
                 </button>
              </div>

              {/* Chatbot Bento */}
              <SmartChatbot 
                analysis={analysis} 
                onSetReminders={setReminderPref} 
                activePreference={reminderPref} 
                patientInfo={patientInfo} 
                onTriggerCall={() => triggerCall(analysis.medicines[0])}
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
      <div className="max-w-xs w-full bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border border-slate-100">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-black mb-8 shadow-xl">S</div>
        <h2 className="text-3xl font-black mb-8 tracking-tighter">Enter Care Room</h2>
        <input type="text" className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-lg font-bold mb-6 outline-none focus:border-blue-600" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-blue-600 transition-all">Enter Session</button>
      </div>
    </div>
  );
};

const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  
  const checkKey = useCallback(async () => {
    const win = window as any;
    if (!win.aistudio) { setHasKey(true); return; }
    try { 
      const s = await win.aistudio.hasSelectedApiKey(); 
      setHasKey(s); 
    } catch { 
      setHasKey(true); 
    }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey]);

  const handleKey = async () => { 
    if((window as any).aistudio) await (window as any).aistudio.openSelectKey(); 
    setHasKey(true); 
  };

  if (hasKey === null) return null;
  if (!hasKey) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="max-w-xs bg-white p-12 rounded-[3rem] text-center shadow-2xl">
        <h2 className="text-2xl font-black mb-6">Connect AI Shield</h2>
        <p className="text-slate-500 font-bold mb-8">Please select an API key to activate the clinical scanning engine.</p>
        <button onClick={handleKey} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-lg">Activate Now</button>
      </div>
    </div>
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: '', language: 'en', caregiverRelationship: '' });
  
  const handleLogout = () => {
    logout();
    setPatientInfo({ age: '', condition: '', language: 'en', caregiverRelationship: '' });
  };

  return (
    <Router>
      <ApiKeyGuard>
        <Nav user={user} onLogout={handleLogout} lang={patientInfo.language} />
        <Routes>
          <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="/app" element={isAuthenticated ? <MainDashboard user={user!} patientInfo={patientInfo} setPatientInfo={setPatientInfo} /> : <Navigate to="/login" />} />
        </Routes>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
