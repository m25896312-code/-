import { useState, useEffect, useRef, cloneElement, useMemo, memo, useCallback } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from "recharts";
import { 
  DIVS, QTYPES, DIFFS, FINAL_REVIEWS, BOOKS, TIPS, BADGES, getBadge 
} from "./constants";
import { db } from "./lib/storage";
import { aiCall, SYS_BASE, generateSpeech } from "./lib/gemini";
import { 
  BookOpen, 
  Brain, 
  Camera,
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Copy,
  Download, 
  FileText, 
  GraduationCap, 
  History, 
  Home, 
  Image as ImageIcon,
  LayoutDashboard, 
  Lightbulb, 
  ListTodo,
  LogOut, 
  Maximize2,
  MessageSquare, 
  Mic,
  Music,
  Play, 
  RotateCcw, 
  Save, 
  Search, 
  Send, 
  Settings, 
  Share2, 
  Sparkles,
  Star, 
  Trophy, 
  User, 
  Volume2, 
  Zap 
} from "lucide-react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ══════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════
function Spin({ sm, color }: { sm?: boolean; color?: string }) {
  return (
    <div 
      className={cn(
        "animate-spin rounded-full border-t-transparent",
        sm ? "h-4 w-4 border-2" : "h-8 w-8 border-4"
      )}
      style={{ borderColor: color || (sm ? "rgba(255,255,255,0.9)" : "#6C63FF"), borderTopColor: "transparent" }}
    />
  );
}

function CreatorBadge() {
  return (
    <div className="flex justify-center py-2 px-4 shrink-0 relative z-50">
      <motion.div 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-6 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl flex items-center gap-2 group"
      >
        <div className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-pulse shadow-[0_0_8px_#6C63FF]" />
        <span className="text-[10px] font-bold bg-gradient-to-r from-[#6C63FF] via-[#A78BFA] to-[#D8B4FE] bg-clip-text text-transparent animate-gradient-x whitespace-nowrap tracking-widest uppercase">
          صُنعت بواسطة محمد عامر فاروق ❤️
        </span>
        <div className="w-1.5 h-1.5 bg-[#A78BFA] rounded-full animate-pulse shadow-[0_0_8px_#A78BFA] [animation-delay:1s]" />
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════
// APP ROOT
// ══════════════════════════════════════
export default function App() {
  const [screen, setScreen] = useState<"loading" | "auth" | "main">("loading");
  const [user, setUser] = useState<any>(null);
  const [nav, setNav] = useState("home");
  const [div, setDiv] = useState<any>(null);
  const [subj, setSubj] = useState<any>(null);
  const [tip, setTip] = useState(0);
  const [toast, setToast] = useState<{ msg: string; err?: boolean } | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    chats: 0, banks: 0, quizzes: 0, exams: 0, flashcards: 0, pomodoros: 0, points: 0,
    streak: 0, lastActive: "", dailyGoal: 100, history: [] as { date: string; pts: number }[]
  });

  // Auth state
  const [aMode, setAMode] = useState<"login" | "register">("login");
  const [lf, setLf] = useState({ u: "", p: "" });
  const [rf, setRf] = useState({ name: "", u: "", p: "", c: "" });
  const [aErr, setAErr] = useState("");

  const showToast = (msg: string, isErr?: boolean) => {
    setToast({ msg, err: isErr });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const init = async () => {
      const u = await db.get("nf-user");
      const st = await db.get("nf-stats");
      const tourDone = await db.get("nf-tour-done");
      if (st) setStats(st);
      setTip(Math.floor(Math.random() * TIPS.length));
      if (u) {
        setUser(u);
        setScreen("main");
        if (!tourDone) setShowTour(true);
      } else {
        setScreen("auth");
      }
    };
    init();
    
    const tipInterval = setInterval(() => {
      setTip(p => (p + 1) % TIPS.length);
    }, 10000);
    
    return () => clearInterval(tipInterval);
  }, []);

  const addPoints = async (amount: number, activity: string) => {
    const currentVal = (stats as any)[activity];
    const newStats = { 
      ...stats, 
      points: (stats.points || 0) + amount,
      [activity]: typeof currentVal === "number" ? currentVal + 1 : currentVal 
    };
    setStats(newStats);
    await db.set("nf-stats", newStats);
    
    if (user?.name) {
      const lb = await db.getShared("nf-leaderboard") || {};
      lb[user.name] = { name: user.name, pts: newStats.points, updated: Date.now() };
      await db.setShared("nf-leaderboard", lb);
    }
  };

  const renderContent = useMemo(() => {
    if (screen !== "main") return null;
    switch (nav) {
      case "home": return <HomeScreen goNav={setNav} user={user} stats={stats} badge={getBadge(stats.points)} onProfile={() => setShowProfile(true)} />;
      case "chat": return <ChatScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "bank": return <BankScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "quiz": return <QuizScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "mindmap": return <MindMapScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "flashcards": return <FlashcardsScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "exam": return <ExamScreen div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} addPoints={addPoints} showToast={showToast} />;
      case "pomodoro": return <PomodoroScreen addPoints={addPoints} showToast={showToast} />;
      case "leaderboard": return <LeaderboardScreen user={user} stats={stats} />;
      case "saved": return <SavedScreen showToast={showToast} />;
      case "books": return <BooksScreen />;
      case "reviews": return <ReviewsScreen />;
      default: return <HomeScreen goNav={setNav} user={user} stats={stats} badge={getBadge(stats.points)} onProfile={() => setShowProfile(true)} />;
    }
  }, [screen, nav, div, subj, stats, user, addPoints, showToast]);

  const doLogin = async () => {
    if (!lf.u || !lf.p) { setAErr("ادخل البيانات"); return; }
    const users = await db.get("nf-users") || [];
    const found = users.find((x: any) => x.u === lf.u && x.p === lf.p);
    if (!found) { setAErr("البيانات غلط ❌"); return; }
    await db.set("nf-user", found);
    setUser(found);
    setScreen("main");
    setAErr("");
  };

  const doReg = async () => {
    const { name, u, p, c } = rf;
    if (!name || !u || !p) { setAErr("أكمل كل الحقول"); return; }
    if (p !== c) { setAErr("كلمتي المرور مش متطابقتين"); return; }
    if (p.length < 6) { setAErr("كلمة السر 6 أحرف على الأقل"); return; }
    const users = await db.get("nf-users") || [];
    if (users.find((x: any) => x.u === u)) { setAErr("الاسم ده موجود"); return; }
    const nu = { id: Date.now(), name, u, p };
    await db.set("nf-users", [...users, nu]);
    await db.set("nf-user", nu);
    setUser(nu);
    setScreen("main");
    setAErr("");
  };

  if (screen === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#060c1a] text-white font-['Cairo']">
        <div className="text-6xl mb-4">⚛️</div>
        <div className="text-3xl font-black bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] bg-clip-text text-transparent mb-6">نيوتن AI</div>
        <Spin />
        <div className="mt-12">
          <CreatorBadge />
        </div>
      </div>
    );
  }

  if (screen === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_50%_20%,#0d1f3c,#060c1a)] text-white font-['Cairo'] p-4" dir="rtl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-8 w-full max-w-md backdrop-blur-xl"
        >
          <div className="text-center mb-8">
            <div className="text-5xl mb-2">⚛️</div>
            <div className="text-3xl font-black bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] bg-clip-text text-transparent">نيوتن AI</div>
            <div className="text-slate-400 text-sm mt-2">تالتة ثانوي · منهج 2025/2026</div>
          </div>

          <div className="space-y-4">
            {aMode === "register" && (
              <input 
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:border-[#6C63FF] outline-none transition-all"
                placeholder="اسمك الكامل" 
                value={rf.name} 
                onChange={e => setRf(p => ({ ...p, name: e.target.value }))}
              />
            )}
            <input 
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:border-[#6C63FF] outline-none transition-all"
              placeholder="اسم المستخدم"
              value={aMode === "login" ? lf.u : rf.u}
              onChange={e => aMode === "login" ? setLf(p => ({ ...p, u: e.target.value })) : setRf(p => ({ ...p, u: e.target.value }))}
            />
            <input 
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:border-[#6C63FF] outline-none transition-all"
              type="password" 
              placeholder="كلمة السر"
              value={aMode === "login" ? lf.p : rf.p}
              onChange={e => aMode === "login" ? setLf(p => ({ ...p, p: e.target.value })) : setRf(p => ({ ...p, p: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && (aMode === "login" ? doLogin() : doReg())}
            />
            {aMode === "register" && (
              <input 
                className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:border-[#6C63FF] outline-none transition-all"
                type="password" 
                placeholder="أكد كلمة السر" 
                value={rf.c} 
                onChange={e => setRf(p => ({ ...p, c: e.target.value }))}
              />
            )}

            {aErr && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-xl text-center">
                {aErr}
              </div>
            )}

            <button 
              className="w-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
              onClick={aMode === "login" ? doLogin : doReg}
            >
              {aMode === "login" ? <><LogOut className="rotate-180 h-5 w-5" /> ادخل</> : <><Zap className="h-5 w-5" /> سجّل حساب</>}
            </button>

            <div className="text-center text-slate-400 text-sm mt-4">
              {aMode === "login" ? "مش عندك حساب؟ " : "عندك حساب؟ "}
              <button 
                className="text-[#A78BFA] font-bold hover:underline"
                onClick={() => { setAMode(aMode === "login" ? "register" : "login"); setAErr(""); }}
              >
                {aMode === "login" ? "سجّل دلوقتي" : "ادخل"}
              </button>
            </div>
          </div>

          <div className="mt-8 p-4 bg-[#6C63FF]/10 border border-[#6C63FF]/20 rounded-2xl text-center">
            <div className="text-[#A5B4FC] text-sm leading-relaxed">
              💡 {TIPS[tip]}
            </div>
          </div>
          
          <div className="mt-4">
            <CreatorBadge />
          </div>
        </motion.div>
      </div>
    );
  }

  const doLogout = async () => {
    await db.set("nf-user", null);
    setUser(null);
    setScreen("auth");
  };

  return (
    <div className="h-screen flex flex-col bg-[#060c1a] text-white font-['Cairo'] overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/5 border-b border-white/10 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#6C63FF]/5 to-transparent pointer-events-none" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C63FF]/20">
            <GraduationCap className="text-white h-6 w-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-white tracking-tight leading-none">نيوتن <span className="text-[#6C63FF]">AI</span></span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">ثانوية عامة 2026</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-sm font-bold">{user?.name}</div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <Trophy className="h-3 w-3 text-yellow-500" />
              <span>{stats.points} نقطة</span>
              <span className="mx-1">•</span>
              <span style={{ color: getBadge(stats.points).color }}>{getBadge(stats.points).name}</span>
            </div>
          </div>
          <button 
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all group"
          >
            <User className="h-5 w-5 text-slate-400 group-hover:text-[#6C63FF]" />
          </button>
          <button 
            onClick={doLogout}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/20 transition-all group"
          >
            <LogOut className="h-5 w-5 text-slate-400 group-hover:text-red-500" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={nav}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {renderContent}
          </motion.div>
        </AnimatePresence>
        <CreatorBadge />
      </main>

      {/* Footer Nav */}
      <nav className="flex items-center justify-around px-2 py-3 bg-white/5 border-t border-white/10 shrink-0">
        <NavBtn id="nav-home" active={nav === "home"} onClick={() => setNav("home")} icon={<Home />} label="الرئيسية" />
        <NavBtn id="nav-chat" active={nav === "chat"} onClick={() => setNav("chat")} icon={<MessageSquare />} label="المدرس" />
        <NavBtn id="nav-bank" active={nav === "bank"} onClick={() => setNav("bank")} icon={<FileText />} label="بنك" />
        <NavBtn id="nav-mindmap" active={nav === "mindmap"} onClick={() => setNav("mindmap")} icon={<Brain />} label="خرائط" />
        <NavBtn id="nav-saved" active={nav === "saved"} onClick={() => setNav("saved")} icon={<Save />} label="المحفوظات" />
      </nav>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={cn(
              "fixed top-6 left-1/2 z-[9999] px-6 py-2 rounded-full text-sm font-bold shadow-2xl whitespace-nowrap",
              toast.err ? "bg-red-500 text-white" : "bg-[#6C63FF] text-white"
            )}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Onboarding Tour */}
      <AnimatePresence>
        {showTour && (
          <TourOverlay 
            step={tourStep} 
            onNext={() => setTourStep(s => s + 1)} 
            onSkip={async () => {
              setShowTour(false);
              await db.set("nf-tour-done", true);
            }} 
          />
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <ProfileModal 
            user={user} 
            stats={stats} 
            badge={getBadge(stats.points)} 
            onClose={() => setShowProfile(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileModal({ user, stats, badge, onClose }: any) {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-[#0d1f3c] border border-white/10 rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#6C63FF]/10 blur-3xl -mr-32 -mt-32" />
        
        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar relative">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white">الملف الشخصي</h2>
              <p className="text-xs text-slate-500">إحصائيات مذاكرتك بالتفصيل</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-all">
              <RotateCcw className="h-5 w-5 rotate-45" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6C63FF] to-[#8B5CF6] flex items-center justify-center text-4xl shadow-xl shadow-[#6C63FF]/20 relative group">
              {user?.name[0]}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0d1f3c] border-4 border-[#0d1f3c] rounded-2xl flex items-center justify-center text-xl shadow-lg">
                {badge.icon}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-white">{user?.name}</h3>
              <p className="text-sm text-[#6C63FF] font-bold">{badge.name}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <div className="text-lg font-black text-white">{stats.points}</div>
              <div className="text-[10px] text-slate-500 uppercase">نقطة</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <div className="text-lg font-black text-white">{stats.streak || 3}</div>
              <div className="text-[10px] text-slate-500 uppercase">يوم</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl text-center">
              <div className="text-lg font-black text-white">{stats.exams}</div>
              <div className="text-[10px] text-slate-500 uppercase">امتحان</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">الإنجازات</h4>
            <div className="space-y-3">
              <AchievementItem icon={<Zap className="text-orange-500" />} title="داحي الفيزياء" desc="حل 50 سؤال بدون خطأ" progress={80} />
              <AchievementItem icon={<Brain className="text-emerald-500" />} title="ملك الخرائط" desc="أنشئ 10 خرائط ذهنية" progress={40} />
              <AchievementItem icon={<Clock className="text-blue-500" />} title="تركيز عالي" desc="أكمل 5 جلسات بومودورو" progress={100} />
            </div>
          </div>
          <div className="pt-6 border-t border-white/5">
            <CreatorBadge />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function AchievementItem({ icon, title, desc, progress }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl flex items-center gap-4">
      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-white">{title}</span>
          <span className="text-[10px] text-slate-500">{progress}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-[#6C63FF] rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-[10px] text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function TourOverlay({ step, onNext, onSkip }: { step: number; onNext: () => void; onSkip: () => void }) {
  const steps = [
    { 
      title: "أهلاً بك في نيوتن AI ⚛️", 
      desc: "أول منصة ذكية لمذاكرة الفيزياء والعلوم لطلاب الثانوية العامة.",
      target: null 
    },
    { 
      title: "المدرس الذكي 🤖", 
      desc: "تقدر تسأل المدرس في أي وقت، تبعتله صور أسئلة، وتسمع شرحه بصوت واضح.",
      target: "nav-chat" 
    },
    { 
      title: "بنك الأسئلة 📚", 
      desc: "آلاف الأسئلة المتدرجة في الصعوبة مع شرح مفصل لكل إجابة.",
      target: "nav-bank" 
    },
    { 
      title: "الخرائط الذهنية 🧠", 
      desc: "لخص المنهج كله في خرائط ذهنية منظمة تساعدك على الحفظ والفهم.",
      target: "nav-mindmap" 
    },
    { 
      title: "المحفوظات 💾", 
      desc: "أي سؤال أو خريطة تعجبك تقدر تحفظها هنا وترجعلها في أي وقت.",
      target: "nav-saved" 
    }
  ];

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 });

  useEffect(() => {
    if (current.target) {
      const el = document.getElementById(current.target);
      if (el) {
        const rect = el.getBoundingClientRect();
        setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      }
    }
  }, [step]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      {current.target && (
        <motion.div 
          initial={false}
          animate={{ 
            top: pos.top - 8, 
            left: pos.left - 8, 
            width: pos.width + 16, 
            height: pos.height + 16 
          }}
          className="absolute border-2 border-[#6C63FF] rounded-2xl shadow-[0_0_20px_#6C63FF] pointer-events-none"
        />
      )}
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0d1f3c] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C63FF]/10 blur-3xl -mr-16 -mt-16" />
        
        <div className="relative space-y-4 text-center">
          <h3 className="text-2xl font-black text-white">{current.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{current.desc}</p>
          
          <div className="flex gap-3 pt-4">
            <button 
              onClick={isLast ? onSkip : onNext}
              className="flex-1 bg-[#6C63FF] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all"
            >
              {isLast ? "ابدأ الآن" : "التالي"}
            </button>
            {!isLast && (
              <button 
                onClick={onSkip}
                className="px-6 text-slate-500 font-bold hover:text-white transition-all"
              >
                تخطي
              </button>
            )}
          </div>
          
          <div className="flex justify-center gap-1 mt-4">
            {steps.map((_, i) => (
              <div key={i} className={cn("w-1.5 h-1.5 rounded-full transition-all", i === step ? "bg-[#6C63FF] w-4" : "bg-white/10")} />
            ))}
          </div>

          {step === 0 && (
            <div className="pt-6 border-t border-white/5 mt-6">
              <CreatorBadge />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ══════════════════════════════════════
// EXPORT UTILS
// ══════════════════════════════════════
async function exportImage(id: string, name: string) {
  const el = document.getElementById(id);
  if (!el) return;
  
  let canvas: HTMLCanvasElement;
  if (el instanceof HTMLCanvasElement) {
    canvas = el;
  } else {
    canvas = await html2canvas(el, { backgroundColor: "#0F172A", scale: 2 });
  }
  
  const link = document.createElement("a");
  link.download = `${name}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function exportPDF(id: string, name: string) {
  const el = document.getElementById(id);
  if (!el) return;
  
  let canvas: HTMLCanvasElement;
  if (el instanceof HTMLCanvasElement) {
    canvas = el;
  } else {
    canvas = await html2canvas(el, { backgroundColor: "#0F172A", scale: 2 });
  }
  
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save(`${name}.pdf`);
}

function NavBtn({ id, active, onClick, icon, label }: { id?: string; active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button 
      id={id}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all relative group",
        active ? "text-[#6C63FF]" : "text-slate-500 hover:text-slate-300"
      )}
    >
      <div className={cn(
        "transition-all duration-300 group-hover:scale-110",
        active && "drop-shadow-[0_0_8px_rgba(108,99,255,0.5)]"
      )}>
        {cloneElement(icon, { className: "h-5 w-5" })}
      </div>
      <span className="text-[10px] font-bold">{label}</span>
      {active && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -top-1 w-1 h-1 bg-[#6C63FF] rounded-full shadow-[0_0_8px_#6C63FF]"
        />
      )}
    </button>
  );
}

// ══════════════════════════════════════
// SCREENS (Placeholders for now)
// ══════════════════════════════════════

const ParticleBackground = memo(function ParticleBackground() {
  const particles = useMemo(() => [...Array(15)].map((_, i) => ({
    id: i,
    initialX: Math.random() * 100 + "%",
    initialY: Math.random() * 100 + "%",
    opacity: Math.random() * 0.3 + 0.1,
    duration: Math.random() * 15 + 15,
    delay: Math.random() * 10
  })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-white/10 rounded-full"
          initial={{ x: p.initialX, y: p.initialY, opacity: 0 }}
          animate={{ 
            y: ["110%", "-10%"],
            opacity: [0, p.opacity, 0]
          }}
          transition={{ 
            duration: p.duration, 
            repeat: Infinity, 
            delay: p.delay,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
});

function HomeScreen({ goNav, user, stats, badge }: any) {
  const dailyProgress = Math.min(100, (stats.points % 100)); // Simplified goal logic
  
  const chartData = useMemo(() => {
    const days = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];
    return days.map((d, i) => ({
      name: d,
      pts: Math.floor(Math.random() * 200) + 50 // Placeholder for real history
    }));
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8 relative custom-scrollbar">
      <ParticleBackground />
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#6C63FF]/5 blur-[120px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#A78BFA]/5 blur-[120px] rounded-full animate-float [animation-delay:2s]" />
      </div>

      {/* Welcome */}
      <section className="flex items-center justify-between animate-in fade-in slide-in-from-right-4 duration-700">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white">أهلاً يا <span className="gradient-text">{user?.name.split(" ")[0]}</span> 👋</h1>
          <p className="text-slate-400 text-sm font-medium">جاهز تذاكر إيه النهارده؟</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center border border-orange-500/20 animate-pulse">
            <Zap className="h-6 w-6 text-orange-500" />
          </div>
          <span className="text-[10px] font-bold text-orange-500">{stats.streak || 3} يوم متواصل</span>
        </div>
      </section>

      {/* Daily Goal */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C63FF]/5 blur-3xl -mr-16 -mt-16 group-hover:bg-[#6C63FF]/10 transition-colors duration-500" />
        <div className="flex items-center justify-between relative">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">هدفك اليومي 🎯</h3>
            <p className="text-[10px] text-slate-500">فاضلك {100 - dailyProgress} نقطة وتوصل لهدفك</p>
          </div>
          <div className="text-xl font-black text-[#6C63FF]">{dailyProgress}%</div>
        </div>
        <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden relative">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${dailyProgress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-[#6C63FF] to-[#A78BFA] rounded-full shadow-[0_0_10px_rgba(108,99,255,0.5)]"
          />
        </div>
      </section>

      {/* Daily Challenge */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-4 relative overflow-hidden group border-r-4 border-orange-500">
        <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/5 blur-3xl -ml-16 -mt-16" />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">تحدي اليوم 🔥</h3>
              <p className="text-[10px] text-slate-500">حل 5 أسئلة فيزياء في 10 دقائق</p>
            </div>
          </div>
          <button 
            onClick={() => {
              goNav("quiz");
              // We'll pass a special flag or just let the user know
            }}
            className="px-4 py-2 bg-orange-500 text-white text-[10px] font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-orange-500/20"
          >
            ابدأ الآن
          </button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 stagger-fade-in">
        <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center gap-2 hover-lift group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6C63FF]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-3xl font-black text-[#6C63FF] drop-shadow-[0_0_10px_rgba(108,99,255,0.3)]">{stats.points}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">نقطة</div>
        </div>
        <div className="glass-card p-5 rounded-3xl flex flex-col items-center justify-center gap-2 hover-lift group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#A78BFA]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="text-xl font-black flex items-center gap-2" style={{ color: badge.color }}>
            <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{badge.icon}</span>
            {badge.name}
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">المستوى</div>
        </div>
      </div>

      {/* Study Analytics */}
      <section className="glass-card p-6 rounded-[2.5rem] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4 text-[#6C63FF]" />
            <h3 className="text-sm font-bold text-white">تحليل المذاكرة 📊</h3>
          </div>
          <span className="text-[10px] text-slate-500">آخر 7 أيام</span>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPts" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10 }} 
                reversed
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0d1f3c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                itemStyle={{ color: '#fff', fontSize: '12px' }}
              />
              <Area 
                type="monotone" 
                dataKey="pts" 
                stroke="#6C63FF" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPts)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">الأدوات الذكية</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-4" />
        </div>
        <div className="grid grid-cols-2 gap-4 stagger-fade-in">
          <ActionCard onClick={() => goNav("chat")} icon={<MessageSquare />} title="المدرس الآلي" desc="اسأل في أي درس" color="bg-blue-500" />
          <ActionCard onClick={() => goNav("bank")} icon={<FileText />} title="بنك الأسئلة" desc="توليد أسئلة فورية" color="bg-purple-500" />
          <ActionCard onClick={() => goNav("mindmap")} icon={<Brain />} title="خرائط ذهنية" desc="لخص المنهج بصرياً" color="bg-emerald-500" />
          <ActionCard onClick={() => goNav("quiz")} icon={<Zap />} title="اختبار سريع" desc="قيم مستواك الآن" color="bg-orange-500" />
          <ActionCard onClick={() => goNav("exam")} icon={<GraduationCap />} title="محاكي الامتحان" desc="تجربة الامتحان الحقيقي" color="bg-red-500" />
          <ActionCard onClick={() => goNav("flashcards")} icon={<RotateCcw />} title="بطاقات مراجعة" desc="حفظ المصطلحات" color="bg-pink-500" />
        </div>
      </section>

      {/* Resources */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">المصادر التعليمية</h2>
          <div className="h-[1px] flex-1 bg-white/5 mx-4" />
        </div>
        <div className="grid grid-cols-2 gap-4 stagger-fade-in">
          <ResourceBtn onClick={() => goNav("books")} icon={<BookOpen />} label="الكتب الخارجية" />
          <ResourceBtn onClick={() => goNav("reviews")} icon={<Star />} label="المراجعات النهائية" />
          <ResourceBtn onClick={() => goNav("pomodoro")} icon={<Clock />} label="مؤقت بومودورو" />
          <ResourceBtn onClick={() => goNav("leaderboard")} icon={<Trophy />} label="لوحة الشرف" />
        </div>
      </section>
    </div>
  );
}

function ActionCard({ icon, title, desc, color, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="glass-card p-5 rounded-[2rem] text-right flex flex-col gap-4 hover-lift group relative overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 w-20 h-20 blur-3xl -mr-10 -mt-10 opacity-20 group-hover:opacity-40 transition-opacity duration-500", color)} />
      <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500", color)}>
        {cloneElement(icon, { className: "h-6 w-6" })}
      </div>
      <div>
        <div className="font-black text-base mb-1 text-white group-hover:text-[#6C63FF] transition-colors">{title}</div>
        <div className="text-[10px] text-slate-500 font-medium leading-relaxed">{desc}</div>
      </div>
    </button>
  );
}

function ResourceBtn({ icon, label, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="glass-card rounded-2xl p-4 flex items-center gap-4 hover-lift group relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="text-[#6C63FF] bg-[#6C63FF]/10 p-2.5 rounded-xl group-hover:scale-110 transition-transform duration-500">
        {cloneElement(icon, { className: "h-5 w-5" })}
      </div>
      <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}

// Placeholder Screens for navigation
function ChatScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="chat" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<ChatContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }
function BankScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="bank" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<BankContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }
function QuizScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="quiz" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<QuizContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }
function MindMapScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="mindmap" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<MindMapContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }
function FlashcardsScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="flashcards" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<FlashcardsContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }
function ExamScreen({ div, setDiv, subj, setSubj, addPoints, showToast }: any) { return <SubjPicker nav="exam" div={div} setDiv={setDiv} subj={subj} setSubj={setSubj} onPick={() => {}} content={<ExamContent subj={subj} div={div} addPoints={addPoints} showToast={showToast} />} />; }

function PomodoroScreen({ addPoints, showToast }: any) {
  const [time, setTime] = useState(25 * 60);
  const [active, setActive] = useState(false);
  const [mode, setMode] = useState<"work" | "short" | "long">("work");
  const [tasks, setTasks] = useState<{ text: string; done: boolean }[]>([]);
  const [newTask, setNewTask] = useState("");
  const [sound, setSound] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const sounds = [
    { id: "rain", name: "مطر", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }, 
    { id: "forest", name: "غابة", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }, 
    { id: "coffee", name: "مقهى", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }, 
  ];

  useEffect(() => {
    let timer: any;
    if (active && time > 0) {
      timer = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0) {
      setActive(false);
      const session = { mode, date: new Date().toLocaleTimeString("ar-EG"), duration: mode === "work" ? 25 : mode === "short" ? 5 : 15 };
      setHistory(prev => [session, ...prev].slice(0, 5));
      
      if (mode === "work") {
        addPoints(20, "pomodoros");
        showToast("انتهت جلسة التركيز! خد راحة ☕");
      } else {
        showToast("خلصت الراحة! يلا نرجع نركز 💪");
      }
    }
    return () => clearInterval(timer);
  }, [active, time, mode, addPoints]);

  useEffect(() => {
    if (sound && active && mode === "work") {
      const s = sounds.find(x => x.id === sound);
      if (s) {
        if (audioRef.current) audioRef.current.pause();
        audioRef.current = new Audio(s.url);
        audioRef.current.loop = true;
        audioRef.current.play().catch(() => {});
      }
    } else {
      audioRef.current?.pause();
    }
  }, [sound, active, mode]);

  const setM = (m: "work" | "short" | "long", mins: number) => {
    setMode(m);
    setTime(mins * 60);
    setActive(false);
  };

  const format = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks([...tasks, { text: newTask.trim(), done: false }]);
    setNewTask("");
  };

  if (focusMode && active) {
    return (
      <div className="fixed inset-0 bg-[#060c1a] z-[100] flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-1000">
        <div className="text-[12vw] font-black font-mono tracking-tighter gradient-text animate-pulse">{format(time)}</div>
        <button 
          onClick={() => setFocusMode(false)}
          className="px-8 py-3 glass-card rounded-full text-slate-500 hover:text-white transition-all text-sm font-bold"
        >
          إنهاء وضع التركيز
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-8 overflow-y-auto items-center">
      <div className="flex items-center justify-between w-full max-w-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#6C63FF]/20 rounded-xl flex items-center justify-center">
            <Clock className="h-6 w-6 text-[#6C63FF]" />
          </div>
          <div>
            <h2 className="text-xl font-black">بومودورو الذكي ⏱️</h2>
            <p className="text-xs text-slate-400">نظم وقتك وضاعف تركيزك</p>
          </div>
        </div>
        <button 
          onClick={() => setFocusMode(true)}
          className="p-2 glass-card rounded-lg text-slate-400 hover:text-[#6C63FF] transition-all"
          title="وضع التركيز الكامل"
        >
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex gap-2 glass-card p-1 rounded-2xl w-full max-w-sm">
        <button onClick={() => setM("work", 25)} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", mode === "work" ? "bg-[#6C63FF] text-white" : "text-slate-400 hover:text-slate-200")}>تركيز</button>
        <button onClick={() => setM("short", 5)} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", mode === "short" ? "bg-[#6C63FF] text-white" : "text-slate-400 hover:text-slate-200")}>راحة قصيرة</button>
        <button onClick={() => setM("long", 15)} className={cn("flex-1 py-2 rounded-xl text-xs font-bold transition-all", mode === "long" ? "bg-[#6C63FF] text-white" : "text-slate-400 hover:text-slate-200")}>راحة طويلة</button>
      </div>

      <div className="relative w-72 h-72 flex items-center justify-center group">
        <div className="absolute inset-0 rounded-full border-8 border-white/5" />
        <svg className="w-full h-full -rotate-90 drop-shadow-[0_0_15px_rgba(108,99,255,0.3)]">
          <motion.circle 
            cx="144" cy="144" r="136" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={2 * Math.PI * 136}
            animate={{ strokeDashoffset: (2 * Math.PI * 136) * (1 - time / (mode === "work" ? 25 * 60 : mode === "short" ? 5 * 60 : 15 * 60)) }}
            transition={{ duration: 1, ease: "linear" }}
            className="text-[#6C63FF]"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-7xl font-black font-mono tracking-tighter gradient-text drop-shadow-[0_0_10px_rgba(108,99,255,0.3)]">{format(time)}</div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-2">{mode === "work" ? "وقت المذاكرة" : "وقت الراحة"}</div>
        </div>
        <div className="absolute inset-0 rounded-full bg-[#6C63FF]/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      </div>

      <div className="flex gap-4 w-full max-w-sm">
        <button 
          onClick={() => setActive(!active)}
          className={cn("flex-1 py-5 modern-button flex items-center justify-center gap-3 text-lg", active && "from-white/10 to-white/10 text-white border border-white/10")}
        >
          {active ? <><Clock className="h-6 w-6" /> إيقاف</> : <><Play className="h-6 w-6" /> ابدأ التركيز</>}
        </button>
        <button 
          onClick={() => { setActive(false); setTime(mode === "work" ? 25 * 60 : mode === "short" ? 5 * 60 : 15 * 60); }}
          className="p-5 glass-card rounded-2xl text-slate-400 hover:text-white transition-all"
        >
          <RotateCcw className="h-6 w-6" />
        </button>
      </div>

      <div className="w-full max-w-sm flex flex-wrap justify-center gap-2">
        {sounds.map(s => (
          <button 
            key={s.id}
            onClick={() => setSound(sound === s.id ? null : s.id)}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-bold transition-all border",
              sound === s.id ? "bg-[#6C63FF]/20 border-[#6C63FF] text-[#6C63FF]" : "bg-white/5 border-white/10 text-slate-500"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-sm font-bold">
              <ListTodo className="h-4 w-4 text-[#6C63FF]" />
              <span>مهام التركيز</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input 
              className="flex-1 glass-input rounded-xl px-4 py-2 text-sm"
              placeholder="إيه اللي هتركز عليه؟"
              value={newTask}
              onChange={e => setNewTask(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addTask()}
            />
            <button onClick={addTask} className="px-4 bg-[#6C63FF] rounded-xl text-white font-bold text-sm">+</button>
          </div>

          <div className="space-y-2">
            {tasks.map((t, i) => (
              <div key={i} className="glass-card p-3 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      const nt = [...tasks];
                      nt[i].done = !nt[i].done;
                      setTasks(nt);
                    }}
                    className={cn(
                      "h-4 w-4 rounded border flex items-center justify-center transition-all",
                      t.done ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                    )}
                  >
                    {t.done && <CheckCircle2 className="h-3 w-3 text-white" />}
                  </button>
                  <span className={cn("text-sm transition-all", t.done ? "text-slate-500 line-through" : "text-slate-200")}>{t.text}</span>
                </div>
                <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100">
                  <LogOut className="h-4 w-4 rotate-90" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2 text-sm font-bold">
            <RotateCcw className="h-4 w-4 text-[#6C63FF]" />
            <span>السجل الأخير</span>
          </div>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="glass-card p-3 rounded-xl flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", h.mode === "work" ? "bg-[#6C63FF]" : "bg-emerald-500")} />
                  <span className="text-slate-300">{h.mode === "work" ? "تركيز" : "راحة"}</span>
                </div>
                <span className="text-slate-500">{h.duration} دقيقة - {h.date}</span>
              </div>
            ))}
            {history.length === 0 && <div className="text-center py-4 text-slate-600 text-[10px] italic">لا يوجد سجل حالياً</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardScreen({ user, stats }: any) {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const lb = await db.getShared("nf-leaderboard") || {};
      const sorted = Object.values(lb).sort((a: any, b: any) => b.pts - a.pts).slice(0, 20);
      setList(sorted);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center">
          <Trophy className="h-7 w-7 text-yellow-500" />
        </div>
        <div>
          <h2 className="text-xl font-black">لوحة الشرف 🏆</h2>
          <p className="text-xs text-slate-400">أفضل الطلاب على مستوى الجمهورية</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin /></div>
      ) : (
        <div className="space-y-3">
          {list.map((item: any, i: number) => (
            <div 
              key={i} 
              className={cn(
                "bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between transition-all",
                item.name === user?.name ? "border-[#6C63FF] bg-[#6C63FF]/5" : ""
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs",
                  i === 0 ? "bg-yellow-500 text-black" : i === 1 ? "bg-slate-300 text-black" : i === 2 ? "bg-orange-400 text-black" : "bg-white/10 text-slate-400"
                )}>
                  {i + 1}
                </div>
                <div>
                  <div className="font-bold text-sm">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{getBadge(item.pts).name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-[#6C63FF]">{item.pts}</div>
                <div className="text-[8px] text-slate-500 uppercase tracking-tighter">نقطة</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedScreen({ showToast }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const svd = await db.get("nf-saved") || [];
      setItems(svd);
      setLoading(false);
    };
    fetch();
  }, []);

  const del = async (id: number) => {
    const updated = items.filter(x => x.id !== id);
    setItems(updated);
    await db.set("nf-saved", updated);
    showToast("اتحفظ بنجاح");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
          <Save className="h-7 w-7 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-xl font-black">المحفوظات 💾</h2>
          <p className="text-xs text-slate-400">كل اللي حفظته من بنك الأسئلة</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spin /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="text-5xl opacity-20">📂</div>
          <div className="text-slate-500 font-bold">مفيش حاجة محفوظة لسه</div>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div>
                  <div className="font-bold text-sm">{item.topic}</div>
                  <div className="text-[10px] text-slate-500">{item.subject} • {item.date}</div>
                </div>
                <button onClick={() => del(item.id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                <Markdown>{item.content}</Markdown>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BooksScreen() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center">
          <BookOpen className="h-7 w-7 text-blue-500" />
        </div>
        <div>
          <h2 className="text-xl font-black">الكتب الخارجية 📚</h2>
          <p className="text-xs text-slate-400">أحدث الكتب والملخصات بصيغة PDF</p>
        </div>
      </div>

      <div className="space-y-8">
        {BOOKS.map((cat, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
              <h3 className="font-bold">{cat.subject}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {cat.items.map((book, bi) => (
                <a 
                  key={bi} 
                  href={book.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-slate-500 group-hover:text-[#6C63FF]" />
                    <span className="text-sm font-bold">{book.name}</span>
                  </div>
                  <Download className="h-4 w-4 text-slate-600" />
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewsScreen() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
          <Star className="h-7 w-7 text-purple-500" />
        </div>
        <div>
          <h2 className="text-xl font-black">المراجعات النهائية ⭐</h2>
          <p className="text-xs text-slate-400">توقعات ليلة الامتحان وأهم المذكرات</p>
        </div>
      </div>

      <div className="space-y-8">
        {FINAL_REVIEWS.map((cat, i) => (
          <div key={i} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: cat.color }}>{cat.icon}</div>
              <h3 className="font-bold">{cat.subject}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {cat.items.map((rev, ri) => (
                <a 
                  key={ri} 
                  href={rev.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(
                    "bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group",
                    !rev.url && "opacity-50 pointer-events-none"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-slate-500 group-hover:text-[#6C63FF]" />
                    <span className="text-sm font-bold">{rev.name}</span>
                  </div>
                  {rev.url && <ChevronLeft className="h-4 w-4 text-slate-600" />}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════

function SubjPicker({ div, setDiv, subj, setSubj, content }: any) {
  if (!div) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <h2 className="text-xl font-black">اختار شعبتك 🎓</h2>
        <div className="grid grid-cols-1 gap-4">
          {DIVS.map(d => (
            <button 
              key={d.id}
              onClick={() => setDiv(d)}
              className="glass-card p-5 rounded-2xl flex items-center justify-between hover-lift group"
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl group-hover:animate-float">{d.icon}</div>
                <div className="text-right">
                  <div className="font-bold text-lg text-white">{d.name}</div>
                  <div className="text-xs text-slate-500">{d.subjects.length} مادة</div>
                </div>
              </div>
              <ChevronLeft className="h-5 w-5 text-slate-600 group-hover:text-[#6C63FF] transition-colors" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!subj) {
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setDiv(null)} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-black">اختار المادة 📚</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {div.subjects.map((s: any) => (
            <button 
              key={s.id}
              onClick={() => setSubj(s)}
              className="glass-card p-4 rounded-2xl flex flex-col items-center gap-3 hover-lift group"
            >
              <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: s.color }}>
                {s.icon}
              </div>
              <div className="text-xs font-bold text-center text-white">{s.name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSubj(null)} className="p-1 hover:bg-white/10 rounded-full transition-all">
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold">{subj.name}</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-400">{div.name}</span>
          </div>
        </div>
      </div>
      {content}
    </div>
  );
}

function ChatContent({ subj, div, addPoints, showToast }: any) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [ci, setCi] = useState("");
  const [loading, setLoading] = useState(false);
  const [audioLoading, setAudioLoading] = useState<number | null>(null);
  const [img, setImg] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const endRef = useRef<any>(null);
  const fileRef = useRef<any>(null);

  useEffect(() => {
    setMsgs([{
      role: "assistant", 
      content: `أهلاً! 👋 أنا مدرسك في **${subj.name}**.\n\nبجيبلك كل المعلومات من **الكتاب المدرسي الرسمي 2026**.\n\nتقدر تسألني عن أي شرح أو حل مسائل، وتقدر تبعتلي صورة للسؤال كمان! 📸`
    }]);
  }, [subj]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, loading]);

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev: any) => setImg({ 
        data: ev.target.result.split(",")[1], 
        mimeType: file.type, 
        preview: ev.target.result 
      });
      reader.readAsDataURL(file);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("متصفحك لا يدعم تحويل الكلام لنص", true);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ar-EG";
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCi(prev => prev + transcript);
    };
    recognition.start();
  };

  const send = async () => {
    if ((!ci.trim() && !img) || loading) return;
    const text = ci.trim();
    const currentImg = img;
    setCi("");
    setImg(null);
    
    const userMsg: any = { role: "user", content: text || "حل السؤال اللي في الصورة" };
    if (currentImg) userMsg.image = { data: currentImg.data, mimeType: currentImg.mimeType, preview: currentImg.preview };
    
    const updated = [...msgs, userMsg];
    setMsgs(updated);
    setLoading(true);
    try {
      const sys = SYS_BASE(subj.name, div.name);
      const reply = await aiCall(updated, sys);
      setMsgs(prev => [...prev, { role: "assistant", content: reply }]);
      addPoints(5, "chats");
    } catch (_) {
      setMsgs(prev => [...prev, { role: "assistant", content: "⚠️ في مشكلة في الاتصال، جرب تاني." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-start" : "justify-end")}>
            <div className={cn(
              "max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed glass-card relative group",
              m.role === "user" ? "bg-[#6C63FF] text-white rounded-tr-none shadow-lg shadow-[#6C63FF]/20" : "text-slate-200 rounded-tl-none"
            )}>
              {m.image && (
                <img src={m.image.preview} alt="User upload" className="w-full max-h-60 object-cover rounded-xl mb-3 border border-white/10" />
              )}
              <div className="prose prose-invert prose-sm max-w-none">
                <Markdown>{m.content}</Markdown>
              </div>
              {m.role === "assistant" && (
                <button 
                  onClick={async () => {
                    if (audioLoading !== null) return;
                    setAudioLoading(i);
                    try {
                      const url = await generateSpeech(m.content.replace(/[#*`]/g, ''));
                      if (url) {
                        const a = new Audio(url);
                        a.onended = () => setAudioLoading(null);
                        a.play();
                      } else {
                        setAudioLoading(null);
                      }
                    } catch (_) {
                      setAudioLoading(null);
                    }
                  }}
                  className={cn(
                    "absolute -bottom-6 left-0 p-1 transition-all opacity-0 group-hover:opacity-100",
                    audioLoading === i ? "text-[#6C63FF] animate-pulse" : "text-slate-500 hover:text-[#6C63FF]"
                  )}
                  title="استمع للإجابة"
                >
                  {audioLoading === i ? <Spin sm color="#6C63FF" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="glass-card p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-[#6C63FF] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      
      <div className="p-4 bg-white/5 border-t border-white/10 space-y-3">
        {img && (
          <div className="relative w-20 h-20 group">
            <img src={img.preview} className="w-full h-full object-cover rounded-xl border-2 border-[#6C63FF]" />
            <button onClick={() => setImg(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg">
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <input type="file" hidden ref={fileRef} accept="image/*" onChange={handleImage} />
          <button 
            onClick={() => fileRef.current?.click()}
            className="h-11 w-11 glass-card rounded-xl flex items-center justify-center text-slate-400 hover:text-[#6C63FF] transition-all"
          >
            <Camera className="h-5 w-5" />
          </button>
          
          <button 
            onClick={startVoice}
            className={cn(
              "h-11 w-11 glass-card rounded-xl flex items-center justify-center transition-all",
              isRecording ? "text-red-500 glow-effect" : "text-slate-400 hover:text-[#6C63FF]"
            )}
          >
            <Mic className="h-5 w-5" />
          </button>

          <textarea 
            className="flex-1 glass-input rounded-xl px-4 py-2 text-sm max-h-32 min-h-[44px]"
            placeholder="اسأل أي حاجة..."
            value={ci}
            onChange={e => setCi(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          />
          
          <button 
            onClick={send}
            disabled={loading || (!ci.trim() && !img)}
            className="h-11 w-11 modern-button flex items-center justify-center disabled:opacity-50 shrink-0"
          >
            <Send className="h-5 w-5 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Placeholder for other contents to avoid token limit
function BankContent({ subj, div, addPoints, showToast }: any) {
  const [topic, setTopic] = useState("");
  const [type, setType] = useState("mcq");
  const [cnt, setCnt] = useState(10);
  const [diff, setDiff] = useState("medium");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const gen = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setRes("");
    setDone(false);
    try {
      const ti = QTYPES.find(q => q.id === type) || QTYPES[0];
      const di = DIFFS.find(d => d.id === diff) || DIFFS[1];
      const sys = SYS_BASE(subj.name, div.name) + `
مستوى الصعوبة: ${di.name} – ${di.desc}. رقّم من 1 لـ ${cnt} بالضبط.
${type === "mcq" ? "الصيغة: السؤال ثم أ) ب) ج) د) على أسطر ثم ✅ الإجابة:" : type === "short" ? "الصيغة: السؤال ثم الإجابة." : type === "essay" ? "الصيغة: السؤال بدون إجابة." : "الصيغة: المصطلح ثم تعريفه."}`;
      const prompt = `أنشئ بالضبط ${cnt} سؤال ${ti.name} مستوى ${di.name} من "${topic}" في ${subj.name} 2026. العدد ${cnt} بالضبط.`;
      const result = await aiCall([{ role: "user", content: prompt }], sys);
      setRes(result);
      setDone(true);
      addPoints(10, "banks");
    } catch (_) {
      showToast("❌ في مشكلة في الاتصال", true);
    }
    setLoading(false);
  };

  const save = async () => {
    const svd = await db.get("nf-saved") || [];
    const item = { type: "bank", id: Date.now(), subject: subj.name, division: div.name, topic, qtype: type, content: res, date: new Date().toLocaleDateString("ar-EG") };
    await db.set("nf-saved", [item, ...svd]);
    showToast("اتحفظ ✅");
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {!done ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">الموضوع أو الدرس</label>
            <input 
              className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 focus:border-[#6C63FF] outline-none transition-all"
              placeholder="مثلاً: الخلية، الحمض النووي، ثورة 19..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">نوع الأسئلة</label>
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                value={type}
                onChange={e => setType(e.target.value)}
              >
                {QTYPES.map(q => <option key={q.id} value={q.id} className="bg-[#060c1a]">{q.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">الصعوبة</label>
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                value={diff}
                onChange={e => setDiff(e.target.value)}
              >
                {DIFFS.map(d => <option key={d.id} value={d.id} className="bg-[#060c1a]">{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">العدد</label>
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                value={cnt}
                onChange={e => setCnt(parseInt(e.target.value))}
              >
                {[5, 10, 15, 20, 30].map(n => <option key={n} value={n} className="bg-[#060c1a]">{n}</option>)}
              </select>
            </div>
          </div>

          <button 
            onClick={gen}
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#6C63FF]/20"
          >
            {loading ? <Spin sm /> : <><Zap className="h-5 w-5" /> توليد الأسئلة</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg">الأسئلة المولّدة ✨</h3>
            <div className="flex gap-2">
              <button onClick={save} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all text-[#6C63FF]">
                <Save className="h-4 w-4" />
              </button>
              <button onClick={() => setDone(false)} className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-sm leading-relaxed whitespace-pre-wrap">
            <Markdown>{res}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}

function QuizContent({ subj, div, addPoints, showToast }: any) {
  const [topic, setTopic] = useState("");
  const [diff, setDiff] = useState("medium");
  const [cnt, setCnt] = useState(5);
  const [qs, setQs] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [room, setRoom] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [roomInput, setRoomInput] = useState("");

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const data = qs.map((q, i) => ({ q: q.q, correct: answers[i] === q.c, explanation: q.e }));
      const prompt = `حلل نتائج الطالب في اختبار ${subj.name} موضوع "${topic}". النتائج: ${JSON.stringify(data)}.
      طلع تقرير بـ Markdown فيه:
      1. نقاط الضعف.
      2. المواضيع اللي محتاج يراجعها.
      3. نصيحة للتحسن.
      4. نسبة النجاح المتوقعة في الامتحان النهائي.`;
      const res = await aiCall([{ role: "user", content: prompt }], "أنت خبير تعليمي ومحلل أداء بالذكاء الاصطناعي.");
      setAnalysis(res);
    } catch (_) {
      showToast("❌ فشل تحليل الأداء", true);
    }
    setAnalyzing(false);
  };

  const createRoom = async () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoom(id);
    showToast(`تم إنشاء غرفة التحدي: ${id}`);
    // In a real app we'd wait for opponent here
  };

  const joinRoom = () => {
    if (!roomInput.trim()) return;
    setRoom(roomInput.toUpperCase());
    showToast("تم الانضمام لتحدي الصديق! 🎮");
  };

  const gen = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setQs([]);
    setDone(false);
    setSubmitted(false);
    setAnswers({});
    try {
      const di = DIFFS.find(d => d.id === diff) || DIFFS[1];
      const sys = SYS_BASE(subj.name, div.name) + `
أنت بتولّد أسئلة MCQ من الكتاب المدرسي 2026 فقط. رد بـ JSON array فقط بلا markdown:
[{"q":"السؤال","a":["أ) خيار1","ب) خيار2","ج) خيار3","د) خيار4"],"c":0,"e":"شرح الإجابة"}]
c = index الإجابة الصحيحة (0-3).`;
      const prompt = `بالضبط ${cnt} أسئلة MCQ مستوى ${di.name} من "${topic}" في ${subj.name} 2026. JSON array فقط.`;
      const raw = await aiCall([{ role: "user", content: prompt }], sys);
      let parsed = null;
      try { parsed = JSON.parse(raw.trim()); } catch (_) {
        const m = raw.match(/\[[\s\S]*\]/);
        if (m) try { parsed = JSON.parse(m[0]); } catch (_) { }
      }
      if (!parsed || !Array.isArray(parsed)) throw new Error("Format error");
      setQs(parsed.slice(0, cnt));
      setDone(true);
      addPoints(15, "quizzes");
    } catch (_) {
      showToast("❌ فشل توليد الاختبار", true);
    }
    setLoading(false);
  };

  const submit = () => {
    let s = 0;
    qs.forEach((q, i) => { if (answers[i] === q.c) s++; });
    setScore(s);
    setSubmitted(true);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {!done ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">موضوع الاختبار</label>
            <input 
              className="w-full glass-input rounded-xl px-4 py-3"
              placeholder="مثلاً: الباب الأول، التنفس الخلوي..."
              value={topic}
              onChange={e => setTopic(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">الصعوبة</label>
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                value={diff}
                onChange={e => setDiff(e.target.value)}
              >
                {DIFFS.map(d => <option key={d.id} value={d.id} className="bg-[#060c1a]">{d.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">عدد الأسئلة</label>
              <select 
                className="w-full glass-input rounded-xl px-4 py-3 text-sm"
                value={cnt}
                onChange={e => setCnt(parseInt(e.target.value))}
              >
                {[5, 10, 15, 20].map(n => <option key={n} value={n} className="bg-[#060c1a]">{n}</option>)}
              </select>
            </div>
          </div>
          <button 
            onClick={gen}
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-[#6C63FF] to-[#8B5CF6] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <Spin sm /> : <><Zap className="h-5 w-5" /> ابدأ الاختبار</>}
          </button>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">مود المنافسة المباشرة 🎮</h4>
            {!room ? (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={createRoom}
                  className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-[10px] font-bold">إنشاء تحدي</span>
                </button>
                <button 
                  onClick={() => setJoining(true)}
                  className="glass-card p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-white/10 transition-all"
                >
                  <User className="h-5 w-5 text-blue-500" />
                  <span className="text-[10px] font-bold">انضمام لصديق</span>
                </button>
              </div>
            ) : (
              <div className="glass-card p-4 rounded-2xl text-center space-y-2">
                <div className="text-[10px] text-slate-500 uppercase">كود الغرفة</div>
                <div className="text-2xl font-black text-[#6C63FF] tracking-widest">{room}</div>
                <p className="text-[10px] text-slate-400">ابعت الكود لصاحبك عشان يبدأ معاك!</p>
              </div>
            )}

            {joining && !room && (
              <div className="flex gap-2">
                <input 
                  className="flex-1 glass-input rounded-xl px-4 py-2 text-sm"
                  placeholder="ادخل كود الغرفة"
                  value={roomInput}
                  onChange={e => setRoomInput(e.target.value)}
                />
                <button onClick={joinRoom} className="bg-[#6C63FF] px-4 rounded-xl text-xs font-bold">دخول</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 pb-10">
          {submitted && (
            <div className="glass-card p-6 rounded-3xl text-center space-y-4 animate-in zoom-in duration-500">
              <div className="text-4xl">🎉</div>
              <h3 className="text-xl font-black">خلصت الاختبار!</h3>
              <div className="flex justify-center gap-8">
                <div>
                  <div className="text-2xl font-black text-[#6C63FF]">{score}/{qs.length}</div>
                  <div className="text-[10px] text-slate-500 uppercase">النتيجة</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-500">{Math.round((score/qs.length)*100)}%</div>
                  <div className="text-[10px] text-slate-500 uppercase">النسبة</div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={analyze}
                  disabled={analyzing}
                  className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                >
                  {analyzing ? <Spin sm /> : <><Brain className="h-4 w-4 text-[#6C63FF]" /> تحليل الأداء بالذكاء الاصطناعي</>}
                </button>
              </div>

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-right bg-white/5 p-6 rounded-2xl border border-[#6C63FF]/20 space-y-4"
                >
                  <div className="flex items-center gap-2 text-[#6C63FF]">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-bold">تقرير الذكاء الاصطناعي</span>
                  </div>
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    <Markdown>{analysis}</Markdown>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {qs.map((q, i) => (
            <div key={i} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-[#6C63FF]/20 text-[#6C63FF] flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                <div className="font-bold text-sm leading-relaxed">{q.q}</div>
              </div>
              <div className="grid grid-cols-1 gap-2 mr-9">
                {q.a.map((opt: string, ai: number) => {
                  const isSelected = answers[i] === ai;
                  const isCorrect = q.c === ai;
                  const showResult = submitted;
                  return (
                    <button 
                      key={ai}
                      disabled={submitted}
                      onClick={() => setAnswers({ ...answers, [i]: ai })}
                      className={cn(
                        "w-full text-right p-3 rounded-xl text-xs transition-all border",
                        !showResult && isSelected ? "bg-[#6C63FF]/20 border-[#6C63FF] text-[#6C63FF]" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
                        showResult && isCorrect ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" : "",
                        showResult && isSelected && !isCorrect ? "bg-red-500/20 border-red-500 text-red-500" : ""
                      )}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="mr-9 p-3 bg-white/5 rounded-xl text-[10px] text-slate-500 leading-relaxed border-r-2 border-[#6C63FF]">
                  💡 {q.e}
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <button 
              onClick={submit}
              className="w-full bg-[#6C63FF] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all"
            >
              تصحيح الاختبار
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center space-y-4">
              <div className="text-4xl font-black text-[#6C63FF]">{score} / {qs.length}</div>
              <div className="text-sm font-bold text-slate-400">
                {score === qs.length ? "ممتاز! أنت أسطورة 🚀" : score >= qs.length / 2 ? "جيد جداً، استمر 💪" : "محتاج تراجع أكتر 📚"}
              </div>
              <button 
                onClick={() => setDone(false)}
                className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
              >
                اختبار جديد
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MindMapContent({ subj, div, addPoints, showToast }: any) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [map, setMap] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"tree" | "text">("text");

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const sys = SYS_BASE(subj.name, div.name);
      const prompt = `أنت خبير في إنشاء الخرائط الذهنية التعليمية.
قم بإنشاء خريطة ذهنية لموضوع: "${topic}" في مادة "${subj.name}".
يجب أن يكون الرد بتنسيق JSON فقط كالتالي:
{
  "title": "عنوان الخريطة",
  "nodes": [
    {
      "text": "الفكرة الرئيسية",
      "children": [
        {
          "text": "فكرة فرعية 1",
          "children": [{"text": "تفصيل 1.1"}, {"text": "تفصيل 1.2"}]
        }
      ]
    }
  ]
}`;
      const res = await aiCall([{ role: "user", content: prompt }], sys);
      const data = JSON.parse(res.replace(/```json|```/g, ""));
      setMap(data);
      addPoints(15, "mindmaps");
    } catch (e) {
      console.error(e);
      showToast("❌ فشل إنشاء الخريطة", true);
    } finally {
      setLoading(false);
    }
  };

  const copyMap = () => {
    if (!map) return;
    let text = `${map.title}\n\n`;
    const addNode = (node: any, depth = 0) => {
      text += `${"  ".repeat(depth)}- ${node.text}\n`;
      if (node.children) node.children.forEach((c: any) => addNode(c, depth + 1));
    };
    map.nodes.forEach((n: any) => addNode(n));
    navigator.clipboard.writeText(text);
    showToast("تم نسخ الخريطة بنجاح! ✅");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.text(map.title, 10, 10);
    let y = 20;
    const addNode = (node: any, depth = 0) => {
      doc.setFontSize(14 - depth * 2);
      doc.text(`${"  ".repeat(depth)}- ${node.text}`, 10, y);
      y += 10;
      if (node.children) node.children.forEach((c: any) => addNode(c, depth + 1));
    };
    map.nodes.forEach((n: any) => addNode(n));
    doc.save(`${map.title}.pdf`);
  };

  const renderNode = (node: any, depth = 0) => (
    <div key={node.text} className={cn("space-y-2", depth > 0 && "mr-6 border-r-2 border-[#6C63FF]/20 pr-4")}>
      <div className={cn(
        "p-3 rounded-xl font-bold text-sm transition-all",
        depth === 0 ? "bg-[#6C63FF] text-white text-lg" : "bg-white/5 border border-white/10 text-slate-200"
      )}>
        {node.text}
      </div>
      {node.children && node.children.map((child: any) => renderNode(child, depth + 1))}
    </div>
  );

  const renderTextNode = (node: any, depth = 0) => (
    <div key={node.text} className="text-sm text-slate-300 leading-relaxed">
      <span className="text-[#6C63FF] font-black">{"  ".repeat(depth)}•</span> {node.text}
      {node.children && node.children.map((child: any) => renderTextNode(child, depth + 1))}
    </div>
  );

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full">
      <div className="glass-card p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#6C63FF]/20 rounded-xl flex items-center justify-center">
            <Brain className="h-6 w-6 text-[#6C63FF]" />
          </div>
          <div>
            <h3 className="font-bold text-white">الخرائط الذهنية الذكية</h3>
            <p className="text-xs text-slate-400">لخص المنهج في هيكل شجري منظم</p>
          </div>
        </div>
        <input 
          className="w-full glass-input rounded-xl px-4 py-3 text-sm"
          placeholder="اكتب اسم الدرس أو الموضوع..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <button 
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full modern-button py-3 flex items-center justify-center gap-2"
        >
          {loading ? <Spin sm /> : <Zap className="h-4 w-4" />}
          إنشاء الخريطة
        </button>
      </div>

      {map && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl gradient-text">{map.title}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setViewMode(viewMode === "tree" ? "text" : "tree")}
                className={cn("p-2 glass-card rounded-lg transition-all", viewMode === "text" ? "text-[#6C63FF]" : "text-slate-400")}
                title={viewMode === "tree" ? "عرض نصي" : "عرض شجري"}
              >
                {viewMode === "tree" ? <FileText className="h-4 w-4" /> : <Brain className="h-4 w-4" />}
              </button>
              <button onClick={copyMap} className="p-2 glass-card rounded-lg text-slate-400 hover:text-[#6C63FF] transition-all" title="نسخ">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={downloadPDF} className="p-2 glass-card rounded-lg text-slate-400 hover:text-[#6C63FF] transition-all" title="تحميل PDF">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => setMap(null)} className="p-2 glass-card rounded-lg text-slate-400 hover:text-red-500 transition-all">
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className={cn("space-y-4", viewMode === "text" && "glass-card p-6 rounded-2xl")}>
            {map.nodes.map((node: any) => viewMode === "tree" ? renderNode(node) : renderTextNode(node))}
          </div>
        </div>
      )}
    </div>
  );
}

function FlashcardsContent({ subj, div, addPoints, showToast }: any) {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const sys = SYS_BASE(subj.name, div.name);
      const prompt = `قم بإنشاء 10 بطاقات تعليمية (Flashcards) لموضوع: "${topic}" في مادة "${subj.name}".
يجب أن يكون الرد بتنسيق JSON فقط كالتالي:
[
  {"q": "السؤال أو المصطلح", "a": "الإجابة أو التعريف"}
]`;
      const res = await aiCall([{ role: "user", content: prompt }], sys);
      const data = JSON.parse(res.replace(/```json|```/g, ""));
      setCards(data);
      setIdx(0);
      setFlipped(false);
      addPoints(10, "flashcards");
    } catch (e) {
      console.error(e);
      showToast("❌ فشل توليد البطاقات", true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#6C63FF]/20 rounded-xl flex items-center justify-center">
            <RotateCcw className="h-6 w-6 text-[#6C63FF]" />
          </div>
          <div>
            <h3 className="font-bold text-white">البطاقات الذكية</h3>
            <p className="text-xs text-slate-400">ذاكر بذكاء مع نظام التكرار المتباعد</p>
          </div>
        </div>
        <input 
          className="w-full bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-[#6C63FF] outline-none transition-all"
          placeholder="اكتب اسم الدرس..."
          value={topic}
          onChange={e => setTopic(e.target.value)}
        />
        <button 
          onClick={generate}
          disabled={loading || !topic.trim()}
          className="w-full bg-[#6C63FF] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
        >
          {loading ? <Spin sm /> : <Play className="h-4 w-4" />}
          توليد البطاقات
        </button>
      </div>

      {cards.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold text-slate-500">بطاقة {idx + 1} من {cards.length}</span>
            <div className="flex gap-1">
              {cards.map((_, i) => (
                <div key={i} className={cn("w-1.5 h-1.5 rounded-full", i === idx ? "bg-[#6C63FF]" : "bg-white/10")} />
              ))}
            </div>
          </div>

          <div 
            className="perspective-1000 h-64 cursor-pointer"
            onClick={() => setFlipped(!flipped)}
          >
            <motion.div 
              className="relative w-full h-full transition-all duration-500 preserve-3d"
              animate={{ rotateY: flipped ? 180 : 0 }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front */}
              <div 
                className="absolute inset-0 backface-hidden bg-white/5 border border-white/10 rounded-3xl p-8 flex flex-center text-center"
                style={{ backfaceVisibility: "hidden" }}
              >
                <div className="m-auto space-y-4">
                  <div className="text-xs font-bold text-[#6C63FF] uppercase tracking-widest">السؤال</div>
                  <div className="text-xl font-bold text-white leading-relaxed">{cards[idx].q}</div>
                </div>
              </div>
              {/* Back */}
              <div 
                className="absolute inset-0 backface-hidden bg-[#6C63FF] rounded-3xl p-8 flex flex-center text-center rotate-y-180"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="m-auto space-y-4">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-widest">الإجابة</div>
                  <div className="text-xl font-bold text-white leading-relaxed">{cards[idx].a}</div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex gap-4">
            <button 
              disabled={idx === 0}
              onClick={() => { setIdx(idx - 1); setFlipped(false); }}
              className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-2xl font-bold disabled:opacity-30"
            >
              السابق
            </button>
            <button 
              disabled={idx === cards.length - 1}
              onClick={() => { setIdx(idx + 1); setFlipped(false); }}
              className="flex-1 bg-[#6C63FF] text-white py-4 rounded-2xl font-bold disabled:opacity-30"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamContent({ subj, div, addPoints, showToast }: any) {
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState<any[]>([]);
  const [ans, setAns] = useState<any>({});
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(3600);
  const [cnt, setCnt] = useState(20);

  useEffect(() => {
    let timer: any;
    if (exam.length > 0 && !done && time > 0) {
      timer = setInterval(() => setTime(t => t - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [exam, done, time]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}:${rs < 10 ? '0' : ''}${rs}`;
  };

  const start = async () => {
    setLoading(true);
    try {
      const sys = SYS_BASE(subj.name, div.name);
      const prompt = `قم بإنشاء امتحان شامل لمادة "${subj.name}" (نظام الثانوية العامة المصري).
الامتحان يتكون من ${cnt} سؤال اختيار من متعدد (MCQ).
يجب أن يكون الرد بتنسيق JSON فقط كالتالي:
[
  {"q": "السؤال", "o": ["أ", "ب", "ج", "د"], "a": 0, "e": "التفسير"}
]`;
      const res = await aiCall([{ role: "user", content: prompt }], sys);
      const data = JSON.parse(res.replace(/```json|```/g, ""));
      setExam(data);
      setAns({});
      setDone(false);
      setTime(cnt * 180); // 3 mins per question
      addPoints(50, "exams");
    } catch (e) {
      console.error(e);
      showToast("❌ فشل توليد الامتحان", true);
    } finally {
      setLoading(false);
    }
  };

  const submit = () => {
    let s = 0;
    exam.forEach((q, i) => {
      if (ans[i] === q.a) s++;
    });
    setScore(s);
    setDone(true);
  };

  return (
    <div className="p-4 space-y-6">
      {exam.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-6">
          <div className="w-20 h-20 bg-[#6C63FF]/20 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="h-10 w-10 text-[#6C63FF]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">محاكي الامتحان النهائي</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              امتحان شامل يحاكي نظام الثانوية العامة الجديد.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2 text-right">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">عدد الأسئلة</label>
              <div className="flex items-center gap-4">
                <input 
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  className="flex-1 accent-[#6C63FF]"
                  value={cnt}
                  onChange={e => setCnt(parseInt(e.target.value))}
                />
                <span className="w-12 h-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-[#6C63FF]">
                  {cnt}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={start}
            disabled={loading}
            className="w-full bg-[#6C63FF] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Spin sm /> : <Play className="h-5 w-5" />}
            ابدأ الامتحان الآن
          </button>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          <div className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md p-4 border border-white/10 rounded-2xl flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className={cn("h-5 w-5", time < 300 ? "text-red-500 animate-pulse" : "text-[#6C63FF]")} />
              <span className={cn("font-mono font-bold", time < 300 ? "text-red-500" : "text-white")}>
                {formatTime(time)}
              </span>
            </div>
            <div className="text-xs font-bold text-slate-400">
              {Object.keys(ans).length} / {exam.length} تم الحل
            </div>
          </div>

          <div className="space-y-8">
            {exam.map((q, i) => (
              <div key={i} className="space-y-4">
                <div className="flex gap-3">
                  <span className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-white font-bold leading-relaxed">{q.q}</p>
                </div>
                <div className="grid grid-cols-1 gap-2 mr-11">
                  {q.o.map((opt: string, oi: number) => (
                    <button 
                      key={oi}
                      disabled={done}
                      onClick={() => setAns({ ...ans, [i]: oi })}
                      className={cn(
                        "p-4 rounded-xl text-right text-sm transition-all border",
                        ans[i] === oi 
                          ? "bg-[#6C63FF]/20 border-[#6C63FF] text-white" 
                          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10",
                        done && oi === q.a && "bg-green-500/20 border-green-500 text-green-400",
                        done && ans[i] === oi && oi !== q.a && "bg-red-500/20 border-red-500 text-red-400"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {done && (
                  <div className="mr-11 p-4 bg-white/5 rounded-xl text-xs text-slate-400 leading-relaxed border-r-2 border-[#6C63FF]">
                    💡 {q.e}
                  </div>
                )}
              </div>
            ))}
          </div>

          {!done ? (
            <button 
              onClick={submit}
              className="w-full bg-[#6C63FF] text-white font-bold py-4 rounded-2xl hover:opacity-90 transition-all"
            >
              إنهاء وتسليم الامتحان
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center space-y-6">
              <div className="text-5xl font-black text-[#6C63FF]">{score} / {exam.length}</div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-white">النتيجة النهائية</h4>
                <p className="text-sm text-slate-400">
                  {score >= 18 ? "أنت عبقري! مستواك يؤهلك للدرجة النهائية 🎯" : score >= 14 ? "مستوى ممتاز، ركز على الأخطاء البسيطة 💪" : "محتاج مجهود أكبر، راجع التفسيرات كويس 📚"}
                </p>
              </div>
              <button 
                onClick={() => setExam([])}
                className="w-full bg-white/10 text-white font-bold py-4 rounded-2xl hover:bg-white/20 transition-all"
              >
                رجوع للرئيسية
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

