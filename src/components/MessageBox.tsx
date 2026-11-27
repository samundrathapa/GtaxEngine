import React from "react";
import { AlertCircle, CheckCircle2, HelpCircle, X } from "lucide-react";

export type MessageBoxType = "confirm" | "success" | "error" | "info";

interface MessageBoxProps {
  isOpen: boolean;
  type: MessageBoxType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  onClose: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const MessageBox: React.FC<MessageBoxProps> = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onClose,
  confirmText = "Yes",
  cancelText = "No"
}) => {
  if (!isOpen) return null;

  const isConfirm = type === "confirm";
  const isSuccess = type === "success";
  const isError = type === "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
              isSuccess
                ? "bg-emerald-600 text-white shadow-emerald-600/30"
                : isError
                ? "bg-rose-600 text-white shadow-rose-600/30"
                : "bg-indigo-600 text-white shadow-indigo-600/30"
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : isError ? (
              <AlertCircle className="w-6 h-6" />
            ) : (
              <HelpCircle className="w-6 h-6" />
            )}
          </div>

          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {title || (isSuccess ? "Success" : isError ? "Error" : "Confirmation Required")}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-mono">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {isConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-md ${
                isError
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/20"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20"
              }`}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export interface MessageBoxState {
  isOpen: boolean;
  type: MessageBoxType;
  title?: string;
  message: string;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useMessageBox = () => {
  const [state, setState] = React.useState<MessageBoxState>({
    isOpen: false,
    type: "confirm",
    title: "",
    message: ""
  });

  const showConfirm = (
    message: string,
    onConfirm: () => void,
    title = "Do you want to proceed?",
    confirmText = "Yes",
    cancelText = "No"
  ) => {
    setState({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  const showSuccess = (message: string, title = "Success") => {
    setState({
      isOpen: true,
      type: "success",
      title,
      message
    });
  };

  const showError = (message: string, title = "Error") => {
    setState({
      isOpen: true,
      type: "error",
      title,
      message
    });
  };

  const close = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const MessageBoxModal = () => (
    <MessageBox
      isOpen={state.isOpen}
      type={state.type}
      title={state.title}
      message={state.message}
      onConfirm={state.onConfirm}
      onClose={close}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
    />
  );

  return {
    showConfirm,
    showSuccess,
    showError,
    close,
    MessageBoxModal
  };
};

