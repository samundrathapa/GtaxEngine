import React, { useState } from "react";
import { LoginFormData, initialLoginForm, AuthSessionState } from "./model.ts";
import { AuthController } from "./controller.ts";
import { RegisterWindow, ForgotPasswordWindow } from "./window.tsx";
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  UserPlus,
  KeyRound,
  CheckCircle2,
  Building2,
  Landmark
} from "lucide-react";

interface AuthPanelProps {
  onLoginSuccess: (session: AuthSessionState) => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({ onLoginSuccess }) => {
  const [form, setForm] = useState<LoginFormData>(initialLoginForm);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [registeredNotice, setRegisteredNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      setErrorMessage("Please enter both identifier (email or mobile) and password.");
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Decorative Mesh & Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        {/* Left Side: Clean Brand & Mission Overview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-950/70 via-slate-900 to-slate-950 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-indigo-600/40">
                G
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">gtax</span>
                <p className="text-xs text-indigo-300">
                  Municipal Revenue & Tax Management
                </p>
              </div>
            </div>

            {/* Mission & Key Platform Capabilities */}
            <div className="space-y-4 my-8">
              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mt-0.5">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Integrated Property Tax Engine</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Automated assessment of land parcels, building plinth areas, and floor depreciation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">1-Door Taxpayer Registration</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Continuous sequential registration of citizen portfolios, multi-kitta parcels, and house structures.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 mt-0.5">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Jurisdiction Standards</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Compliant with municipal revenue guidelines, prompt payment rebates, and progressive slabs.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
            <span>Official Municipal Revenue Portal • FY 2081/82</span>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Sign In
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your email address or registered mobile number to continue.
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <KeyRound className="w-5 h-5" />
              </div>
            </div>

            {registeredNotice && (
              <div className="mb-4 p-3 text-xs bg-emerald-950/70 border border-emerald-800 text-emerald-300 rounded-xl flex items-center justify-between">
                <span>{registeredNotice}</span>
                <button onClick={() => setRegisteredNotice(null)} className="font-bold underline ml-2">
                  Dismiss
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 text-xs bg-rose-950/70 border border-rose-800 text-rose-300 rounded-xl">
                {errorMessage}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Email Address or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={form.identifier}
                    onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                    placeholder="name@gtax.enterprise or 98XXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Enter your password..."
                    className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors placeholder:text-slate-600"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Remember session on this device</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 group mt-3"
              >
                <span>{submitting ? "Signing In..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </form>
          </div>

          {/* Bottom Bar: Clean User Registration Link */}
          <div className="mt-8 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-400">
              Need a new operator account?
            </span>
            <button
              onClick={() => setIsRegisterOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register New User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      <RegisterWindow
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={(email, pass) => {
          setIsRegisterOpen(false);
          setRegisteredNotice(`User ${email} created successfully. You can now log in.`);
          setForm({
            ...form,
            identifier: email,
            password: pass || form.password
          });
        }}
      />

      {/* Forgot Password Modal Dialog */}
      <ForgotPasswordWindow
        isOpen={isForgotOpen}
        onClose={() => setIsForgotOpen(false)}
      />
    </div>
  );
};
