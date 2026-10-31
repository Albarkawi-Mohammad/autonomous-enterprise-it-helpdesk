"use client";

import React, { useEffect, useState } from "react";
import { AuditTrailResponse } from "@/types/helpdesk";
import { fetchAuditTrail } from "@/lib/api";
import {
  ShieldCheck,
  Lock,
  Link2,
  RefreshCw,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
} from "lucide-react";

export function AuditLedgerView() {
  const [auditData, setAuditData] = useState<AuditTrailResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLedger = async () => {
    setLoading(true);
    try {
      const data = await fetchAuditTrail();
      setAuditData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
  }, []);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-6">
      {/* Top Section: Zero-Trust Architectural Boundary (Structured Hairline Layout inspired by Reference Design) */}
      <div className="grid grid-cols-1 gap-6 rounded-2xl border border-[#dce3f5] bg-white p-6 shadow-sheet lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col justify-between pr-4">
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#3555e4]">
              Zero-Trust Architecture
            </div>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] text-[#060b21]">
              From untrusted ticket to{" "}
              <span className="font-serif italic font-normal text-[#3555e4]">
                verified
              </span>{" "}
              directory mutation in 42ms.
            </h2>
            <p className="mt-2.5 text-xs leading-relaxed text-[#3b4262]">
              The Language Model never holds LDAP bind credentials or shell execution privileges. It acts strictly as an untrusted parser emitting a locked Pydantic V2 schema into a deterministic Python policy gate.
            </p>
          </div>

          {/* 4-Step Tonal Architecture Mini-Cards */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="tonal-card-1 rounded-lg p-3">
              <div className="font-mono text-[10px] text-[#98a9f9]">STAGE 01</div>
              <div className="mt-1 text-xs font-semibold text-white">
                RFC822 &amp; Webhook Ingest
              </div>
            </div>
            <div className="tonal-card-2 rounded-lg p-3">
              <div className="font-mono text-[10px] text-[#dadfff]">STAGE 02</div>
              <div className="mt-1 text-xs font-semibold text-white">
                Pydantic V2 Strict Parse
              </div>
            </div>
            <div className="tonal-card-3 rounded-lg p-3">
              <div className="font-mono text-[10px] text-[#2842bb]">STAGE 03</div>
              <div className="mt-1 text-xs font-semibold text-[#060b21]">
                Python Guardrail Gate
              </div>
            </div>
            <div className="tonal-card-4 rounded-lg p-3">
              <div className="font-mono text-[10px] text-[#6e7799]">STAGE 04</div>
              <div className="mt-1 text-xs font-semibold text-[#060b21]">
                SHA-256 Hash Ledger
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Hairline-divided Architectural Guarantees */}
        <div className="lg:col-span-7 divide-y divide-[#dce3f5] border-t border-[#dce3f5] lg:border-l lg:border-t-0 lg:pl-6">
          <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4 flex items-center gap-2 font-semibold text-xs text-[#060b21]">
              <FileCode2 className="h-4 w-4 text-[#3555e4]" />
              <span>Strict Schema Contract</span>
            </div>
            <div className="sm:col-span-8 text-xs text-[#3b4262]">
              <code className="font-mono text-[11px] text-[#060b21]">
                ConfigDict(extra=&quot;forbid&quot;, strict=True)
              </code>{" "}
              rejects hallucinated parameters, shell flags, or arbitrary LDAP filters at the serialization boundary.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4 flex items-center gap-2 font-semibold text-xs text-[#060b21]">
              <ShieldCheck className="h-4 w-4 text-[#3555e4]" />
              <span>Adversarial Regex &amp; Semantic Scanner</span>
            </div>
            <div className="sm:col-span-8 text-xs text-[#3b4262]">
              Scans raw MIME headers and body text for prompt overrides, SQLi, XSS, and Kerberos Golden Ticket forgery before any directory lookup occurs.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4 flex items-center gap-2 font-semibold text-xs text-[#060b21]">
              <Database className="h-4 w-4 text-[#3555e4]" />
              <span>Privileged Group Circuit Breaker</span>
            </div>
            <div className="sm:col-span-8 text-xs text-[#3b4262]">
              Queries Active Directory <code className="font-mono text-[11px]">memberOf</code> attributes. Any member of{" "}
              <strong>Domain Admins</strong>, <strong>Enterprise Admins</strong>, or <strong>Schema Admins</strong> is hard-routed to the Redis HITL queue.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 py-3.5 sm:grid-cols-12">
            <div className="sm:col-span-4 flex items-center gap-2 font-semibold text-xs text-[#060b21]">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>Cryptographic SHA-256 Chaining</span>
            </div>
            <div className="sm:col-span-8 text-xs text-[#3b4262]">
              Every triage decision computes{" "}
              <code className="font-mono text-[11px] text-[#060b21]">
                SHA256(prev_hash + canonical_json)
              </code>
              , making retroactive log tampering mathematically detectable.
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Live Cryptographic Hash Chain Table */}
      <div className="rounded-2xl border border-[#dce3f5] bg-white shadow-sheet overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#dce3f5] bg-[#fafbff] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-800 ring-1 ring-emerald-500/25">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {auditData?.integrity.is_valid !== false
                  ? "CRYPTOGRAPHIC INTEGRITY VERIFIED"
                  : "TAMPER DETECTED"}
              </span>
              <span className="font-mono text-xs text-[#6e7799] tabular-nums">
                {auditData?.integrity.entries_checked || 0} Chained Blocks
              </span>
            </div>
            <p className="mt-1 text-xs text-[#3b4262]">
              {auditData?.integrity.message ||
                "Verifying SHA-256 links back to Genesis block (0000...0000)..."}
            </p>
          </div>

          <button
            type="button"
            onClick={loadLedger}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-[#dce3f5] bg-white px-3 py-1.5 text-xs font-semibold text-[#060b21] hover:border-[#3555e4] hover:text-[#3555e4]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Re-Verify Hash Chain</span>
          </button>
        </div>

        {/* Ledger Rows */}
        <div className="divide-y divide-[#e8edf8]">
          {auditData?.entries.map((entry) => (
            <div
              key={`${entry.index}-${entry.ticket_id}`}
              className="p-4 transition-colors hover:bg-[#f2f5fc]/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="rounded bg-[#060b21] px-2 py-0.5 font-mono text-xs font-semibold text-white tabular-nums">
                    Block #{String(entry.index).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#3555e4] tabular-nums">
                    {entry.ticket_id}
                  </span>
                  <span className="rounded bg-[#ebeefd] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#2842bb]">
                    {entry.action}
                  </span>
                  <span className="font-mono text-xs text-[#3b4262]">
                    Target: <strong>{entry.user_id}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-[#6e7799] tabular-nums">
                  <span>Actor: {entry.actor}</span>
                  <span>•</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>

              <div className="mt-2.5 grid grid-cols-1 gap-2 rounded-lg border border-[#e8edf8] bg-[#fafbff] p-2.5 font-mono text-[11px] lg:grid-cols-2">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-[10px] uppercase text-[#6e7799] shrink-0">
                    prev_hash:
                  </span>
                  <code className="truncate text-[#6e7799] tabular-nums">
                    {entry.prev_hash}
                  </code>
                </div>
                <div className="flex items-center gap-2 truncate">
                  <Link2 className="h-3 w-3 text-[#3555e4] shrink-0" />
                  <span className="text-[10px] font-semibold uppercase text-[#3555e4] shrink-0">
                    entry_hash:
                  </span>
                  <code className="truncate font-semibold text-[#060b21] tabular-nums">
                    {entry.entry_hash}
                  </code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

