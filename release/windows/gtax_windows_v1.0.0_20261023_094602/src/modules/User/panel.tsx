import React, { useEffect, useState } from "react";
import { UserModel, UserFormData } from "./model.ts";
import { UserController } from "./controller.ts";
import { UserWindow } from "./window.tsx";
import { Plus, Search, Trash2, Edit2, Shield, RefreshCw, CheckCircle2, UserCheck, Phone, BadgeCheck } from "lucide-react";

export const UserPanel: React.FC = () => {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserModel | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await UserController.fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error("[UserPanel] Fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateOrUpdate = async (formData: UserFormData) => {
    if (selectedUser) {
      const res = await UserController.updateUser(selectedUser.user_id, formData);
      setActionMessage(res.message);
    } else {
      const res = await UserController.createUser(formData);
      setActionMessage(res.message);
    }
    await loadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  const handleDelete = async (userId: string) => {
    if (confirm("Are you sure you want to soft-delete this user from tbl_user? (is_active will be marked false with timestamp)")) {
      const res = await UserController.deleteUser(userId);
      setActionMessage(res.message);
      await loadData();
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.employee_id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    const r = (role || "").toLowerCase();
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
        USER
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>RBAC Security</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-indigo-600 font-semibold">PostgreSQL: tbl_user & tbl_user_role</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">/api/v1/users</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Enterprise User Management</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-md font-mono">
              Live DB Sync
            </span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Superadmin master user registry, role-based access control, and 7 mandatory audit trail columns.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload from PostgreSQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              setSelectedUser(null);
              setIsWindowOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User to tbl_user
          </button>
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

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, employee ID, or role..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{filteredUsers.length}</span> active operators in <span className="font-mono text-indigo-500">tbl_user</span>
        </div>
      </div>

      {/* Data Grid / Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-3 px-4">Operator / Name</th>
                <th className="py-3 px-4">Role (tbl_role)</th>
                <th className="py-3 px-4">Contact & Employee ID</th>
                <th className="py-3 px-4">Audit Metadata</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
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
                filteredUsers.map((user) => (
                  <tr key={user.user_id || String(user.id)} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
                          {user.full_name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{user.full_name}</span>
                            {user.is_locked && (
                              <span className="text-[10px] px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded font-semibold">Locked</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <span>{user.email}</span>
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
                          {user.employee_id || "EMP-001"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                        <div>
                          <span className="text-slate-400">Created: </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">{user.insert_by || "SYSTEM"}</span>
                          <span className="text-slate-400"> on </span>
                          <span>{user.insert_on ? new Date(user.insert_on).toLocaleDateString() : "Initial"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Updated: </span>
                          <span>{user.update_by || "SYSTEM"}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsWindowOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Edit user in tbl_user"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.user_id || String(user.id))}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                          title="Soft delete user from tbl_user"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
    </div>
  );
};
