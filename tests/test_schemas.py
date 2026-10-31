"""
Unit Tests for Pydantic V2 Schemas
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import pytest
from pydantic import ValidationError

from app.schemas import (
    AllowlistedAction,
    IssueCategory,
    ParsedTicketIntent,
    RiskLevel,
    TicketIngestRequest,
    TicketStatus,
    UrgencyLevel,
)


def test_ticket_ingest_request_valid():
    req = TicketIngestRequest(
        ticket_id="INC-1001",
        sender_email="user@corp.example.test",
        raw_subject="Help needed",
        raw_body="Cannot log in.",
    )
    assert req.ticket_id == "INC-1001"
    assert req.sender_email == "user@corp.example.test"


def test_ticket_ingest_request_invalid_email():
    with pytest.raises(ValidationError):
        TicketIngestRequest(
            ticket_id="INC-1001",
            sender_email="not-an-email",
            raw_subject="Help",
            raw_body="Cannot log in",
        )


def test_ticket_ingest_request_extra_fields_forbidden():
    with pytest.raises(ValidationError):
        TicketIngestRequest(
            ticket_id="INC-1001",
            sender_email="user@corp.example.test",
            raw_subject="Help",
            raw_body="Cannot log in",
            unauthorized_field="malicious_payload",
        )


def test_parsed_ticket_intent_valid():
    intent = ParsedTicketIntent(
        user_id="demo.user01",
        issue_category=IssueCategory.ACCOUNT_LOCKOUT,
        affected_device="WS-MUC-01",
        urgency_level=UrgencyLevel.HIGH,
        confidence_score=0.98,
        suggested_action=AllowlistedAction.UNLOCK_ACCOUNT,
        extracted_reasoning="User account is locked out.",
        is_injection_suspected=False,
    )
    assert intent.user_id == "demo.user01"
    assert intent.confidence_score == 0.98
    assert intent.suggested_action == AllowlistedAction.UNLOCK_ACCOUNT


def test_parsed_ticket_intent_confidence_out_of_bounds():
    with pytest.raises(ValidationError):
        ParsedTicketIntent(
            user_id="demo.user01",
            issue_category=IssueCategory.ACCOUNT_LOCKOUT,
            urgency_level=UrgencyLevel.HIGH,
            confidence_score=1.5,  # Exceeds 1.0 limit
            suggested_action=AllowlistedAction.UNLOCK_ACCOUNT,
            extracted_reasoning="Invalid confidence",
        )


def test_parsed_ticket_intent_sanitizes_user_id():
    intent = ParsedTicketIntent(
        user_id="CORP\\demo.user01",  # Domain prefix
        issue_category=IssueCategory.ACCOUNT_LOCKOUT,
        urgency_level=UrgencyLevel.HIGH,
        confidence_score=0.96,
        suggested_action=AllowlistedAction.UNLOCK_ACCOUNT,
        extracted_reasoning="Domain stripped",
    )
    assert intent.user_id == "demo.user01"


def test_parsed_ticket_intent_forbids_arbitrary_actions():
    with pytest.raises(ValidationError):
        ParsedTicketIntent(
            user_id="demo.user01",
            issue_category=IssueCategory.ACCOUNT_LOCKOUT,
            urgency_level=UrgencyLevel.HIGH,
            confidence_score=0.96,
            suggested_action="EXECUTE_BASH_SCRIPT",  # Not in allowlist
            extracted_reasoning="Arbitrary code execution attempt",
        )
