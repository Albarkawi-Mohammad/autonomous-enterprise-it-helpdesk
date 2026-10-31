"use client";

import React, { useState } from "react";
import { LdapUser } from "@/types/helpdesk";
import {
  Server,
  Lock,
  Unlock,
  ShieldAlert,
  ChevronUp,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Search,
} from "lucide-react";

interface LdapInspectorProps {
  users: LdapUser[];
  highlightedUserId?: string | null;
  onToggleLock: (username: string, lock: boolean) => Promise<void>;
  fullPage?: boolean;
}

export function LdapInspector({
  users,
  highlightedUserId,
  onToggleLock,
  fullPage = false,
}: LdapInspectorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [togglingUser, setTogglingUser] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyLocked, setOnlyLocked] = useState(false);

  const lockedCount = users.filter((u) => u.is_locked).length;
  const privilegedCount = users.filter((u) => u.is_privileged).length;

  const filteredUsers = users.filter((u) => {
    if (onlyLocked && !u.is_locked) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.sAMAccountName.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.dn.toLowerCase().includes(q) ||
      u.mail.toLowerCase().includes(q)
    );
  });

  const handleToggle = async (username: string, lock: boolean) => {
    setTogglingUser(username);
    try {
      await onToggleLock(username, lock);
    } finally {
      setTogglingUser(null);
    }
  };

  const renderUserCard = (user: LdapUser) => {
    const isHighlighted = user.sAMAccountName === highlightedUserId;
    const isBusy = togglingUser === user.sAMAccountName;

    return (
      <div
        key={user.sAMAccountName}
        className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
          isHighlighted
            ? "border-[#3555e4] bg-[#ebeefd]/65 shadow-sm ring-1 ring-[#3555e4]/30"
            : "border-[#dce3f5] bg-white hover:border-[#98a9f9]"
        }`}
      >
        <div>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-semibold text-[#060b21]">
                  {user.sAMAccountName}
                </span>
                {user.is_privileged && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-[#060b21] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-300">
                    <ShieldAlert className="h-2.5 w-2.5 text-amber-400" />
                    DOMAIN ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#6e7799]">{user.department}</p>
            </div>

            {/* Lockout State Pill */}
            {user.is_locked ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-500/25">
                <Lock className="h-3 w-3 text-rose-600" />
                LOCKED
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/25">
                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                ACTIVE
              </span>
            )}
          </div>

          {/* Distinguished Name & LockoutTime Attribute */}
          <div className="mt-2.5 rounded-lg bg-[#f2f5fc] p-2 font-mono text-[10px] text-[#3b4262]">
            <div className="truncate" title={user.dn}>
              <span className="text-[#6e7799]">dn:</span> {user.dn}
            </div>
            <div className="mt-0.5 flex items-center justify-between tabular-nums">
              <span>
                <span className="text-[#6e7799]">lockoutTime:</span>{" "}
                <strong
                  className={
                    user.is_locked ? "text-rose-700" : "text-emerald-700"
                  }
                >
                  {user.lockoutTime}
                </strong>
              </span>
              {isHighlighted && !user.is_locked && (
                <span className="rounded bg-emerald-100 px-1 text-[9px] font-semibold text-emerald-900">
                  DIFF: LOCKED → ACTIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="mt-3 flex items-center justify-between border-t border-[#e8edf8] pt-2.5">
          <span className="font-mono text-[10px] text-[#6e7799] truncate max-w-[160px]">
            {user.privileged_groups.length > 0
              ? user.privileged_groups.join(", ")
              : "Standard Users"}
          </span>

          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleToggle(user.sAMAccountName, !user.is_locked)}
            className={`flex items-center gap-1 rounded-md px-2.5 py-1 font-mono text-[10px] font-semibold transition-all disabled:opacity-50 ${
              user.is_locked
                ? "bg-[#3555e4] text-white hover:bg-[#2842bb]"
                : "border border-[#dce3f5] bg-[#fafbff] text-[#3b4262] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
            }`}
          >
            {isBusy ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : user.is_locked ? (
              <Unlock className="h-3 w-3" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            <span>{user.is_locked ? "Unlock Object" : "Simulate Lockout"}</span>
          </button>
        </div>
      </div>
    );
  };

  if (fullPage) {
    return (
      <div className="mx-auto max-w-[1600px] p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#dce3f5] bg-white p-5 shadow-sheet">
          <div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-[#3555e4]" />
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#3555e4]">
                Active Directory Domain Controller // DC01.corp.example.test
              </span>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#060b21]">
              Live LDAP Principal Objects &amp; Security Group Boundaries
            </h2>
            <p className="mt-0.5 text-xs text-[#6e7799]">
              Toggle <code className="font-mono">lockoutTime</code> on any directory object to test autonomous remediation or privileged Domain Admin HITL freezes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-64">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6e7799]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter sAMAccountName, OU..."
                className="w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] py-1.5 pl-8 pr-3 text-xs text-[#060b21] focus:border-[#3555e4] focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() => setOnlyLocked(!onlyLocked)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-medium transition-colors tabular-nums ${
                onlyLocked
                  ? "border-rose-400 bg-rose-50 text-rose-800"
                  : "border-[#dce3f5] bg-white text-[#3b4262] hover:bg-[#f2f5fc]"
              }`}
            >
              Locked Only ({lockedCount})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredUsers.map(renderUserCard)}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Active Directory Live State Dock"
      className="border-t border-[#dce3f5] bg-[#f2f5fc]"
    >
      {/* Dock Header Bar */}
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-[#3555e4]" />
            <span className="font-mono text-xs font-semibold text-[#060b21]">
              LDAP State Inspector
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#6e7799]">
            dc=corp,dc=example,dc=test
          </span>
          <span className="rounded bg-white px-2 py-0.5 font-mono text-[10px] font-semibold text-[#060b21] ring-1 ring-[#dce3f5] tabular-nums">
            {users.length} Principals • {lockedCount} Locked • {privilegedCount} Privileged
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[11px] font-medium text-[#2842bb] hover:bg-[#dadfff]/50"
        >
          <span>{isExpanded ? "Collapse Directory Dock" : "Expand Directory Dock"}</span>
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Horizontal Scrollable Cards */}
      {isExpanded && (
        <div className="mx-auto max-w-[1600px] px-6 pb-3.5 pt-1">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {users.slice(0, 5).map(renderUserCard)}
          </div>
        </div>
      )}
    </section>
  );
}
