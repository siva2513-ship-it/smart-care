
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

// --- NAVIGATION ---
const Nav: React.FC<{ user: User | null; onLogout: () => void }> = ({ user, onLogout }) => (
  <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">S</div>
        <span className="text-2xl font-black text-slate-800 tracking-tighter">SmartCare</span>
      </Link>
      
      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="font-bold text-slate-600 hover:text-blue-600 transition-colors">How it Works</a>
          <a href="#support" className="font-bold text-slate-600 hover:text-blue-600 transition-colors">Support</a>
          <a href="#contact" className="font-bold text-slate-600 hover:text-blue-600 transition-colors">Contact</a>
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
          <Link to="/login" className="px-6 py-2 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-md">
            Sign In
          </Link>
        )}
      </div>
    </div>
  </nav>
);

// --- LANDING PAGE ---
const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white">
      {/* Cinematic Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516733725897-1aa73b87c8e8?auto=format&fit=crop&q=80&w=2070" 
            alt="Healthcare background" 
            className="w-full h-full object-cover opacity-15"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-black text-xs uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              AI Care Companion
            </div>
            <h1 className="text-7xl md:text-[7rem] font-black text-slate-900 leading-[0.95] tracking-tight mb-10">
              From Prescription <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">to Protection.</span>
            </h1>
            <p className="text-2xl md:text-3xl text-slate-500 mb-14 font-medium leading-relaxed max-w-2xl">
              We translate complex medical jargon into simple, spoken daily plans. Designed with love for seniors and caregivers.
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={() => navigate('/app')}
                className="px-14 py-7 bg-blue-600 text-white text-2xl font-black rounded-[2.5rem] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all transform hover:scale-105 active:scale-95"
              >
                Scan My First Paper
              </button>
              <button className="px-10 py-7 bg-slate-100 text-slate-700 text-2xl font-black rounded-[2.5rem] hover:bg-slate-200 transition-all">
                See How It Works
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 bg-slate-50 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="text-5xl font-black text-slate-900 mb-6 tracking-tight">Three Simple Steps</h2>
            <p className="text-xl text-slate-400 font-bold max-w-xl mx-auto">No complex apps. No confusing menus. Just care.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { 
                step: "01", 
                title: "Scan Document", 
                desc: "Hold your paper up to the camera or upload a photo.", 
                img: "https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80&w=600",
                icon: "📸"
              },
              { 
                step: "02", 
                title: "AI Analysis", 
                desc: "Our model identifies dosage, timing, and safety warnings.", 
                img: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600",
                icon: "🧠"
              },
              { 
                step: "03", 
                title: "Voice Setup", 
                desc: "Receive clear voice calls and simple visual reminders.", 
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600",
                icon: "📞"
              }
            ].map(item => (
              <div key={item.step} className="group relative bg-white rounded-[3.5rem] overflow-hidden shadow-xl hover:-translate-y-4 transition-all duration-500 border border-slate-100">
                <div className="h-64 relative">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-blue-600/10"></div>
                  <div className="absolute top-8 left-8 w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                    {item.icon}
                  </div>
                </div>
                <div className="p-10">
                   <span className="text-blue-600 font-black text-xl block mb-2">{item.step}</span>
                   <h3 className="text-3xl font-black mb-4">{item.title}</h3>
                   <p className="text-slate-500 font-bold leading-relaxed text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-32 bg-white">
        <div className="container mx-auto px-6">
          <div className="bg-blue-600 rounded-[4rem] p-16 md:p-24 text-white flex flex-col md:flex-row items-center justify-between gap-12 shadow-3xl shadow-blue-200">
            <div className="max-w-xl">
              <h2 className="text-5xl font-black mb-6 leading-tight">Need help setting up <br/> for your parents?</h2>
              <p className="text-xl text-blue-100 font-bold mb-10 leading-relaxed">
                Our support team specializes in digital accessibility. We're here to walk you through the entire onboarding process.
              </p>
              <div className="flex flex-wrap gap-6">
                 <button className="px-8 py-5 bg-white text-blue-600 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-50 transition-all">Talk to a Care Expert</button>
                 <button className="px-8 py-5 bg-blue-500 text-white rounded-2xl font-black text-xl border-2 border-blue-400 hover:bg-blue-400 transition-all">Video Guide</button>
              </div>
            </div>
            <div className="w-full md:w-1/3 aspect-square relative">
               <img 
                 src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800" 
                 alt="Support Specialist" 
                 className="w-full h-full object-cover rounded-[3rem] shadow-2xl border-4 border-blue-400/50"
               />
               <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-3xl shadow-2xl text-slate-800">
                  <p className="text-sm font-black uppercase text-blue-600">Online Now</p>
                  <p className="text-lg font-black tracking-tight">Sarah from Support</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 bg-slate-50">
        <div className="container mx-auto px-6">
           <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-6xl font-black text-slate-900 mb-8 tracking-tighter">Get in touch.</h2>
                <div className="space-y-10">
                   <div className="flex gap-6 items-start">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📍</div>
                      <div>
                        <h4 className="text-2xl font-black mb-2">Office</h4>
                        <p className="text-xl text-slate-500 font-bold">123 Care Street, Health Valley <br/> California, CA 90210</p>
                      </div>
                   </div>
                   <div className="flex gap-6 items-start">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">✉️</div>
                      <div>
                        <h4 className="text-2xl font-black mb-2">Email</h4>
                        <p className="text-xl text-slate-500 font-bold">support@smartcare.ai</p>
                      </div>
                   </div>
                   <div className="flex gap-6 items-start">
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-3xl">📞</div>
                      <div>
                        <h4 className="text-2xl font-black mb-2">Phone</h4>
                        <p className="text-xl text-slate-500 font-bold">1-800-SMART-CARE</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-blue-50">
                <form className="space-y-6">
                   <div>
                     <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Your Name</label>
                     <input type="text" className="w-full p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none text-xl font-bold" />
                   </div>
                   <div>
                     <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">Message</label>
                     <textarea rows={4} className="w-full p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none text-xl font-bold"></textarea>
                   </div>
                   <button className="w-full py-6 bg-blue-600 text-white rounded-2xl text-2xl font-black shadow-xl hover:bg-blue-700 transition-all">Send Message</button>
                </form>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-20 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-white/10 pb-12 mb-12">
            <div className="flex items-center gap-3 mb-8 md:mb-0">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg">S</div>
              <span className="text-3xl font-black tracking-tighter">SmartCare</span>
            </div>
            <div className="flex gap-10 font-bold text-slate-400">
               <a href="#" className="hover:text-white">Privacy</a>
               <a href="#" className="hover:text-white">Terms</a>
               <a href="#" className="hover:text-white">Health Disclosure</a>
            </div>
          </div>
          <p className="text-center text-slate-500 font-bold">© 2025 SmartCare AI. From Prescription to Protection.</p>
        </div>
      </footer>
    </div>
  );
};

// --- LOGIN PAGE ---
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
          <button className="w-full py-7 bg-blue-600 text-white text-2xl font-black rounded-3xl shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95">
            Sign In
          </button>
        </form>
        
        <div className="mt-10 pt-10 border-t border-slate-100">
          <p className="text-slate-400 font-black text-xs uppercase tracking-widest mb-6">Quick Demo Login</p>
          <div className="flex gap-4 justify-center">
            <button onClick={() => { onLogin("Grandpa Joe"); navigate('/app'); }} className="flex-1 py-4 bg-slate-50 rounded-2xl font-black text-sm hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">👴 Joe</button>
            <button onClick={() => { onLogin("Rose"); navigate('/app'); }} className="flex-1 py-4 bg-slate-50 rounded-2xl font-black text-sm hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">👵 Rose</button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    } catch (err) {
      console.error("AI Error:", err);
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
    <div className="min-h-screen bg-slate-50 pb-24">
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
                />
              </div>
              <div>
                <label className="block text-2xl font-black text-slate-700 mb-4">Primary Condition</label>
                <div className="grid grid-cols-2 gap-6">
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <div className="p-14 rounded-[4.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-3xl relative overflow-hidden">
                <h2 className="text-5xl font-black mb-8 tracking-tight">Daily Care Plan</h2>
                <p className="text-blue-50 text-3xl font-bold leading-relaxed opacity-95 mb-12 max-w-2xl">{analysis.summary}</p>
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
                <h4 className="text-3xl font-black mb-10 tracking-tight">Support Desk</h4>
                <div className="space-y-6">
                  <button onClick={() => setShowCallUI(true)} className="w-full p-8 bg-slate-900 text-white rounded-[2.5rem] font-black text-2xl flex items-center justify-between group shadow-xl">
                    <span>Quick Call</span>
                    <span className="text-4xl group-hover:animate-bounce">📞</span>
                  </button>
                  <button onClick={() => setStep('upload')} className="w-full p-8 bg-blue-50 text-blue-700 rounded-[2.5rem] font-black text-2xl flex items-center justify-between hover:bg-blue-100 transition-all border-4 border-blue-100/50">
                    <span>New Scan</span>
                    <span className="text-4xl">📸</span>
                  </button>
                </div>
              </div>

              <div className="bg-amber-400 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                <h4 className="text-3xl font-black mb-6 tracking-tight">Family View</h4>
                <p className="font-black text-amber-950 text-xl leading-relaxed opacity-80 mb-8">
                  Daughter Rose and Caretaker Sam are active and watching.
                </p>
                <div className="flex -space-x-4">
                  <div className="w-16 h-16 rounded-3xl bg-white border-4 border-amber-400 flex items-center justify-center font-black text-xl shadow-lg">R</div>
                  <div className="w-16 h-16 rounded-3xl bg-blue-100 border-4 border-amber-400 flex items-center justify-center font-black text-xl text-blue-600 shadow-lg">S</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <Router>
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
    </Router>
  );
};

export default App;
