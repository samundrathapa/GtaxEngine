import React, { useState } from "react";
import { LoginFormData, initialLoginForm, AuthSessionState } from "./model.ts";
import { AuthController } from "./controller.ts";
import { ForgotPasswordWindow } from "./window.tsx";
import municipalCartoonImg from "../../assets/images/municipal_tax_cartoon_1795794180379.jpg";
import {
  Eye,
  EyeOff,
  Calculator,
  Building2
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
  const [imgFailed, setImgFailed] = useState(false);

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Single Seamless White Card (No difference between left & right containers) */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_20px_50px_-15px_rgba(15,23,42,0.08)] border border-slate-200/70 overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-center">
        
        {/* Left Side: Municipal Office Calculation Cartoon */}
        <div className="lg:col-span-6 bg-white p-6 sm:p-10 flex items-center justify-center">
          {!imgFailed ? (
            <img
              src={municipalCartoonImg}
              alt="Municipal office staff calculating property tax at a desk"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full max-w-md h-auto object-contain select-none"
            />
          ) : (
            <div className="w-full max-w-sm py-14 px-6 bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <div className="flex items-center gap-3 text-emerald-600">
                <Building2 className="w-10 h-10" />
                <Calculator className="w-9 h-9 text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Municipal Tax Assessment Desk
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Clean, Simple Login Form on Matching White Canvas */}
        <div className="lg:col-span-6 bg-white px-6 py-8 sm:px-12 sm:py-12 lg:pr-14 lg:pl-6 flex flex-col justify-between">
          <div className="w-full max-w-sm mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">
                Welcome to Gtax
              </h1>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                Municipal property tax calculation, land valuation &amp; taxpayer portal
              </p>
            </div>

            {sessionTimeoutAlert && (
              <div className="mb-4 p-3 text-xs bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-center justify-between gap-2">
                <span>{sessionTimeoutAlert}</span>
                <button
                  type="button"
                  onClick={() => setSessionTimeoutAlert(null)}
                  className="font-semibold underline text-amber-700 shrink-0 cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="mb-4 p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="User ID / Email / Mobile"
                  aria-label="User ID or Email or Mobile"
                  className="w-full px-4 py-3.5 text-sm bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors placeholder:text-slate-400"
                  required
                />
              </div>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password"
                  aria-label="Password"
                  className="w-full pl-4 pr-11 py-3.5 text-sm bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-[0_2px_8px_rgba(15,23,42,0.03)] focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/15 transition-colors placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={(e) => setForm({ ...form, rememberMe: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-xs disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {submitting ? "Signing In..." : "LOGIN"}
                </button>
              </div>
            </form>

            {/* Clean Bottom Links */}
            <div className="mt-10 pt-4 flex items-center justify-center gap-3 text-xs text-slate-500">
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="hover:text-slate-900 transition-colors cursor-pointer"
              >
                Forgot Password
              </button>
              {onOpenPrivacy && (
                <>
                  <span aria-hidden="true" className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={onOpenPrivacy}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </>
              )}
            </div>
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
