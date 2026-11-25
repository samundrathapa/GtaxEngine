import React, { useState } from "react";
import { LoginFormData, initialLoginForm, AuthSessionState } from "./model.ts";
import { AuthController } from "./controller.ts";
import { ForgotPasswordWindow } from "./window.tsx";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  Landmark,
  ShieldCheck,
  Zap,
  CheckCircle2
} from "lucide-react";

interface AuthPanelProps {
  onLoginSuccess: (session: AuthSessionState) => void;
  onOpenPrivacy?: () => void;
  idleTimeoutNotice?: string | null;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  onLoginSuccess,
  onOpenPrivacy,
  idleTimeoutNotice = null
}) => {
  const [form, setForm] = useState<LoginFormData>(initialLoginForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check if logout was due to idle session timeout
  const [sessionTimeoutAlert, setSessionTimeoutAlert] = useState<string | null>(() => {
    if (idleTimeoutNotice) return idleTimeoutNotice;
    const reason = localStorage.getItem("gtax_logout_reason");
    if (reason === "idle_timeout") {
      localStorage.removeItem("gtax_logout_reason");
      return "Your session timed out due to inactivity. Please sign in again.";
    }
    return null;
  });

  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setErrorMessage("Please enter both email or mobile and password.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await AuthController.login(form);
      if (res.success && res.data) {
        onLoginSuccess({
          isAuthenticated: true,
          user: res.data.user,
          role: res.data.role,
          rights: res.data.rights || [],
          token: res.data.token
        });
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-600 selection:text-white relative overflow-hidden">
      {/* Dribbble POSLINE Style Ambient Floating Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Dribbble Card Container */}
      <div className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Side: Brand Visual Panel (POSLINE Dribbble Aesthetic) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 p-8 sm:p-12 flex flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/40">
                G
              </div>
              <div>
                <span className="text-xl font-black tracking-tight">Gtax Municipal</span>
                <p className="text-[11px] text-indigo-300 font-medium">Revenue &amp; Tax Suite</p>
              </div>
            </div>

            <div className="space-y-4 my-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold backdrop-blur-md border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Secure Municipal Gateway</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Streamlining Property Tax &amp; Valuation.
              </h2>
              <p className="text-xs text-indigo-200/80 leading-relaxed">
                Log in to manage taxpayer dossiers, multi-year arrears, rate masters, and certified assessments.
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-6 border-t border-white/10 text-[11px] text-indigo-300 flex items-center justify-between font-mono">
            <span>v2.5 Enterprise</span>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-white hover:text-indigo-200 underline font-sans text-xs transition-colors cursor-pointer"
              >
                Privacy Policy
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Clean Dribbble POSLINE Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 bg-white flex flex-col justify-between">
          <div>
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Welcome back 👋
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Please enter your details to sign in.
              </p>
            </div>

            {sessionTimeoutAlert && (
              <div className="mb-5 p-3.5 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-center justify-between gap-2">
                <span>{sessionTimeoutAlert}</span>
                <button onClick={() => setSessionTimeoutAlert(null)} className="font-bold underline text-amber-700">
                  Dismiss
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mb-5 p-3.5 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Email Address or Mobile
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    placeholder="name@gtax.enterprise"
                    className="w-full pl-11 pr-4 py-3.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium shadow-2xs"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-11 py-3.5 text-sm bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 font-medium shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group cursor-pointer mt-3"
              >
                <span>{submitting ? "Signing In..." : "Sign In to Account"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>© Gtax Enterprise</span>
            {onOpenPrivacy && (
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-indigo-600 hover:underline font-semibold cursor-pointer"
              >
                Privacy Policy
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal Dialog */}
      <ForgotPasswordWindow
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
};
