"""
In-Memory Triage Ticket Store & Scenario Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
from datetime import datetime, timezone
import threading
from typing import Any, Dict, List, Optional
import uuid

from app.ticket_fixtures import GRADED_20_TICKETS

class TriageTicketStore:
    """
    Thread-safe storage for ingested support tickets,
    execution traces, guardrail checks, and HITL lifecycle.
    """

    def __init__(self):
        self._lock = threading.Lock()
        self._tickets: Dict[str, Dict[str, Any]] = {}
        self.reset_to_default_fixtures()

    def reset_to_default_fixtures(self):
        """Pre-populate the store with the 20 graded enterprise scenarios (Easy to Extreme)."""
        with self._lock:
            self._tickets.clear()
            for fixture in GRADED_20_TICKETS:
                self._add_fixture(**dict(fixture))

    def _add_fixture(self, **kwargs):
        tid = kwargs["ticket_id"]
        # Generate raw MIME text
        mime_text = (
            f"Received: from mailrelay01.corp.example.test (192.0.2.3)\n"
            f"Message-ID: <{tid.lower()}.enterprise.it@example.test>\n"
            f"Date: {kwargs['timestamp']}\n"
            f"From: {kwargs['sender_email']}\n"
            f"To: it-servicedesk@corp.example.test\n"
            f"Subject: {kwargs['raw_subject']}\n"
            f"Content-Type: text/plain; charset=UTF-8\n"
            f"X-Mailer: Microsoft Outlook 16.0\n\n"
            f"{kwargs['raw_body']}"
        )
        kwargs["raw_mime"] = mime_text
        kwargs["subject"] = kwargs.get("raw_subject", "")
        self._tickets[tid] = kwargs

    def record_ingested_ticket(
        self,
        ticket_id: str,
        source: str,
        sender_email: str,
        raw_subject: str,
        raw_body: str,
        latency_ms: int,
        user_id: str,
        issue_category: str,
        ai_confidence: float,
        policy_verdict: str,
        pydantic_intent: Dict[str, Any],
        guardrail_checks: List[Dict[str, Any]],
        audit_hash: Optional[str] = None,
        audit_entry: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Record newly triaged ticket from live ingest API."""
        now_iso = datetime.now(timezone.utc).isoformat()
        mime_text = (
            f"Received: from api-gateway.corp.example.test (192.0.2.4)\n"
            f"Message-ID: <{ticket_id.lower()}@example.test>\n"
            f"Date: {now_iso}\n"
            f"From: {sender_email}\n"
            f"To: it-triage@corp.example.test\n"
            f"Subject: {raw_subject}\n"
            f"Content-Type: text/plain; charset=UTF-8\n\n"
            f"{raw_body}"
        )
        item = {
            "ticket_id": ticket_id,
            "timestamp": now_iso,
            "source": source or "Email",
            "sender_email": sender_email,
            "user_id": user_id,
            "subject": raw_subject,
            "raw_subject": raw_subject,
            "raw_body": raw_body,
            "raw_mime": mime_text,
            "extracted_category": issue_category,
            "ai_confidence": round(ai_confidence, 2),
            "latency_ms": latency_ms,
            "policy_verdict": policy_verdict,
            "pydantic_intent": pydantic_intent,
            "guardrail_checks": guardrail_checks,
            "audit_hash": audit_hash,
            "audit_entry": audit_entry,
            "hitl_action_taken": None,
        }
        with self._lock:
            self._tickets[ticket_id] = item
        return item

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            return self._tickets.get(ticket_id)

    def list_tickets(
        self,
        status_filter: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        with self._lock:
            items = list(self._tickets.values())

        # Sort reverse chronological
        items.sort(key=lambda x: x.get("timestamp", ""), reverse=True)

        if status_filter and status_filter != "ALL":
            items = [t for t in items if t.get("policy_verdict") == status_filter]

        if search_query:
            q = search_query.lower()
            items = [
                t for t in items
                if q in t.get("ticket_id", "").lower()
                or q in t.get("user_id", "").lower()
                or q in t.get("sender_email", "").lower()
                or q in t.get("raw_subject", "").lower()
                or q in t.get("raw_body", "").lower()
                or q in t.get("extracted_category", "").lower()
            ]

        return items

    def update_hitl_decision(self, ticket_id: str, action: str, audit_hash: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            ticket = self._tickets.get(ticket_id)
            if not ticket:
                return None
            if action == "APPROVE":
                ticket["policy_verdict"] = "AUTO_EXECUTED"
                ticket["hitl_action_taken"] = "APPROVED_BY_SUPERVISOR"
            else:
                ticket["policy_verdict"] = "TIER2_ESCALATED"
                ticket["hitl_action_taken"] = "REJECTED_BY_SUPERVISOR"
            ticket["audit_hash"] = audit_hash
            return ticket


triage_store = TriageTicketStore()
