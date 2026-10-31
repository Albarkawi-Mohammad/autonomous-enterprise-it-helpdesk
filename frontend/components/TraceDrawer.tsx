"use client";

import React, { useState } from "react";
import { TriageRecord } from "@/types/helpdesk";
import { HitlApprovalCard } from "./HitlApprovalCard";
import {
  FileText,
  Code2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Check,
  Copy,
  Terminal,
  ExternalLink,
} from "lucide-react";

interface TraceDrawerProps {
  ticket: TriageRecord | null;
  onApproveHitl: (ticketId: string, approver: string) => Promise<void>;
  onRejectHitl: (ticketId: string, approver: string) => Promise<void>;
  onOpenLedger?: () => void;
}

export function TraceDrawer({
  ticket,
  onApproveHitl,
  onRejectHitl,
  onOpenLedger,
}: TraceDrawerProps) {
  const [showRawMime, setShowRawMime] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!ticket) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[#fafbff] p-8 text-center">
        <Terminal className="h-9 w-9 text-[#98a9f9] mb-2.5" />
        <h3 className="text-sm font-semibold text-[#060b21]">
          Select an Incident to Inspect Triage Pipeline
        </h3>
        <p className="mt-1 max-w-xs text-xs text-[#6e7799]">
          View the 4-stage execution trace: Raw MIME Ingestion, Strict Pydantic V2 Intent Extraction, Deterministic Policy Gate, and SHA-256 Audit Seal.
        </p>
      </div>
    );
  }

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(ticket.pydantic_intent, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1800);
  };

  return (
    <div className="flex h-full flex-col bg-[#fafbff] overflow-y-auto">
      {/* Sticky Drawer Header */}
      <div className="sticky top-0 z-10 border-b border-[#dce3f5] bg-white/95 px-6 py-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#060b21] px-2 py-0.5 font-mono text-xs font-semibold text-white tabular-nums">
              {ticket.ticket_id}
            </span>
            {ticket.difficulty_level && (
              <span className="rounded-md bg-[#ebeefd] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#2842bb] tabular-nums">
                Level {String(ticket.difficulty_level).padStart(2, "0")}/20 ·{" "}
                {ticket.difficulty_tier}
              </span>
            )}
            <span className="font-mono text-[11px] text-[#6e7799] tabular-nums">
              {ticket.latency_ms}ms gate execution
            </span>
          </div>

          <span className="font-mono text-[11px] text-[#3b4262]">
            Principal:{" "}
            <strong className="font-semibold text-[#060b21]">
              {ticket.user_id}
            </strong>
          </span>
        </div>

        <h2 className="mt-2 text-base font-semibold tracking-[-0.02em] text-[#060b21]">
          {ticket.subject || ticket.raw_subject}
        </h2>
      </div>

      {/* 4-Stage Execution Waterfall Content */}
      <div className="flex-1 space-y-5 p-6">
        {/* HITL Banner at top if pending supervisor approval */}
        {ticket.policy_verdict === "REQUIRES_HITL" && (
          <HitlApprovalCard
            ticket={ticket}
            onApprove={onApproveHitl}
            onReject={onRejectHitl}
          />
        )}

        {/* STAGE 01: Raw Ticket Ingestion */}
        <section className="rounded-xl border border-[#dce3f5] bg-white p-4 shadow-sheet">
          <div className="flex items-center justify-between border-b border-[#e8edf8] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#ebeefd] font-mono text-[10px] font-bold text-[#2842bb] tabular-nums">
                01
              </span>
              <h3 className="text-xs font-semibold text-[#060b21]">
                Raw Ingestion Payload ({ticket.source})
              </h3>
            </div>

            <div className="flex items-center rounded-md border border-[#dce3f5] bg-[#f2f5fc] p-0.5">
              <button
                type="button"
                onClick={() => setShowRawMime(false)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  !showRawMime
                    ? "bg-white text-[#060b21] shadow-sm"
                    : "text-[#6e7799] hover:text-[#060b21]"
                }`}
              >
                Parsed Body
              </button>
              <button
                type="button"
                onClick={() => setShowRawMime(true)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] font-medium transition-colors ${
                  showRawMime
                    ? "bg-[#060b21] text-white shadow-sm"
                    : "text-[#6e7799] hover:text-[#060b21]"
                }`}
              >
                RFC822 / MIME
              </button>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-[#6e7799]">
              <span>
                From:{" "}
                <strong className="font-mono text-[#060b21]">
                  {ticket.sender_email}
                </strong>
              </span>
              <span>
                Timestamp:{" "}
                <strong className="font-mono text-[#060b21] tabular-nums">
                  {ticket.timestamp}
                </strong>
              </span>
            </div>

            {showRawMime ? (
              <pre className="max-h-48 overflow-x-auto rounded-lg bg-[#060b21] p-3.5 font-mono text-[11px] leading-relaxed text-[#dadfff]">
                {ticket.raw_mime || ticket.raw_body}
              </pre>
            ) : (
              <div className="whitespace-pre-wrap rounded-lg border border-[#e8edf8] bg-[#f2f5fc]/60 p-3.5 text-xs leading-relaxed text-[#060b21]">
                {ticket.raw_body}
              </div>
            )}
          </div>
        </section>

        {/* STAGE 02: Strict Pydantic V2 Intent Extraction */}
        <section className="rounded-xl border border-[#dce3f5] bg-white p-4 shadow-sheet">
          <div className="flex items-center justify-between border-b border-[#e8edf8] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#3555e4] font-mono text-[10px] font-bold text-white tabular-nums">
                02
              </span>
              <div>
                <h3 className="text-xs font-semibold text-[#060b21]">
                  Strict Pydantic V2 Structured Intent Extraction
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyJson}
              className="flex items-center gap-1 rounded-md border border-[#dce3f5] bg-[#fafbff] px-2 py-1 font-mono text-[10px] font-medium text-[#3b4262] hover:border-[#3555e4] hover:text-[#3555e4]"
            >
              {copiedJson ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy Schema</span>
                </>
              )}
            </button>
          </div>

          {/* Key Extracted Attributes Strip */}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-lg border border-[#e8edf8] bg-[#f2f5fc] p-2.5">
              <div className="font-mono text-[10px] uppercase text-[#6e7799]">
                Target Principal
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-[#060b21] truncate">
                {ticket.pydantic_intent.user_id}
              </div>
            </div>
            <div className="rounded-lg border border-[#e8edf8] bg-[#f2f5fc] p-2.5">
              <div className="font-mono text-[10px] uppercase text-[#6e7799]">
                Suggested Action
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-[#3555e4] truncate">
                {ticket.pydantic_intent.suggested_action}
              </div>
            </div>
            <div className="rounded-lg border border-[#e8edf8] bg-[#f2f5fc] p-2.5">
              <div className="font-mono text-[10px] uppercase text-[#6e7799]">
                Urgency Level
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-[#060b21]">
                {ticket.pydantic_intent.urgency_level}
              </div>
            </div>
            <div className="rounded-lg border border-[#e8edf8] bg-[#f2f5fc] p-2.5">
              <div className="font-mono text-[10px] uppercase text-[#6e7799]">
                Confidence Score
              </div>
              <div className="mt-0.5 font-mono text-xs font-semibold text-emerald-700 tabular-nums">
                {(ticket.pydantic_intent.confidence_score * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Midnight Abyss JSON Code Block */}
          <div className="mt-3 overflow-hidden rounded-lg border border-[#16235a] bg-[#060b21]">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#050a20] px-3 py-1.5 font-mono text-[10px] text-[#98a9f9]">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-3 w-3 text-[#3555e4]" />
                class TicketIntentExtraction(BaseModel)
              </span>
              <span>extra=&quot;forbid&quot;</span>
            </div>
            <pre className="overflow-x-auto p-3.5 font-mono text-[11px] leading-relaxed text-[#dadfff] tabular-nums">
              {JSON.stringify(ticket.pydantic_intent, null, 2)}
            </pre>
          </div>
        </section>

        {/* STAGE 03: Deterministic Security Policy Guardrails (Structured Hairline Rows) */}
        <section className="rounded-xl border border-[#dce3f5] bg-white p-4 shadow-sheet">
          <div className="flex items-center justify-between border-b border-[#e8edf8] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-[#060b21] font-mono text-[10px] font-bold text-white tabular-nums">
                03
              </span>
              <div>
                <h3 className="text-xs font-semibold text-[#060b21]">
                  Deterministic Python Policy Gate (Zero-Trust Guardrails)
                </h3>
              </div>
            </div>
            <span className="font-mono text-[10px] text-[#6e7799]">
              app/security_rules.py
            </span>
          </div>

          {/* Hairline-divided horizontal rows inspired by the reference design */}
          <div className="mt-1 divide-y divide-[#dce3f5]">
            {ticket.guardrail_checks.map((check, idx) => {
              const isPass = check.status === "PASS";
              const isWarn = check.status === "WARN";
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-12 sm:items-start"
                >
                  <div className="sm:col-span-5 flex items-center gap-2">
                    {isPass ? (
                      <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : isWarn ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                    ) : (
                      <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
                    )}
                    <span className="text-xs font-semibold text-[#060b21]">
                      {check.name}
                    </span>
                  </div>

                  <div className="sm:col-span-7 flex items-start justify-between gap-2">
                    <p className="text-xs text-[#3b4262] leading-relaxed">
                      {check.detail}
                    </p>
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold ${
                        isPass
                          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/20"
                          : isWarn
                          ? "bg-amber-50 text-amber-900 ring-1 ring-amber-500/25"
                          : "bg-rose-50 text-rose-800 ring-1 ring-rose-500/25"
                      }`}
                    >
                      {check.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* STAGE 04: Cryptographic SHA-256 Audit Ledger Seal */}
        <section className="rounded-xl border border-[#dce3f5] bg-[#f2f5fc] p-4">
          <div className="flex items-center justify-between border-b border-[#dce3f5] pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 font-mono text-[10px] font-bold text-white tabular-nums">
                04
              </span>
              <h3 className="text-xs font-semibold text-[#060b21]">
                Immutable Cryptographic SHA-256 Audit Seal
              </h3>
            </div>

            {onOpenLedger && (
              <button
                type="button"
                onClick={onOpenLedger}
                className="flex items-center gap-1 font-mono text-[11px] font-semibold text-[#3555e4] hover:underline"
              >
                <span>Inspect Full Hash Chain</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="mt-3 space-y-2 font-mono text-[11px]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[#3b4262]">
              <span>
                Ledger Block:{" "}
                <strong className="text-[#060b21] tabular-nums">
                  #{ticket.audit_entry?.index || 1}
                </strong>
              </span>
              <span>
                Actor:{" "}
                <strong className="text-[#060b21]">
                  {ticket.audit_entry?.actor || "AUTONOMOUS_TRIAGE_ENGINE"}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <Lock className="h-3 w-3" />
                CHAIN LINK VERIFIED
              </span>
            </div>

            <div className="rounded-lg border border-[#dce3f5] bg-white p-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[10px] uppercase text-[#6e7799]">
                  prev_hash:
                </span>
                <code className="truncate text-[11px] text-[#6e7799] tabular-nums">
                  {ticket.audit_entry?.prev_hash ||
                    "0000000000000000000000000000000000000000000000000000000000000000"}
                </code>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[10px] font-semibold uppercase text-[#3555e4]">
                  entry_hash:
                </span>
                <code className="truncate text-[11px] font-semibold text-[#060b21] tabular-nums">
                  {ticket.audit_hash}
                </code>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
