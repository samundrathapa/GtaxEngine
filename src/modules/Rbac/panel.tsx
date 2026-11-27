import React, { useEffect, useState } from "react";
import { AuthSessionState } from "../Auth/model.ts";
import { SupportedLang } from "../../utils/i18n.ts";
import { hasMenuRight } from "../../utils/permissions.ts";
import { UserPanel } from "../User/panel.tsx";
import { RolePanel } from "../Role/panel.tsx";
import { Users, Shield, KeyRound } from "lucide-react";

export type RbacTab = "user" | "role" | "right";

interface RbacPanelProps {
  currentSession?: AuthSessionState | null;
  currentLang?: SupportedLang;
  initialTab?: RbacTab;
  onTabChange?: (tab: RbacTab) => void;
}

export const RbacPanel: React.FC<RbacPanelProps> = ({
  currentSession,
  currentLang = "eng",
  initialTab = "user",
  onTabChange
}) => {
  const canUsers = !currentSession || hasMenuRight(currentSession, "user");
  const canRoles = !currentSession || hasMenuRight(currentSession, "role");

  const getValidTab = (requested: RbacTab): RbacTab => {
    if (requested === "user" && canUsers) return "user";
    if ((requested === "role" || requested === "right") && canRoles) return requested;
    if (canUsers) return "user";
    if (canRoles) return "role";
    return requested;
  };

  const [activeTab, setActiveTab] = useState<RbacTab>(() => getValidTab(initialTab));
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  useEffect(() => {
    setActiveTab(getValidTab(initialTab));
  }, [initialTab, canUsers, canRoles]);

  const handleSelectTab = (tab: RbacTab) => {
    setActiveTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  const allTabs: Array<{ id: RbacTab; label: string; icon: React.ComponentType<any>; allowed: boolean }> = [
    { id: "user", label: "User", icon: Users, allowed: canUsers },
    { id: "role", label: "Role", icon: Shield, allowed: canRoles },
    { id: "right", label: "Right", icon: KeyRound, allowed: canRoles }
  ];
  const tabs = allTabs.filter((item) => item.allowed);

  return (
    <div className="space-y-2 m-[3px]">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            RBAC Access Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage system users, security roles, and user-wise menu permissions
          </p>
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-950 font-bold border border-slate-200 shadow-2xs"
                    : "text-slate-600 hover:text-slate-950 font-normal"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "user" && canUsers && (
        <UserPanel
          currentSession={currentSession}
          currentLang={currentLang}
          onManageUserRights={(uid) => {
            if (!canRoles) return;
            setTargetUserId(uid);
            handleSelectTab("right");
          }}
        />
      )}

      {activeTab === "role" && canRoles && (
        <RolePanel
          currentSession={currentSession}
          currentLang={currentLang}
          initialSubTab="roles"
          hideSubTabs={true}
        />
      )}

      {activeTab === "right" && canRoles && (
        <RolePanel
          currentSession={currentSession}
          currentLang={currentLang}
          initialSubTab="user_rights"
          initialTargetUserId={targetUserId}
          hideSubTabs={true}
        />
      )}
    </div>
  );
};
