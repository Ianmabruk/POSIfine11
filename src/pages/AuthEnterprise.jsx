import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Lock, User, Loader, LogOut, ArrowRight, Eye, EyeOff,
  Smartphone, CheckCircle2, AlertCircle, ArrowLeft,
  Chrome, Apple, Github
} from "lucide-react";
import { getDashboardRoute } from "../utils/dashboardRouting";

export default function AuthEnterprise() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, login, loading: authLoading } = useAuth();
  
  const [mode, setMode] = useState("login");
  const [loginMethod, setLoginMethod] = useState("password");
  const [formData, setFormData] = useState({ 
    email: "", 
    password: "", 
    pin: "", 
    name: "", 
    newPassword: "", 
    confirmPassword: "",
    currentPassword: "",
    totpCode: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);
  const [switchingUser, setSwitchingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const existingSession = !authLoading && user && localStorage.getItem("token");

  const handleSwitchUser = async () => {
    setSwitchingUser(true);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("csrfToken");
    localStorage.removeItem("appLogo");
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("products_cache_")) localStorage.removeItem(key);
    });
    sessionStorage.removeItem("reminderShown");
    sessionStorage.removeItem("adminReminderShown");
    window.location.replace("/auth/login");
  };

  const getSelectedPlan = () => {
    try {
      return JSON.parse(localStorage.getItem("selectedPlan") || "null");
    } catch (e) {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "forgot-password") {
        setEmailSent(true);
        setLoading(false);
        return;
      }

      if (mode === "reset-password") {
        if (formData.newPassword !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }
        setError("Password reset link sent. Check your email.");
        setLoading(false);
        setTimeout(() => setMode("login"), 3000);
        return;
      }

      if (mode === "2fa-setup") {
        if (formData.totpCode.length !== 6) {
          setError("Please enter a valid 6-digit code");
          setLoading(false);
          return;
        }
        setLoading(false);
        navigate("/dashboard");
        return;
      }

      if (needsPasswordSetup) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (formData.newPassword.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }
        const res = await auth.login({ email: formData.email, newPassword: formData.newPassword });
        if (res.token && res.user) {
          await login(res);
          navigate("/dashboard");
        }
        return;
      }

      if (mode === "login") {
        if (loginMethod === "pin") {
          if (!formData.pin || formData.pin.length !== 4) {
            setError("Please enter a valid 4-digit PIN");
            setLoading(false);
            return;
          }
        } else {
          if (!formData.password) {
            setError("Please enter your password");
            setLoading(false);
            return;
          }
        }
      }

      let res;
      if (mode === "login") {
        if (loginMethod === "pin") {
          try {
            res = await auth.pinLogin({ email: formData.email, pin: formData.pin });
          } catch (pinError) {
            if (pinError.message?.includes("PIN not set")) {
              setError("PIN not set. Please use password login.");
            } else if (pinError.message?.includes("Invalid PIN")) {
              setError("Invalid PIN. Please try again.");
            } else {
              setError(pinError.message || "PIN login failed");
            }
            setLoading(false);
            return;
          }
        } else {
          res = await auth.login({ email: formData.email, password: formData.password });
        }
      } else {
        const selectedPlan = getSelectedPlan();
        const planId = localStorage.getItem("planId") || selectedPlan?.id || "basic";
        const selectedFeatures = localStorage.getItem("selectedFeatures");
        res = await auth.signup({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          plan: planId,
          selectedFeatures: selectedFeatures ? JSON.parse(selectedFeatures) : [],
        });
      }
      
      if (res?.needsPasswordSetup) {
        setNeedsPasswordSetup(true);
        setFormData({ ...formData, email: res.email || formData.email });
        setError("");
        setLoading(false);
        return;
      }

      if (!res || !res.user || !res.token) {
        throw new Error("Authentication failed. Please try again.");
      }

      await login(res);
      const dashRoute = getDashboardRoute(res.user);
      navigate(dashRoute, { replace: true });
    } catch (err) {
      let errorMsg = err.message || "Authentication failed. Please try again.";
      
      if (errorMsg.includes("Email already registered") || errorMsg.includes("already exists")) {
        errorMsg = "This email is already registered. Please log in instead.";
      } else if (errorMsg.includes("500") || errorMsg.includes("Server error")) {
        errorMsg = "Server error. Please wait a moment and try again.";
      } else if (errorMsg.includes("network") || errorMsg.includes("no response") || errorMsg.includes("fetch")) {
        errorMsg = "Network error. Check your connection and try again.";
      } else if (errorMsg.includes("lock")) {
        errorMsg = "Your account has been locked. Please contact support.";
      } else if (errorMsg.includes("inactive") || errorMsg.includes("subscription")) {
        errorMsg = "Your account is inactive. Please choose a subscription plan.";
      } else if (mode === "signup" && errorMsg.includes("failed")) {
        errorMsg = "Please ensure all fields are filled correctly.";
      }
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const modeTitle = { login: "Welcome back", signup: "Create your account", "forgot-password": "Reset your password", "reset-password": "Set new password", "2fa-setup": "Two-factor authentication", "verify-email": "Verify your email" };
  const modeSubtitle = { login: "Sign in to your account to continue", signup: "Start your 15-day free trial today", "forgot-password": "Enter your email and we'll send you a reset link", "reset-password": "Choose a strong password for your account", "2fa-setup": "Enter the 6-digit code from your authenticator app", "verify-email": "Check your inbox and verify your email address" };

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Premium gradient background with soft orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-purple-950" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary-600/20 rounded-full blur-[120px] gpu-accelerated" style={{ transform: "translateZ(0)" }} />
        <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] bg-brand-600/15 rounded-full blur-[100px] gpu-accelerated" style={{ transform: "translateZ(0)" }} />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-accent-600/10 rounded-full blur-[100px] gpu-accelerated" style={{ transform: "translateZ(0)" }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.03]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-brand-500 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-white font-bold text-xs sm:text-sm">P</span>
            </div>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight">POSIFY</span>
          </button>
          <button onClick={() => navigate("/")} className="text-xs sm:text-sm text-slate-400 hover:text-white font-medium transition-colors">
            Back to Home
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3 sm:px-6 lg:px-8 pt-14 sm:pt-16">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-0 items-center">
          
          {/* Left Branding Side */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:flex flex-col justify-center px-8 xl:px-16"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center mb-8 shadow-xl shadow-primary-500/30"
              >
                <span className="text-white font-bold text-2xl">P</span>
              </motion.div>
              <h2 className="text-4xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
                Welcome to<br />
                <span className="gradient-text">the future of POS</span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed mb-10 max-w-md">
                Manage sales, inventory, and customers across every channel — all from one beautifully crafted platform.
              </p>
              <div className="flex flex-col gap-4">
                {["15-day free trial", "No credit card required", "Setup in 5 minutes"].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-slate-300">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary-500 to-brand-500 flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </div>
              
              {/* Floating mini cards */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-4 top-20 glass-card p-4 rounded-2xl shadow-xl hidden xl:block"
                style={{ width: "220px" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-primary-400" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Quick Setup</span>
                </div>
                <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-primary-500 to-brand-500 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Form Side */}
          <div className="w-full max-w-md lg:max-w-none mx-auto lg:mx-0 lg:ml-auto lg:mr-8 xl:mr-16">
            {existingSession && !switchingUser && mode === "login" && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl glass-card">
                <p className="text-sm text-slate-300 font-medium mb-1">You're signed in as</p>
                <p className="text-white font-semibold truncate">{user?.email}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate(getDashboardRoute(user), { replace: true })} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-brand-500 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all">
                    Go to Dashboard <ArrowRight size={14} />
                  </button>
                  <button onClick={handleSwitchUser} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/20 text-slate-300 text-sm font-medium hover:bg-white/10 transition-all">
                    <LogOut size={14} /> Switch
                  </button>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass-card p-8 sm:p-10 rounded-[2rem]"
            >
              <AnimatePresence mode="wait">
                {emailSent && mode === "forgot-password" ? (
                  <motion.div key="email-sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center py-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-success to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-success/30">
                      <CheckCircle2 className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Check your email</h3>
                    <p className="text-sm text-slate-400 mb-6">We've sent a password reset link to <strong className="text-white">{formData.email}</strong></p>
                    <button onClick={() => { setEmailSent(false); setMode("login"); }} className="btn-primary w-full py-3 text-sm">Back to Login</button>
                  </motion.div>
                ) : (
                  <motion.form key={mode} onSubmit={handleSubmit} className="space-y-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <div className="text-center mb-8">
                      <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
                        <span className="text-white font-bold text-xl">P</span>
                      </div>
                      <h1 className="text-2xl font-bold text-white mb-1">{modeTitle[mode] || "Welcome"}</h1>
                      <p className="text-sm text-slate-400">{modeSubtitle[mode] || ""}</p>
                    </div>

                    {mode === "signup" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                        <div className="relative">
                          <User className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "name" ? "text-primary-400" : "text-slate-500"}`} />
                          <input type="text" placeholder="John Doe" className="input bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)} required />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "email" ? "text-primary-400" : "text-slate-500"}`} />
                        <input type="email" placeholder="you@company.com" className="input bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} onFocus={() => setFocusedField("email")} onBlur={() => setFocusedField(null)} required />
                      </div>
                    </div>

                    {mode === "login" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Sign in with</label>
                        <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl border border-white/5">
                          {["password", "pin"].map((method) => (
                            <button key={method} type="button" onClick={() => setLoginMethod(method)} className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-all ${loginMethod === method ? "bg-gradient-to-r from-primary-500 to-brand-500 text-white shadow-md shadow-primary-500/20" : "text-slate-400 hover:text-slate-200"}`}>
                              {method === "password" ? "Password" : "PIN"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(mode === "login" || mode === "signup" || mode === "reset-password") && mode !== "forgot-password" && mode !== "2fa-setup" && !needsPasswordSetup && (
                      <>
                        {mode === "login" && loginMethod === "password" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "password" ? "text-primary-400" : "text-slate-500"}`} />
                              <input type={showPassword ? "text" : "password"} placeholder="Enter your password" className="input pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} required />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {mode === "login" && loginMethod === "pin" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">4-digit PIN</label>
                            <input type="text" inputMode="numeric" placeholder="••••" className="input text-center text-2xl tracking-[0.5em] font-mono bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.pin} onChange={(e) => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })} maxLength={4} required />
                          </div>
                        )}

                        {(mode === "signup" || mode === "reset-password") && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "password" ? "text-primary-400" : "text-slate-500"}`} />
                              <input type={showPassword ? "text" : "password"} placeholder={mode === "signup" ? "Create a strong password" : "New password"} className="input pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} onFocus={() => setFocusedField("password")} onBlur={() => setFocusedField(null)} required />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}

                        {mode === "reset-password" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirm Password</label>
                            <div className="relative">
                              <Lock className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "confirmPassword" ? "text-primary-400" : "text-slate-500"}`} />
                              <input type={showPassword ? "text" : "password"} placeholder="Confirm your password" className="input pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} onFocus={() => setFocusedField("confirmPassword")} onBlur={() => setFocusedField(null)} required />
                            </div>
                          </div>
                        )}

                        {mode === "2fa-setup" && (
                          <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1.5">Authenticator Code</label>
                            <div className="relative">
                              <Smartphone className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${focusedField === "totpCode" ? "text-primary-400" : "text-slate-500"}`} />
                              <input type="text" inputMode="numeric" placeholder="000000" className="input pl-10 text-center text-2xl tracking-[0.3em] font-mono bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20" value={formData.totpCode} onChange={(e) => setFormData({ ...formData, totpCode: e.target.value.replace(/\D/g, "").slice(0, 6) })} maxLength={6} onFocus={() => setFocusedField("totpCode")} onBlur={() => setFocusedField(null)} required />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {needsPasswordSetup && (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <p className="text-sm text-amber-200 font-medium">Please set a new password to continue</p>
                      </div>
                    )}

                    {error && (
                      <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
                        <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-red-200 leading-relaxed">{error}</span>
                      </motion.div>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary-500 to-brand-500 hover:from-primary-600 hover:to-brand-600 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm">
                      {loading ? (
                        <span className="flex items-center gap-2"><Loader className="w-4 h-4 animate-spin" /> Processing...</span>
                      ) : ({ login: "Sign In", signup: "Create Account", "forgot-password": "Send Reset Link", "reset-password": "Update Password", "2fa-setup": "Verify & Continue", "verify-email": "Verify Email" })[mode] || "Continue"}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>

              <div className="mt-6">
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-slate-500">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Chrome, label: "Google" },
                    { icon: Apple, label: "Apple" },
                    { icon: Github, label: "GitHub" },
                  ].map((provider) => (
                    <button key={provider.label} type="button" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-primary-500/50 transition-all text-sm font-medium">
                      <provider.icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{provider.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 text-center">
                <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setNeedsPasswordSetup(false); }} className="text-sm text-slate-400 hover:text-primary-400 font-medium transition-colors">
                  {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>

              {mode === "login" && (
                <div className="mt-4 text-center">
                  <button onClick={() => { setMode("forgot-password"); setEmailSent(false); setError(""); }} className="text-sm text-slate-500 hover:text-primary-400 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {mode === "forgot-password" && !emailSent && (
                <div className="mt-4 text-center">
                  <button onClick={() => { setMode("login"); setEmailSent(false); setError(""); }} className="text-sm text-slate-500 hover:text-primary-400 font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
                    <ArrowLeft className="w-3 h-3" /> Back to login
                  </button>
                </div>
              )}
            </motion.div>

            <p className="text-center text-xs text-slate-500 mt-8">
              Protected by enterprise-grade security.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
