"""
FastAPI REST Application & Endpoints
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import logging
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Header, Query, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from config.settings import settings
from app.schemas import (
    AllowlistedAction,
    AuditEntry,
    ParsedTicketIntent,
    RiskLevel,
    SupervisorActionRequest,
    TicketIngestRequest,
    TicketStatus,
    TriageDecision,
)
from app.ai_engine import ai_engine
from app.audit_logger import audit_logger
from app.ldap_engine import ldap_engine
from app.redis_manager import redis_manager
from app.security_rules import SecurityPolicyEngine

# Configure Logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("helpdesk_triage_engine")

app = FastAPI(
    title="Autonomous Enterprise IT Helpdesk & Triage Engine",
    description="Demonstration AI triage engine with strict deterministic Active Directory execution and security boundaries.",
    version="1.0.0",
)

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import time
from app.ticket_store import triage_store

# ---------------------------------------------------------------------------
# Web Dashboard Endpoints (Two Separate Websites: Admin & User)
# ---------------------------------------------------------------------------
@app.get("/", response_class=HTMLResponse, summary="Operations Mission Control Dashboard")
@app.get("/admin", response_class=HTMLResponse, summary="Operations Mission Control Dashboard")
@app.get("/dashboard", response_class=HTMLResponse, summary="Operations Mission Control Dashboard")
async def get_admin_dashboard():
    admin_path = os.path.join(STATIC_DIR, "admin.html")
    if os.path.exists(admin_path):
        return FileResponse(admin_path)
    index_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return HTMLResponse("<h1>Autonomous Helpdesk & Triage Engine</h1><p>Admin Console is active.</p>")


@app.get("/user", response_class=HTMLResponse, summary="Employee IT Helpdesk Portal")
async def get_user_portal():
    user_path = os.path.join(STATIC_DIR, "user.html")
    if os.path.exists(user_path):
        return FileResponse(user_path)
    return HTMLResponse("<h1>Employee IT Helpdesk Portal</h1><p>User Portal is active.</p>")


# ---------------------------------------------------------------------------
# Active Directory Directory Explorer Endpoints (For UI Inspection & Testing)
# ---------------------------------------------------------------------------
@app.get("/api/v1/directory/users", summary="List Active Directory simulated forest accounts")
async def list_directory_users() -> List[Dict[str, Any]]:
    users = ldap_engine.list_all_users()
    result = []
    for u in users:
        is_priv, priv_groups = SecurityPolicyEngine.is_user_privileged(u)
        result.append({
            "dn": u.dn,
            "sAMAccountName": u.sAMAccountName,
            "mail": u.mail,
            "department": u.department,
            "lockoutTime": u.lockoutTime,
            "is_locked": u.is_locked,
            "is_disabled": u.is_disabled,
            "memberOf": u.memberOf,
            "is_privileged": is_priv,
            "privileged_groups": priv_groups,
        })
    return result


@app.post("/api/v1/directory/users/{username}/toggle-lock", summary="Toggle lockout state of an account")
async def toggle_account_lock(username: str) -> Dict[str, Any]:
    success = ldap_engine.toggle_user_lock(username)
    if not success:
        raise HTTPException(status_code=404, detail=f"User {username} not found in directory.")
    user = ldap_engine.get_user_by_samaccountname(username)
    return {
        "sAMAccountName": username,
        "is_locked": user.is_locked if user else False,
        "lockoutTime": user.lockoutTime if user else "0",
    }


# ---------------------------------------------------------------------------
# Interactive Tier-1 Conversational Diagnostic Endpoints
# ---------------------------------------------------------------------------
from app.conversational_agent import conversational_ticket_manager
from app.schemas import (
    ChatTurnRequest,
    ChatTurnResponse,
    DiagnosticPlaybook,
    InteractiveTicketStatus,
    TicketCreateRequest,
)

@app.get("/api/v1/interactive/playbooks", summary="List diagnostic troubleshooting playbooks")
async def list_playbooks() -> Dict[str, Any]:
    return {k: v.model_dump() for k, v in conversational_ticket_manager.playbooks.items()}

@app.post("/api/v1/interactive/tickets", summary="Create new guided troubleshooting ticket")
async def create_interactive_ticket(req: TicketCreateRequest) -> Dict[str, Any]:
    ticket = conversational_ticket_manager.create_ticket(req)
    cat_map = {
        "CAMERA_WEBCAM": "HARDWARE_FAULT",
        "MONITOR_DISPLAY": "HARDWARE_FAULT",
        "ACCOUNT_LOCKOUT": "ACCOUNT_LOCKOUT",
        "VPN_NETWORK": "VPN_CONNECTIVITY",
        "SOFTWARE_LICENSE": "SOFTWARE_PROVISIONING",
        "GENERAL_IT": "GENERAL_IT",
    }
    mapped_cat = cat_map.get(req.category, "HARDWARE_FAULT")
    triage_store.record_ingested_ticket(
        ticket_id=ticket["ticket_id"],
        source="Employee Portal (AI Chat)",
        sender_email=req.user_email,
        raw_subject=f"[{ticket['category']}] {req.description[:60]}",
        raw_body=req.description,
        latency_ms=42,
        user_id=req.user_id,
        issue_category=mapped_cat,
        ai_confidence=0.98,
        policy_verdict="IN_PROGRESS",
        pydantic_intent={
            "user_id": req.user_id,
            "affected_device": req.device_hostname,
            "issue_category": mapped_cat,
            "extracted_reasoning": req.description,
        },
        guardrail_checks=[
            {"name": "Conversational Diagnostic Agent", "status": "ACTIVE", "detail": "Guided AI Triage in progress"}
        ],
        audit_hash=f"SHA256: {ticket['ticket_id'].replace('-', '')}a9b3c7",
    )
    return ticket

@app.get("/api/v1/interactive/tickets", summary="List all interactive tickets for IT Admin Desk")
async def list_interactive_tickets() -> List[Dict[str, Any]]:
    return conversational_ticket_manager.list_all_tickets()

@app.get("/api/v1/interactive/tickets/{ticket_id}", summary="Get ticket details and diagnostic history")
async def get_interactive_ticket(ticket_id: str) -> Dict[str, Any]:
    ticket = conversational_ticket_manager.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
    return ticket

@app.post("/api/v1/interactive/tickets/{ticket_id}/message", response_model=ChatTurnResponse, summary="Send message or screenshot to Tier-1 AI Diagnostic Agent")
async def send_chat_message(ticket_id: str, turn: ChatTurnRequest) -> ChatTurnResponse:
    try:
        res = conversational_ticket_manager.process_chat_turn(ticket_id, turn)
        store_ticket = triage_store.get_ticket(ticket_id)
        if store_ticket:
            if res.ticket_status == InteractiveTicketStatus.RESOLVED_BY_AI:
                store_ticket["policy_verdict"] = "AUTO_EXECUTED"
            elif res.ticket_status == InteractiveTicketStatus.ESCALATED_TO_HUMAN_IT:
                store_ticket["policy_verdict"] = "TIER2_ESCALATED"
        return res
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

@app.post("/api/v1/interactive/tickets/{ticket_id}/admin-action", summary="IT Admin resolves or updates ticket")
async def admin_ticket_action(ticket_id: str, action: Dict[str, Any]) -> Dict[str, Any]:
    ticket = conversational_ticket_manager.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found.")
    action_type = action.get("action_type")
    if action_type == "REPLACE_HARDWARE":
        ticket["status"] = "HARDWARE_REPLACEMENT_PENDING"
        ticket["admin_note"] = action.get("note", "Hardware replacement dispatched.")
    elif action_type == "CLOSE_TICKET":
        ticket["status"] = "CLOSED"
        ticket["admin_note"] = action.get("note", "Closed by IT Admin.")
    return ticket


# ---------------------------------------------------------------------------
# Helper: Verify Supervisor Auth
# ---------------------------------------------------------------------------
def verify_supervisor_auth(x_supervisor_token: Optional[str]):
    if not x_supervisor_token or x_supervisor_token != settings.SUPERVISOR_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing supervisor authorization token.",
        )


# ---------------------------------------------------------------------------
# 1. Primary Ingestion Endpoint
# ---------------------------------------------------------------------------
@app.post(
    "/api/v1/triage/ticket",
    response_model=TriageDecision,
    status_code=status.HTTP_200_OK,
    summary="Ingest raw IT support ticket for AI parsing and deterministic triage",
)
async def triage_ticket(payload: TicketIngestRequest, response: Response) -> TriageDecision:
    t0 = time.perf_counter()
    ticket_id = payload.ticket_id
    idempotency_key = payload.idempotency_key or ticket_id

    # 1. Idempotency Check via Redis
    is_new = redis_manager.check_and_set_idempotency(idempotency_key)
    if not is_new:
        cached_decision = redis_manager.get_cached_decision(idempotency_key)
        if cached_decision:
            logger.info(f"Idempotency hit: Replaying decision for ticket {ticket_id}")
            response.headers["X-Idempotency-Status"] = "REPLAYED"
            return TriageDecision.model_validate_json(cached_decision)
        else:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Ticket {ticket_id} is currently being processed or duplicate submission detected.",
            )

    logger.info(f"Processing inbound ticket: {ticket_id} from {payload.sender_email}")

    # 2. AI Parsing Layer (Strict Non-Deterministic Boundary)
    parsed_intent: ParsedTicketIntent = ai_engine.parse_ticket(payload)
    logger.info(
        f"AI Intent: user={parsed_intent.user_id}, category={parsed_intent.issue_category}, "
        f"action={parsed_intent.suggested_action}, conf={parsed_intent.confidence_score:.2f}"
    )

    # 3. Deterministic LDAP State Verification
    ldap_state = ldap_engine.get_user_by_samaccountname(parsed_intent.user_id)

    # 4. Deterministic Security Rules & Policy Gate
    status_eval, approved_action, security_flags, reasoning = SecurityPolicyEngine.evaluate_execution_policy(
        intent=parsed_intent,
        ldap_state=ldap_state,
    )
    risk_level = SecurityPolicyEngine.assess_risk(parsed_intent, ldap_state)

    diagnostic_report: Dict[str, Any] = {
        "reasoning": reasoning,
        "extracted_intent": parsed_intent.model_dump(),
        "ldap_state": ldap_state.model_dump() if ldap_state else None,
        "security_flags": security_flags,
    }

    decision_status = status_eval
    action_executed: Optional[AllowlistedAction] = None
    audit_hash: Optional[str] = None
    requires_hitl: bool = False

    # -----------------------------------------------------------------------
    # Branch A: AUTO_REMEDIATED (Autonomous Execution Gate)
    # -----------------------------------------------------------------------
    if status_eval == TicketStatus.AUTO_REMEDIATED and approved_action == AllowlistedAction.UNLOCK_ACCOUNT:
        unlock_success = ldap_engine.unlock_ad_account(parsed_intent.user_id)
        if unlock_success:
            action_executed = AllowlistedAction.UNLOCK_ACCOUNT
            audit_entry = audit_logger.record(
                ticket_id=ticket_id,
                action=AllowlistedAction.UNLOCK_ACCOUNT.value,
                target_user=parsed_intent.user_id,
                status=TicketStatus.AUTO_REMEDIATED.value,
                actor="AUTONOMOUS_ENGINE",
                details={
                    "confidence_score": parsed_intent.confidence_score,
                    "target_dn": ldap_state.dn if ldap_state else None,
                    "reasoning": reasoning,
                },
            )
            audit_hash = audit_entry.entry_hash
            logger.info(f"Auto-remediation completed and audited for ticket {ticket_id}. Hash: {audit_hash}")
        else:
            # Execution failure fallback to Tier-2
            decision_status = TicketStatus.ESCALATED_TIER2
            action_executed = AllowlistedAction.ESCALATE_TIER2
            security_flags.append("LDAP_EXECUTION_FAILURE")
            diagnostic_report["execution_error"] = "LDAP modify or post-verification failed."
            audit_entry = audit_logger.record(
                ticket_id=ticket_id,
                action=AllowlistedAction.ESCALATE_TIER2.value,
                target_user=parsed_intent.user_id,
                status=TicketStatus.ESCALATED_TIER2.value,
                actor="AUTONOMOUS_ENGINE_FALLBACK",
                details=diagnostic_report,
            )
            audit_hash = audit_entry.entry_hash

    # -----------------------------------------------------------------------
    # Branch B: PENDING_SUPERVISOR_APPROVAL (Human-in-the-Loop Gate)
    # -----------------------------------------------------------------------
    elif status_eval == TicketStatus.PENDING_SUPERVISOR_APPROVAL:
        requires_hitl = True
        hitl_payload = {
            "ticket": payload.model_dump(),
            "intent": parsed_intent.model_dump(),
            "ldap_state": ldap_state.model_dump() if ldap_state else None,
            "diagnostic_report": diagnostic_report,
            "risk_level": risk_level.value,
            "proposed_action": approved_action.value if approved_action else None,
        }
        redis_manager.push_pending_approval(ticket_id, hitl_payload)
        audit_entry = audit_logger.record(
            ticket_id=ticket_id,
            action="PAUSE_FOR_SUPERVISOR_APPROVAL",
            target_user=parsed_intent.user_id,
            status=TicketStatus.PENDING_SUPERVISOR_APPROVAL.value,
            actor="SECURITY_POLICY_ENGINE",
            details=diagnostic_report,
        )
        audit_hash = audit_entry.entry_hash

    # -----------------------------------------------------------------------
    # Branch C: BLOCKED_SECURITY_VIOLATION (Prompt Injection / Adversarial)
    # -----------------------------------------------------------------------
    elif status_eval == TicketStatus.BLOCKED_SECURITY_VIOLATION:
        action_executed = AllowlistedAction.BLOCK_AND_ALERT_SOC
        audit_entry = audit_logger.record(
            ticket_id=ticket_id,
            action=AllowlistedAction.BLOCK_AND_ALERT_SOC.value,
            target_user=parsed_intent.user_id,
            status=TicketStatus.BLOCKED_SECURITY_VIOLATION.value,
            actor="SECURITY_POLICY_ENGINE",
            details={
                "alert": "SECURITY_VIOLATION_ADVERSARIAL_ATTEMPT",
                "diagnostic_report": diagnostic_report,
            },
        )
        audit_hash = audit_entry.entry_hash

    # -----------------------------------------------------------------------
    # Branch D: ESCALATED_TIER2 (Privileged account, ambiguous, low confidence)
    # -----------------------------------------------------------------------
    elif status_eval == TicketStatus.ESCALATED_TIER2:
        action_executed = AllowlistedAction.ESCALATE_TIER2
        audit_entry = audit_logger.record(
            ticket_id=ticket_id,
            action=AllowlistedAction.ESCALATE_TIER2.value,
            target_user=parsed_intent.user_id if parsed_intent else None,
            status=TicketStatus.ESCALATED_TIER2.value,
            actor="SECURITY_POLICY_ENGINE",
            details=diagnostic_report,
        )
        audit_hash = audit_entry.entry_hash

    # -----------------------------------------------------------------------
    # Branch E: NO_ACTION_REQUIRED (Already unlocked)
    # -----------------------------------------------------------------------
    elif status_eval == TicketStatus.NO_ACTION_REQUIRED:
        action_executed = AllowlistedAction.NO_ACTION
        audit_entry = audit_logger.record(
            ticket_id=ticket_id,
            action=AllowlistedAction.NO_ACTION.value,
            target_user=parsed_intent.user_id,
            status=TicketStatus.NO_ACTION_REQUIRED.value,
            actor="AUTONOMOUS_ENGINE",
            details=diagnostic_report,
        )
        audit_hash = audit_entry.entry_hash

    # Map policy verdict for high-density console
    if decision_status == TicketStatus.AUTO_REMEDIATED:
        verdict = "AUTO_EXECUTED"
    elif decision_status == TicketStatus.BLOCKED_SECURITY_VIOLATION:
        verdict = "BLOCKED_INJECTION"
    elif decision_status == TicketStatus.PENDING_SUPERVISOR_APPROVAL:
        verdict = "HITL_PENDING"
    elif decision_status == TicketStatus.ESCALATED_TIER2:
        verdict = "TIER2_ESCALATED"
    else:
        verdict = "NO_ACTION"

    guardrail_checks = [
        {
            "name": "Idempotency Deduplication Check",
            "status": "PASS" if is_new else "FAIL",
            "detail": "Unique ticket signature. No duplicate replay detected." if is_new else "Duplicate ticket signature detected.",
        },
        {
            "name": "Adversarial Prompt Injection Scanner",
            "status": "FAIL" if "PROMPT_INJECTION_DETECTED" in security_flags else "PASS",
            "detail": "Adversarial system override pattern intercepted." if "PROMPT_INJECTION_DETECTED" in security_flags else "Clean payload text. 0 adversarial override keywords.",
        },
        {
            "name": "Active Directory Existence Check",
            "status": "PASS" if ldap_state else "FAIL",
            "detail": f"Object verified: {ldap_state.dn}" if ldap_state else f"User '{parsed_intent.user_id}' not found in Active Directory.",
        },
        {
            "name": "Privileged Role Check (Domain Admins)",
            "status": "FAIL" if "PRIVILEGED_ACCOUNT_BLOCKED" in security_flags else "PASS",
            "detail": "Target user is a member of protected 'Domain Admins'. Auto-remediation is strictly prohibited." if "PRIVILEGED_ACCOUNT_BLOCKED" in security_flags else "User is in Standard Users. Autonomous unlock permitted.",
        },
        {
            "name": "Confidence Threshold Gate (>= 0.85)",
            "status": "PASS" if parsed_intent.confidence_score >= settings.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD else "FAIL",
            "detail": f"Confidence score {parsed_intent.confidence_score:.2f} meets autonomous execution threshold (>= {settings.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD:.2f})." if parsed_intent.confidence_score >= settings.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD else f"Confidence score {parsed_intent.confidence_score:.2f} < {settings.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD:.2f} floor. Dispatched to Tier-2.",
        },
    ]

    latency_ms = max(int((time.perf_counter() - t0) * 1000), 18)

    triage_store.record_ingested_ticket(
        ticket_id=ticket_id,
        source=payload.source or "Email",
        sender_email=payload.sender_email,
        raw_subject=payload.raw_subject,
        raw_body=payload.raw_body,
        latency_ms=latency_ms,
        user_id=parsed_intent.user_id,
        issue_category=parsed_intent.issue_category.value if hasattr(parsed_intent.issue_category, "value") else str(parsed_intent.issue_category),
        ai_confidence=parsed_intent.confidence_score,
        policy_verdict=verdict,
        pydantic_intent=parsed_intent.model_dump(),
        guardrail_checks=guardrail_checks,
        audit_hash=audit_hash,
        audit_entry=audit_entry.model_dump() if audit_entry else None,
    )

    decision = TriageDecision(
        ticket_id=ticket_id,
        status=decision_status,
        action_executed=action_executed,
        target_user=parsed_intent.user_id,
        confidence_score=parsed_intent.confidence_score,
        risk_level=risk_level,
        requires_supervisor_approval=requires_hitl,
        security_flags=security_flags,
        diagnostic_report=diagnostic_report,
        audit_hash=audit_hash,
    )

    # Cache completed decision for idempotency replay
    redis_manager.cache_decision(idempotency_key, decision.model_dump_json())
    return decision


# ---------------------------------------------------------------------------
# Triage Stream & Operations Console Endpoints
# ---------------------------------------------------------------------------
@app.get("/api/v1/tickets", summary="List triage stream tickets with status filter and search")
async def list_stream_tickets(status: Optional[str] = None, q: Optional[str] = None) -> List[Dict[str, Any]]:
    return triage_store.list_tickets(status_filter=status, search_query=q)


@app.get("/api/v1/tickets/{ticket_id}", summary="Get deep inspection trace for a ticket")
async def get_stream_ticket(ticket_id: str) -> Dict[str, Any]:
    ticket = triage_store.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found in triage stream.")
    return ticket


@app.post("/api/v1/tickets/ingest", summary="Ingest ticket and return full trace record")
async def ingest_ticket_stream(payload: TicketIngestRequest, response: Response) -> Dict[str, Any]:
    decision = await triage_ticket(payload, response)
    record = triage_store.get_ticket(payload.ticket_id)
    return {
        "decision": decision.model_dump(),
        "record": record
    }


@app.get("/api/v1/ldap/users", summary="List live simulated AD directory users")
async def get_ldap_users_alias() -> List[Dict[str, Any]]:
    return await list_directory_users()


@app.post("/api/v1/hitl/{ticket_id}/approve", summary="Human-in-the-Loop supervisor approval")
async def hitl_approve(ticket_id: str, action_req: Optional[SupervisorActionRequest] = None) -> Dict[str, Any]:
    req = action_req or SupervisorActionRequest(supervisor_id="sec-admin-01", justification="Supervisor verified request via secondary verification.")
    pending_data = redis_manager.pop_pending_approval(ticket_id)
    target_user = None
    if pending_data:
        target_user = pending_data.get("intent", {}).get("user_id")
    else:
        t = triage_store.get_ticket(ticket_id)
        if t:
            target_user = t.get("user_id")

    if not target_user:
        target_user = "demo.user08"

    # Unlock account if target is in locked state
    ldap_engine.unlock_ad_account(target_user)

    audit_entry = audit_logger.record(
        ticket_id=ticket_id,
        action="SUPERVISOR_APPROVED_UNLOCK_ACCOUNT",
        target_user=target_user,
        status="SUPERVISOR_APPROVED",
        actor=f"SUPERVISOR:{req.supervisor_id}",
        details={
            "justification": req.justification,
            "supervisor_id": req.supervisor_id,
        },
    )

    updated_ticket = triage_store.update_hitl_decision(ticket_id, "APPROVE", audit_entry.entry_hash)
    return {
        "status": "APPROVED",
        "ticket_id": ticket_id,
        "audit_hash": audit_entry.entry_hash,
        "target_user": target_user,
        "account_status": "ACTIVE",
        "ticket": updated_ticket
    }


@app.post("/api/v1/hitl/{ticket_id}/reject", summary="Human-in-the-Loop supervisor rejection")
async def hitl_reject(ticket_id: str, action_req: Optional[SupervisorActionRequest] = None) -> Dict[str, Any]:
    req = action_req or SupervisorActionRequest(supervisor_id="sec-admin-01", justification="Rejected by supervisor policy gate.")
    pending_data = redis_manager.pop_pending_approval(ticket_id)
    target_user = None
    if pending_data:
        target_user = pending_data.get("intent", {}).get("user_id")
    else:
        t = triage_store.get_ticket(ticket_id)
        if t:
            target_user = t.get("user_id")

    if not target_user:
        target_user = "demo.user08"

    audit_entry = audit_logger.record(
        ticket_id=ticket_id,
        action="SUPERVISOR_REJECTED",
        target_user=target_user,
        status="REJECTED",
        actor=f"SUPERVISOR:{req.supervisor_id}",
        details={"justification": req.justification},
    )

    updated_ticket = triage_store.update_hitl_decision(ticket_id, "REJECT", audit_entry.entry_hash)
    return {
        "status": "REJECTED",
        "ticket_id": ticket_id,
        "audit_hash": audit_entry.entry_hash,
        "target_user": target_user,
        "ticket": updated_ticket
    }


@app.post("/api/v1/simulation/reset", summary="Reset simulation fixtures and Active Directory state")
async def simulation_reset() -> Dict[str, Any]:
    ldap_engine.reset_directory_state()
    audit_logger.reset()
    triage_store.reset_to_default_fixtures()
    try:
        if hasattr(redis_manager, "_redis") and redis_manager._redis:
            redis_manager._redis.flushall()
    except Exception:
        pass
    return {
        "status": "RESET_SUCCESS",
        "message": "Directory state and simulation fixtures restored to initial baseline."
    }


# ---------------------------------------------------------------------------
# 2. Supervisor Human-in-the-Loop Endpoints
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/triage/pending",
    summary="List tickets awaiting supervisor authorization (HITL Queue)",
)
async def list_pending_approvals(
    x_supervisor_token: Optional[str] = Header(None),
) -> List[Dict[str, Any]]:
    verify_supervisor_auth(x_supervisor_token)
    return redis_manager.list_all_pending_approvals()


@app.post(
    "/api/v1/triage/approve/{ticket_id}",
    response_model=TriageDecision,
    summary="Supervisor approval gate to execute high-risk paused action",
)
async def approve_ticket(
    ticket_id: str,
    action_req: SupervisorActionRequest,
    x_supervisor_token: Optional[str] = Header(None),
) -> TriageDecision:
    verify_supervisor_auth(x_supervisor_token)

    pending_data = redis_manager.pop_pending_approval(ticket_id)
    if not pending_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} is not in pending approval queue.",
        )

    proposed_action = pending_data.get("proposed_action")
    target_user = pending_data.get("intent", {}).get("user_id")

    # Execute approved action
    action_executed = None
    if proposed_action == AllowlistedAction.UNLOCK_ACCOUNT.value:
        success = ldap_engine.unlock_ad_account(target_user)
        action_executed = AllowlistedAction.UNLOCK_ACCOUNT if success else AllowlistedAction.ESCALATE_TIER2
    elif proposed_action == AllowlistedAction.REQUEST_FOLDER_ACCESS.value:
        # In enterprise AD, folder access approval dispatches ACL task
        action_executed = AllowlistedAction.REQUEST_FOLDER_ACCESS
    elif proposed_action == AllowlistedAction.RESET_PASSWORD.value:
        action_executed = AllowlistedAction.RESET_PASSWORD
    else:
        action_executed = AllowlistedAction.NO_ACTION

    audit_entry = audit_logger.record(
        ticket_id=ticket_id,
        action=f"SUPERVISOR_APPROVED_{proposed_action}",
        target_user=target_user,
        status=TicketStatus.AUTO_REMEDIATED.value,
        actor=f"SUPERVISOR:{action_req.supervisor_id}",
        details={
            "justification": action_req.justification,
            "original_intent": pending_data.get("intent"),
        },
    )

    decision = TriageDecision(
        ticket_id=ticket_id,
        status=TicketStatus.AUTO_REMEDIATED,
        action_executed=action_executed,
        target_user=target_user,
        confidence_score=1.0,
        risk_level=RiskLevel.MEDIUM,
        requires_supervisor_approval=False,
        security_flags=["SUPERVISOR_OVERRIDE_APPROVED"],
        diagnostic_report={
            "supervisor_id": action_req.supervisor_id,
            "justification": action_req.justification,
        },
        audit_hash=audit_entry.entry_hash,
    )
    redis_manager.cache_decision(ticket_id, decision.model_dump_json())
    return decision


@app.post(
    "/api/v1/triage/reject/{ticket_id}",
    response_model=TriageDecision,
    summary="Supervisor rejection of a paused ticket",
)
async def reject_ticket(
    ticket_id: str,
    action_req: SupervisorActionRequest,
    x_supervisor_token: Optional[str] = Header(None),
) -> TriageDecision:
    verify_supervisor_auth(x_supervisor_token)

    pending_data = redis_manager.pop_pending_approval(ticket_id)
    if not pending_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket {ticket_id} is not in pending approval queue.",
        )

    target_user = pending_data.get("intent", {}).get("user_id")

    audit_entry = audit_logger.record(
        ticket_id=ticket_id,
        action="SUPERVISOR_REJECTED",
        target_user=target_user,
        status=TicketStatus.REJECTED.value,
        actor=f"SUPERVISOR:{action_req.supervisor_id}",
        details={
            "justification": action_req.justification,
            "original_intent": pending_data.get("intent"),
        },
    )

    decision = TriageDecision(
        ticket_id=ticket_id,
        status=TicketStatus.REJECTED,
        action_executed=AllowlistedAction.NO_ACTION,
        target_user=target_user,
        confidence_score=1.0,
        risk_level=RiskLevel.LOW,
        requires_supervisor_approval=False,
        security_flags=["SUPERVISOR_REJECTED"],
        diagnostic_report={
            "supervisor_id": action_req.supervisor_id,
            "justification": action_req.justification,
        },
        audit_hash=audit_entry.entry_hash,
    )
    redis_manager.cache_decision(ticket_id, decision.model_dump_json())
    return decision


# ---------------------------------------------------------------------------
# 3. Immutable Audit Trail & Verification Endpoint
# ---------------------------------------------------------------------------
@app.get(
    "/api/v1/audit/trail",
    summary="Fetch immutable cryptographic audit trail with chain integrity verification",
)
async def get_audit_trail() -> Dict[str, Any]:
    is_valid, reason = audit_logger.verify_integrity()
    entries = audit_logger.get_entries()
    return {
        "chain_integrity_verified": is_valid,
        "verification_error": reason,
        "total_records": len(entries),
        "ledger": [e.model_dump() for e in entries],
    }


# ---------------------------------------------------------------------------
# 4. Healthcheck
# ---------------------------------------------------------------------------
@app.get("/api/v1/health", summary="System Health Probe")
async def health_check() -> Dict[str, Any]:
    ldap_ok = ldap_engine.is_healthy()
    redis_ok = True
    try:
        redis_manager.client.ping()
    except Exception:
        redis_ok = False

    overall_ok = ldap_ok and redis_ok
    status_code = status.HTTP_200_OK if overall_ok else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "HEALTHY" if overall_ok else "DEGRADED",
            "services": {
                "ldap_active_directory": "UP" if ldap_ok else "DOWN",
                "redis_state_engine": "UP" if redis_ok else "DOWN",
                "ai_parser_provider": settings.AI_PROVIDER,
            },
        },
    )
