import React from "react";
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";

interface IdleSessionWarningModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  timeoutMinutes: number;
  onStayLoggedIn: () => void;
  onLogoutNow: () => void;
}

export const IdleSessionWarningModal: React.FC<IdleSessionWarningModalProps> = ({
  isOpen,
  secondsRemaining,
  timeoutMinutes,
  onStayLoggedIn,
  onLogoutNow
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Inactivity Warning
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {timeoutMinutes}m Inactivity Policy
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              Are you still there? (सत्र निष्क्रियता चेतावनी)
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              For municipal financial data security, your session will automatically log out due to inactivity in:
            </p>
          </div>
        </div>

        {/* Countdown Big Display */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
          <div className="text-3xl font-black font-mono tracking-wider text-amber-400 flex items-center justify-center gap-1">
            <span>{secondsRemaining}</span>
            <span className="text-sm font-sans font-semibold text-slate-400">seconds remaining</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-500 to-rose-500 h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${Math.min(100, (secondsRemaining / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onLogoutNow}
            className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Log Out Now</span>
          </button>

          <button
            type="button"
            onClick={onStayLoggedIn}
            className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Stay Signed In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
