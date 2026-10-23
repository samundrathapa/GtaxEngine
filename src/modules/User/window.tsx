import React, { useState, useEffect } from "react";
import { UserFormData, UserModel } from "./model.ts";
import { X, Shield, KeyRound, Mail, User, Phone, BadgeCheck } from "lucide-react";

interface UserWindowProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  editUser?: UserModel | null;
}

export const UserWindow: React.FC<UserWindowProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editUser
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    full_name: "",
    password: "",
    mobile: "",
    employee_id: "",
    role: "operator",
    org_id: "ORG_GLOBAL_CORP",
    company_id: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (editUser) {
      setFormData({
        username: editUser.username || "",
        email: editUser.email || "",
        full_name: editUser.full_name || "",
        password: "",
        mobile: editUser.mobile || "",
        employee_id: editUser.employee_id || "",
        role: editUser.role || "operator",
        org_id: editUser.org_id || "ORG_GLOBAL_CORP",
        company_id: editUser.company_id || 1
      });
    } else {
      setFormData({
        username: "",
        email: "",
        full_name: "",
        password: "Password123!",
        mobile: "",
        employee_id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        role: "operator",
        org_id: "ORG_GLOBAL_CORP",
        company_id: 1
      });
    }
    setErrorMsg("");
  }, [editUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.full_name) {
      setErrorMsg("Full name and email are required.");
      return;
    }
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        username: formData.username || formData.email.split("@")[0]
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editUser ? "Edit User Record (tbl_user)" : "Register User in tbl_user"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PostgreSQL persistence with 7 mandatory audit columns & RBAC roles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name</span>
            </label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="e.g. Ram Bahadur Thapa"
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="officer@gtax.enterprise"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Mobile / Phone</span>
              </label>
              <input
                type="text"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="9841234567"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Security Role (tbl_role)</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              >
                <option value="superadmin">Superadmin (Full Oversight & Master Control)</option>
                <option value="admin">Admin (Corporate & Tax Manager)</option>
                <option value="operator">Operator (Tax Registration & Valuation Entry)</option>
                <option value="user">User (Standard Tax Analyst)</option>
                <option value="tax_analyst">Tax Analyst</option>
                <option value="auditor">Auditor (Compliance & Reporting)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="EMP-001"
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Password {editUser ? "(Leave blank to keep current)" : ""}</span>
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={editUser ? "••••••••" : "Password123!"}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required={!editUser}
            />
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-400 font-mono">
              BaseFrame Contract: Auto-persisted to tbl_user & tbl_user_role with insert_by & timestamps.
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? "Saving to tbl_user..." : editUser ? "Update User" : "Create User in tbl_user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
