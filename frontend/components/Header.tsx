"use client";

import React from "react";
import Link from "next/link";
import { HealthStatus } from "@/types/helpdesk";
import {
  ShieldCheck,
  Database,
  Cpu,
  Lock,
  Activity,
  MessageSquarePlus,
  Layers,
  Server,
  FileCheck2,
} from "lucide-react";

export type AdminWorkspaceTab = "triage" | "directory" | "ledger";

interface HeaderProps {
  health: HealthStatus | null;
  activeTab?: AdminWorkspaceTab;
  onSelectTab?: (tab: AdminWorkspaceTab) => void;
  hitlCount?: number;
  lockedUsersCount?: number;
  auditBlockCount?: number;
}

export function Header({
  health,
  activeTab = "triage",
  onSelectTab,
  hitlCount = 0,
  lockedUsersCount = 0,
  auditBlockCount = 20,
}: HeaderProps) {
  return (
    <header className="cobalt-horizon-banner relative overflow-hidden text-white border-b border-[#1d3299]">
      {/* Subtle atmospheric glow orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/4 h-64 w-[38rem] rounded-full bg-[#3555e4]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 right-10 h-48 w-[28rem] rounded-full bg-[#98a9f9]/25 blur-3xl"
      />

      {/* Top Navigation & Telemetry Bar */}
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3555e4] shadow-inner ring-1 ring-white/25">
            <ShieldCheck className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">
                Example Organization Sovereign Triage
              </span>
              <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-[#dadfff] ring-1 ring-white/15 tabular-nums">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-[#98a9f9]">
              Autonomous Enterprise IT Helpdesk &amp; Deterministic Policy Gate
            </p>
          </div>
        </div>

        {/* Workspace Mode Switcher */}
        {onSelectTab && (
          <nav
            aria-label="Primary Workspace Views"
            className="flex items-center rounded-lg bg-[#050a20]/65 p-1 ring-1 ring-white/12 backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => onSelectTab("triage")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "triage"
                  ? "bg-[#3555e4] text-white shadow-sm"
                  : "text-[#dadfff] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Triage Console</span>
              {hitlCount > 0 && (
                <span className="ml-1 rounded-full bg-amber-400/20 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-amber-300 ring-1 ring-amber-300/30 tabular-nums">
                  {hitlCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("directory")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "directory"
                  ? "bg-[#3555e4] text-white shadow-sm"
                  : "text-[#dadfff] hover:bg-white/5 hover:text-white"
              }`}
            >
              <Server className="h-3.5 w-3.5" />
              <span>Active Directory Forest</span>
              <span className="ml-1 rounded-full bg-white/10 px-1.5 py-0.2 font-mono text-[10px] text-[#dadfff] tabular-nums">
                {lockedUsersCount} locked
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectTab("ledger")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                activeTab === "ledger"
                  ? "bg-[#3555e4] text-white shadow-sm"
                  : "text-[#dadfff] hover:bg-white/5 hover:text-white"
              }`}
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>SHA-256 Audit Ledger</span>
              <span className="ml-1 rounded-full bg-emerald-400/20 px-1.5 py-0.2 font-mono text-[10px] text-emerald-300 tabular-nums">
                {auditBlockCount}
              </span>
            </button>
          </nav>
        )}

        {/* Right Subsystem Telemetry & Employee Self-Service Link */}
        <div className="flex items-center gap-2.5">
          <div className="hidden xl:flex items-center gap-1.5 rounded-md bg-[#050a20]/60 px-2.5 py-1 text-[11px] text-[#dadfff] ring-1 ring-white/10">
            <Cpu className="h-3.5 w-3.5 text-[#98a9f9]" />
            <span className="text-white/60">Pydantic V2:</span>
            <span className="font-mono text-[#dadfff]">
              {health?.llm_mode === "LIVE_OPENAI" ? "gpt-4o-mini" : "Deterministic"}
            </span>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 rounded-md bg-[#050a20]/60 px-2.5 py-1 text-[11px] text-[#dadfff] ring-1 ring-white/10">
            <Database className="h-3.5 w-3.5 text-[#98a9f9]" />
            <span className="text-white/60">LDAP:</span>
            <span className="font-mono text-[#dadfff]">corp.example.test</span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-1 text-[11px] text-emerald-200 ring-1 ring-emerald-400/30">
            <Lock className="h-3 w-3 text-emerald-300" />
            <span className="font-mono text-[11px]">SHA-256 Verified</span>
          </div>

          <Link
            href="/user"
            className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-[#060b21] shadow-sm transition-all hover:bg-[#ebeefd] active:scale-[0.99]"
          >
            <MessageSquarePlus className="h-3.5 w-3.5 text-[#3555e4]" />
            <span>Employee Self-Service Portal</span>
          </Link>
        </div>
      </div>

      {/* Atmospheric Editorial Command Banner */}
      <div className="relative z-10 mx-auto flex max-w-[1600px] flex-col justify-between gap-4 px-6 py-5 lg:flex-row lg:items-end">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#98a9f9]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Zero-Trust Execution Boundary Active
            </span>
            <span className="text-white/25">•</span>
            <span className="font-mono text-[11px] text-[#dadfff]/80">
              DC01.corp.example.test:636 (LDAPS)
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-[28px] leading-tight">
            Autonomous ticket resolution,{" "}
            <span className="font-serif italic font-normal text-[#dadfff]">
              deterministic
            </span>{" "}
            directory security.
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-[#dadfff]/90">
          <div className="border-l border-white/15 pl-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#98a9f9]">
              Execution Policy
            </div>
            <div className="mt-0.5 font-medium text-white">
              LLM Extracts Intent Only • Python Gate Mutates AD
            </div>
          </div>
          <div className="border-l border-white/15 pl-3.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#98a9f9]">
              Privileged Guardrail
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 font-medium text-white">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              <span>Domain Admins Frozen to Redis HITL</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
