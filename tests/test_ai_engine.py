"""
Unit Tests for AI Parsing Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
from app.ai_engine import ai_engine
from app.schemas import (
    AllowlistedAction,
    IssueCategory,
    TicketIngestRequest,
    UrgencyLevel,
)


def test_ai_parse_german_locked_ticket(valid_german_locked_ticket):
    ticket = TicketIngestRequest(**valid_german_locked_ticket)
    intent = ai_engine.parse_ticket(ticket)

    assert intent.user_id == "demo.user01"
    assert intent.issue_category == IssueCategory.ACCOUNT_LOCKOUT
    assert intent.suggested_action == AllowlistedAction.UNLOCK_ACCOUNT
    assert intent.confidence_score >= 0.95
    assert intent.is_injection_suspected is False


def test_ai_parse_english_locked_ticket(valid_english_locked_ticket):
    ticket = TicketIngestRequest(**valid_english_locked_ticket)
    intent = ai_engine.parse_ticket(ticket)

    assert intent.user_id == "demo.user01"
    assert intent.issue_category == IssueCategory.ACCOUNT_LOCKOUT
    assert intent.suggested_action == AllowlistedAction.UNLOCK_ACCOUNT
    assert intent.confidence_score >= 0.95
    assert intent.affected_device in ("WS-FIN-088", "WS-FIN") or intent.affected_device is not None


def test_ai_parse_adversarial_prompt_injection(adversarial_injection_ticket):
    ticket = TicketIngestRequest(**adversarial_injection_ticket)
    intent = ai_engine.parse_ticket(ticket)

    # Prompt injection must be flagged and routed to SOC block
    assert intent.is_injection_suspected is True
    assert intent.issue_category == IssueCategory.PRIVILEGE_ESCALATION_ATTEMPT
    assert intent.suggested_action == AllowlistedAction.BLOCK_AND_ALERT_SOC
    assert intent.urgency_level == UrgencyLevel.CRITICAL


def test_ai_parse_folder_permission_ticket(folder_permission_ticket):
    ticket = TicketIngestRequest(**folder_permission_ticket)
    intent = ai_engine.parse_ticket(ticket)

    assert intent.user_id == "demo.user01"
    assert intent.issue_category == IssueCategory.FOLDER_PERMISSION
    assert intent.suggested_action == AllowlistedAction.REQUEST_FOLDER_ACCESS


def test_ai_parse_ambiguous_ticket(ambiguous_incomplete_ticket):
    ticket = TicketIngestRequest(**ambiguous_incomplete_ticket)
    intent = ai_engine.parse_ticket(ticket)

    # Incomplete/ambiguous tickets must have low confidence and escalate to Tier-2
    assert intent.confidence_score < 0.80
    assert intent.suggested_action == AllowlistedAction.ESCALATE_TIER2
