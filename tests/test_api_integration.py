"""
End-to-End API Integration & Evaluation Harness
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import pytest
from app.ldap_engine import ldap_engine
from app.audit_logger import audit_logger
from app.schemas import AllowlistedAction, TicketStatus


# ---------------------------------------------------------------------------
# Test 1: Valid Ticket -> Auto-Remediates Account in Active Directory
# ---------------------------------------------------------------------------
def test_e2e_valid_german_ticket_triggers_unlock(client, valid_german_locked_ticket):
    # 1. Verify user is initially locked out in LDAP
    user_before = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user_before.is_locked is True

    # 2. Ingest ticket via REST API
    response = client.post("/api/v1/triage/ticket", json=valid_german_locked_ticket)
    assert response.status_code == 200
    data = response.json()

    # 3. Assert triage decision
    assert data["ticket_id"] == valid_german_locked_ticket["ticket_id"]
    assert data["status"] == TicketStatus.AUTO_REMEDIATED.value
    assert data["action_executed"] == AllowlistedAction.UNLOCK_ACCOUNT.value
    assert data["target_user"] == "demo.user01"
    assert data["confidence_score"] >= 0.95
    assert data["audit_hash"] is not None

    # 4. Programmatically verify state changed in Active Directory / LDAP
    user_after = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user_after.is_locked is False
    assert user_after.lockoutTime == "0"

    # 5. Programmatically verify audit entry written to immutable ledger
    entries = audit_logger.get_entries()
    assert len(entries) >= 1
    latest_audit = entries[-1]
    assert latest_audit.ticket_id == valid_german_locked_ticket["ticket_id"]
    assert latest_audit.action == AllowlistedAction.UNLOCK_ACCOUNT.value
    assert latest_audit.entry_hash == data["audit_hash"]


def test_e2e_valid_english_ticket_triggers_unlock(client, valid_english_locked_ticket):
    response = client.post("/api/v1/triage/ticket", json=valid_english_locked_ticket)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == TicketStatus.AUTO_REMEDIATED.value
    assert data["action_executed"] == AllowlistedAction.UNLOCK_ACCOUNT.value
    assert data["target_user"] == "demo.user01"

    user_after = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user_after.is_locked is False


# ---------------------------------------------------------------------------
# Test 2: Adversarial / Malicious Tickets Caught by Deterministic Security
# ---------------------------------------------------------------------------
def test_e2e_prompt_injection_blocked_by_security_layer(client, adversarial_injection_ticket):
    response = client.post("/api/v1/triage/ticket", json=adversarial_injection_ticket)
    assert response.status_code == 200
    data = response.json()

    # Must be intercepted and blocked from any AD modification
    assert data["status"] == TicketStatus.BLOCKED_SECURITY_VIOLATION.value
    assert data["action_executed"] == AllowlistedAction.BLOCK_AND_ALERT_SOC.value
    assert "PROMPT_INJECTION_DETECTED" in data["security_flags"]

    # Verify privileged user demo.user03 was NOT modified or unlocked
    admin_user = ldap_engine.get_user_by_samaccountname("demo.user03")
    assert admin_user.is_locked is True


def test_e2e_privileged_account_escalated_to_tier2(client, privileged_account_direct_ticket):
    """
    Direct ticket targeting Domain Admin account without prompt injection words.
    The deterministic LDAP security layer MUST block auto-unlock and route to Tier-2.
    """
    response = client.post("/api/v1/triage/ticket", json=privileged_account_direct_ticket)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == TicketStatus.ESCALATED_TIER2.value
    assert data["action_executed"] == AllowlistedAction.ESCALATE_TIER2.value
    assert "PRIVILEGED_ACCOUNT_SECURITY_BLOCK" in data["security_flags"]
    assert any("Domain Admins" in flag for flag in data["security_flags"])

    # Verify directory was untouched
    admin_user = ldap_engine.get_user_by_samaccountname("demo.user03")
    assert admin_user.is_locked is True


# ---------------------------------------------------------------------------
# Test 3: Ambiguous or Incomplete Tickets Routed to Tier-2
# ---------------------------------------------------------------------------
def test_e2e_ambiguous_ticket_routed_to_tier2(client, ambiguous_incomplete_ticket):
    response = client.post("/api/v1/triage/ticket", json=ambiguous_incomplete_ticket)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == TicketStatus.ESCALATED_TIER2.value
    assert data["action_executed"] == AllowlistedAction.ESCALATE_TIER2.value
    assert data["confidence_score"] < 0.80
    assert "diagnostic_report" in data
    assert "extracted_intent" in data["diagnostic_report"]


# ---------------------------------------------------------------------------
# Test 4: Idempotency Enforcement (Redis Cache Replay)
# ---------------------------------------------------------------------------
def test_e2e_idempotency_duplicate_submission(client, valid_german_locked_ticket):
    # First submission
    resp1 = client.post("/api/v1/triage/ticket", json=valid_german_locked_ticket)
    assert resp1.status_code == 200
    data1 = resp1.json()

    # Second submission with same ticket_id
    resp2 = client.post("/api/v1/triage/ticket", json=valid_german_locked_ticket)
    assert resp2.status_code == 200
    assert resp2.headers.get("X-Idempotency-Status") == "REPLAYED"
    data2 = resp2.json()

    # Replayed response must match original exactly
    assert data1["ticket_id"] == data2["ticket_id"]
    assert data1["audit_hash"] == data2["audit_hash"]


# ---------------------------------------------------------------------------
# Test 5: Human-in-the-Loop (HITL) Supervisor Gate
# ---------------------------------------------------------------------------
def test_e2e_hitl_approval_workflow(client, folder_permission_ticket, supervisor_headers):
    ticket_id = folder_permission_ticket["ticket_id"]

    # 1. Ingest high-risk ticket -> paused in PENDING_SUPERVISOR_APPROVAL
    resp = client.post("/api/v1/triage/ticket", json=folder_permission_ticket)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == TicketStatus.PENDING_SUPERVISOR_APPROVAL.value
    assert data["requires_supervisor_approval"] is True

    # 2. Supervisor checks pending queue
    pending_resp = client.get("/api/v1/triage/pending", headers=supervisor_headers)
    assert pending_resp.status_code == 200
    pending_list = pending_resp.json()
    assert any(item.get("ticket", {}).get("ticket_id") == ticket_id for item in pending_list)

    # 3. Supervisor approves ticket
    approval_payload = {
        "supervisor_id": "demo.supervisor",
        "decision": "APPROVE",
        "justification": "Verified financial analyst role requires Q4 folder access.",
    }
    approve_resp = client.post(
        f"/api/v1/triage/approve/{ticket_id}",
        json=approval_payload,
        headers=supervisor_headers,
    )
    assert approve_resp.status_code == 200
    approved_data = approve_resp.json()
    assert approved_data["status"] == TicketStatus.AUTO_REMEDIATED.value
    assert approved_data["action_executed"] == AllowlistedAction.REQUEST_FOLDER_ACCESS.value

    # 4. Verify queue is now empty
    pending_after = client.get("/api/v1/triage/pending", headers=supervisor_headers)
    assert not any(item.get("ticket", {}).get("ticket_id") == ticket_id for item in pending_after.json())


def test_e2e_hitl_rejection_workflow(client, folder_permission_ticket, supervisor_headers):
    # Alter ticket ID
    folder_permission_ticket["ticket_id"] = "INC-2026-HITL-REJ"
    ticket_id = folder_permission_ticket["ticket_id"]

    client.post("/api/v1/triage/ticket", json=folder_permission_ticket)

    # Supervisor rejects ticket
    rejection_payload = {
        "supervisor_id": "demo.supervisor",
        "decision": "REJECT",
        "justification": "User lacks necessary confidentiality clearance for this share.",
    }
    reject_resp = client.post(
        f"/api/v1/triage/reject/{ticket_id}",
        json=rejection_payload,
        headers=supervisor_headers,
    )
    assert reject_resp.status_code == 200
    data = reject_resp.json()
    assert data["status"] == TicketStatus.REJECTED.value
    assert data["action_executed"] == AllowlistedAction.NO_ACTION.value


# ---------------------------------------------------------------------------
# Test 6: Immutable Audit Trail & Cryptographic Verification
# ---------------------------------------------------------------------------
def test_e2e_audit_trail_integrity(client, valid_german_locked_ticket):
    client.post("/api/v1/triage/ticket", json=valid_german_locked_ticket)

    resp = client.get("/api/v1/audit/trail")
    assert resp.status_code == 200
    data = resp.json()

    assert data["chain_integrity_verified"] is True
    assert data["total_records"] >= 1
    assert data["verification_error"] is None

    # Test tamper detection
    # Artificially tamper with one entry in ledger
    entries = audit_logger.get_entries()
    entries[0].action = "TAMPERED_UNAUTHORIZED_ACTION"
    is_valid, reason = audit_logger.verify_integrity()
    assert is_valid is False
    assert "Tampered entry detected" in reason or "Broken chain" in reason
