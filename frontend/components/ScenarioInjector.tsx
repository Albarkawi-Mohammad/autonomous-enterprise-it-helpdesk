"use client";

import React, { useState } from "react";
import { ScenarioKey } from "@/types/helpdesk";
import { INITIAL_TICKETS } from "@/lib/mockData";
import {
  UserCheck,
  ShieldAlert,
  KeyRound,
  Cpu,
  Plus,
  RotateCcw,
  Loader2,
  Sparkles,
} from "lucide-react";

interface ScenarioInjectorProps {
  onInject: (scenario: ScenarioKey) => Promise<void>;
  onInjectBenchmark?: (level: number) => Promise<void>;
  onOpenCustomModal: () => void;
  onReset: () => Promise<void>;
  loadingScenario: ScenarioKey | null;
  isResetting: boolean;
}

export function ScenarioInjector({
  onInject,
  onInjectBenchmark,
  onOpenCustomModal,
  onReset,
  loadingScenario,
  isResetting,
}: ScenarioInjectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<number>(16);
  const [isInjectingLevel, setIsInjectingLevel] = useState(false);

  const handleBenchmarkRun = async () => {
    if (!onInjectBenchmark) return;
    setIsInjectingLevel(true);
    try {
      await onInjectBenchmark(selectedLevel);
    } finally {
      setIsInjectingLevel(false);
    }
  };

  return (
    <section
      aria-label="Live Scenario Simulation Deck"
      className="border-b border-[#dce3f5] bg-white px-6 py-3"
    >
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        {/* Left: 4 Quick Deterministic Scenario Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-[#6e7799]">
            Simulate Vector:
          </span>

          {/* Scenario 1: Standard Lockout */}
          <button
            type="button"
            onClick={() => onInject("alex_lockout")}
            disabled={loadingScenario !== null}
            className="group flex items-center gap-2 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-1.5 text-xs font-medium text-[#060b21] transition-all hover:border-[#3555e4] hover:bg-[#ebeefd]/60 disabled:opacity-50"
          >
            {loadingScenario === "alex_lockout" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3555e4]" />
            ) : (
              <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>Demo User 06 Lockout</span>
            <kbd className="rounded bg-[#ebeefd] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#2842bb] tabular-nums">
              1
            </kbd>
          </button>

          {/* Scenario 2: Prompt Injection */}
          <button
            type="button"
            onClick={() => onInject("prompt_injection")}
            disabled={loadingScenario !== null}
            className="group flex items-center gap-2 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-1.5 text-xs font-medium text-[#060b21] transition-all hover:border-rose-400 hover:bg-rose-50/60 disabled:opacity-50"
          >
            {loadingScenario === "prompt_injection" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
            ) : (
              <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
            )}
            <span>Prompt Injection Attack</span>
            <kbd className="rounded bg-rose-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-rose-800 tabular-nums">
              2
            </kbd>
          </button>

          {/* Scenario 3: Domain Admin HITL */}
          <button
            type="button"
            onClick={() => onInject("admin_hitl")}
            disabled={loadingScenario !== null}
            className="group flex items-center gap-2 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-1.5 text-xs font-medium text-[#060b21] transition-all hover:border-amber-400 hover:bg-amber-50/60 disabled:opacity-50"
          >
            {loadingScenario === "admin_hitl" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : (
              <KeyRound className="h-3.5 w-3.5 text-amber-600" />
            )}
            <span>Domain Admin Lockout (HITL)</span>
            <kbd className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-900 tabular-nums">
              3
            </kbd>
          </button>

          {/* Scenario 4: Hardware Failure */}
          <button
            type="button"
            onClick={() => onInject("hardware_escalation")}
            disabled={loadingScenario !== null}
            className="group flex items-center gap-2 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-1.5 text-xs font-medium text-[#060b21] transition-all hover:border-[#3555e4] hover:bg-[#ebeefd]/60 disabled:opacity-50"
          >
            {loadingScenario === "hardware_escalation" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3555e4]" />
            ) : (
              <Cpu className="h-3.5 w-3.5 text-[#3555e4]" />
            )}
            <span>Hardware Fault (Tier-2)</span>
            <kbd className="rounded bg-[#ebeefd] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#2842bb] tabular-nums">
              4
            </kbd>
          </button>
        </div>

        {/* Right: 20-Scenario Graded Benchmark Picker + Custom Payload + Reset */}
        <div className="flex flex-wrap items-center gap-2">
          {onInjectBenchmark && (
            <div className="flex items-center rounded-lg border border-[#dce3f5] bg-[#f2f5fc] p-0.5">
              <select
                aria-label="Select Graded Benchmark Scenario (L01-L20)"
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(Number(e.target.value))}
                className="bg-transparent px-2.5 py-1 text-xs font-medium text-[#060b21] focus:outline-none max-w-[230px] truncate tabular-nums"
              >
                {INITIAL_TICKETS.map((t) => {
                  const lvl = t.difficulty_level || 1;
                  return (
                    <option key={t.ticket_id} value={lvl}>
                      L{String(lvl).padStart(2, "0")} [{t.difficulty_tier}] — {t.subject}
                    </option>
                  );
                })}
              </select>
              <button
                type="button"
                onClick={handleBenchmarkRun}
                disabled={isInjectingLevel}
                className="flex items-center gap-1 rounded-md bg-[#060b21] px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-[#3555e4] disabled:opacity-50"
              >
                {isInjectingLevel ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Sparkles className="h-3 w-3 text-[#98a9f9]" />
                )}
                <span>Run L{String(selectedLevel).padStart(2, "0")}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCustomModal}
            className="flex items-center gap-1.5 rounded-lg bg-[#3555e4] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#2842bb]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Custom Ticket</span>
            <kbd className="ml-0.5 rounded bg-white/20 px-1.5 py-0.2 font-mono text-[10px] text-white">
              N
            </kbd>
          </button>

          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            title="Reset AD & Ticket Ledger (Shift+R)"
            className="flex items-center gap-1.5 rounded-lg border border-[#dce3f5] bg-white px-2.5 py-1.5 text-xs font-medium text-[#3b4262] transition-colors hover:border-[#98a9f9] hover:bg-[#f2f5fc] hover:text-[#060b21] disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Reset</span>
            <kbd className="rounded bg-[#f2f5fc] px-1 py-0.5 font-mono text-[10px] text-[#6e7799]">
              ⇧R
            </kbd>
          </button>
        </div>
      </div>
    </section>
  );
}
