"use client";

import React, { useState } from "react";
import { TriageRecord } from "@/types/helpdesk";
import { ShieldAlert, Check, X, Loader2, KeyRound, Lock } from "lucide-react";

interface HitlApprovalCardProps {
  ticket: TriageRecord;
  onApprove: (ticketId: string, approver: string) => Promise<void>;
  onReject: (ticketId: string, approver: string) => Promise<void>;
}

export function HitlApprovalCard({
  ticket,
  onApprove,
  onReject,
}: HitlApprovalCardProps) {
  const [approver, setApprover] = useState("secops.lead@corp.example.test");
  const [submitting, setSubmitting] = useState<"approve" | "reject" | null>(null);

  if (ticket.policy_verdict !== "REQUIRES_HITL") {
    return null;
  }

  const handleApprove = async () => {
    setSubmitting("approve");
    try {
      await onApprove(ticket.ticket_id, approver);
    } finally {
      setSubmitting(null);
    }
  };

  const handleReject = async () => {
    setSubmitting("reject");
    try {
      await onReject(ticket.ticket_id, approver);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className="rounded-xl border-2 border-amber-400/80 bg-amber-50/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white shadow-sm">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Redis Human-in-the-Loop Gate
              </span>
              <span className="rounded bg-amber-200/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-amber-950 tabular-nums">
                hitl:pending:{ticket.ticket_id}
              </span>
            </div>
            <h4 className="mt-0.5 text-sm font-semibold text-[#060b21]">
              Privileged Directory Mutation Paused for Supervisor Sign-off
            </h4>
            <p className="mt-1 text-xs text-[#3b4262] leading-relaxed">
              Target principal{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#060b21] ring-1 ring-amber-300">
                {ticket.user_id}
              </code>{" "}
              belongs to a protected Active Directory security group (
              <strong className="text-amber-950">Domain Admins</strong>). The Python policy gate froze{" "}
              <code className="font-mono text-[11px] font-semibold text-[#2842bb]">
                {ticket.pydantic_intent.suggested_action}
              </code>{" "}
              in Redis.
            </p>
          </div>
        </div>
      </div>

      {/* Approver Input & Action Buttons */}
      <div className="mt-3.5 flex flex-col gap-2.5 border-t border-amber-300/70 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Lock className="h-3.5 w-3.5 text-amber-800 shrink-0" />
          <label
            htmlFor={`approver-${ticket.ticket_id}`}
            className="font-mono text-[10px] font-semibold uppercase text-amber-900 shrink-0"
          >
            Approver ID:
          </label>
          <input
            id={`approver-${ticket.ticket_id}`}
            type="text"
            value={approver}
            onChange={(e) => setApprover(e.target.value)}
            className="w-full rounded-md border border-amber-300 bg-white px-2.5 py-1 font-mono text-xs text-[#060b21] focus:border-[#3555e4] focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleApprove}
            disabled={submitting !== null}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting === "approve" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            <span>Approve &amp; Execute LDAP</span>
            <kbd className="ml-0.5 rounded bg-white/20 px-1 py-0.2 font-mono text-[10px]">
              A
            </kbd>
          </button>

          <button
            type="button"
            onClick={handleReject}
            disabled={submitting !== null}
            className="flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-50 disabled:opacity-50"
          >
            {submitting === "reject" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="h-3.5 w-3.5" />
            )}
            <span>Deny &amp; Purge</span>
            <kbd className="ml-0.5 rounded bg-rose-100 px-1 py-0.2 font-mono text-[10px] text-rose-800">
              R
            </kbd>
          </button>
        </div>
      </div>
    </div>
  );
}
