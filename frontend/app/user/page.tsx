"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { INITIAL_TICKETS } from "@/lib/mockData";
import {
  createInteractiveTicket,
  sendInteractiveChatMessage,
} from "@/lib/api";
import { InteractiveTicketSession } from "@/types/helpdesk";
import {
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  Send,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  Laptop,
  Bot,
  User,
  Loader2,
  Terminal,
  X,
} from "lucide-react";

export default function EmployeeSelfServicePortal() {
  const [userId, setUserId] = useState("demo.user06");
  const [senderEmail, setSenderEmail] = useState("demo.user06@corp.example.test");
  const [category, setCategory] = useState("VPN_CONNECTIVITY");
  const [affectedDevice, setAffectedDevice] = useState("LT-SALES-042");
  const [subject, setSubject] = useState(
    "GlobalProtect VPN Error 809 when connecting from home fiber"
  );
  const [description, setDescription] = useState(
    "Whenever I try to connect to corp.example.test VPN from my home office, it hangs at 'Connecting' and drops with Error 809: The network connection between your computer and the VPN server could not be established."
  );
  const [selectedPresetLevel, setSelectedPresetLevel] = useState<number>(3);

  const [session, setSession] = useState<InteractiveTicketSession | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedImageName, setAttachedImageName] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleLoadBenchmarkPreset = (level: number) => {
    setSelectedPresetLevel(level);
    const found =
      INITIAL_TICKETS.find((t) => (t.difficulty_level || 1) === level) ||
      INITIAL_TICKETS[0];
    setUserId(found.user_id);
    setSenderEmail(found.sender_email);
    setSubject(found.subject || found.raw_subject || "");
    setDescription(found.raw_body);
    setAffectedDevice(found.pydantic_intent.affected_device || "WS-CORP-104");

    if (found.extracted_category === "ACCOUNT_LOCKOUT") {
      setCategory("ACCOUNT_LOCKOUT");
    } else if (found.extracted_category === "HARDWARE_FAILURE") {
      setCategory("HARDWARE_FAILURE");
    } else if (found.extracted_category === "SOFTWARE_INSTALL") {
      setCategory("SOFTWARE_INSTALL");
    } else {
      setCategory("VPN_CONNECTIVITY");
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      const res = await createInteractiveTicket({
        user_id: userId,
        sender_email: senderEmail,
        subject,
        description,
        affected_device: affectedDevice,
        category,
      });
      setSession(res.session);
    } finally {
      setIsStarting(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    if (!session) return;
    const content = (textOverride ?? chatInput).trim();
    if (!content && !attachedImage) return;

    setIsSending(true);
    try {
      const res = await sendInteractiveChatMessage(
        session.ticket_id,
        content || "Attached diagnostic screenshot for inspection.",
        attachedImage
      );
      setSession(res.session);
      setChatInput("");
      setAttachedImage(null);
      setAttachedImageName(null);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAttachedImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const latestAssistantMsg = session?.messages
    .slice()
    .reverse()
    .find((m) => m.role === "assistant");

  return (
    <div className="flex min-h-screen flex-col bg-[#fafbff] text-[#060b21]">
      {/* Atmospheric Cobalt Horizon Header */}
      <header className="cobalt-horizon-banner relative overflow-hidden border-b border-[#1d3299] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/3 h-64 w-[36rem] rounded-full bg-[#3555e4]/35 blur-3xl"
        />

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#3555e4] ring-1 ring-white/25">
              <ShieldCheck className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-tight text-white">
                Example Organization Employee IT Self-Service
              </span>
              <p className="text-[11px] text-[#98a9f9]">
                Interactive Tier-1 AI Diagnostic &amp; Autonomous Remediation Portal
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-all hover:bg-white hover:text-[#060b21]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to IT Admin Command Center</span>
          </Link>
        </div>

        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col justify-between gap-4 px-6 py-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-1.5 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#98a9f9]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Interactive Tier-1 AI Specialist Online
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white sm:text-3xl">
              Resolve IT incidents{" "}
              <span className="font-serif italic font-normal text-[#dadfff]">
                before
              </span>{" "}
              they slow you down.
            </h1>
          </div>

          <p className="max-w-md text-xs leading-relaxed text-[#dadfff]">
            Walk through interactive step-by-step diagnostics, unlock standard Active Directory accounts immediately, or trigger an automatic Tier-2 escalation with an express replacement laptop.
          </p>
        </div>
      </header>

      {/* 4-Step Monochromatic Tonal Strip */}
      <section className="border-b border-[#dce3f5] bg-[#fafbff] px-6 py-4">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="tonal-card-1 rounded-xl p-4">
            <div className="font-mono text-[10px] text-[#98a9f9]">
              01 / FIRST DIAGNOSTIC RESPONSE
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white tabular-nums">
              &lt; 1.2s
            </div>
            <p className="mt-1 text-xs text-[#98a9f9]">
              Zero hold music; guided troubleshooting starts immediately.
            </p>
          </div>

          <div className="tonal-card-2 rounded-xl p-4">
            <div className="font-mono text-[10px] text-[#dadfff]">
              02 / ACTIVE DIRECTORY UNLOCK
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white tabular-nums">
              42ms
            </div>
            <p className="mt-1 text-xs text-[#dadfff]">
              Autonomous LDAP <code className="font-mono">lockoutTime=0</code> reset for standard users.
            </p>
          </div>

          <div className="tonal-card-3 rounded-xl p-4">
            <div className="font-mono text-[10px] text-[#2842bb]">
              03 / MULTIMODAL VISION SUPPORT
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#060b21] tabular-nums">
              Screenshots
            </div>
            <p className="mt-1 text-xs text-[#263259]">
              Attach BSOD, VPN error codes, or damaged hardware photos.
            </p>
          </div>

          <div className="tonal-card-4 rounded-xl p-4">
            <div className="font-mono text-[10px] text-[#6e7799]">
              04 / EXPRESS HARDWARE RMA
            </div>
            <div className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[#060b21] tabular-nums">
              Tier-2 Depot
            </div>
            <p className="mt-1 text-xs text-[#3b4262]">
              Unresolved physical faults auto-order a replacement laptop.
            </p>
          </div>
        </div>
      </section>

      {/* Main Two-Column Workspace */}
      <main className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-12">
        {/* Left 5 Columns: Ticket Intake & 20-Scenario Loader */}
        <div className="lg:col-span-5 space-y-5">
          {/* 20-Scenario Quick Fill Card */}
          <div className="rounded-2xl border border-[#dce3f5] bg-white p-5 shadow-sheet">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#3555e4]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#060b21]">
                  Load Graded Scenario Template (L01–L20)
                </h2>
              </div>
              <span className="rounded bg-[#ebeefd] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#2842bb] tabular-nums">
                20 Presets
              </span>
            </div>

            <p className="mt-1 text-xs text-[#6e7799]">
              Pre-populate the intake form with any of the 20 enterprise IT incidents to test the interactive Tier-1 AI specialist.
            </p>

            <div className="mt-3">
              <select
                value={selectedPresetLevel}
                onChange={(e) => handleLoadBenchmarkPreset(Number(e.target.value))}
                className="w-full rounded-lg border border-[#dce3f5] bg-[#f2f5fc] px-3 py-2 text-xs font-medium text-[#060b21] focus:border-[#3555e4] focus:outline-none tabular-nums"
              >
                {INITIAL_TICKETS.map((t) => {
                  const lvl = t.difficulty_level || 1;
                  return (
                    <option key={t.ticket_id} value={lvl}>
                      Level {String(lvl).padStart(2, "0")} [{t.difficulty_tier}] —{" "}
                      {t.subject}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Ticket Intake Form */}
          <form
            onSubmit={handleStartSession}
            className="rounded-2xl border border-[#dce3f5] bg-white p-5 shadow-sheet space-y-4"
          >
            <div className="border-b border-[#e8edf8] pb-3">
              <h2 className="text-base font-semibold tracking-[-0.02em] text-[#060b21]">
                Submit Incident for Interactive Tier-1 Triage
              </h2>
              <p className="text-xs text-[#6e7799]">
                Our AI Support Specialist will walk you through targeted remediation before escalating.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                  AD Username (sAMAccountName)
                </label>
                <input
                  type="text"
                  required
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 font-mono text-xs text-[#060b21] focus:border-[#3555e4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                  Corporate Email
                </label>
                <input
                  type="email"
                  required
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 font-mono text-xs text-[#060b21] focus:border-[#3555e4] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                  Diagnostic Playbook Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 text-xs font-medium text-[#060b21] focus:border-[#3555e4] focus:outline-none"
                >
                  <option value="ACCOUNT_LOCKOUT">
                    Active Directory Account Lockout
                  </option>
                  <option value="VPN_CONNECTIVITY">
                    VPN &amp; Zero-Trust Network Tunnel
                  </option>
                  <option value="HARDWARE_FAILURE">
                    Laptop / Display / Dock Hardware Fault
                  </option>
                  <option value="SOFTWARE_INSTALL">
                    Software Provisioning &amp; Intune Sync
                  </option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                  Workstation / Asset Tag
                </label>
                <input
                  type="text"
                  value={affectedDevice}
                  onChange={(e) => setAffectedDevice(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 font-mono text-xs text-[#060b21] focus:border-[#3555e4] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                Incident Summary
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 text-xs font-medium text-[#060b21] focus:border-[#3555e4] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-semibold uppercase text-[#3b4262]">
                Detailed Symptoms &amp; Error Codes
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#dce3f5] bg-[#fafbff] p-3 text-xs leading-relaxed text-[#060b21] focus:border-[#3555e4] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isStarting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#3555e4] px-4 py-2.5 text-xs font-semibold text-white shadow-cobalt transition-all hover:bg-[#2842bb] disabled:opacity-50"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Bot className="h-4 w-4" />
              )}
              <span>Launch Interactive Tier-1 AI Diagnostic Session</span>
            </button>
          </form>
        </div>

        {/* Right 7 Columns: Interactive Tier-1 AI Chat & Escalation Console */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl border border-[#dce3f5] bg-white shadow-sheet overflow-hidden min-h-[620px]">
          {!session ? (
            <div className="flex flex-1 flex-col items-center justify-center p-10 text-center bg-[#fafbff]">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebeefd] text-[#3555e4] shadow-sm mb-4">
                <Bot className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#060b21]">
                Tier-1 AI Diagnostic Specialist Ready
              </h3>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#6e7799]">
                Submit the incident form on the left (or choose one of the 20 graded scenarios) to begin an interactive troubleshooting session with live Active Directory unlock and hardware RMA capabilities.
              </p>

              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadBenchmarkPreset(1)}
                  className="rounded-lg border border-[#dce3f5] bg-white px-3 py-1.5 text-xs font-medium text-[#060b21] hover:border-[#3555e4]"
                >
                  Try L01: Standard AD Lockout
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBenchmarkPreset(3)}
                  className="rounded-lg border border-[#dce3f5] bg-white px-3 py-1.5 text-xs font-medium text-[#060b21] hover:border-[#3555e4]"
                >
                  Try L03: VPN Error 809
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadBenchmarkPreset(7)}
                  className="rounded-lg border border-[#dce3f5] bg-white px-3 py-1.5 text-xs font-medium text-[#060b21] hover:border-[#3555e4]"
                >
                  Try L07: Laptop BSOD &amp; Replacement
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Session Header with Step Progress Bar */}
              <div className="border-b border-[#dce3f5] bg-[#060b21] px-6 py-4 text-white">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#3555e4] px-2 py-0.5 font-mono text-xs font-semibold text-white tabular-nums">
                      {session.ticket_id}
                    </span>
                    <span className="font-mono text-xs text-[#98a9f9]">
                      {session.category}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="font-mono text-xs text-[#dadfff] tabular-nums">
                      Step {session.current_step} of {session.total_steps}
                    </span>
                  </div>

                  {/* Session Status Pill */}
                  {session.status === "DIAGNOSING" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#3555e4]/30 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-[#dadfff] ring-1 ring-[#98a9f9]/40">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#98a9f9] animate-pulse" />
                      DIAGNOSING AT TIER-1
                    </span>
                  )}
                  {session.status === "RESOLVED_BY_AI" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-400/40">
                      <CheckCircle2 className="h-3 w-3" />
                      RESOLVED BY TIER-1 AI
                    </span>
                  )}
                  {session.status === "ESCALATED_TO_ADMIN" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-300 ring-1 ring-amber-400/40">
                      <AlertTriangle className="h-3 w-3" />
                      ESCALATED TO TIER-2 ADMIN
                    </span>
                  )}
                  {session.status === "HARDWARE_REPLACEMENT_ORDERED" && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#3555e4] px-2.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                      <Laptop className="h-3 w-3" />
                      REPLACEMENT LAPTOP ORDERED
                    </span>
                  )}
                </div>

                <h3 className="mt-1.5 text-sm font-semibold text-white">
                  {session.subject}
                </h3>

                {/* Step Progress Bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-[#3555e4] transition-all duration-300"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          (session.current_step / Math.max(1, session.total_steps)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Conversation Transcript */}
              <div className="flex-1 space-y-4 overflow-y-auto bg-[#fafbff] p-6">
                {session.messages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div
                      key={idx}
                      className={`flex gap-3 ${
                        isUser ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#060b21] text-white shadow-sm">
                          <Bot className="h-4 w-4 text-[#98a9f9]" />
                        </div>
                      )}

                      <div
                        className={`max-w-[82%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                          isUser
                            ? "bg-[#3555e4] text-white"
                            : "border border-[#dce3f5] bg-white text-[#060b21]"
                        }`}
                      >
                        <div className="mb-1 flex items-center justify-between gap-4 font-mono text-[10px] opacity-75">
                          <span>
                            {isUser
                              ? `${session.user_id} (Employee)`
                              : "Example Organization Tier-1 AI Specialist"}
                          </span>
                          {msg.step_number && (
                            <span className="tabular-nums">
                              Step {msg.step_number}/{session.total_steps}
                            </span>
                          )}
                        </div>

                        <div className="whitespace-pre-wrap">{msg.content}</div>

                        {msg.image_base64 && (
                          <div className="mt-2.5 overflow-hidden rounded-lg border border-white/20">
                            <img
                              src={msg.image_base64}
                              alt="Uploaded diagnostic attachment"
                              className="max-h-44 w-auto object-contain"
                            />
                          </div>
                        )}

                        {msg.action_taken && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-md bg-[#f2f5fc] px-2.5 py-1 font-mono text-[10px] font-semibold text-[#2842bb] ring-1 ring-[#dce3f5]">
                            <Terminal className="h-3 w-3" />
                            <span>Action Executed: {msg.action_taken}</span>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ebeefd] text-[#2842bb]">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Escalation / Hardware Replacement Summary Banner */}
                {session.escalation_summary && (
                  <div className="rounded-xl border-2 border-[#3555e4] bg-[#ebeefd]/60 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#3555e4] text-white">
                        {session.hardware_replacement_requested ? (
                          <Laptop className="h-5 w-5" />
                        ) : (
                          <AlertTriangle className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#2842bb]">
                          {session.hardware_replacement_requested
                            ? "Tier-2 Hardware Depot Requisition & Escalation"
                            : "Structured Tier-2 Administrator Handoff"}
                        </div>
                        <h4 className="mt-0.5 text-sm font-semibold text-[#060b21]">
                          {session.hardware_replacement_requested
                            ? `Express Replacement Laptop Ordered for Asset ${session.affected_device}`
                            : "Diagnostic Transcript & Telemetry Forwarded to Tier-2 Queue"}
                        </h4>
                        <p className="mt-1 text-xs text-[#3b4262] leading-relaxed">
                          {session.escalation_summary}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick-Reply Diagnostic Pills */}
              {session.status === "DIAGNOSING" &&
                latestAssistantMsg?.quick_replies &&
                latestAssistantMsg.quick_replies.length > 0 && (
                  <div className="border-t border-[#e8edf8] bg-[#f2f5fc] px-6 py-3">
                    <div className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#6e7799]">
                      Suggested Diagnostic Responses:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {latestAssistantMsg.quick_replies.map((reply, i) => (
                        <button
                          key={i}
                          type="button"
                          disabled={isSending}
                          onClick={() => handleSendMessage(reply)}
                          className="rounded-lg border border-[#dce3f5] bg-white px-3 py-1.5 text-xs font-medium text-[#060b21] shadow-sm transition-all hover:border-[#3555e4] hover:bg-[#ebeefd] hover:text-[#2842bb] disabled:opacity-50"
                        >
                          {reply}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              {/* Chat Input & Screenshot Attachment Bar */}
              <div className="border-t border-[#dce3f5] bg-white p-4">
                {attachedImageName && (
                  <div className="mb-2 flex items-center justify-between rounded-lg bg-[#ebeefd] px-3 py-1.5 text-xs text-[#2842bb]">
                    <span className="font-mono text-[11px] truncate">
                      Attached Screenshot: {attachedImageName}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedImage(null);
                        setAttachedImageName(null);
                      }}
                      className="text-[#2842bb] hover:text-[#060b21]"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach Screenshot or Photo of Hardware/Error"
                    className="flex items-center gap-1.5 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3 py-2 text-xs font-medium text-[#3b4262] hover:border-[#3555e4] hover:text-[#3555e4]"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Screenshot</span>
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Reply to the Tier-1 AI Specialist or describe what happened..."
                    className="flex-1 rounded-lg border border-[#dce3f5] bg-[#fafbff] px-3.5 py-2 text-xs text-[#060b21] placeholder-[#98a1c0] focus:border-[#3555e4] focus:outline-none"
                  />

                  <button
                    type="button"
                    disabled={isSending || (!chatInput.trim() && !attachedImage)}
                    onClick={() => handleSendMessage()}
                    className="flex items-center gap-1.5 rounded-lg bg-[#3555e4] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#2842bb] disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Send className="h-3.5 w-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

