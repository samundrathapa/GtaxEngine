import React, { useState, useRef, useEffect } from "react";
import { AuthSessionState } from "../modules/Auth/model.ts";
import { SupportedLang, SupportedTheme, translations } from "../utils/i18n.ts";
import { ApiController } from "../api/controller.ts";
import {
  User,
  LogOut,
  Palette,
  Languages,
  Shield,
  Key,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  ChevronDown,
  X,
  Sparkles,
  Calendar,
  Layers,
  Database,
  RefreshCw,
  Zap,
  Server,
  CheckCircle2
} from "lucide-react";

interface UserMenuProps {
  session: AuthSessionState;
  currentLang: SupportedLang;
  currentTheme: SupportedTheme;
  onLanguageChange: (lang: SupportedLang) => void;
  onThemeChange: (theme: SupportedTheme) => void;
  onLogout: () => void;
  loggingOut?: boolean;
  onOpenDbColumnModal?: () => void;
  onOpenPrivacy?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  session,
  currentLang,
  currentTheme,
  onLanguageChange,
  onThemeChange,
  onLogout,
  loggingOut = false,
  onOpenDbColumnModal,
  onOpenPrivacy
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncingCache, setSyncingCache] = useState(false);
  const [syncSuccessModal, setSyncSuccessModal] = useState<any | null>(null);
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrPwd, setShowCurrPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const t = translations[currentLang];

  const handleOpenResetPassword = () => {
    setIsOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
    setShowCurrPwd(false);
    setShowNewPwd(false);
    setIsResetPwdOpen(true);
  };

  const handleResetOwnPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!currentPassword) {
      setResetError("Please enter your current password.");
      return;
    }
    if (newPassword.trim().length < 4) {
      setResetError("New password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("New password and confirmation do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setResetError("New password must be different from your current password.");
      return;
    }

    setResetSubmitting(true);
    try {
      const res = await ApiController.resetOwnPassword(currentPassword, newPassword, session.token || undefined);
      if (res.success) {
        setResetSuccess(res.message || "Your password has been updated successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setResetError(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setResetError(err?.message || "Network error updating password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleClearCacheAndSync = async () => {
    setSyncingCache(true);
    try {
      const res = await fetch("/api/v1/cache/clear-and-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token || ""}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setSyncSuccessModal(data.data);
        window.dispatchEvent(new CustomEvent("gtax:cache-cleared-and-synced", { detail: data.data }));
      } else {
        alert("Failed to sync cache: " + (data.errors?.[0] || "Unknown error"));
      }
    } catch (e: any) {
      alert("Network error syncing cache: " + (e?.message || "Unknown error"));
    } finally {
      setSyncingCache(false);
    }
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const themes: { id: SupportedTheme; label: string; desc: string; preview: string }[] = [
    { id: "dark", label: "Dark (Navy 950)", desc: "High contrast dark mode", preview: "bg-slate-900 border-slate-700 text-white" },
    { id: "slate", label: "Slate Pro", desc: "Corporate balanced contrast", preview: "bg-slate-800 border-slate-600 text-slate-100" },
    { id: "emerald", label: "Nordic Emerald", desc: "Fresh municipal green accent", preview: "bg-emerald-900 border-emerald-700 text-emerald-100" },
    { id: "light", label: "Light Clean", desc: "Crisp bright office view", preview: "bg-zinc-100 border-zinc-300 text-zinc-900" }
  ];

  const languages: { code: SupportedLang; label: string; sub: string; flag: string }[] = [
    { code: "nep", label: "नेपाली", sub: "नेपाल नगरपालिका मानक", flag: "🇳🇵" },
    { code: "ind", label: "हिन्दी", sub: "नगर निगम मानक (भारत)", flag: "🇮🇳" },
    { code: "eng", label: "English", sub: "International Standard", flag: "🌐" }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* User Button in Header / Navigation */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm shadow-xs transition-all text-left group"
        title="Open User Profile & Settings Menu"
        aria-expanded={isOpen}
      >
        {session.user?.photo_path ? (
          <img
            src={session.user.photo_path}
            alt={session.user.fullname}
            className="w-7 h-7 rounded-full object-cover border border-indigo-400 ring-2 ring-indigo-500/20"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {session.user?.fullname?.charAt(0) || "U"}
          </div>
        )}

        <div className="hidden sm:block">
          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
            {session.user?.fullname?.split(" ")[0] || "User"}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
            <span>{session.role?.role_name || "OPERATOR"}</span>
            <span className="inline-block w-1 h-1 rounded-full bg-emerald-500"></span>
            <span className="text-[9px] uppercase font-semibold text-indigo-500">{currentLang}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-88 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header Profile Section */}
          <div className="p-4 bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800/80 dark:via-slate-900 dark:to-indigo-950/30 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {session.user?.photo_path ? (
                  <img
                    src={session.user.photo_path}
                    alt={session.user.fullname}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500 shadow-sm"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
                    {session.user?.fullname?.charAt(0) || "U"}
                  </div>
                )}
                <div className="truncate">
                  <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {session.user?.fullname}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {session.user?.email || "user@gtax.local"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold uppercase">
                      {session.role?.role_name || "SUPERADMIN"}
                    </span>
                    {session.user?.employee_id && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        EMP: {session.user.employee_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto no-scrollbar">
            {/* 1. Language Selection (Moved to Users Menu) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Languages className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{t.language} (Language Selection)</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                  {currentLang}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {languages.map((l) => {
                  const isSelected = currentLang === l.code;
                  return (
                    <button
                      key={l.code}
                      onClick={() => onLanguageChange(l.code)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-base mb-0.5">{l.flag}</span>
                      <span className="text-xs font-semibold leading-tight">{l.label}</span>
                      <span className={`text-[9px] uppercase font-mono ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                        {l.code}
                      </span>
                    </button>
                  );
                })}
              </div>

              {onOpenDbColumnModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onOpenDbColumnModal();
                  }}
                  className="mt-2.5 w-full flex items-center justify-between p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="leading-tight">Language JSON (DB Column Mapping)</div>
                    
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-300 shrink-0">
                    JSON
                  </span>
                </button>
              )}
            </div>

            {/* 2. Theme Selection (Moved to Users Menu) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wide">
                  <Palette className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t.theme} (Theme Mode)</span>
                </span>
                <span className="text-[10px] font-mono font-bold capitalize text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                  {currentTheme}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {themes.map((th) => {
                  const isSelected = currentTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => onThemeChange(th.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border ${th.preview} shrink-0 flex items-center justify-center text-[10px]`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate leading-tight">{th.label}</div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                          {th.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Redis Cache & Live Database Synchronization Action */}
            <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 rounded-xl border border-amber-200/80 dark:border-amber-900/50 space-y-2">
              
             
              <button
                type="button"
                onClick={handleClearCacheAndSync}
                disabled={syncingCache}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg shadow-sm transition-all disabled:opacity-60 cursor-pointer active:scale-98"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingCache ? "animate-spin" : ""}`} />
                <span>{syncingCache ? "Flushing & Syncing from DB..." : "Clear Cache & Sync DB"}</span>
              </button>
            </div>

            {/* User Permissions & Security Details */}
          
          </div>

          {/* Footer Actions: Reset Password, Privacy Policy & Sign Out */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={handleOpenResetPassword}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Reset Password</span>
              </div>
              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-mono">Own Account</span>
            </button>

            {onOpenPrivacy && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenPrivacy();
                }}
                className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Privacy Policy & Terms</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Policy</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              disabled={loggingOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 border border-rose-200 dark:border-rose-900/50 rounded-xl transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{loggingOut ? "Signing out..." : "Sign Out (Clear Session)"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Self Reset Password Modal */}
      {isResetPwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    Reset Your Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[230px]">
                    {session.user?.fullname} ({session.user?.email})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsResetPwdOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetOwnPasswordSubmit} className="p-6 space-y-4">
              {resetError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Current Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrPwd ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrPwd(!showCurrPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPwd ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetPwdOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  {resetSuccess ? "Close" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm shadow-indigo-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{resetSubmitting ? "Updating..." : "Update Own Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redis Cache Flush & Live DB Sync Report Modal */}
      {syncSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Redis Cache Flushed & Re-Synced
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Live data queried from database and updated to Redis
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSyncSuccessModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Database</div>
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono truncate mt-0.5">
                  {syncSuccessModal.database || "gtax_db"}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Tables Synced</div>
                <div className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">
                  {syncSuccessModal.syncedTablesCount || 26}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Records Loaded</div>
                <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                  {syncSuccessModal.totalRecordsLoaded || 0}
                </div>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
                <div className="text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400">Latency</div>
                <div className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                  {syncSuccessModal.latencyMs || 0} ms
                </div>
              </div>
            </div>

            {/* Table Details Scrollable */}
            {syncSuccessModal.tables && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Synced PostgreSQL Tables in Redis:</span>
                  <span className="text-[10px] text-slate-400 font-mono">26 Tables Complete</span>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 bg-slate-50/50 dark:bg-slate-950/40 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {Object.entries(syncSuccessModal.tables).map(([tbl, count]) => (
                    <div key={tbl} className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">{tbl}</span>
                      <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 ml-1">{count as any}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
              All client queries now automatically fetch pre-materialized responses from Redis cache. Any mutation directly persists to PostgreSQL database with user ID audit columns and updates Redis!
            </div>

            <button
              onClick={() => setSyncSuccessModal(null)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Continue Working (Redis Cache Ready)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

