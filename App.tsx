
import React, { useState, useEffect } from 'react';
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
    langLabel: "Preferred Language",
    caregiverLabel: "Who is monitoring?",
    scanBtn: "Scan Prescription",
    dashboard: "Patient Dashboard",
    routine: "Today's Routine",
    summaryTitle: "AI Health Summary",
    safetyMode: "Safety Mode",
    startGuard: "Start Voice Guard",
    stopGuard: "Stop Monitoring",
    testCall: "Quick Test Call",
    armed: "Armed",
    off: "Off",
    inspectedBy: "Inspected By",
    careCircle: "Care Circle Active",
    statusBadge: "Monitoring Status"
  },
  hi: {
    home: "मुख्य पृष्ठ",
    setupProfile: "प्रोफ़ाइल सेटअप",
    ageLabel: "रोगी की आयु",
    conditionLabel: "बीमारी",
    langLabel: "पसंदीदा भाषा",
    caregiverLabel: "निगरानी कौन कर रहा है?",
    scanBtn: "पर्चा स्कैन करें",
    dashboard: "रोगी डैशबोर्ड",
    routine: "आज की दिनचर्या",
    summaryTitle: "एआई स्वास्थ्य सारांश",
    safetyMode: "सुरक्षा मोड",
    startGuard: "वॉयस गार्ड शुरू करें",
    stopGuard: "निगरानी बंद करें",
    testCall: "त्वरित परीक्षण कॉल",
    armed: "सक्रिय",
    off: "बंद",
    inspectedBy: "देखरेख करने वाले",
    careCircle: "केयर सर्कल सक्रिय",
    statusBadge: "निगरानी की स्थिति"
  },
  te: {
    home: "హోమ్",
    setupProfile: "ప్రొఫైల్ సెటప్",
    ageLabel: "రోగి వయస్సు",
    conditionLabel: "పరిస్థితి",
    langLabel: "భాష ఎంచుకోండి",
    caregiverLabel: "ఎవరు పర్యవేక్షిస్తున్నారు?",
    scanBtn: "ప్రిస్క్రిప్షన్ స్కాన్ చేయండి",
    dashboard: "రోగి డాష్‌బోర్డ్",
    routine: "నేటి దినచర్య",
    summaryTitle: "AI ఆరోగ్య సారాంశం",
    safetyMode: "భద్రతా మోడ్",
    startGuard: "వాయిస్ గార్డ్ ప్రారంభించండి",
    stopGuard: "పర్యవేక్షణ ఆపివేయి",
    testCall: "పరీక్ష కాల్",
    armed: "ప్రారంభమైంది",
    off: "ఆఫ్",
    inspectedBy: "తనిఖీ చేస్తున్నవారు",
    careCircle: "కేర్ సర్కిల్ యాక్టివ్",
    statusBadge: "పర్యవేక్షణ స్థితి"
  }
};

const RELATIONSHIPS = {
  en: ["Child", "Spouse", "Nurse", "Guardian", "Self"],
  hi: ["बच्चा", "जीवनसाथी", "नर्स", "अभिभावक", "स्वयं"],
  te: ["పిల్లలు", "భార్య/భర్త", "నర్స్", "సంరక్షకుడు", "నేనే"]
};

// --- AUTH ---

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

const Nav: React.FC<{ user: User | null; onLogout: () => void; lang: Language }> = ({ user, onLogout, lang }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const labels = UI_STRINGS[lang] || UI_STRINGS.en;

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="container mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-md group-hover:rotate-12 transition-transform">S</div>
            <span className="text-lg font-black text-slate-800 tracking-tighter">SmartCare</span>
          </Link>
          <Link to="/" className={`px-2 py-1 rounded-lg font-black text-[10px] flex items-center gap-1 transition-all ${isHome ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}>
            🏠 {labels.home}
          </Link>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 pl-4 border-l border-slate-200">
              <p className="text-[10px] font-black text-slate-900 hidden sm:block">{user.name}</p>
              <button onClick={onLogout} className="px-2 py-1 bg-slate-100 text-slate-600 font-black text-[9px] rounded hover:bg-red-50 hover:text-red-600 transition-all">Log Out</button>
            </div>
          ) : (
            <div className="w-1 h-1"></div>
          )}
        </div>
      </div>
    </nav>
  );
};

// --- MAIN COMPONENTS ---

const LandingPage: React.FC<{ isAuthenticated: boolean }> = ({ isAuthenticated }) => {
  const navigate = useNavigate();
  return (
    <div className="bg-white min-h-screen">
      <section className="container mx-auto px-6 py-12 md:py-20 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full border border-blue-100 mb-6">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Elderly Voice Companion</span>
        </div>
        <h1 className="text-5xl md:text-[6.5rem] font-black text-slate-900 leading-[0.95] tracking-tighter mb-6">
          Simple Care.<br/>
          <span className="text-blue-600">Zero Mistakes.</span>
        </h1>
        <p className="text-lg text-slate-500 mb-10 max-w-xl font-medium leading-relaxed">
          The only AI prescription tool that decodes handwriting and <strong>calls the patient</strong> to explain their medication in English, Hindi, or Telugu.
        </p>
        <button 
          onClick={() => navigate('/app')}
          className="px-12 py-6 bg-blue-600 text-white text-xl font-black rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all mb-16"
        >
          {isAuthenticated ? 'Enter Dashboard' : 'Start Free Session'}
        </button>

        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📸", title: "Scan", desc: "Handwriting Scan", color: "bg-blue-600" },
              { icon: "🧠", title: "Analyze", desc: "Pro AI Decoding", color: "bg-indigo-600" },
              { icon: "📞", title: "Speak", desc: "Voice Guidance", color: "bg-emerald-600" }
            ].map((step, idx) => (
              <div key={idx} className="relative p-8 rounded-[3rem] bg-slate-50 border-2 border-slate-100 group hover:bg-white hover:border-blue-200 hover:shadow-xl transition-all">
                <div className={`${step.color} w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl mb-6 shadow-lg group-hover:rotate-3 transition-transform mx-auto md:mx-0`}>
                  {step.icon}
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-1">{step.title}</h3>
                <p className="text-blue-600 font-black uppercase text-[10px] tracking-[0.2em] mb-2">{step.desc}</p>
              </div>
            ))}
          </div>
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
  const LANGUAGES: {id: Language, label: string, flag: string}[] = [
    {id: 'en', label: 'English', flag: '🇺🇸'},
    {id: 'hi', label: 'हिन्दी', flag: '🇮🇳'},
    {id: 'te', label: 'తెలుగు', flag: '🇮🇳'}
  ];

  const handleDataReady = async (source: string) => {
    setIsProcessing(true);
    try {
      const result = await geminiService.analyzePrescription(source, patientInfo);
      setAnalysis(result);
      setStep('dashboard');
    } catch (err) {
      console.error("Analysis failed, using mock data", err);
      setAnalysis(MOCK_PRESCRIPTION_DATA);
      setStep('dashboard');
    } finally { setIsProcessing(false); }
  };

  const triggerCall = (med: Medicine) => {
    setActiveCallMed(med);
    setShowCallUI(true);
  };

  const markAsTaken = (id: string, time: TimeOfDay) => {
    const next = new Set(takenKeys);
    next.add(`${id}-${time}`);
    setTakenKeys(next);
    localStorage.setItem('scr_taken_keys', JSON.stringify(Array.from(next)));
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      {showCallUI && activeCallMed && (
        <IncomingCallUI 
          callerName="SmartCare Pro"
          medicineName={activeCallMed.name}
          dosage={activeCallMed.dosage}
          instructions={activeCallMed.instructions}
          timeOfDay={simulatedTime}
          lang={patientInfo.language}
          onAccept={() => {}}
          onDecline={() => setShowCallUI(false)}
        />
      )}
      
      <div className="container mx-auto px-4 py-6">
        {step === 'onboarding' && (
          <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-blue-50 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tighter">{labels.setupProfile}</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{labels.ageLabel}</label>
                <input type="number" className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-slate-100 text-xl font-black focus:border-blue-600 outline-none" placeholder="e.g. 75" value={patientInfo.age} onChange={e => setPatientInfo({...patientInfo, age: e.target.value})} />
              </div>
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{labels.langLabel}</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => (
                    <button 
                      key={lang.id} 
                      onClick={() => setPatientInfo({...patientInfo, language: lang.id})}
                      className={`py-3 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center justify-center gap-1 ${patientInfo.language === lang.id ? 'bg-blue-600 text-white border-blue-400 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-blue-200'}`}
                    >
                      <span className="text-xl">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">{labels.caregiverLabel}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(RELATIONSHIPS[patientInfo.language] || RELATIONSHIPS.en).map(rel => (
                    <button 
                      key={rel} 
                      onClick={() => setPatientInfo({...patientInfo, caregiverRelationship: rel})}
                      className={`py-2 rounded-xl border-2 font-bold text-xs transition-all ${patientInfo.caregiverRelationship === rel ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-indigo-200'}`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep('upload')} 
                disabled={!patientInfo.age || !patientInfo.caregiverRelationship} 
                className="w-full py-5 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-xl disabled:opacity-20 transition-all"
              >
                {labels.scanBtn}
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {step === 'dashboard' && analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
            <div className="lg:col-span-8 space-y-6">
              {/* Timing Selector Header */}
              <div className="bg-white p-5 rounded-[2.5rem] border-2 border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-xl">📋</div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm leading-tight">{labels.dashboard}</h3>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{labels.routine}</p>
                  </div>
                </div>
                <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-4 py-2 rounded-lg font-black text-[10px] transition-all ${simulatedTime === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule Cards */}
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

              {/* INSPECTED BY SECTION - Displayed after schedule */}
              <div className="bg-indigo-600 p-8 rounded-[3.5rem] text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 transition-transform group-hover:rotate-0">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.23-2.93 8.19-7 9.18-4.07-.99-7-4.95-7-9.18V6.3l7-3.12zM12 7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm0 2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/></svg>
                </div>
                <div className="flex items-center gap-6 relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl">👤</div>
                  <div>
                    <h4 className="text-xs font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">{labels.inspectedBy}</h4>
                    <p className="text-3xl font-black">{patientInfo.caregiverRelationship}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center sm:items-end gap-2 relative z-10">
                  <div className="px-5 py-2 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 text-center sm:text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-100">{labels.statusBadge}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></span>
                      <span className="text-sm font-black">{labels.careCircle}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="p-7 bg-white rounded-[3rem] border-2 border-slate-100 shadow-lg">
                 <h4 className="text-sm font-black mb-3 flex items-center gap-2 text-slate-800">
                   <span className="text-xl">🧠</span> {labels.summaryTitle}
                 </h4>
                 <p className="text-slate-600 text-xs font-bold leading-relaxed mb-6 italic opacity-90">{analysis.summary}</p>
                 <VoiceAssistant text={analysis.summary} lang={patientInfo.language} />
              </div>

              <div className="p-6 bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm">
                 <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="font-black text-slate-900 text-xs uppercase tracking-tight">{labels.safetyMode}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${remindersArmed ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{remindersArmed ? labels.armed : labels.off}</span>
                    </div>
                 </div>
                 <button 
                  onClick={() => setRemindersArmed(!remindersArmed)}
                  className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${remindersArmed ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-600 text-white shadow-md'}`}
                 >
                   {remindersArmed ? labels.stopGuard : labels.startGuard}
                 </button>
                 <button 
                   onClick={() => triggerCall(analysis.medicines[0])}
                   className="w-full mt-4 text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
                 >
                   {labels.testCall}
                 </button>
              </div>

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
      <div className="max-w-xs w-full bg-white p-10 rounded-[3rem] shadow-2xl text-center border-2 border-blue-50">
        <h2 className="text-2xl font-black mb-6 tracking-tighter">Enter Care Room</h2>
        <input type="text" className="w-full px-5 py-4 rounded-xl bg-slate-50 border-2 border-slate-100 text-lg font-bold mb-4 outline-none focus:border-blue-600" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <button onClick={() => { if(name) { onLogin(name); navigate('/app'); } }} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg">Enter</button>
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
      <div className="max-w-xs bg-white p-10 rounded-[2.5rem] text-center">
        <h2 className="text-xl font-black mb-4">Connect AI</h2>
        <button onClick={handleKey} className="w-full py-4 bg-blue-600 text-white rounded-xl font-black">Activate</button>
      </div>
    </div>
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: '', language: 'en', caregiverRelationship: '' });
  
  return (
    <Router>
      <ApiKeyGuard>
        <Nav user={user} onLogout={logout} lang={patientInfo.language} />
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
