import React, { useEffect, useState } from "react";
import { userStoreInstance } from "./UserStore.ts";
import { UserController } from "./UserController.ts";
import { UserWindow } from "./UserWindow.tsx";
import { IUserRecord } from "../../serverside/User/UserModel.ts";
import { Plus, Search, Trash2, Edit2, Shield, RefreshCw, CheckCircle2, UserCheck, Phone, BadgeCheck } from "lucide-react";

export const UserPanel: React.FC = () => {
  const [storeState, setStoreState] = useState(userStoreInstance.getState());
  const [searchQuery, setSearchQuery] = useState("");
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<IUserRecord | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = userStoreInstance.subscribe(() => {
      setStoreState(userStoreInstance.getState());
    });
    return unsubscribe;
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
      setActionMessage(res.message);
      setTimeout(() => setActionMessage(null), 4000);
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
            <span>User Management</span>
            <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-full font-mono">
              clientside/User & serverside/User
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by UserController, UserService, UserModel & UserRepo with GetSearchTemplate & GetComboTemplate
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadData(searchQuery)}
            className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload via GetSearchTemplate API"
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
            Add User
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
                          <button
                            onClick={() => handleDelete(user)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
    </div>
  );
};
