import React, { useState } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";

import {
  PrescriptionAnalysis,
  TimeOfDay,
  ReminderPreference,
  PatientInfo,
  User,
} from "./types";

import { MOCK_PRESCRIPTION_DATA } from "./constants";

import PrescriptionUpload from "./components/PrescriptionUpload";
import ScheduleCard from "./components/ScheduleCard";
import VoiceAssistant from "./components/VoiceAssistant";
import SmartChatbot from "./components/SmartChatbot";
import IncomingCallUI from "./components/IncomingCallUI";

/* =========================
   AUTH (Mock)
========================= */
const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("scr_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = (name: string) => {
    const newUser: User = {
      id: "u1",
      name,
      email: `${name.toLowerCase()}@care.com`,
    };
    setUser(newUser);
    localStorage.setItem("scr_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("scr_user");
  };

  return { user, login, logout, isAuthenticated: !!user };
};

/* =========================
   NAVBAR
========================= */
const Nav: React.FC<{ user: User | null; onLogout: () => void }> = ({
  user,
  onLogout,
}) => (
  <nav className="sticky top-0 z-50 glass-effect border-b border-slate-200">
    <div className="container mx-auto px-6 h-20 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl">
          S
        </div>
        <span className="text-2xl font-black">SmartCare</span>
      </Link>

      {user ? (
        <div className="flex items-center gap-4">
          <span className="font-black">{user.name}</span>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-100 rounded-lg font-black"
          >
            Log Out
          </button>
        </div>
      ) : (
        <Link
          to="/login"
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-black"
        >
          Sign In
        </Link>
      )}
    </div>
  </nav>
);

/* =========================
   LANDING PAGE
========================= */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-6xl font-black mb-6">
          From Prescription <br />
          <span className="text-blue-600 italic">to Protection</span>
        </h1>
        <p className="text-xl text-slate-500 mb-10">
          Simple, voice-first medicine reminders for seniors & caregivers.
        </p>
        <button
          onClick={() => navigate("/app")}
          className="px-10 py-6 bg-blue-600 text-white text-xl font-black rounded-3xl"
        >
          Scan My First Prescription
        </button>
      </div>
    </div>
  );
};

/* =========================
   LOGIN
========================= */
const LoginPage: React.FC<{ onLogin: (name: string) => void }> = ({
  onLogin,
}) => {
  const [name, setName] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onLogin(name);
    navigate("/app");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-3xl shadow-xl w-96 text-center"
      >
        <h2 className="text-3xl font-black mb-6">Sign In</h2>
        <input
          className="w-full p-4 rounded-xl border mb-6 text-xl"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-black">
          Continue
        </button>
      </form>
    </div>
  );
};

/* =========================
   DASHBOARD
========================= */
const MainDashboard: React.FC<{ user: User }> = () => {
  const [step, setStep] = useState<"upload" | "dashboard">("upload");
  const [analysis, setAnalysis] = useState<PrescriptionAnalysis | null>(null);
  const [reminderPref, setReminderPref] =
    useState<ReminderPreference | null>(null);
  const [takenKeys, setTakenKeys] = useState<Set<string>>(new Set());
  const [showCallUI, setShowCallUI] = useState(false);

  const handleDataReady = async () => {
    // ✅ SAFE: mock data only
    setAnalysis(MOCK_PRESCRIPTION_DATA);
    setStep("dashboard");
  };

  const handleCallAccepted = () => {
    const text = `Hello. It is time for your medicine.`;
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.8;
    window.speechSynthesis.speak(utt);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      {showCallUI && (
        <IncomingCallUI
          callerName="Smart Care Assistant"
          medicineInfo="Your daily medicine"
          onAccept={handleCallAccepted}
          onDecline={() => setShowCallUI(false)}
        />
      )}

      {step === "upload" && (
        <PrescriptionUpload onUpload={handleDataReady} isProcessing={false} />
      )}

      {step === "dashboard" && analysis && (
        <div className="space-y-10">
          <div className="bg-blue-600 text-white p-10 rounded-3xl">
            <h2 className="text-3xl font-black mb-4">Daily Care Plan</h2>
            <p className="text-xl">{analysis.summary}</p>
            <VoiceAssistant text={analysis.summary} />
          </div>

          <SmartChatbot
            analysis={analysis}
            onSetReminders={setReminderPref}
            activePreference={reminderPref}
            patientInfo={{ age: "65", condition: "General Aging" }}
            onTriggerCall={() => setShowCallUI(true)}
          />

          <div className="grid md:grid-cols-2 gap-6">
            {[TimeOfDay.MORNING, TimeOfDay.EVENING].map((time) => (
              <ScheduleCard
                key={time}
                time={time}
                medicines={analysis.medicines.filter((m) =>
                  m.timing.includes(time)
                )}
                takenKeys={takenKeys}
                onMarkTaken={(id, t) =>
                  setTakenKeys((prev) => new Set(prev).add(`${id}-${t}`))
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* =========================
   APP ROOT
========================= */
const App: React.FC = () => {
  const { user, login, logout, isAuthenticated } = useAuth();

  return (
    <Router>
      <Nav user={user} onLogout={logout} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={login} />} />
        <Route
          path="/app"
          element={
            isAuthenticated ? (
              <MainDashboard user={user!} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
