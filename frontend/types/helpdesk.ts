/**
 * TypeScript Definitions for Autonomous Enterprise IT Helpdesk & Triage Engine
 * Aligned with both FastAPI backend schemas and deterministic local state.
 */

export type PolicyVerdict =
  | "AUTO_APPROVED"
  | "AUTO_EXECUTED"
  | "HITL_APPROVED"
  | "REQUIRES_HITL"
  | "HITL_PENDING"
  | "BLOCKED_INJECTION"
  | "HITL_REJECTED"
  | "ESCALATED_TIER2"
  | "TIER2_ESCALATED"
  | "IN_PROGRESS"
  | "NO_ACTION";

export type ScenarioKey =
  | "alex_lockout"
  | "prompt_injection"
  | "admin_hitl"
  | "hardware_escalation";

export interface CustomTicketPayload {
  source: "Email" | "Webhook" | string;
  sender_email: string;
  subject: string;
  raw_body: string;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  llm_mode: string;
  ldap_mode: string;
  redis_connected: boolean;
  audit_chain_verified: boolean;
}

export interface GuardrailCheck {
  name: string;
  status: "PASS" | "WARN" | "FAIL" | "BLOCKED" | "ACTIVE";
  detail: string;
}

export interface PydanticIntent {
  user_id: string;
  issue_category: string;
  affected_device: string | null;
  urgency_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  confidence_score: number;
  suggested_action: string;
  suggested_playbook: string;
  extracted_reasoning: string;
  is_injection_suspected?: boolean;
}

export interface AuditEntryRecord {
  entry_id?: string;
  index: number;
  prev_hash: string;
  entry_hash?: string;
  timestamp: string;
  ticket_id?: string;
  action: string;
  target_user: string | null;
  status: string;
  actor: string;
  details?: Record<string, unknown>;
}

export interface TriageRecord {
  ticket_id: string;
  source: string;
  sender_email: string;
  subject: string;
  raw_subject?: string;
  raw_body: string;
  raw_mime?: string;
  timestamp: string;
  user_id: string;
  extracted_category: string;
  ai_confidence: number;
  policy_verdict: PolicyVerdict;
  latency_ms: number;
  pydantic_intent: PydanticIntent;
  guardrail_checks: GuardrailCheck[];
  audit_hash: string;
  audit_entry: AuditEntryRecord;
  difficulty_level?: number;
  difficulty_tier?: "Easy" | "Medium" | "Hard" | "Extreme" | string;
  hitl_token?: string;
  hitl_action_taken?: string | null;
}

export interface LdapUser {
  dn: string;
  sAMAccountName: string;
  mail: string;
  department: string;
  lockoutTime: string;
  is_locked: boolean;
  is_disabled: boolean;
  memberOf: string[];
  is_privileged: boolean;
  privileged_groups: string[];
}

export interface AuditTrailEntry {
  index: number;
  timestamp: string;
  ticket_id: string;
  user_id: string;
  action: string;
  actor: string;
  status: string;
  details: Record<string, unknown>;
  prev_hash: string;
  entry_hash: string;
}

export interface AuditTrailResponse {
  integrity: {
    is_valid: boolean;
    entries_checked: number;
    message: string;
  };
  entries: AuditTrailEntry[];
}

export interface InteractiveChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  step_number?: number;
  quick_replies?: string[];
  image_base64?: string | null;
  action_taken?: string | null;
}

export interface InteractiveTicketSession {
  ticket_id: string;
  user_id: string;
  sender_email: string;
  subject: string;
  category: string;
  affected_device: string;
  urgency: string;
  status:
    | "DIAGNOSING"
    | "RESOLVED_BY_AI"
    | "ESCALATED_TO_ADMIN"
    | "HARDWARE_REPLACEMENT_ORDERED";
  current_step: number;
  total_steps: number;
  created_at: string;
  updated_at: string;
  hardware_replacement_requested: boolean;
  escalation_summary: string | null;
  messages: InteractiveChatMessage[];
}

export interface ChatTurnResponse {
  session: InteractiveTicketSession;
  latest_message: InteractiveChatMessage;
}
