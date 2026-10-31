import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Example Organization Autonomous IT Helpdesk & Deterministic Triage Engine",
  description:
    "Zero-Trust AI Service Desk with Strict Pydantic V2 Intent Extraction, Deterministic Policy Guardrails, Active Directory LDAP Remediation, Redis HITL Approval, and Cryptographic SHA-256 Audit Ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#fafbff] font-sans text-[#060b21] selection:bg-[#3555e4] selection:text-white">
        {children}
      </body>
    </html>
  );
}
