import { useState, useRef, useEffect, useCallback } from "react";

// ── Supabase config ──────────────────────────────────────────────────────────
const SB_URL = "https://egnmsfgaskkmiengmcxa.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnbm1zZmdhc2trbWllbmdtY3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwNzgxMTYsImV4cCI6MjA4ODY1NDExNn0.EG41Rx-JzWNuR_uGLBGEqSgtzsqOMbmrrsM__rJFGSg";

const sb = {
  headers: { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` },

  async signUp(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/signup`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signIn(email, password) {
    const r = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ email, password })
    });
    return r.json();
  },

  async signOut(token) {
    await fetch(`${SB_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { ...this.headers, "Authorization": `Bearer ${token}` }
    });
  },

  authHeaders(token) {
    return { ...this.headers, "Authorization": `Bearer ${token}`, "Prefer": "return=representation" };
  },

  async upsertProfile(token, userId, data) {
    // try update first
    const r = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}`, {
      method: "PATCH", headers: this.authHeaders(token),
      body: JSON.stringify(data)
    });
    const text = await r.text();
    // if nothing was updated (no row), insert
    if (text === "[]" || text === "") {
      await fetch(`${SB_URL}/rest/v1/profiles`, {
        method: "POST", headers: this.authHeaders(token),
        body: JSON.stringify({ id: userId, ...data })
      });
    }
  },

  async getProfile(token, userId) {
    const r = await fetch(`${SB_URL}/rest/v1/profiles?id=eq.${userId}&select=*`, {
      headers: this.authHeaders(token)
    });
    const d = await r.json();
    return Array.isArray(d) ? d[0] : null;
  },

  async upsertPlan(token, userId, data) {
    const r = await fetch(`${SB_URL}/rest/v1/plans?user_id=eq.${userId}&select=id`, {
      headers: this.authHeaders(token)
    });
    const existing = await r.json();
    if (Array.isArray(existing) && existing.length > 0) {
      await fetch(`${SB_URL}/rest/v1/plans?user_id=eq.${userId}`, {
        method: "PATCH", headers: this.authHeaders(token),
        body: JSON.stringify({ ...data, updated_at: new Date().toISOString() })
      });
    } else {
      await fetch(`${SB_URL}/rest/v1/plans`, {
        method: "POST", headers: this.authHeaders(token),
        body: JSON.stringify({ user_id: userId, ...data })
      });
    }
  },

  async getPlan(token, userId) {
    const r = await fetch(`${SB_URL}/rest/v1/plans?user_id=eq.${userId}&select=*`, {
      headers: this.authHeaders(token)
    });
    const d = await r.json();
    return Array.isArray(d) ? d[0] : null;
  },

  async addProgress(token, userId, weight, date) {
    await fetch(`${SB_URL}/rest/v1/progress_log`, {
      method: "POST", headers: this.authHeaders(token),
      body: JSON.stringify({ user_id: userId, weight, date })
    });
  },

  async getProgress(token, userId) {
    const r = await fetch(`${SB_URL}/rest/v1/progress_log?user_id=eq.${userId}&order=created_at.asc&select=*`, {
      headers: this.authHeaders(token)
    });
    return r.json();
  }
};

// ── i18n ─────────────────────────────────────────────────────────────────────
const T = {
  es: {
    tagline: "Tu coach personalizado con inteligencia artificial",
    login: "Iniciar sesión", register: "Registrarse", logout: "Cerrar sesión",
    email: "Email", password: "Contraseña", confirmPassword: "Confirmar contraseña",
    noAccount: "¿No tenés cuenta?", hasAccount: "¿Ya tenés cuenta?",
    lang: "EN", steps: ["Perfil", "Objetivos", "Tu Plan"],
    name: "¿Cómo te llamás?", namePh: "Tu nombre",
    age: "Edad", weight: "Peso (kg)", height: "Altura (cm)", sex: "Sexo",
    male: "Masculino", female: "Femenino", next: "Siguiente →", back: "← Atrás",
    activity: "Nivel de actividad",
    acts: ["Sedentario", "Ligero (1-3 días/semana)", "Moderado (3-5 días)", "Intenso (6-7 días)", "Muy intenso"],
    goal: "Tu objetivo principal",
    goals: ["🔥 Perder grasa", "💪 Ganar músculo", "⚖️ Mantenerme", "🏃 Mejorar rendimiento"],
    diet: "Preferencia alimentaria",
    diets: ["Sin restricciones", "Vegetariano", "Vegano", "Sin gluten", "Bajo en carbos"],
    generate: "Generar mi plan ✨", generating: "Creando tu plan personalizado...",
    tabs: ["Calorías", "Comidas", "Ejercicios", "Progreso", "Chat"],
    tdee: "Gasto calórico total", target: "Objetivo calórico",
    protein: "Proteínas", carbs: "Carbohidratos", fat: "Grasas",
    logWeight: "Registrar peso de hoy (kg)", log: "Registrar",
    progressTitle: "Tu progreso", noProgress: "Aún no hay registros. ¡Empezá hoy!",
    chatPh: "Preguntame sobre tu entrenamiento, nutrición...",
    send: "Enviar", thinking: "FitAI está pensando...",
    restart: "Inicio", bmi: "IMC",
    notes: "¿Algo que debamos considerar? (opcional)",
    notesPh: "Ej: lesión en rodilla, celíaco, trabajo de noche...",
    saving: "Guardando...", saved: "✓ Guardado", loadingData: "Cargando tu plan...",
    welcomeBack: "¡Bienvenido de vuelta", passwordMismatch: "Las contraseñas no coinciden",
    authError: "Error. Verificá tu email y contraseña.",
    continueLastPlan: "Continuar mi último plan", startNewPlan: "Crear nuevo plan",
    lastPlan: "Plan guardado el",
  },
  en: {
    tagline: "Your AI-powered personal coach",
    login: "Sign in", register: "Sign up", logout: "Sign out",
    email: "Email", password: "Password", confirmPassword: "Confirm password",
    noAccount: "Don't have an account?", hasAccount: "Already have an account?",
    lang: "ES", steps: ["Profile", "Goals", "Your Plan"],
    name: "What's your name?", namePh: "Your name",
    age: "Age", weight: "Weight (kg)", height: "Height (cm)", sex: "Sex",
    male: "Male", female: "Female", next: "Next →", back: "← Back",
    activity: "Activity level",
    acts: ["Sedentary", "Light (1-3 days/week)", "Moderate (3-5 days)", "Active (6-7 days)", "Very active"],
    goal: "Your main goal",
    goals: ["🔥 Lose fat", "💪 Build muscle", "⚖️ Maintain weight", "🏃 Improve performance"],
    diet: "Dietary preference",
    diets: ["No restrictions", "Vegetarian", "Vegan", "Gluten-free", "Low carb"],
    generate: "Generate my plan ✨", generating: "Creating your personalized plan...",
    tabs: ["Calories", "Meals", "Workouts", "Progress", "Chat"],
    tdee: "Total daily energy", target: "Caloric target",
    protein: "Protein", carbs: "Carbohydrates", fat: "Fat",
    logWeight: "Log today's weight (kg)", log: "Log",
    progressTitle: "Your progress", noProgress: "No entries yet. Start today!",
    chatPh: "Ask me about your training, nutrition...",
    send: "Send", thinking: "FitAI is thinking...",
    restart: "Home", bmi: "BMI",
    notes: "Anything we should consider? (optional)",
    notesPh: "E.g. knee injury, gluten intolerance, night shift...",
    saving: "Saving...", saved: "✓ Saved", loadingData: "Loading your plan...",
    welcomeBack: "Welcome back", passwordMismatch: "Passwords don't match",
    authError: "Error. Check your email and password.",
    continueLastPlan: "Continue my last plan", startNewPlan: "Create new plan",
    lastPlan: "Plan saved on",
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcCalories(data) {
  const { weight, height, age, sex, activityLevel, goal } = data;
  const w = parseFloat(weight), h = parseFloat(height), a = parseInt(age);
  let bmr = sex === "male" ? 10*w + 6.25*h - 5*a + 5 : 10*w + 6.25*h - 5*a - 161;
  const factors = [1.2, 1.375, 1.55, 1.725, 1.9];
  const tdee = Math.round(bmr * factors[activityLevel]);
  let target = tdee;
  if (goal === 0) target = tdee - 500;
  if (goal === 1) target = tdee + 300;
  const protein = Math.round(w * (goal === 1 ? 2.2 : 1.8));
  const fat = Math.round((target * 0.25) / 9);
  const carbs = Math.round((target - protein * 4 - fat * 9) / 4);
  const bmi = (w / ((h / 100) ** 2)).toFixed(1);
  return { tdee, target, protein, carbs, fat, bmi };
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@400;500;700&family=DM+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #020817; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0f172a; }
  ::-webkit-scrollbar-thumb { background: #34d399; border-radius: 99px; }
  .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; }
  .inp { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 12px 16px; color: #f1f5f9; font-size: 15px; font-family: 'DM Sans', sans-serif; width: 100%; outline: none; transition: border .2s; }
  .inp:focus { border-color: #34d399; }
  .btn { background: linear-gradient(135deg, #34d399, #059669); color: #022c22; font-weight: 700; font-family: 'Syne', sans-serif; font-size: 15px; border: none; border-radius: 12px; padding: 14px 28px; cursor: pointer; transition: transform .15s, opacity .15s; width: 100%; }
  .btn:hover { transform: translateY(-1px); opacity: .92; }
  .btn:disabled { opacity: .4; cursor: not-allowed; transform: none; }
  .btn-ghost { background: #1e293b; color: #94a3b8; }
  .btn-ghost:hover { background: #334155; color: #f1f5f9; }
  .btn-outline { background: transparent; color: #34d399; border: 1.5px solid #34d399; font-weight: 700; font-family: 'Syne', sans-serif; font-size: 15px; border-radius: 12px; padding: 14px 28px; cursor: pointer; transition: all .15s; width: 100%; }
  .btn-outline:hover { background: rgba(52,211,153,.08); transform: translateY(-1px); }
  .option { background: #1e293b; border: 1.5px solid #334155; border-radius: 10px; padding: 12px 16px; cursor: pointer; transition: all .2s; color: #cbd5e1; font-family: 'DM Sans', sans-serif; font-size: 14px; }
  .option:hover { border-color: #34d399; color: #f1f5f9; }
  .option.sel { border-color: #34d399; background: rgba(52,211,153,.1); color: #34d399; font-weight: 600; }
  .tab { flex: 1; padding: 10px 4px; background: transparent; border: none; color: #64748b; font-family: 'DM Sans', sans-serif; font-size: 12px; cursor: pointer; transition: color .2s; border-bottom: 2px solid transparent; }
  .tab.active { color: #34d399; border-bottom-color: #34d399; }
  textarea.inp { resize: none; }
  @keyframes fadeIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:none } }
  .fade { animation: fadeIn .4s ease forwards; }
  @keyframes spin { to { transform: rotate(360deg) } }
  .spin { animation: spin 1s linear infinite; }
`;

function MacroBar({ label, value, unit, color, max }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#94a3b8", fontFamily: "DM Sans, sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", fontFamily: "DM Mono, monospace" }}>{value}{unit}</span>
      </div>
      <div style={{ height: 6, background: "#1e293b", borderRadius: 99 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1)" }} />
      </div>
    </div>
  );
}

function PlanModifier({ lang, type, plan, onUpdate, userData, macros }) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const label = lang === "es"
    ? (type === "meals" ? "✏️ Modificar plan de comidas" : "✏️ Modificar plan de ejercicios")
    : (type === "meals" ? "✏️ Modify meal plan" : "✏️ Modify workout plan");
  const placeholder = lang === "es"
    ? (type === "meals" ? "Ej: no me gusta el pollo, cambiá el miércoles..." : "Ej: hoy hice running en vez de pesas...")
    : (type === "meals" ? "E.g. I don't like chicken, change Wednesday..." : "E.g. today I ran instead of lifting...");

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setLoading(true);
    const system = lang === "es"
      ? `Eres FitAI. El usuario tiene este plan:\n\n${plan}\n\nPerfil: ${userData.name}, ${userData.age}a, ${userData.weight}kg. Cal: ${macros?.target}/día.\nDevolvé ÚNICAMENTE el plan completo actualizado en el mismo formato markdown. Sin explicaciones.`
      : `You are FitAI. The user has this plan:\n\n${plan}\n\nProfile: ${userData.name}, ${userData.age}y, ${userData.weight}kg. Cal: ${macros?.target}/day.\nReturn ONLY the complete updated plan in the same markdown format. No explanations.`;
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, system, messages: [{ role: "user", content: userMsg }] })
      });
      const data = await res.json();
      const updated = data.content?.map(b => b.text || "").join("") || "";
      onUpdate(updated);
      setMessages(prev => [...prev, { role: "assistant", text: lang === "es" ? "✅ Plan actualizado y guardado." : "✅ Plan updated and saved." }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Error." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 20 }}>
      <p style={{ fontFamily: "Syne, sans-serif", color: "#34d399", fontSize: 15, fontWeight: 700, marginBottom: 14 }}>{label}</p>
      {messages.length > 0 && (
        <div style={{ marginBottom: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 160, overflowY: "auto" }}>
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
              <span style={{ background: m.role === "user" ? "linear-gradient(135deg,#34d399,#059669)" : "#1e293b", color: m.role === "user" ? "#022c22" : "#cbd5e1", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "8px 12px", fontSize: 13, maxWidth: "85%" }}>{m.text}</span>
            </div>
          ))}
          <div ref={endRef} />
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input style={{ flex: 1, background: "#1e293b", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none" }}
          placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
        <button onClick={send} disabled={loading}
          style={{ background: "linear-gradient(135deg,#34d399,#059669)", color: "#022c22", border: "none", borderRadius: 10, padding: "10px 18px", fontWeight: 700, fontFamily: "Syne, sans-serif", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, whiteSpace: "nowrap" }}>
          {loading ? "..." : (lang === "es" ? "Actualizar" : "Update")}
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function FitAI() {
  const [lang, setLang] = useState("es");
  const t = T[lang];

  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authConfirm, setAuthConfirm] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [session, setSession] = useState(null);

  const [screen, setScreen] = useState("auth");
  const [step, setStep] = useState(0);
  const [userData, setUserData] = useState({ name: "", age: "", weight: "", height: "", sex: "male", activityLevel: 1, goal: 0, diet: 0, notes: "" });
  const [macros, setMacros] = useState(null);
  const [mealPlan, setMealPlan] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [progressLog, setProgressLog] = useState([]);
  const [weightInput, setWeightInput] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [savedPlanDate, setSavedPlanDate] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const savePlanToDb = useCallback(async (meal, workout, m, sess, uData) => {
    if (!sess) return;
    setSaveStatus("saving");
    try {
      await Promise.all([
        sb.upsertPlan(sess.token, sess.userId, { meal_plan: meal, workout_plan: workout, macros: m }),
        sb.upsertProfile(sess.token, sess.userId, {
          name: uData.name, age: parseInt(uData.age), weight: parseFloat(uData.weight),
          height: parseFloat(uData.height), sex: uData.sex, activity_level: uData.activityLevel,
          goal: uData.goal, diet: uData.diet, notes: uData.notes
        })
      ]);
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
    } catch { setSaveStatus(""); }
  }, []);

  const update = (k, v) => setUserData(p => ({ ...p, [k]: v }));

  const handleAuth = async () => {
    setAuthError("");
    if (authMode === "register" && authPassword !== authConfirm) { setAuthError(t.passwordMismatch); return; }
    if (authPassword.length < 6) { setAuthError(lang === "es" ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters."); return; }
    setAuthLoading(true);
    try {
      const data = authMode === "register"
        ? await sb.signUp(authEmail, authPassword)
        : await sb.signIn(authEmail, authPassword);

      console.log("Auth response:", JSON.stringify(data));

      // Registration success but needs email confirmation
      if (authMode === "register" && data.id && !data.access_token) {
        setAuthError(lang === "es" ? "✉️ Revisá tu email y hacé click en el link de confirmación. Luego iniciá sesión." : "✉️ Check your email and click the confirmation link. Then sign in.");
        setAuthMode("login");
        setAuthLoading(false); return;
      }

      // Handle known errors
      if (data.error || data.error_code || data.msg) {
        const msg = (data.error_description || data.msg || data.error || "").toLowerCase();
        if (msg.includes("email not confirmed")) {
          setAuthError(lang === "es" ? "✉️ Confirmá tu email primero. Revisá bandeja y spam." : "✉️ Confirm your email first. Check inbox and spam.");
        } else if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
          setAuthError(lang === "es" ? "Email o contraseña incorrectos." : "Invalid email or password.");
        } else if (msg.includes("already registered") || msg.includes("already exists")) {
          setAuthError(lang === "es" ? "Este email ya está registrado. Iniciá sesión." : "Email already registered. Sign in instead.");
          setAuthMode("login");
        } else {
          setAuthError(data.error_description || data.msg || data.error || t.authError);
        }
        setAuthLoading(false); return;
      }

      if (!data.access_token) { setAuthError(t.authError); setAuthLoading(false); return; }

      const sess = { token: data.access_token, userId: data.user?.id, email: authEmail };
      setSession(sess);
      setLoading(true);

      const [profile, plan, progress] = await Promise.all([
        sb.getProfile(sess.token, sess.userId),
        sb.getPlan(sess.token, sess.userId),
        sb.getProgress(sess.token, sess.userId)
      ]);
      setLoading(false);

      if (profile?.name) {
        setUserData({ name: profile.name || "", age: profile.age || "", weight: profile.weight || "", height: profile.height || "", sex: profile.sex || "male", activityLevel: profile.activity_level ?? 1, goal: profile.goal ?? 0, diet: profile.diet ?? 0, notes: profile.notes || "" });
      }
      if (plan?.meal_plan) {
        setMealPlan(plan.meal_plan);
        setWorkoutPlan(plan.workout_plan || "");
        setMacros(plan.macros || null);
        setSavedPlanDate(plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : null);
      }
      if (Array.isArray(progress) && progress.length > 0) {
        setProgressLog(progress.map(p => ({ date: p.date, weight: p.weight })));
      }

      if (plan?.meal_plan && profile?.name) setScreen("welcome_back");
      else if (profile?.name) { setScreen("onboard"); setStep(1); }
      else setScreen("onboard");
    } catch { setAuthError(t.authError); setLoading(false); }
    setAuthLoading(false);
  };

  const handleLogout = async () => {
    if (session) await sb.signOut(session.token);
    setSession(null); setScreen("auth"); setMealPlan(""); setWorkoutPlan(""); setMacros(null);
    setProgressLog([]); setChatMessages([]);
    setUserData({ name: "", age: "", weight: "", height: "", sex: "male", activityLevel: 1, goal: 0, diet: 0, notes: "" });
  };

  const generatePlan = async () => {
    setLoading(true);
    const m = calcCalories(userData);
    setMacros(m);
    const goals = t.goals[userData.goal], diet = t.diets[userData.diet];
    const prompt = lang === "es"
      ? `Eres un coach de nutrición y fitness experto. El usuario se llama ${userData.name}, tiene ${userData.age} años, pesa ${userData.weight}kg, mide ${userData.height}cm. Objetivo: ${goals}. Dieta: ${diet}. Calorías: ${m.target} kcal. Macros: ${m.protein}g proteína, ${m.carbs}g carbos, ${m.fat}g grasas.\n\nCrea exactamente estas DOS secciones:\n\n## 🍽️ Plan de Comidas Semanal\nPlan de 7 días con desayuno, almuerzo, merienda y cena. Porciones específicas.\n\n## 💪 Plan de Entrenamiento Semanal\n5 días de entrenamiento. Para cada día: ejercicios con series x repeticiones y descanso.\n\n${userData.notes ? `Consideraciones: ${userData.notes}` : ""}\nFormato claro y motivador. En español.`
      : `You are an expert coach. User: ${userData.name}, ${userData.age}y, ${userData.weight}kg, ${userData.height}cm. Goal: ${goals}. Diet: ${diet}. Calories: ${m.target} kcal. Macros: ${m.protein}g protein, ${m.carbs}g carbs, ${m.fat}g fat.\n\nCreate exactly TWO sections:\n\n## 🍽️ Weekly Meal Plan\n7-day plan with breakfast, lunch, snack and dinner. Specific portions.\n\n## 💪 Weekly Workout Plan\n5 training days. For each day: exercises with sets x reps and rest.\n\n${userData.notes ? `Considerations: ${userData.notes}` : ""}\nClear and motivating format.`;
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 3000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("") || "";
      const fi = (txt, ms) => { for (const m of ms) { const i = txt.indexOf(m); if (i !== -1) return i; } return -1; };
      const mI = fi(text, ["## 🍽️", "🍽️"]), wI = fi(text, ["## 💪", "💪"]);
      const meal = (mI !== -1 && wI > mI) ? text.slice(mI, wI).trim() : text;
      const workout = (wI !== -1 && wI > mI) ? text.slice(wI).trim() : "";
      setMealPlan(meal); setWorkoutPlan(workout);
      await savePlanToDb(meal, workout, m, session, userData);
    } catch { setMealPlan(lang === "es" ? "Error al generar." : "Generation error."); }
    setLoading(false);
    setScreen("plan");
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user", content: chatInput };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs); setChatInput(""); setChatLoading(true);
    const sys = lang === "es"
      ? `Eres FitAI, coach IA. Usuario: ${userData.name}, objetivo: ${t.goals[userData.goal]}, ${macros?.target} kcal/día. Respondé conciso y motivador. Máx 3 párrafos.`
      : `You are FitAI, AI coach. User: ${userData.name}, goal: ${t.goals[userData.goal]}, ${macros?.target} kcal/day. Respond concisely. Max 3 paragraphs.`;
    try {
      const res = await fetch("http://localhost:3001/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: sys, messages: newMsgs })
      });
      const d = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: d.content?.map(b => b.text || "").join("") || "" }]);
    } catch { setChatMessages(prev => [...prev, { role: "assistant", content: "Error." }]); }
    setChatLoading(false);
  };

  const logWeight = async () => {
    if (!weightInput) return;
    const entry = { date: new Date().toLocaleDateString(), weight: parseFloat(weightInput) };
    setProgressLog(prev => [...prev, entry]); setWeightInput("");
    if (session) await sb.addProgress(session.token, session.userId, entry.weight, entry.date);
  };

  const renderMd = (text) => {
    if (!text) return <p style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: 24 }}>{lang === "es" ? "Sin contenido aún." : "No content yet."}</p>;
    return text.split("\n").map((line, i) => {
      if (line.startsWith("## ")) return <h3 key={i} style={{ color: "#34d399", fontFamily: "Syne, sans-serif", fontSize: 18, margin: "20px 0 10px" }}>{line.slice(3)}</h3>;
      if (line.startsWith("### ")) return <h4 key={i} style={{ color: "#94a3b8", fontFamily: "Syne, sans-serif", fontSize: 15, margin: "14px 0 6px" }}>{line.slice(4)}</h4>;
      if (/^\*\*.*\*\*$/.test(line)) return <p key={i} style={{ fontWeight: 700, color: "#f1f5f9", margin: "8px 0 4px", fontFamily: "DM Sans, sans-serif" }}>{line.replace(/\*\*/g, "")}</p>;
      if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ color: "#cbd5e1", margin: "3px 0", paddingLeft: 14, fontSize: 14, fontFamily: "DM Sans, sans-serif", borderLeft: "2px solid #34d399" }}>{line.replace(/^[-•] /, "")}</p>;
      if (!line.trim()) return <br key={i} />;
      return <p key={i} style={{ color: "#cbd5e1", margin: "4px 0", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>{line}</p>;
    });
  };

  // ── Spinner ──
  if (loading && screen === "auth") return (
    <><style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#020817", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ width: 48, height: 48, border: "3px solid #1e293b", borderTop: "3px solid #34d399", borderRadius: "50%" }} className="spin" />
        <p style={{ color: "#64748b", fontSize: 15, fontFamily: "DM Sans, sans-serif" }}>{t.loadingData}</p>
      </div>
    </>
  );

  // ── Auth ──
  if (screen === "auth") return (
    <><style>{css}</style>
      <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at 30% 20%, rgba(52,211,153,.08) 0%, transparent 60%), #020817", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 420, width: "100%" }} className="fade">
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ width: 60, height: 60, background: "linear-gradient(135deg,#34d399,#059669)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 26 }}>🤖</div>
            <h1 style={{ fontFamily: "Syne, sans-serif", fontSize: 40, fontWeight: 800, color: "#f1f5f9" }}>Fit<span style={{ color: "#34d399" }}>AI</span></h1>
            <p style={{ color: "#64748b", fontFamily: "DM Sans, sans-serif", fontSize: 15, marginTop: 6 }}>{t.tagline}</p>
          </div>
          <div className="card">
            <h2 style={{ fontFamily: "Syne, sans-serif", color: "#f1f5f9", fontSize: 20, marginBottom: 22, textAlign: "center" }}>{authMode === "login" ? t.login : t.register}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="inp" type="email" placeholder={t.email} value={authEmail} onChange={e => setAuthEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
              <input className="inp" type="password" placeholder={t.password} value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />
              {authMode === "register" && <input className="inp" type="password" placeholder={t.confirmPassword} value={authConfirm} onChange={e => setAuthConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAuth()} />}
              {authError && <p style={{ color: "#ef4444", fontSize: 13, fontFamily: "DM Sans, sans-serif", textAlign: "center" }}>{authError}</p>}
              <button className="btn" onClick={handleAuth} disabled={authLoading} style={{ marginTop: 4 }}>{authLoading ? "..." : (authMode === "login" ? t.login : t.register)}</button>
              <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>
                {authMode === "login" ? t.noAccount : t.hasAccount}{" "}
                <span style={{ color: "#34d399", cursor: "pointer", fontWeight: 600 }} onClick={() => { setAuthMode(authMode === "login" ? "register" : "login"); setAuthError(""); }}>
                  {authMode === "login" ? t.register : t.login}
                </span>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => setLang(l => l === "es" ? "en" : "es")} style={{ marginTop: 12, fontSize: 13 }}>{t.lang}</button>
        </div>
      </div>
    </>
  );

  // ── Welcome back ──
  if (screen === "welcome_back") return (
    <><style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }} className="fade">
          <div style={{ fontSize: 56, marginBottom: 20 }}>👋</div>
          <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 30, fontWeight: 800, color: "#f1f5f9", marginBottom: 8 }}>
            {t.welcomeBack},<br /><span style={{ color: "#34d399" }}>{userData.name}</span>
          </h2>
          {savedPlanDate && <p style={{ color: "#64748b", fontFamily: "DM Sans, sans-serif", fontSize: 14, marginBottom: 36 }}>{t.lastPlan} {savedPlanDate}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button className="btn" onClick={() => { setScreen("plan"); setActiveTab(0); }}>{t.continueLastPlan}</button>
            <button className="btn-outline" onClick={() => { setScreen("onboard"); setStep(0); }}>{t.startNewPlan}</button>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ fontSize: 13 }}>{t.logout}</button>
          </div>
        </div>
      </div>
    </>
  );

  // ── Onboarding ──
  if (screen === "onboard") {
    const valid0 = userData.name && userData.age && userData.weight && userData.height;
    return (
      <><style>{css}</style>
        <div style={{ minHeight: "100vh", background: "#020817", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 480, width: "100%" }} className="fade">
            <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
              {t.steps.map((s, i) => (
                <div key={i} style={{ flex: 1 }}>
                  <div style={{ height: 3, borderRadius: 99, background: i <= step ? "#34d399" : "#1e293b", transition: "background .3s" }} />
                  <p style={{ fontSize: 11, color: i === step ? "#34d399" : "#475569", fontFamily: "DM Sans, sans-serif", marginTop: 6 }}>{s}</p>
                </div>
              ))}
            </div>

            {step === 0 && (
              <div className="card fade">
                <h2 style={{ fontFamily: "Syne, sans-serif", color: "#f1f5f9", fontSize: 22, marginBottom: 24 }}>👋 {t.name}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input className="inp" placeholder={t.namePh} value={userData.name} onChange={e => update("name", e.target.value)} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    {[["age", t.age, "25"], ["weight", t.weight, "70"], ["height", t.height, "175"]].map(([k, label, ph]) => (
                      <div key={k}>
                        <label style={{ fontSize: 12, color: "#64748b", fontFamily: "DM Sans, sans-serif", display: "block", marginBottom: 6 }}>{label}</label>
                        <input className="inp" type="number" placeholder={ph} value={userData[k]} onChange={e => update(k, e.target.value)} />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: "#64748b", fontFamily: "DM Sans, sans-serif", display: "block", marginBottom: 8 }}>{t.sex}</label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {["male", "female"].map((s, i) => (
                        <div key={s} className={`option${userData.sex === s ? " sel" : ""}`} onClick={() => update("sex", s)} style={{ textAlign: "center" }}>
                          {i === 0 ? "♂ " : "♀ "}{i === 0 ? t.male : t.female}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="btn" onClick={() => setStep(1)} disabled={!valid0} style={{ opacity: valid0 ? 1 : 0.4 }}>{t.next}</button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="card fade">
                <h2 style={{ fontFamily: "Syne, sans-serif", color: "#f1f5f9", fontSize: 22, marginBottom: 24 }}>🎯 {t.goal}</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                  {t.goals.map((g, i) => <div key={i} className={`option${userData.goal === i ? " sel" : ""}`} onClick={() => update("goal", i)}>{g}</div>)}
                </div>
                <p style={{ fontSize: 13, color: "#64748b", fontFamily: "DM Sans, sans-serif", marginBottom: 10 }}>{t.activity}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                  {t.acts.map((a, i) => <div key={i} className={`option${userData.activityLevel === i ? " sel" : ""}`} onClick={() => update("activityLevel", i)} style={{ fontSize: 13 }}>{a}</div>)}
                </div>
                <p style={{ fontSize: 13, color: "#64748b", fontFamily: "DM Sans, sans-serif", marginBottom: 10 }}>{t.diet}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {t.diets.map((d, i) => <div key={i} className={`option${userData.diet === i ? " sel" : ""}`} onClick={() => update("diet", i)} style={{ fontSize: 13, textAlign: "center" }}>{d}</div>)}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#64748b", fontFamily: "DM Sans, sans-serif", marginBottom: 8 }}>{t.notes}</p>
                  <textarea className="inp" rows={3} placeholder={t.notesPh} value={userData.notes} onChange={e => update("notes", e.target.value)} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>{t.back}</button>
                  <button className="btn" onClick={generatePlan} disabled={loading}>{loading ? t.generating : t.generate}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Plan ──
  return (
    <><style>{css}</style>
      <div style={{ minHeight: "100vh", background: "#020817" }}>
        <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 18, color: "#34d399" }}>FitAI</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saveStatus === "saving" && <span style={{ color: "#64748b", fontSize: 12, fontFamily: "DM Sans, sans-serif" }}>{t.saving}</span>}
            {saveStatus === "saved" && <span style={{ color: "#34d399", fontSize: 12, fontFamily: "DM Sans, sans-serif" }}>{t.saved}</span>}
            <span style={{ color: "#f1f5f9", fontWeight: 600, fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>{userData.name}</span>
            <button className="btn btn-ghost" onClick={() => setScreen("welcome_back")} style={{ padding: "6px 10px", fontSize: 12, width: "auto" }}>{t.restart}</button>
            <button className="btn btn-ghost" onClick={handleLogout} style={{ padding: "6px 10px", fontSize: 12, width: "auto" }}>{t.logout}</button>
          </div>
        </div>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 80, gap: 20 }}>
            <div style={{ width: 48, height: 48, border: "3px solid #1e293b", borderTop: "3px solid #34d399", borderRadius: "50%" }} className="spin" />
            <p style={{ color: "#64748b", fontSize: 15, fontFamily: "DM Sans, sans-serif" }}>{t.generating}</p>
          </div>
        )}

        {!loading && (
          <>
            <div style={{ background: "#0f172a", borderBottom: "1px solid #1e293b", display: "flex", overflowX: "auto" }}>
              {t.tabs.map((tab, i) => <button key={i} className={`tab${activeTab === i ? " active" : ""}`} onClick={() => setActiveTab(i)}>{tab}</button>)}
            </div>

            <div style={{ maxWidth: 680, margin: "0 auto", padding: "20px 16px" }}>

              {activeTab === 0 && macros && (
                <div className="fade">
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                      {[{ label: t.tdee, value: macros.tdee, bg: "rgba(52,211,153,.05)", border: "rgba(52,211,153,.15)" }, { label: t.target, value: macros.target, bg: "rgba(52,211,153,.1)", border: "rgba(52,211,153,.3)" }].map((card, i) => (
                        <div key={i} style={{ height: 100, background: card.bg, border: `1px solid ${card.border}`, borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <p style={{ fontSize: 11, color: "#64748b", textAlign: "center" }}>{card.label}</p>
                          <p style={{ fontSize: 30, fontWeight: 800, color: "#34d399", fontFamily: "Syne, sans-serif", lineHeight: 1, margin: 0 }}>{card.value}</p>
                          <p style={{ fontSize: 11, color: "#475569" }}>kcal/día</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding: "14px 16px", background: "#1e293b", borderRadius: 10, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ color: "#64748b", fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>{t.bmi}</span>
                      <span style={{ color: parseFloat(macros.bmi) < 18.5 ? "#fbbf24" : parseFloat(macros.bmi) < 25 ? "#34d399" : parseFloat(macros.bmi) < 30 ? "#f97316" : "#ef4444", fontWeight: 700, fontFamily: "DM Mono, monospace", fontSize: 18 }}>{macros.bmi}</span>
                    </div>
                    <MacroBar label={t.protein} value={macros.protein} unit="g" color="#34d399" max={300} />
                    <MacroBar label={t.carbs} value={macros.carbs} unit="g" color="#3b82f6" max={400} />
                    <MacroBar label={t.fat} value={macros.fat} unit="g" color="#f59e0b" max={150} />
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="card">{renderMd(mealPlan)}</div>
                  <PlanModifier lang={lang} type="meals" plan={mealPlan} userData={userData} macros={macros}
                    onUpdate={(u) => { setMealPlan(u); savePlanToDb(u, workoutPlan, macros, session, userData); }} />
                </div>
              )}

              {activeTab === 2 && (
                <div className="fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="card">{renderMd(workoutPlan)}</div>
                  <PlanModifier lang={lang} type="workouts" plan={workoutPlan} userData={userData} macros={macros}
                    onUpdate={(u) => { setWorkoutPlan(u); savePlanToDb(mealPlan, u, macros, session, userData); }} />
                </div>
              )}

              {activeTab === 3 && (
                <div className="fade">
                  <div className="card" style={{ marginBottom: 16 }}>
                    <h3 style={{ fontFamily: "Syne, sans-serif", color: "#f1f5f9", fontSize: 16, marginBottom: 16 }}>{t.logWeight}</h3>
                    <div style={{ display: "flex", gap: 10 }}>
                      <input className="inp" type="number" placeholder="70.5" value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => e.key === "Enter" && logWeight()} />
                      <button className="btn" onClick={logWeight} style={{ width: "auto", padding: "12px 20px" }}>{t.log}</button>
                    </div>
                  </div>
                  <div className="card">
                    <h3 style={{ fontFamily: "Syne, sans-serif", color: "#f1f5f9", fontSize: 16, marginBottom: 16 }}>{t.progressTitle}</h3>
                    {progressLog.length === 0
                      ? <p style={{ color: "#475569", fontSize: 14, textAlign: "center", padding: 24 }}>{t.noProgress}</p>
                      : progressLog.map((entry, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: i < progressLog.length - 1 ? "1px solid #1e293b" : "none" }}>
                          <span style={{ color: "#64748b", fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>{entry.date}</span>
                          <span style={{ color: "#34d399", fontWeight: 700, fontFamily: "DM Mono, monospace", fontSize: 16 }}>{entry.weight} kg</span>
                          {i > 0 && <span style={{ fontSize: 12, color: entry.weight < progressLog[i-1].weight ? "#34d399" : "#ef4444" }}>{entry.weight < progressLog[i-1].weight ? "↓" : "↑"} {Math.abs(entry.weight - progressLog[i-1].weight).toFixed(1)}kg</span>}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {activeTab === 4 && (
                <div className="fade" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
                  <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                    {chatMessages.length === 0 && (
                      <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                        <p style={{ color: "#475569", fontSize: 14, fontFamily: "DM Sans, sans-serif" }}>{lang === "es" ? "Preguntame cualquier cosa sobre tu entrenamiento o nutrición" : "Ask me anything about your training or nutrition"}</p>
                      </div>
                    )}
                    {chatMessages.map((msg, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                        <div style={{ maxWidth: "80%", padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", background: msg.role === "user" ? "linear-gradient(135deg,#34d399,#059669)" : "#1e293b", color: msg.role === "user" ? "#022c22" : "#cbd5e1", fontSize: 14, lineHeight: 1.6, fontFamily: "DM Sans, sans-serif" }}>
                          {msg.content}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 32, height: 32, background: "#1e293b", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤖</div>
                        <span style={{ color: "#475569", fontSize: 13, fontFamily: "DM Sans, sans-serif" }}>{t.thinking}</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: "1px solid #1e293b" }}>
                    <textarea className="inp" rows={2} placeholder={t.chatPh} value={chatInput} onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }} />
                    <button className="btn" onClick={sendChat} disabled={chatLoading} style={{ width: "auto", padding: "0 20px", opacity: chatLoading ? 0.5 : 1 }}>{t.send}</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
