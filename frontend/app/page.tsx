"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  CustomTicketPayload,
  HealthStatus,
  LdapUser,
  ScenarioKey,
  TriageRecord,
} from "@/types/helpdesk";
import {
  approveHitlTicket,
  fetchHealth,
  fetchLdapUsers,
  fetchTickets,
  injectBenchmarkScenario,
  injectScenario,
  rejectHitlTicket,
  resetDemoState,
  submitCustomTicket,
  toggleLdapUserLock,
} from "@/lib/api";
import { Header, AdminWorkspaceTab } from "@/components/Header";
import { TelemetryStrip } from "@/components/TelemetryStrip";
import { ScenarioInjector } from "@/components/ScenarioInjector";
import { TicketQueue } from "@/components/TicketQueue";
import { TraceDrawer } from "@/components/TraceDrawer";
import { LdapInspector } from "@/components/LdapInspector";
import { CustomTicketModal } from "@/components/CustomTicketModal";
import { AuditLedgerView } from "@/components/AuditLedgerView";
import { CheckCircle2, ShieldAlert, Clock, Info } from "lucide-react";

interface ToastMessage {
  id: string;
  title: string;
  detail: string;
  tone: "emerald" | "amber" | "rose" | "cobalt";
}

export default function HelpdeskCommandCenter() {
  const [tickets, setTickets] = useState<TriageRecord[]>([]);
  const [ldapUsers, setLdapUsers] = useState<LdapUser[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<ScenarioKey | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeTab, setActiveTab] = useState<AdminWorkspaceTab>("triage");
  const [externalFilter, setExternalFilter] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const pushToast = useCallback(
    (title: string, detail: string, tone: ToastMessage["tone"]) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((prev) => [{ id, title, detail, tone }, ...prev.slice(0, 2)]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  // Initial Data Load
  useEffect(() => {
    let mounted = true;
    async function init() {
      const [initialTickets, initialUsers, healthData] = await Promise.all([
        fetchTickets(),
        fetchLdapUsers(),
        fetchHealth(),
      ]);
      if (!mounted) return;
      setTickets(initialTickets);
      setLdapUsers(initialUsers);
      setHealth(healthData);
      if (initialTickets.length > 0) {
        setSelectedTicketId(initialTickets[0].ticket_id);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedTicket =
    tickets.find((t) => t.ticket_id === selectedTicketId) || tickets[0] || null;

  const handleInjectScenario = useCallback(
    async (scenario: ScenarioKey) => {
      setLoadingScenario(scenario);
      try {
        const newTicket = await injectScenario(scenario);
        const [updatedTickets, updatedUsers] = await Promise.all([
          fetchTickets(),
          fetchLdapUsers(),
        ]);
        setTickets(updatedTickets);
        setLdapUsers(updatedUsers);
        setSelectedTicketId(newTicket.ticket_id);
        setActiveTab("triage");

        if (newTicket.policy_verdict === "AUTO_APPROVED") {
          pushToast(
            `${newTicket.ticket_id} • Autonomous LDAP Remediation`,
            `Unlocked '${newTicket.user_id}' in ${newTicket.latency_ms}ms and sealed SHA-256 block.`,
            "emerald"
          );
        } else if (newTicket.policy_verdict === "BLOCKED_INJECTION") {
          pushToast(
            `${newTicket.ticket_id} • Zero-Trust Circuit Breaker`,
            `Blocked adversarial prompt injection targeting '${newTicket.user_id}'.`,
            "rose"
          );
        } else if (newTicket.policy_verdict === "REQUIRES_HITL") {
          pushToast(
            `${newTicket.ticket_id} • Staged in Redis HITL Queue`,
            `Privileged principal '${newTicket.user_id}' requires supervisor sign-off.`,
            "amber"
          );
        } else {
          pushToast(
            `${newTicket.ticket_id} • Escalated to Tier-2 Depot`,
            `Physical hardware diagnostics routed to field engineering.`,
            "cobalt"
          );
        }
      } finally {
        setLoadingScenario(null);
      }
    },
    [pushToast]
  );

  const handleInjectBenchmark = useCallback(
    async (level: number) => {
      const newTicket = await injectBenchmarkScenario(level);
      const [updatedTickets, updatedUsers] = await Promise.all([
        fetchTickets(),
        fetchLdapUsers(),
      ]);
      setTickets(updatedTickets);
      setLdapUsers(updatedUsers);
      setSelectedTicketId(newTicket.ticket_id);
      setActiveTab("triage");
      pushToast(
        `Benchmark L${String(level).padStart(2, "0")} [${newTicket.difficulty_tier}] Ingested`,
        `${newTicket.ticket_id}: Verdict ${newTicket.policy_verdict} (${newTicket.latency_ms}ms)`,
        newTicket.policy_verdict === "BLOCKED_INJECTION"
          ? "rose"
          : newTicket.policy_verdict === "REQUIRES_HITL"
          ? "amber"
          : "emerald"
      );
    },
    [pushToast]
  );

  const handleCustomSubmit = useCallback(
    async (payload: CustomTicketPayload) => {
      const newTicket = await submitCustomTicket(payload);
      const [updatedTickets, updatedUsers] = await Promise.all([
        fetchTickets(),
        fetchLdapUsers(),
      ]);
      setTickets(updatedTickets);
      setLdapUsers(updatedUsers);
      setSelectedTicketId(newTicket.ticket_id);
      setActiveTab("triage");
      pushToast(
        `${newTicket.ticket_id} • Custom Payload Triaged`,
        `Verdict: ${newTicket.policy_verdict} (${newTicket.latency_ms}ms)`,
        newTicket.policy_verdict === "AUTO_APPROVED"
          ? "emerald"
          : newTicket.policy_verdict === "BLOCKED_INJECTION"
          ? "rose"
          : "amber"
      );
    },
    [pushToast]
  );

  const handleApproveHitl = useCallback(
    async (ticketId: string, approver: string) => {
      const updated = await approveHitlTicket(ticketId, approver);
      const [updatedTickets, updatedUsers] = await Promise.all([
        fetchTickets(),
        fetchLdapUsers(),
      ]);
      setTickets(updatedTickets);
      setLdapUsers(updatedUsers);
      if (updated) {
        pushToast(
          `${ticketId} • HITL Supervisor Approved`,
          `Executed LDAP unlock for '${updated.user_id}' signed by ${approver}.`,
          "emerald"
        );
      }
    },
    [pushToast]
  );

  const handleRejectHitl = useCallback(
    async (ticketId: string, approver: string) => {
      const updated = await rejectHitlTicket(ticketId, approver);
      const [updatedTickets, updatedUsers] = await Promise.all([
        fetchTickets(),
        fetchLdapUsers(),
      ]);
      setTickets(updatedTickets);
      setLdapUsers(updatedUsers);
      if (updated) {
        pushToast(
          `${ticketId} • HITL Action Denied`,
          `Purged staged Redis token for '${updated.user_id}'. LDAP untouched.`,
          "rose"
        );
      }
    },
    [pushToast]
  );

  const handleToggleLdapLock = useCallback(
    async (username: string, lock: boolean) => {
      const updatedUsers = await toggleLdapUserLock(username, lock);
      setLdapUsers(updatedUsers);
      pushToast(
        `LDAP Object Modified: ${username}`,
        lock
          ? `Simulated account lockout (lockoutTime -> 133500000000000000).`
          : `Cleared lockoutTime -> 0 on DC01.corp.example.test.`,
        lock ? "amber" : "emerald"
      );
    },
    [pushToast]
  );

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      const { tickets: resetTickets, users: resetUsers } = await resetDemoState();
      setTickets(resetTickets);
      setLdapUsers(resetUsers);
      if (resetTickets.length > 0) {
        setSelectedTicketId(resetTickets[0].ticket_id);
      }
      pushToast(
        "System State Restored",
        "All 20 graded benchmark tickets & Active Directory objects reset.",
        "cobalt"
      );
    } finally {
      setIsResetting(false);
    }
  }, [pushToast]);

  // Keyboard Shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setActiveTab("triage");
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "Escape" && isCustomModalOpen) {
        setIsCustomModalOpen(false);
        return;
      }

      if (isInput || isCustomModalOpen) return;

      if (e.key === "1") {
        e.preventDefault();
        handleInjectScenario("alex_lockout");
      } else if (e.key === "2") {
        e.preventDefault();
        handleInjectScenario("prompt_injection");
      } else if (e.key === "3") {
        e.preventDefault();
        handleInjectScenario("admin_hitl");
      } else if (e.key === "4") {
        e.preventDefault();
        handleInjectScenario("hardware_escalation");
      } else if (e.key.toLowerCase() === "n") {
        e.preventDefault();
        setIsCustomModalOpen(true);
      } else if (e.shiftKey && e.key.toLowerCase() === "r") {
        e.preventDefault();
        handleReset();
      } else if (
        e.key.toLowerCase() === "a" &&
        selectedTicket?.policy_verdict === "REQUIRES_HITL"
      ) {
        e.preventDefault();
        handleApproveHitl(selectedTicket.ticket_id, "secops.lead@corp.example.test");
      } else if (
        e.key.toLowerCase() === "r" &&
        !e.shiftKey &&
        selectedTicket?.policy_verdict === "REQUIRES_HITL"
      ) {
        e.preventDefault();
        handleRejectHitl(selectedTicket.ticket_id, "secops.lead@corp.example.test");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isCustomModalOpen,
    selectedTicket,
    handleInjectScenario,
    handleReset,
    handleApproveHitl,
    handleRejectHitl,
  ]);

  const hitlCount = tickets.filter((t) => t.policy_verdict === "REQUIRES_HITL").length;
  const lockedUsersCount = ldapUsers.filter((u) => u.is_locked).length;

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbff] text-[#060b21]">
      {/* Top Atmospheric Cobalt Horizon Header */}
      <Header
        health={health}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        hitlCount={hitlCount}
        lockedUsersCount={lockedUsersCount}
        auditBlockCount={tickets.length}
      />

      {/* 4-Step Monochromatic Tonal KPI Strip */}
      <TelemetryStrip
        tickets={tickets}
        ldapUsers={ldapUsers}
        onFilterSelect={(filter) => {
          setActiveTab("triage");
          setExternalFilter(filter);
        }}
      />

      {/* Live Scenario Simulation & 20-Level Benchmark Deck */}
      <ScenarioInjector
        onInject={handleInjectScenario}
        onInjectBenchmark={handleInjectBenchmark}
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        onReset={handleReset}
        loadingScenario={loadingScenario}
        isResetting={isResetting}
      />

      {/* Workspace Content Area */}
      {activeTab === "triage" && (
        <>
          <main className="mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 lg:grid-cols-12 lg:divide-x lg:divide-[#dce3f5] border-x border-[#dce3f5] bg-white shadow-sheet">
            {/* Left 7 Columns: Live Triage Queue */}
            <div className="lg:col-span-7 flex flex-col min-h-[540px] max-h-[760px]">
              <TicketQueue
                tickets={tickets}
                selectedTicketId={selectedTicket?.ticket_id || null}
                onSelectTicket={(t) => setSelectedTicketId(t.ticket_id)}
                searchInputRef={searchInputRef}
                externalFilter={externalFilter}
              />
            </div>

            {/* Right 5 Columns: 4-Stage Execution Waterfall & Guardrail Inspector */}
            <div className="lg:col-span-5 flex flex-col min-h-[540px] max-h-[760px] border-t border-[#dce3f5] lg:border-t-0">
              <TraceDrawer
                ticket={selectedTicket}
                onApproveHitl={handleApproveHitl}
                onRejectHitl={handleRejectHitl}
                onOpenLedger={() => setActiveTab("ledger")}
              />
            </div>
          </main>

          {/* Bottom Dock: Live Active Directory State Inspector */}
          <LdapInspector
            users={ldapUsers}
            highlightedUserId={selectedTicket?.user_id || null}
            onToggleLock={handleToggleLdapLock}
          />
        </>
      )}

      {activeTab === "directory" && (
        <main className="flex-1 bg-[#fafbff]">
          <LdapInspector
            users={ldapUsers}
            highlightedUserId={selectedTicket?.user_id || null}
            onToggleLock={handleToggleLdapLock}
            fullPage
          />
        </main>
      )}

      {activeTab === "ledger" && (
        <main className="flex-1 bg-[#fafbff]">
          <AuditLedgerView />
        </main>
      )}

      {/* Custom Ticket Payload Modal */}
      <CustomTicketModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSubmit={handleCustomSubmit}
      />

      {/* Toast Stack */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-[#dce3f5] bg-[#060b21] p-3.5 text-white shadow-elevated"
          >
            {toast.tone === "emerald" && (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toast.tone === "rose" && (
              <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toast.tone === "amber" && (
              <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            )}
            {toast.tone === "cobalt" && (
              <Info className="h-4 w-4 text-[#98a9f9] shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <div className="font-semibold text-white">{toast.title}</div>
              <div className="mt-0.5 text-[#dadfff] leading-relaxed">
                {toast.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
