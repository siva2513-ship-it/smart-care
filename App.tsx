
import React, { useState, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { PrescriptionAnalysis, TimeOfDay, ReminderPreference, PatientInfo, User, Medicine, Language, UserRole } from './types';
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
    statusBadge: "Protection Status",
    loginTitle: "Enter Care Room",
    loginAction: "Enter Session",
    namePlaceholder: "Your Name"
  },
  hi: {
    home: "मुख्य पृष्ठ",
    setupProfile: "प्रोफ़ाइल सेटअप",
    ageLabel: "रोगी की आयु",
    conditionLabel: "बीमारी",
    langLabel: "भाषा",
    caregiverLabel: "निगरानी कौन कर रहा है?",
    scanBtn: "पर्चा स्कैन करें",
    dashboard: "केयर डैशबोर्ड",
    routine: "दवा की समय सारणी",
    summaryTitle: "स्वास्थ्य जानकारी",
    safetyMode: "वॉयस गार्ड",
    startGuard: "वॉयस गार्ड सक्रिय करें",
    stopGuard: "निगरानी बंद करें",
    testCall: "सुरक्षा परीक्षण",
    armed: "सक्रिय",
    off: "बंद",
    inspectedBy: "मुख्य देखभालकर्ता",
    careCircle: "सुरक्षा कवच सक्रिय",
    statusBadge: "सुरक्षा स्थिति",
    loginTitle: "देखभाल कक्ष में प्रवेश करें",
    loginAction: "सत्र शुरू करें",
    namePlaceholder: "आपका नाम"
  },
  te: {
    home: "హోమ్",
    setupProfile: "ప్రొఫైల్ సెటప్",
    ageLabel: "రోగి వయస్సు",
    conditionLabel: "పరిస్థితి",
    langLabel: "భాష",
    caregiverLabel: "ఎవరు పర్యవేక్షిస్తున్నారు?",
    scanBtn: "ప్రిస్క్రిప్షన్ స్కాన్ చేయండి",
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
    statusBadge: "రక్షణ స్థితి",
    loginTitle: "కేర్ రూమ్‌లోకి ప్రవేశించండి",
    loginAction: "సెషన్‌ను ప్రారంభించండి",
    namePlaceholder: "మీ పేరు"
  }
};

const RELATIONSHIPS = {
  en: ["Child", "Spouse", "Nurse", "Guardian", "Self"],
  hi: ["बच्चा", "जीवनसाथी", "नर्स", "अभिभावक", "स्वयं"],
  te: ["పిల్లలు", "భార్య/భర్త", "నర్స్", "సంరక్షకుడు", "నేనే"]
};

const ROLES_LABELS = {
  en: { PATIENT: 'Patient', NURSE: 'Nurse', CHILD: 'Child', GUARDIAN: 'Guardian', SPOUSE: 'Spouse' },
  hi: { PATIENT: 'रोगी', NURSE: 'नर्स', CHILD: 'बच्चा', GUARDIAN: 'अभिभावक', SPOUSE: 'जीवनसाथी' },
  te: { PATIENT: 'రోగి', NURSE: 'నర్స్', CHILD: 'పిల్లలు', GUARDIAN: 'సంరక్షకుడు', SPOUSE: 'భార్య/భర్త' }
};

// --- AUTH & STATE ---

const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('scr_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (name: string, role: UserRole) => {
    const newUser: User = { id: 'u1', name, email: `${name.toLowerCase()}@care.com`, role };
    setUser(newUser);
    localStorage.setItem('scr_user', JSON.stringify(newUser));
  };

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('scr_user');
    localStorage.removeItem('scr_taken_keys'); 
  }, []);

  return { user, login, logout, isAuthenticated: !!user };
};

const Nav: React.FC<{ user: User | null; onLogout: () => void; lang: Language }> = ({ user, onLogout, lang }) => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const labels = UI_STRINGS[lang] || UI_STRINGS.en;
  const roleLabels = ROLES_LABELS[lang] || ROLES_LABELS.en;

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
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-1">
                  {roleLabels[user.role]}
                </p>
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
  const [lastCallEndedAt, setLastCallEndedAt] = useState<number | null>(null);

  const effectiveAnalysis = analysis || MOCK_PRESCRIPTION_DATA;
  const labels = UI_STRINGS[patientInfo.language] || UI_STRINGS.en;
  
  const triggerCall = (med: Medicine) => {
    setActiveCallMed(med);
    setShowCallUI(true);
  };

  const handleCallDecline = () => {
    setShowCallUI(false);
    setActiveCallMed(null);
    setLastCallEndedAt(Date.now());
  };

  const handleDataReady = async (source: string) => {
    if (user.role !== 'PATIENT' && user.role !== 'NURSE') {
      alert("Only Patients and Nurses can modify clinical records.");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await geminiService.analyzePrescription(source, patientInfo);
      setAnalysis(result);
      setStep('dashboard');
    } catch (err) {
      console.error("Analysis Failed:", err);
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

  const canModifyPrescription = user.role === 'PATIENT' || user.role === 'NURSE';
  const canSeeDiagnosis = user.role === 'PATIENT' || user.role === 'NURSE' || user.role === 'SPOUSE' || user.role === 'GUARDIAN';

  const timeLabel = (t: TimeOfDay) => {
    if (patientInfo.language === 'hi') {
      switch(t) {
        case TimeOfDay.MORNING: return 'सुबह';
        case TimeOfDay.AFTERNOON: return 'दोपहर';
        case TimeOfDay.EVENING: return 'शाम';
        case TimeOfDay.NIGHT: return 'रात';
      }
    }
    if (patientInfo.language === 'te') {
      switch(t) {
        case TimeOfDay.MORNING: return 'ఉదయం';
        case TimeOfDay.AFTERNOON: return 'మధ్యాహ్నం';
        case TimeOfDay.EVENING: return 'సాయంత్రం';
        case TimeOfDay.NIGHT: return 'రాత్రి';
      }
    }
    return t;
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
          onDecline={handleCallDecline}
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
                    {id: 'en', label: 'English'},
                    {id: 'hi', label: 'हिंदी'},
                    {id: 'te', label: 'తెలుగు'}
                  ].map(l => (
                    <button key={l.id} onClick={() => setPatientInfo({...patientInfo, language: l.id as Language})} className={`py-4 rounded-2xl border-2 font-black text-sm transition-all ${patientInfo.language === l.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                      {l.label}
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
                      className={`py-3 rounded-xl border-2 font-black text-xs transition-all ${patientInfo.caregiverRelationship === rel ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100'}`}
                    >
                      {rel}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setStep(canModifyPrescription ? 'upload' : 'dashboard')} 
                disabled={!patientInfo.age || !patientInfo.caregiverRelationship} 
                className="w-full py-6 bg-blue-600 text-white text-xl font-black rounded-3xl shadow-xl disabled:opacity-20 hover:scale-105 transition-all"
              >
                {canModifyPrescription ? labels.scanBtn : labels.dashboard}
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && canModifyPrescription && <PrescriptionUpload onUpload={handleDataReady} isProcessing={isProcessing} />}

        {(step === 'dashboard' || (!canModifyPrescription && step === 'upload')) && effectiveAnalysis && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white p-6 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                <h3 className="font-black text-slate-900 text-2xl tracking-tight">{labels.routine}</h3>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                  {Object.values(TimeOfDay).map(t => (
                    <button key={t} onClick={() => setSimulatedTime(t)} className={`px-5 py-2.5 rounded-xl font-black text-xs transition-all ${simulatedTime === t ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}>
                      {timeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING, TimeOfDay.NIGHT].map(time => (
                  <ScheduleCard 
                    key={time} 
                    time={time} 
                    medicines={effectiveAnalysis.medicines.filter(m => m.timing.includes(time))} 
                    takenKeys={takenKeys} 
                    onMarkTaken={markAsTaken}
                    lang={patientInfo.language}
                  />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {canSeeDiagnosis && (
                <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-lg">
                   <h4 className="text-sm font-black text-slate-800 mb-4">{labels.summaryTitle}</h4>
                   <p className="text-slate-600 text-sm font-bold leading-relaxed mb-8 italic">{effectiveAnalysis.summary}</p>
                   <VoiceAssistant text={effectiveAnalysis.summary} lang={patientInfo.language} />
                </div>
              )}

              <div className="p-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm">
                 <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight mb-6">{labels.safetyMode}</h4>
                 <button onClick={() => setRemindersArmed(!remindersArmed)} className={`w-full py-5 rounded-2xl font-black text-xs uppercase transition-all ${remindersArmed ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-100' : 'bg-blue-600 text-white shadow-xl'}`}>
                   {remindersArmed ? labels.stopGuard : labels.startGuard}
                 </button>
                 <button onClick={() => triggerCall(effectiveAnalysis.medicines[0])} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase flex items-center justify-center gap-2 hover:text-blue-600 transition-colors">
                   <span>📞</span> {labels.testCall}
                 </button>
              </div>

              <SmartChatbot 
                analysis={effectiveAnalysis} 
                onSetReminders={setReminderPref} 
                activePreference={reminderPref} 
                patientInfo={patientInfo} 
                role={user.role}
                lastCallEndedAt={lastCallEndedAt}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const LoginPage: React.FC<{ onLogin: (n: string, r: UserRole) => void; lang: Language }> = ({ onLogin, lang }) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('PATIENT');
  const navigate = useNavigate();
  const labels = UI_STRINGS[lang] || UI_STRINGS.en;
  const roleLabels = ROLES_LABELS[lang] || ROLES_LABELS.en;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-2xl text-center border border-slate-100 animate-in zoom-in-95 duration-700">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-black mb-8 shadow-xl">S</div>
        <h2 className="text-3xl font-black mb-8 tracking-tighter">{labels.loginTitle}</h2>
        <input type="text" className="w-full px-6 py-5 rounded-2xl bg-slate-50 border-2 border-slate-100 text-lg font-bold mb-6 outline-none focus:border-blue-600 transition-all" placeholder={labels.namePlaceholder} value={name} onChange={e => setName(e.target.value)} />
        <div className="grid grid-cols-2 gap-3 mb-8">
          {(['PATIENT', 'NURSE', 'CHILD', 'GUARDIAN', 'SPOUSE'] as UserRole[]).map(r => (
            <button key={r} onClick={() => setRole(r)} className={`py-3 rounded-xl border-2 font-black text-[10px] transition-all ${role === r ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>
              {roleLabels[r]}
            </button>
          ))}
        </div>
        <button onClick={() => { if(name) { onLogin(name, role); navigate('/app'); } }} className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:bg-blue-700 transition-all">
          {labels.loginAction}
        </button>
      </div>
    </div>
  );
};

const ApiKeyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const location = useLocation();
  
  const checkKey = useCallback(async () => {
    const win = window as any;
    if (!win.aistudio) { setHasKey(true); return; }
    try { 
      const s = await win.aistudio.hasSelectedApiKey(); 
      setHasKey(s); 
    } catch (e) { setHasKey(true); }
  }, []);

  useEffect(() => {
    checkKey();
  }, [checkKey, location.key]);

  if (hasKey === null) return null;
  if (!hasKey) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-12 rounded-[4rem] text-center shadow-2xl">
        <h2 className="text-3xl font-black mb-6 tracking-tighter">Activate System</h2>
        <p className="text-slate-500 font-bold mb-8">Please select a valid API key to enable clinical scanning and AI voice assistants.</p>
        <button onClick={async () => { await (window as any).aistudio.openSelectKey(); setHasKey(true); }} className="w-full bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all">
          Activate API Key
        </button>
      </div>
    </div>
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({ age: '', condition: 'General Health', language: 'en', caregiverRelationship: 'Self' });
  
  const handleLogout = () => {
    logout();
    setPatientInfo({ age: '', condition: 'General Health', language: 'en', caregiverRelationship: 'Self' });
    window.location.reload(); 
  };

  return (
    <Router>
      <ApiKeyGuard>
        <Nav user={user} onLogout={handleLogout} lang={patientInfo.language} />
        <Routes>
          <Route path="/" element={<LandingPage isAuthenticated={isAuthenticated} />} />
          <Route path="/login" element={<LoginPage onLogin={login} lang={patientInfo.language} />} />
          <Route path="/app" element={isAuthenticated ? <MainDashboard user={user!} patientInfo={patientInfo} setPatientInfo={setPatientInfo} /> : <Navigate to="/login" />} />
        </Routes>
      </ApiKeyGuard>
    </Router>
  );
};

export default App;
