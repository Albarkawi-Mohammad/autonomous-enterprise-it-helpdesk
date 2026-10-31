"use client";

import React from "react";
import { TriageRecord, LdapUser } from "@/types/helpdesk";
import { ArrowUpRight } from "lucide-react";

interface TelemetryStripProps {
  tickets: TriageRecord[];
  ldapUsers: LdapUser[];
  onFilterSelect?: (filter: string) => void;
}

export function TelemetryStrip({
  tickets,
  ldapUsers,
  onFilterSelect,
}: TelemetryStripProps) {
  const total = tickets.length;
  const autoApproved = tickets.filter(
    (t) => t.policy_verdict === "AUTO_APPROVED" || t.policy_verdict === "HITL_APPROVED"
  ).length;
  const hitlPending = tickets.filter((t) => t.policy_verdict === "REQUIRES_HITL").length;
  const blockedInjections = tickets.filter(
    (t) => t.policy_verdict === "BLOCKED_INJECTION"
  ).length;

  const avgLatency =
    total > 0
      ? Math.round(tickets.reduce((acc, t) => acc + t.latency_ms, 0) / total)
      : 42;

  const lockedCount = ldapUsers.filter((u) => u.is_locked).length;

  return (
    <section
      aria-label="Key Operational Telemetry"
      className="border-b border-[#dce3f5] bg-[#fafbff] px-6 py-4"
    >
      <div className="mx-auto max-w-[1600px]">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Midnight Abyss (#060b21) */}
          <button
            type="button"
            onClick={() => onFilterSelect?.("AUTO")}
            className="tonal-card-1 group flex flex-col justify-between rounded-xl p-4 text-left transition-all hover:shadow-elevated"
          >
            <div className="flex w-full items-center justify-between text-[11px] font-mono text-[#98a9f9]">
              <span>01 / AUTONOMOUS REMEDIATION</span>
              <span className="inline-flex items-center gap-0.5 text-[#dadfff] opacity-80 group-hover:opacity-100">
                LDAP WRITE <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-white tabular-nums">
                {autoApproved}
                <span className="ml-1.5 text-sm font-normal text-[#98a9f9] tabular-nums">
                  / {total} tickets
                </span>
              </div>
              <span className="rounded bg-emerald-400/15 px-2 py-0.5 font-mono text-[10px] font-medium text-emerald-300 tabular-nums">
                {lockedCount} AD Locked
              </span>
            </div>

            <p className="mt-2 text-xs text-[#98a9f9]">
              Standard user lockouts verified &amp; resolved without human touch.
            </p>
          </button>

          {/* Card 2: Electric Cobalt (#3555e4) */}
          <button
            type="button"
            onClick={() => onFilterSelect?.("ALL")}
            className="tonal-card-2 group flex flex-col justify-between rounded-xl p-4 text-left transition-all hover:shadow-cobalt"
          >
            <div className="flex w-full items-center justify-between text-[11px] font-mono text-[#dadfff]">
              <span>02 / DETERMINISTIC GATE LATENCY</span>
              <span className="rounded bg-white/15 px-1.5 py-0.5 text-[10px] text-white tabular-nums">
                P99 &lt; 85ms
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-white tabular-nums">
                {avgLatency}
                <span className="ml-0.5 text-lg font-normal text-[#dadfff]">ms</span>
              </div>
              <span className="font-mono text-[11px] text-[#dadfff] tabular-nums">
                40s SLA target
              </span>
            </div>

            <p className="mt-2 text-xs text-[#dadfff]">
              Mean Pydantic V2 schema parse + Python security rule check.
            </p>
          </button>

          {/* Card 3: Periwinkle Ice (#dadfff) */}
          <button
            type="button"
            onClick={() => onFilterSelect?.("HITL")}
            className="tonal-card-3 group flex flex-col justify-between rounded-xl p-4 text-left transition-all hover:border-[#98a9f9]"
          >
            <div className="flex w-full items-center justify-between text-[11px] font-mono text-[#2842bb]">
              <span>03 / REDIS HITL ESCALATION</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                  hitlPending > 0
                    ? "bg-amber-500/20 text-amber-900 ring-1 ring-amber-600/30"
                    : "bg-[#060b21]/10 text-[#060b21]"
                }`}
              >
                {hitlPending > 0 ? "ACTION REQUIRED" : "QUEUE CLEAR"}
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[#060b21] tabular-nums">
                {hitlPending}
                <span className="ml-1.5 text-sm font-normal text-[#3b4262]">
                  staged in Redis
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#2842bb]">
                Keys [A] / [R]
              </span>
            </div>

            <p className="mt-2 text-xs text-[#263259]">
              Privileged Domain Admin mutations paused for human sign-off.
            </p>
          </button>

          {/* Card 4: Cool Alabaster (#f2f5fc) */}
          <button
            type="button"
            onClick={() => onFilterSelect?.("BLOCKED")}
            className="tonal-card-4 group flex flex-col justify-between rounded-xl p-4 text-left transition-all hover:border-[#98a9f9]"
          >
            <div className="flex w-full items-center justify-between text-[11px] font-mono text-[#6e7799]">
              <span>04 / ADVERSARIAL INTERCEPTS</span>
              <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700 ring-1 ring-rose-500/20 tabular-nums">
                100% BLOCKED
              </span>
            </div>

            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-3xl font-semibold tracking-[-0.04em] text-[#060b21] tabular-nums">
                {blockedInjections}
                <span className="ml-1.5 text-sm font-normal text-[#6e7799]">
                  threats neutralized
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 tabular-nums">
                0 LDAP leaks
              </span>
            </div>

            <p className="mt-2 text-xs text-[#3b4262]">
              Prompt injections, SQLi, &amp; Kerberos Golden Tickets hard-aborted.
            </p>
          </button>
        </div>
      </div>
    </section>
  );
}
