import React, { useEffect, useState } from "react";
import { userStoreInstance } from "./UserStore.ts";
import { UserController } from "./UserController.ts";
import { UserWindow } from "./UserWindow.tsx";
import { IUserRecord } from "../../serverside/User/UserModel.ts";
import { AuthSessionState } from "../../modules/Auth/model.ts";
import { SupportedLang, translations, subscribeToTranslations } from "../../utils/i18n.ts";
import { hasActionRight, hasMenuRight } from "../../utils/permissions.ts";
import {
  Plus,
  Search,
  Trash2,
  Edit2,
  Shield,
  RefreshCw,
  CheckCircle2,
  UserCheck,
  Phone,
  BadgeCheck,
  KeyRound,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  AlertTriangle
} from "lucide-react";

interface UserPanelProps {
  currentSession?: AuthSessionState | null;
  currentLang?: SupportedLang;
  onManageUserRights?: (userId: number) => void;
}

export const UserPanel: React.FC<UserPanelProps> = ({ currentSession, currentLang = "eng", onManageUserRights }) => {
  const [storeState, setStoreState] = useState(userStoreInstance.getState());
  const [, setLangVersion] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Superadmin Reset Password modal state (mode: "single" or "all")
  const [resetModalMode, setResetModalMode] = useState<"single" | "all" | null>(null);
  const [resetTargetUser, setResetTargetUser] = useState<IUserRecord | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState("Password123!");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("Password123!");
  const [resetExcludeSelf, setResetExcludeSelf] = useState(true);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetModalError, setResetModalError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const roleString = String(
    currentSession?.role?.role_name || (currentSession?.user as any)?.role || ""
  )
    .trim()
    .toLowerCase();
  const isSuperAdmin =
    roleString === "superadmin" ||
    (currentSession?.user?.email || "").toLowerCase() === "superadmin@gtax.enterprise";

  const canCreateUser = !currentSession || hasActionRight(currentSession, "user", "new");
  const canEditUser = !currentSession || hasActionRight(currentSession, "user", "edit");
  const canDeleteUser = !currentSession || hasActionRight(currentSession, "user", "delete");
  const canManageRoles = Boolean(onManageUserRights) && (!currentSession || hasMenuRight(currentSession, "role"));

  const t = translations[currentLang];

  useEffect(() => {
    const unsubStore = userStoreInstance.subscribe(() => {
      setStoreState(userStoreInstance.getState());
    });
    const unsubLang = subscribeToTranslations(() => setLangVersion((v) => v + 1));
    return () => {
      unsubStore();
      unsubLang();
    };
  }, []);

  const loadData = async (query: string = "") => {
    await UserController.GetSearchTemplate(query);
  };

  useEffect(() => {
    loadData(searchQuery);
  }, [searchQuery]);

  const handleCreateOrUpdate = async (formData: Partial<IUserRecord>) => {
    let res;
    if (selectedUser) {
      const targetId = selectedUser.user_id || selectedUser.id;
      res = await UserController.updateUser(targetId, formData);
    } else {
      res = await UserController.createUser(formData);
    }
    setActionMessage(res.message);
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDelete = async (user: IUserRecord) => {
    const targetId = user.user_id || user.id;
    if (confirm(`Are you sure you want to delete user ${user.fullname || user.username || targetId}?`)) {
      const res = await UserController.deleteUser(targetId);
      if (res.success) {
        setActionMessage(res.message);
        setActionError(null);
      } else {
        setActionError(res.message);
      }
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const openSingleResetModal = (user: IUserRecord) => {
    setResetModalMode("single");
    setResetTargetUser(user);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetModalError(null);
    setShowResetPassword(false);
  };

  const openResetAllModal = () => {
    setResetModalMode("all");
    setResetTargetUser(null);
    setResetNewPassword("Password123!");
    setResetConfirmPassword("Password123!");
    setResetExcludeSelf(true);
    setResetModalError(null);
    setShowResetPassword(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetModalError(null);

    if (!resetNewPassword || resetNewPassword.trim().length < 4) {
      setResetModalError("New password must be at least 4 characters long.");
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetModalError("New password and confirmation do not match.");
      return;
    }

    setResetSubmitting(true);
    try {
      let res;
      if (resetModalMode === "single" && resetTargetUser) {
        const targetId = resetTargetUser.id || resetTargetUser.user_id || "";
        res = await UserController.resetUserPassword(targetId, resetNewPassword, currentSession?.token || undefined);
      } else {
        res = await UserController.resetAllUsersPassword(resetNewPassword, resetExcludeSelf, currentSession?.token || undefined);
      }

      if (res.success) {
        setActionMessage(res.message);
        setActionError(null);
        setResetModalMode(null);
        setTimeout(() => setActionMessage(null), 5000);
      } else {
        setResetModalError(res.message || "Failed to reset password.");
      }
    } catch (err: any) {
      setResetModalError(err?.message || "Network error resetting password.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const getRoleBadge = (roleStr?: string) => {
    const r = (roleStr || "").toLowerCase();
    if (r.includes("superadmin")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
          <Shield className="w-3 h-3 text-purple-600" />
          SUPERADMIN
        </span>
      );
    }
    if (r.includes("admin")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800">
          <BadgeCheck className="w-3 h-3 text-indigo-600" />
          ADMIN
        </span>
      );
    }
    if (r.includes("operator")) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
          <UserCheck className="w-3 h-3 text-emerald-600" />
          OPERATOR
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
        {roleStr || "USER"}
      </span>
    );
  };

  const { users, loading } = storeState;

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{t.userManagement}</span>
          </h2>
      
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadData(searchQuery)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload via GetSearchTemplate API"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {isSuperAdmin && (
            <button
              type="button"
              onClick={openResetAllModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Superadmin: Reset passwords for all user accounts"
            >
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              {t.resetAllPasswords}
            </button>
          )}

          {canCreateUser && (
            <button
              onClick={() => {
                setSelectedUser(null);
                setIsWindowOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t.addUser}
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 text-sm bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs text-emerald-600 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-3 text-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-lg flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-xs text-rose-600 font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search via api/User/GetSearchTemplate..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {loading && (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
          )}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{users.length}</span> active operators in <span className="font-mono text-indigo-500">tbl_user</span>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Operator / Name</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact & Employee ID</th>
                <th className="py-3 px-4">Audit Metadata</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
                    <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <div>No matching users found in tbl_user.</div>
                    <button
                      onClick={() => {
                        setSelectedUser(null);
                        setIsWindowOpen(true);
                      }}
                      className="mt-3 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      + Register First User
                    </button>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const displayName = user.fullname || user.full_name || user.username || "User";
                  return (
                    <tr key={user.user_id || String(user.id)} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                              <span>{displayName}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                              <span>{user.email || "No email"}</span>
                              {user.username && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-[11px] text-slate-400">@{user.username}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-400">
                        <div className="space-y-0.5">
                          {user.mobile && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{user.mobile}</span>
                            </div>
                          )}
                          <div className="font-mono text-[11px] text-slate-500">
                            {user.employee_id || `ID: ${user.id}`}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                          <div>
                            <span className="text-slate-400">Created: </span>
                            <span className="font-medium text-slate-700 dark:text-slate-300">{user.insert_by || "SYSTEM"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Updated: </span>
                            <span>{user.update_by || "SYSTEM"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageRoles && user.id && (
                            <button
                              type="button"
                              onClick={() => onManageUserRights && onManageUserRights(Number(user.id))}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800/60 rounded-md transition-colors cursor-pointer"
                              title={`Configure menu rights for ${displayName}`}
                            >
                              <Shield className="w-3 h-3" />
                              <span>Menu Rights</span>
                            </button>
                          )}
                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => openSingleResetModal(user)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/60 rounded-md transition-colors cursor-pointer"
                              title={`Reset password for ${displayName} (Superadmin)`}
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Password</span>
                            </button>
                          )}
                          {canEditUser && (
                            <button
                              onClick={async () => {
                                const editData = await UserController.GetItemTemplate(user.user_id || user.id);
                                setSelectedUser(editData || user);
                                setIsWindowOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                              title="GetItemTemplate for editing"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDeleteUser && (
                            <button
                              onClick={() => handleDelete(user)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserWindow
        isOpen={isWindowOpen}
        onClose={() => setIsWindowOpen(false)}
        onSubmit={handleCreateOrUpdate}
        editUser={selectedUser}
      />

      {/* Superadmin Reset Password Modal (Single User or All Users) */}
      {resetModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                    {resetModalMode === "all"
                      ? "Reset All User Passwords"
                      : `Reset Password: ${resetTargetUser?.fullname || resetTargetUser?.username || "User"}`}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {resetModalMode === "all"
                      ? `Superadmin bulk credential reset (${users.length} active users)`
                      : resetTargetUser?.email || `ID: ${resetTargetUser?.id}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalMode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              {resetModalMode === "all" && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>
                    This will overwrite the login password for all active users in <span className="font-mono font-semibold">tbl_user</span> and synchronize PostgreSQL &amp; Redis caches.
                  </span>
                </div>
              )}

              {resetModalError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{resetModalError}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const defPwd = "Password123!";
                      setResetNewPassword(defPwd);
                      setResetConfirmPassword(defPwd);
                      setShowResetPassword(true);
                    }}
                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Use Default (Password123!)
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full px-3 pr-10 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  Confirm New Password *
                </label>
                <input
                  type={showResetPassword ? "text" : "password"}
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  required
                />
              </div>

              {resetModalMode === "all" && (
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={resetExcludeSelf}
                    onChange={(e) => setResetExcludeSelf(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Keep my own Superadmin password unchanged (Exclude self)</span>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalMode(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>
                    {resetSubmitting
                      ? "Resetting..."
                      : resetModalMode === "all"
                        ? "Reset All Passwords"
                        : "Reset User Password"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
