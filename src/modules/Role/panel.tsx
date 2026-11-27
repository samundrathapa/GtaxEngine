import React, { useState, useEffect, useCallback } from "react";
import { ApiController } from "../../api/controller.ts";
import { AuthSessionState } from "../Auth/model.ts";
import { SupportedLang, translations } from "../../utils/i18n.ts";
import {
  ACTION_TYPES,
  MENU_DEFINITIONS,
  MenuKey,
  OPERATOR_ALLOWED_MENUS,
  RightActionType,
  RoleMatrixMap,
  rightsToMatrix
} from "../../shared/rbacConfig.ts";
import { hasActionRight, isSuperAdminSession } from "../../utils/permissions.ts";
import { PaginationControls, getPaginationSlice } from "../../components/PaginationControls.tsx";
import { useMessageBox } from "../../components/MessageBox.tsx";
import {
  Shield,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Lock,
  RefreshCw,
  Sliders,
  Check,
  RotateCcw,
  KeyRound,
  Search
} from "lucide-react";

interface RoleItem {
  id: number;
  role_name: string;
  description: string;
  is_builtin?: boolean;
  user_count?: number;
  right_codes: string[];
  matrix: RoleMatrixMap;
}

interface RolePanelProps {
  currentSession?: AuthSessionState | null;
  currentLang?: SupportedLang;
  initialSubTab?: "roles" | "user_rights";
  initialTargetUserId?: number | null;
  hideSubTabs?: boolean;
}

function buildEmptyMatrix(): RoleMatrixMap {
  const m: RoleMatrixMap = {};
  for (const def of MENU_DEFINITIONS) {
    m[def.key] = { menu: false, new: false, edit: false, delete: false, calculation: false };
  }
  return m;
}

function buildOperatorPresetMatrix(): RoleMatrixMap {
  const m = buildEmptyMatrix();
  for (const key of OPERATOR_ALLOWED_MENUS) {
    const def = MENU_DEFINITIONS.find((d) => d.key === key);
    m[key] = {
      menu: true,
      new: Boolean(def?.supportedActions.includes("new")),
      edit: Boolean(def?.supportedActions.includes("edit")),
      delete: false,
      calculation: Boolean(def?.supportedActions.includes("calculation"))
    };
  }
  return m;
}

function buildFullMatrix(): RoleMatrixMap {
  const m = buildEmptyMatrix();
  for (const def of MENU_DEFINITIONS) {
    m[def.key] = {
      menu: def.supportedActions.includes("menu"),
      new: def.supportedActions.includes("new"),
      edit: def.supportedActions.includes("edit"),
      delete: def.supportedActions.includes("delete"),
      calculation: def.supportedActions.includes("calculation")
    };
  }
  return m;
}

export const RolePanel: React.FC<RolePanelProps> = ({
  currentSession,
  currentLang = "eng",
  initialSubTab = "roles",
  initialTargetUserId = null,
  hideSubTabs = false
}) => {
  const { showConfirm, showSuccess, showError, MessageBoxModal } = useMessageBox();
  const t = translations[currentLang];
  const [subTab, setSubTab] = useState<"roles" | "user_rights">(initialSubTab);

  // Roles State
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | "new">("new");
  const [roleNameInput, setRoleNameInput] = useState("");
  const [roleDescInput, setRoleDescInput] = useState("");
  const [roleMatrix, setRoleMatrix] = useState<RoleMatrixMap>(buildEmptyMatrix);

  // User-Wise Rights State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(initialTargetUserId);
  const [selectedUserRoleName, setSelectedUserRoleName] = useState<string>("operator");
  const [userRoleCodes, setUserRoleCodes] = useState<string[]>([]);
  const [userOverrides, setUserOverrides] = useState<Record<string, boolean>>({});
  const [userMatrix, setUserMatrix] = useState<RoleMatrixMap>(buildEmptyMatrix);
  const [loadingUserRights, setLoadingUserRights] = useState(false);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rolesPage, setRolesPage] = useState<number>(1);
  const [usersPage, setUsersPage] = useState<number>(1);
  const listItemsPerPage = 10;

  const isSuper = isSuperAdminSession(currentSession);
  const canCreateRole = isSuper || hasActionRight(currentSession, "role", "new");
  const canEditRole = isSuper || hasActionRight(currentSession, "role", "edit");
  const canDeleteRole = isSuper || hasActionRight(currentSession, "role", "delete");

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if (initialTargetUserId) {
      setSelectedUserId(initialTargetUserId);
      setSubTab("user_rights");
    }
  }, [initialTargetUserId]);

  const notifySuccess = (msg: string) => {
    setErrorMessage(null);
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const notifyError = (msg: string) => {
    setStatusMessage(null);
    setErrorMessage(msg);
  };

  const loadRoles = useCallback(async (keepSelectionId?: number | "new") => {
    setLoading(true);
    try {
      const res = await ApiController.getRoles();
      if (res.success && res.data?.roles) {
        const list = res.data.roles as RoleItem[];
        setRoles(list);
        const targetId = keepSelectionId !== undefined ? keepSelectionId : selectedRoleId;
        if (targetId === "new") {
          if (list.length > 0 && keepSelectionId === undefined) {
            const first = list[0];
            setSelectedRoleId(first.id);
            setRoleNameInput(first.role_name);
            setRoleDescInput(first.description || "");
            setRoleMatrix(first.matrix || rightsToMatrix(first.right_codes || []));
          }
        } else {
          const match = list.find((r) => r.id === Number(targetId)) || list[0];
          if (match) {
            setSelectedRoleId(match.id);
            setRoleNameInput(match.role_name);
            setRoleDescInput(match.description || "");
            setRoleMatrix(match.matrix || rightsToMatrix(match.right_codes || []));
          }
        }
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load roles");
    } finally {
      setLoading(false);
    }
  }, [selectedRoleId]);

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch(`/api/User/GetSearchTemplate`);
      const json = await res.json();
      if (json.success && json.data) {
        const items = json.data.items || json.data || [];
        setUsersList(items);
        if (!selectedUserId && items.length > 0) {
          setSelectedUserId(Number(items[0].id));
        }
      }
    } catch {
      const res = await ApiController.getUsers();
      if (res.success && res.data?.items) {
        setUsersList(res.data.items);
      }
    }
  }, [selectedUserId]);

  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  const loadSelectedUserPermissions = useCallback(async (uid: number) => {
    setLoadingUserRights(true);
    try {
      const res = await ApiController.getUserRights(uid);
      if (res.success && res.data) {
        setSelectedUserRoleName(res.data.role?.role_name || "user");
        setUserRoleCodes(res.data.role_right_codes || []);
        setUserOverrides(res.data.overrides || {});
        setUserMatrix(res.data.effective_matrix || rightsToMatrix(res.data.effective_right_codes || []));
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to load user rights");
    } finally {
      setLoadingUserRights(false);
    }
  }, []);

  useEffect(() => {
    if (selectedUserId && subTab === "user_rights") {
      loadSelectedUserPermissions(selectedUserId);
    }
  }, [selectedUserId, subTab, loadSelectedUserPermissions]);

  const handleSelectRole = (role: RoleItem) => {
    setSelectedRoleId(role.id);
    setRoleNameInput(role.role_name);
    setRoleDescInput(role.description || "");
    setRoleMatrix(role.matrix ? JSON.parse(JSON.stringify(role.matrix)) : rightsToMatrix(role.right_codes || []));
    setErrorMessage(null);
  };

  const handleStartNewRole = () => {
    setSelectedRoleId("new");
    setRoleNameInput("");
    setRoleDescInput("");
    setRoleMatrix(buildOperatorPresetMatrix());
    setErrorMessage(null);
  };

  const toggleMatrixCell = (
    setter: React.Dispatch<React.SetStateAction<RoleMatrixMap>>,
    menuKey: MenuKey,
    action: RightActionType,
    checked: boolean
  ) => {
    setter((prev) => {
      const current = prev[menuKey] || { menu: false, new: false, edit: false, delete: false, calculation: false };
      if (action === "menu") {
        if (!checked) {
          return {
            ...prev,
            [menuKey]: { menu: false, new: false, edit: false, delete: false, calculation: false }
          };
        }
        return {
          ...prev,
          [menuKey]: { ...current, menu: true }
        };
      }
      return {
        ...prev,
        [menuKey]: {
          ...current,
          [action]: checked,
          menu: checked ? true : current.menu
        }
      };
    });
  };

  const toggleMatrixRow = (
    setter: React.Dispatch<React.SetStateAction<RoleMatrixMap>>,
    menuKey: MenuKey,
    enableAll: boolean
  ) => {
    const def = MENU_DEFINITIONS.find((m) => m.key === menuKey);
    if (!def) return;
    setter((prev) => ({
      ...prev,
      [menuKey]: {
        menu: enableAll && def.supportedActions.includes("menu"),
        new: enableAll && def.supportedActions.includes("new"),
        edit: enableAll && def.supportedActions.includes("edit"),
        delete: enableAll && def.supportedActions.includes("delete"),
        calculation: enableAll && def.supportedActions.includes("calculation")
      }
    }));
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput.trim()) {
      showError("Role name is required.");
      notifyError("Role name is required.");
      return;
    }

    showConfirm("Do you want to save role details?", async () => {
      setSaving(true);
      try {
        if (selectedRoleId === "new") {
          const res = await ApiController.createRole({
            role_name: roleNameInput.trim(),
            description: roleDescInput.trim() || roleNameInput.trim(),
            matrix: roleMatrix
          });
          if (res.success && res.data) {
            showSuccess("Record saved successfully!");
            notifySuccess(res.message || "Role created successfully.");
            await loadRoles(Number(res.data.id));
            window.dispatchEvent(new CustomEvent("gtax:rbac_updated"));
          } else {
            showError(res.message || "Failed to create role.");
            notifyError(res.message || "Failed to create role.");
          }
        } else {
          const res = await ApiController.updateRole(selectedRoleId, {
            role_name: roleNameInput.trim(),
            description: roleDescInput.trim(),
            matrix: roleMatrix
          });
          if (res.success) {
            showSuccess("Record saved successfully!");
            notifySuccess(res.message || "Role permissions updated.");
            await loadRoles(selectedRoleId);
            window.dispatchEvent(new CustomEvent("gtax:rbac_updated"));
          } else {
            showError(res.message || "Failed to update role.");
            notifyError(res.message || "Failed to update role.");
          }
        }
      } catch (err: any) {
        showError(err?.message || "Failed to save role.");
        notifyError(err?.message || "Failed to save role.");
      } finally {
        setSaving(false);
      }
    }, "Do you want to save?");
  };

  const handleDeleteRole = async (role: RoleItem) => {
    showConfirm(`Do you want to delete custom role '${role.role_name}'?`, async () => {
      const res = await ApiController.deleteRole(role.id);
      if (res.success) {
        showSuccess("Record deleted successfully.");
        notifySuccess(res.message || "Role deleted.");
        await loadRoles();
        window.dispatchEvent(new CustomEvent("gtax:rbac_updated"));
      } else {
        showError(res.message || "Cannot delete role.");
        notifyError(res.message || "Cannot delete role.");
      }
    }, "Do you want to delete?");
  };

  const handleSaveUserRights = async () => {
    if (!selectedUserId) return;
    showConfirm("Do you want to save user menu and action rights?", async () => {
      setSaving(true);
      try {
        const res = await ApiController.saveUserRights(selectedUserId, {
          role_name: selectedUserRoleName,
          matrix: userMatrix
        });
        if (res.success && res.data) {
          showSuccess("Record saved successfully!");
          setSelectedUserRoleName(res.data.role?.role_name || selectedUserRoleName);
          setUserRoleCodes(res.data.role_right_codes || []);
          setUserOverrides(res.data.overrides || {});
          setUserMatrix(res.data.effective_matrix || rightsToMatrix(res.data.effective_right_codes || []));
          notifySuccess("User-wise menu and action rights saved.");
          loadUsers();
          window.dispatchEvent(new CustomEvent("gtax:rbac_updated"));
        } else {
          showError(res.message || "Failed to update user rights.");
          notifyError(res.message || "Failed to update user rights.");
        }
      } catch (err: any) {
        showError(err?.message || "Failed to save user rights.");
        notifyError(err?.message || "Failed to save user rights.");
      } finally {
        setSaving(false);
      }
    }, "Do you want to save?");
  };

  const handleResetUserOverrides = async () => {
    if (!selectedUserId) return;
    setSaving(true);
    try {
      const res = await ApiController.saveUserRights(selectedUserId, {
        role_name: selectedUserRoleName,
        reset_to_role: true
      });
      if (res.success && res.data) {
        setUserRoleCodes(res.data.role_right_codes || []);
        setUserOverrides({});
        setUserMatrix(res.data.effective_matrix || rightsToMatrix(res.data.effective_right_codes || []));
        notifySuccess("Reset user rights back to assigned role defaults.");
        window.dispatchEvent(new CustomEvent("gtax:rbac_updated"));
      } else {
        notifyError(res.message || "Failed to reset overrides.");
      }
    } catch (err: any) {
      notifyError(err?.message || "Failed to reset user rights.");
    } finally {
      setSaving(false);
    }
  };

  const handleUserRoleDropdownChange = (newRoleName: string) => {
    setSelectedUserRoleName(newRoleName);
    const matchedRole = roles.find((r) => r.role_name.toLowerCase() === newRoleName.toLowerCase());
    if (matchedRole) {
      setUserRoleCodes(matchedRole.right_codes || []);
      setUserMatrix(matchedRole.matrix ? JSON.parse(JSON.stringify(matchedRole.matrix)) : rightsToMatrix(matchedRole.right_codes || []));
      setUserOverrides({});
    }
  };

  const currentRoleObj = selectedRoleId === "new" ? null : roles.find((r) => r.id === selectedRoleId) || null;
  const isEditingSuperadminRole = currentRoleObj?.role_name.toLowerCase() === "superadmin";

  const filteredUsers = usersList.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      String(u.fullname || u.full_name || "").toLowerCase().includes(q) ||
      String(u.email || "").toLowerCase().includes(q) ||
      String(u.role || "").toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    setUsersPage(1);
  }, [userSearch]);

  const { paginatedItems: paginatedRoles } = getPaginationSlice(roles, rolesPage, listItemsPerPage);
  const { paginatedItems: paginatedFilteredUsers } = getPaginationSlice(
    filteredUsers,
    usersPage,
    listItemsPerPage
  );

  const selectedUserObj = usersList.find((u) => Number(u.id) === Number(selectedUserId));
  const isSelectedUserSuperadmin =
    String(selectedUserRoleName || "").toLowerCase() === "superadmin" ||
    String(selectedUserObj?.email || "").toLowerCase() === "superadmin@gtax.enterprise";

  return (
    <div className="space-y-2">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              {t.roleManagement || "Roles & Menu Permissions"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create custom roles, assign menu access with New, Edit, Delete, and Calculation rights, or customize per-user access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!hideSubTabs && (
            <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSubTab("roles")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  subTab === "roles"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Role Matrix</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab("user_rights")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  subTab === "user_rights"
                    ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>User-Wise Menu Rights</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              loadRoles();
              loadUsers();
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            title="Refresh roles and permissions"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {canCreateRole && subTab === "roles" && (
            <button
              type="button"
              onClick={handleStartNewRole}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Alerts */}
      {statusMessage && (
        <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {subTab === "roles" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Roles Registry List */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Security Roles ({roles.length})
              </span>
              {canCreateRole && (
                <button
                  type="button"
                  onClick={handleStartNewRole}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Role</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {paginatedRoles.map((role) => {
                const isSelected = selectedRoleId === role.id;
                const enabledMenusCount = MENU_DEFINITIONS.filter(
                  (m) => role.matrix?.[m.key]?.menu
                ).length;

                return (
                  <div
                    key={role.id}
                    onClick={() => handleSelectRole(role)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-2 ${
                      isSelected
                        ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wide">
                          {role.role_name}
                        </span>
                        {role.is_builtin ? (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            System
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                        {role.description || "Custom municipal security role"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{enabledMenusCount}/{MENU_DEFINITIONS.length} menus</span>
                        <span>·</span>
                        <span>{role.right_codes?.length || 0} rights</span>
                        <span>·</span>
                        <span>{role.user_count || 0} user(s)</span>
                      </div>
                    </div>

                    {!role.is_builtin && canDeleteRole && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRole(role);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                        title="Delete custom role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <PaginationControls
              totalItems={roles.length}
              currentPage={rolesPage}
              itemsPerPage={listItemsPerPage}
              onPageChange={setRolesPage}
              itemLabel="roles"
              compact
            />
          </div>

          {/* Right: Role Editor & Menu/Action Permission Matrix */}
          <form
            onSubmit={handleSaveRole}
            className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col"
          >
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {selectedRoleId === "new"
                      ? "Create New Role & Assign Menu Rights"
                      : `Edit Permissions: ${currentRoleObj?.role_name?.toUpperCase() || ""}`}
                  </span>
                </h3>
              </div>

              {!isEditingSuperadminRole && (selectedRoleId === "new" ? canCreateRole : canEditRole) && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setRoleMatrix(buildFullMatrix())}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Enable All
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleMatrix(buildOperatorPresetMatrix())}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 cursor-pointer"
                  >
                    Operator Preset
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoleMatrix(buildEmptyMatrix())}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Role Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(currentRoleObj?.is_builtin)}
                    value={roleNameInput}
                    onChange={(e) => setRoleNameInput(e.target.value)}
                    placeholder="e.g. ward_officer or tax_assessor"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    disabled={isEditingSuperadminRole}
                    value={roleDescInput}
                    onChange={(e) => setRoleDescInput(e.target.value)}
                    placeholder="Role responsibility summary"
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {isEditingSuperadminRole && (
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>
                    Superadmin always has unrestricted access to every menu and feature (`menu`, `new`, `edit`, `delete`, `calculation`).
                  </span>
                </div>
              )}

              {/* Menu & Action Permission Matrix */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-200/75 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-900">
                      <tr>
                        <th className="py-2.5 px-3.5">Menu / Feature</th>
                        <th className="py-2.5 px-2.5 text-center">Menu</th>
                        <th className="py-2.5 px-2.5 text-center">New</th>
                        <th className="py-2.5 px-2.5 text-center">Edit</th>
                        <th className="py-2.5 px-2.5 text-center">Delete</th>
                        <th className="py-2.5 px-2.5 text-center">Calculation</th>
                        <th className="py-2.5 px-2.5 text-center">Row</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {MENU_DEFINITIONS.map((menu) => {
                        const row = isEditingSuperadminRole
                          ? { menu: true, new: true, edit: true, delete: true, calculation: true }
                          : roleMatrix[menu.key] || { menu: false, new: false, edit: false, delete: false, calculation: false };
                        const canModify =
                          !isEditingSuperadminRole && (selectedRoleId === "new" ? canCreateRole : canEditRole);

                        return (
                          <tr key={menu.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="py-2.5 px-3.5">
                              <div className="font-semibold text-slate-900 dark:text-white">{menu.label}</div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">{menu.description}</div>
                            </td>
                            {ACTION_TYPES.map((act) => {
                              const supported = menu.supportedActions.includes(act);
                              if (!supported) {
                                return (
                                  <td key={act} className="py-2.5 px-2.5 text-center text-slate-300 dark:text-slate-700">
                                    —
                                  </td>
                                );
                              }
                              return (
                                <td key={act} className="py-2.5 px-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(row[act])}
                                    disabled={!canModify}
                                    onChange={(e) => toggleMatrixCell(setRoleMatrix, menu.key, act, e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                  />
                                </td>
                              );
                            })}
                            <td className="py-2.5 px-2.5 text-center">
                              {canModify && (
                                <button
                                  type="button"
                                  onClick={() => toggleMatrixRow(setRoleMatrix, menu.key, !row.menu)}
                                  className="px-2 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  {row.menu ? "Off" : "All"}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Save Footer */}
              {!isEditingSuperadminRole && (selectedRoleId === "new" ? canCreateRole : canEditRole) && (
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {saving
                        ? "Saving..."
                        : selectedRoleId === "new"
                          ? "Create Role with Assigned Features"
                          : "Save Role Permissions"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* User-Wise Menu & Action Overrides Tab */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: User Selector */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Select User ({filteredUsers.length})
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter user name, email, or role..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
              {paginatedFilteredUsers.map((u) => {
                const uid = Number(u.id);
                const active = uid === Number(selectedUserId);
                return (
                  <button
                    key={uid}
                    type="button"
                    onClick={() => setSelectedUserId(uid)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                      active
                        ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-l-4 border-l-indigo-600"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {u.fullname || u.full_name || u.username}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {u.email}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {u.role || "user"}
                    </span>
                  </button>
                );
              })}
            </div>

            <PaginationControls
              totalItems={filteredUsers.length}
              currentPage={usersPage}
              itemsPerPage={listItemsPerPage}
              onPageChange={setUsersPage}
              itemLabel="users"
              compact
            />
          </div>

          {/* Right: User Role & Individual Menu Overrides */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  User-Wise Menu &amp; Feature Rights
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {selectedUserObj
                    ? `${selectedUserObj.fullname || selectedUserObj.username} (${selectedUserObj.email})`
                    : "Select a user on the left to customize menu access"}
                </p>
              </div>

              {selectedUserId && !isSelectedUserSuperadmin && canEditRole && (
                <button
                  type="button"
                  onClick={handleResetUserOverrides}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Role Default</span>
                </button>
              )}
            </div>

            {loadingUserRights ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Loading user permissions...
              </div>
            ) : !selectedUserId ? (
              <div className="p-10 text-center text-xs text-slate-500">
                Select a user from the list to configure their menu permissions.
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={selectedUserRoleName}
                      disabled={isSelectedUserSuperadmin || !canEditRole}
                      onChange={(e) => handleUserRoleDropdownChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg"
                    >
                      {roles.map((r) => (
                        <option key={r.id} value={r.role_name}>
                          {r.role_name.toUpperCase()} — {r.description}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {Object.keys(userOverrides).length > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
                        <Check className="w-3.5 h-3.5" />
                        {Object.keys(userOverrides).length} user-specific override(s) active
                      </span>
                    ) : (
                      <span>Inheriting default rights from assigned role</span>
                    )}
                  </div>
                </div>

                {isSelectedUserSuperadmin && (
                  <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 shrink-0 text-purple-600" />
                    <span>Superadmin account always has every menu and action enabled.</span>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-200/75 border-b border-slate-300 text-[11px] font-bold uppercase tracking-wider text-slate-900">
                        <tr>
                          <th className="py-2.5 px-3.5">Menu / Feature</th>
                          <th className="py-2.5 px-2.5 text-center">Menu</th>
                          <th className="py-2.5 px-2.5 text-center">New</th>
                          <th className="py-2.5 px-2.5 text-center">Edit</th>
                          <th className="py-2.5 px-2.5 text-center">Delete</th>
                          <th className="py-2.5 px-2.5 text-center">Calculation</th>
                          <th className="py-2.5 px-2.5 text-center">Row</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {MENU_DEFINITIONS.map((menu) => {
                          const row = isSelectedUserSuperadmin
                            ? { menu: true, new: true, edit: true, delete: true, calculation: true }
                            : userMatrix[menu.key] || { menu: false, new: false, edit: false, delete: false, calculation: false };

                          return (
                            <tr key={menu.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3.5">
                                <div className="font-semibold text-slate-900 dark:text-white">{menu.label}</div>
                              </td>
                              {ACTION_TYPES.map((act) => {
                                const supported = menu.supportedActions.includes(act);
                                if (!supported) {
                                  return (
                                    <td key={act} className="py-2.5 px-2.5 text-center text-slate-300 dark:text-slate-700">
                                      —
                                    </td>
                                  );
                                }
                                const code = `${menu.key}_${act}`;
                                const isFromRole = userRoleCodes.includes(code);
                                const isChecked = Boolean(row[act]);
                                const isOverridden = isFromRole !== isChecked;
                                return (
                                  <td
                                    key={act}
                                    className={`py-2.5 px-2.5 text-center ${
                                      isOverridden ? "bg-amber-50/70 dark:bg-amber-950/20" : ""
                                    }`}
                                    title={isOverridden ? `Overridden (Role default: ${isFromRole ? "Enabled" : "Disabled"})` : undefined}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      disabled={isSelectedUserSuperadmin || !canEditRole}
                                      onChange={(e) => toggleMatrixCell(setUserMatrix, menu.key, act, e.target.checked)}
                                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  </td>
                                );
                              })}
                              <td className="py-2.5 px-2.5 text-center">
                                {!isSelectedUserSuperadmin && canEditRole && (
                                  <button
                                    type="button"
                                    onClick={() => toggleMatrixRow(setUserMatrix, menu.key, !row.menu)}
                                    className="px-2 py-0.5 text-[10px] font-semibold rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                  >
                                    {row.menu ? "Disable" : "Enable"}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {!isSelectedUserSuperadmin && canEditRole && (
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={handleSaveUserRights}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? "Saving..." : "Save User Menu Rights"}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <MessageBoxModal />
    </div>
  );
};
