"use client";

import React, { useState, useMemo } from "react";
import { TriageRecord, PolicyVerdict } from "@/types/helpdesk";
import {
  Search,
  Mail,
  Webhook,
  CheckCircle2,
  ShieldAlert,
  Clock,
  ArrowUpRight,
  XCircle,
  Shield,
} from "lucide-react";

interface TicketQueueProps {
  tickets: TriageRecord[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: TriageRecord) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  externalFilter?: string | null;
}

type FilterTab = "ALL" | "AUTO" | "HITL" | "BLOCKED" | "ESCALATED";
type TierFilter = "ALL" | "Easy" | "Medium" | "Hard" | "Extreme";

export function TicketQueue({
  tickets,
  selectedTicketId,
  onSelectTicket,
  searchInputRef,
  externalFilter,
}: TicketQueueProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [activeTier, setActiveTier] = useState<TierFilter>("ALL");

  React.useEffect(() => {
    if (
      externalFilter === "ALL" ||
      externalFilter === "AUTO" ||
      externalFilter === "HITL" ||
      externalFilter === "BLOCKED" ||
      externalFilter === "ESCALATED"
    ) {
      setActiveTab(externalFilter);
    }
  }, [externalFilter]);

  const counts = useMemo(() => {
    return {
      ALL: tickets.length,
      AUTO: tickets.filter(
        (t) => t.policy_verdict === "AUTO_APPROVED" || t.policy_verdict === "HITL_APPROVED"
      ).length,
      HITL: tickets.filter((t) => t.policy_verdict === "REQUIRES_HITL").length,
      BLOCKED: tickets.filter(
        (t) => t.policy_verdict === "BLOCKED_INJECTION" || t.policy_verdict === "HITL_REJECTED"
      ).length,
      ESCALATED: tickets.filter((t) => t.policy_verdict === "ESCALATED_TIER2").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (
        activeTab === "AUTO" &&
        t.policy_verdict !== "AUTO_APPROVED" &&
        t.policy_verdict !== "HITL_APPROVED"
      ) {
        return false;
      }
      if (activeTab === "HITL" && t.policy_verdict !== "REQUIRES_HITL") {
        return false;
      }
      if (
        activeTab === "BLOCKED" &&
        t.policy_verdict !== "BLOCKED_INJECTION" &&
        t.policy_verdict !== "HITL_REJECTED"
      ) {
        return false;
      }
      if (activeTab === "ESCALATED" && t.policy_verdict !== "ESCALATED_TIER2") {
        return false;
      }
      if (activeTier !== "ALL" && t.difficulty_tier !== activeTier) {
        return false;
      }
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        t.ticket_id.toLowerCase().includes(q) ||
        (t.subject || "").toLowerCase().includes(q) ||
        t.user_id.toLowerCase().includes(q) ||
        t.extracted_category.toLowerCase().includes(q) ||
        t.sender_email.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, activeTab, activeTier]);

  const renderVerdictBadge = (verdict: PolicyVerdict) => {
    switch (verdict) {
      case "AUTO_APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/25">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            AUTO-EXECUTED
          </span>
        );
      case "HITL_APPROVED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/25">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            HITL-APPROVED
          </span>
        );
      case "REQUIRES_HITL":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-900 ring-1 ring-inset ring-amber-500/35">
            <Clock className="h-3 w-3 text-amber-600 animate-pulse" />
            HITL-PENDING
          </span>
        );
      case "BLOCKED_INJECTION":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/25">
            <ShieldAlert className="h-3 w-3 text-rose-600" />
            BLOCKED-SOC
          </span>
        );
      case "HITL_REJECTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-rose-800 ring-1 ring-inset ring-rose-600/25">
            <XCircle className="h-3 w-3 text-rose-600" />
            HITL-REJECTED
          </span>
        );
      case "ESCALATED_TIER2":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-[#ebeefd] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#2842bb] ring-1 ring-inset ring-[#3555e4]/25">
            <ArrowUpRight className="h-3 w-3 text-[#3555e4]" />
            TIER-2 ESCALATED
          </span>
        );
    }
  };

  const renderDifficultyBadge = (level?: number, tier?: string) => {
    if (!level || !tier) return null;
    const styles: Record<string, string> = {
      Easy: "bg-emerald-50 text-emerald-700 ring-emerald-500/20",
      Medium: "bg-[#ebeefd] text-[#2842bb] ring-[#3555e4]/20",
      Hard: "bg-amber-50 text-amber-800 ring-amber-500/25",
      Extreme: "bg-[#060b21] text-white ring-[#060b21]",
    };
    const cls = styles[tier] || "bg-[#f2f5fc] text-[#3b4262] ring-[#dce3f5]";
    return (
      <span
        title={`Difficulty Level ${level}/20 (${tier})`}
        className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ring-1 ring-inset tabular-nums ${cls}`}
      >
        L{String(level).padStart(2, "0")} · {tier}
      </span>
    );
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      return "14:22:09";
    }
  };

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Filter & Search Header */}
      <div className="border-b border-[#dce3f5] bg-[#fafbff] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Verdict Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: "ALL", label: "All Incidents" },
                { id: "AUTO", label: "Auto-Executed" },
                { id: "HITL", label: "HITL Queue" },
                { id: "BLOCKED", label: "Blocked / SOC" },
                { id: "ESCALATED", label: "Tier-2" },
              ] as { id: FilterTab; label: string }[]
            ).map((tab) => {
              const active = activeTab === tab.id;
              const count = counts[tab.id];
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-[#060b21] text-white shadow-sm"
                      : "text-[#3b4262] hover:bg-[#ebeefd]/60 hover:text-[#060b21]"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`rounded px-1.5 py-0.2 font-mono text-[10px] tabular-nums ${
                      active
                        ? "bg-[#3555e4] text-white"
                        : "bg-[#e8edf8] text-[#3b4262]"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6e7799]" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, user, category... (⌘K)"
              className="w-full rounded-lg border border-[#dce3f5] bg-white py-1.5 pl-8 pr-3 text-xs text-[#060b21] placeholder-[#98a1c0] focus:border-[#3555e4] focus:outline-none focus:ring-2 focus:ring-[#3555e4]/15"
            />
          </div>
        </div>

        {/* Secondary Bar: Graded Difficulty Benchmark Filter (L01-L20) */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-[#e8edf8] pt-2">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6e7799]">
              Complexity Tier:
            </span>
            {(["ALL", "Easy", "Medium", "Hard", "Extreme"] as TierFilter[]).map(
              (tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setActiveTier(tier)}
                  className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                    activeTier === tier
                      ? "bg-[#3555e4] text-white"
                      : "bg-white text-[#3b4262] ring-1 ring-[#dce3f5] hover:bg-[#f2f5fc]"
                  }`}
                >
                  {tier === "ALL" ? "All 20 Levels" : tier}
                </button>
              )
            )}
          </div>

          <span className="font-mono text-[11px] text-[#6e7799] tabular-nums">
            Showing {filteredTickets.length} of {tickets.length} triaged records
          </span>
        </div>
      </div>

      {/* Table Column Header */}
      <div className="grid grid-cols-12 items-center border-b border-[#dce3f5] bg-[#f2f5fc] px-5 py-2 text-[11px] font-semibold text-[#3b4262]">
        <div className="col-span-3">Incident &amp; Tier</div>
        <div className="col-span-4">Subject &amp; Target Principal</div>
        <div className="col-span-2">Pydantic Intent</div>
        <div className="col-span-2">Policy Verdict</div>
        <div className="col-span-1 text-right">Gate SLA</div>
      </div>

      {/* Scrollable Ticket Rows */}
      <div className="flex-1 divide-y divide-[#e8edf8] overflow-y-auto">
        {filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Shield className="h-8 w-8 text-[#98a9f9] mb-2" />
            <p className="text-sm font-medium text-[#060b21]">
              No matching triage records
            </p>
            <p className="mt-1 text-xs text-[#6e7799]">
              Try clearing your filter or inject a live scenario above.
            </p>
          </div>
        ) : (
          filteredTickets.map((ticket) => {
            const isSelected = ticket.ticket_id === selectedTicketId;
            return (
              <div
                key={ticket.ticket_id}
                onClick={() => onSelectTicket(ticket)}
                className={`group grid cursor-pointer grid-cols-12 items-center px-5 py-3 transition-colors ${
                  isSelected
                    ? "bg-[#ebeefd]/75 border-l-[3px] border-l-[#3555e4]"
                    : "hover:bg-[#f2f5fc]/80 border-l-[3px] border-l-transparent"
                }`}
              >
                {/* Col 1: Ticket ID, Source, Difficulty Badge */}
                <div className="col-span-3 flex flex-col gap-1 pr-2">
                  <div className="flex items-center gap-1.5">
                    {ticket.source === "Email" ? (
                      <Mail className="h-3.5 w-3.5 text-[#3555e4] shrink-0" />
                    ) : (
                      <Webhook className="h-3.5 w-3.5 text-[#2842bb] shrink-0" />
                    )}
                    <span className="font-mono text-xs font-semibold text-[#060b21] tabular-nums">
                      {ticket.ticket_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {renderDifficultyBadge(
                      ticket.difficulty_level,
                      ticket.difficulty_tier
                    )}
                    <span className="font-mono text-[10px] text-[#6e7799] tabular-nums">
                      {formatTime(ticket.timestamp)}
                    </span>
                  </div>
                </div>

                {/* Col 2: Subject & Target Principal */}
                <div className="col-span-4 pr-3">
                  <div className="line-clamp-1 text-xs font-semibold text-[#060b21] group-hover:text-[#3555e4]">
                    {ticket.subject || ticket.raw_subject}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#6e7799]">
                    <span className="font-mono font-medium text-[#3b4262]">
                      {ticket.user_id}
                    </span>
                    <span>•</span>
                    <span className="truncate">{ticket.sender_email}</span>
                  </div>
                </div>

                {/* Col 3: Extracted Category & Confidence */}
                <div className="col-span-2 pr-2">
                  <div className="font-mono text-[10px] font-semibold text-[#2842bb] truncate">
                    {ticket.extracted_category}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#dce3f5]">
                      <div
                        className="h-full rounded-full bg-[#3555e4]"
                        style={{
                          width: `${Math.round(ticket.ai_confidence * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-[10px] font-medium text-[#3b4262] tabular-nums">
                      {Math.round(ticket.ai_confidence * 100)}%
                    </span>
                  </div>
                </div>

                {/* Col 4: Deterministic Policy Verdict */}
                <div className="col-span-2">
                  {renderVerdictBadge(ticket.policy_verdict)}
                </div>

                {/* Col 5: Latency */}
                <div className="col-span-1 text-right font-mono text-xs font-medium text-[#3b4262] tabular-nums">
                  {ticket.latency_ms}ms
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
