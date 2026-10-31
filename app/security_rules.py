"""
Deterministic Security Rules & Policy Enforcement Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import re
from typing import List, Optional, Set, Tuple
from config.settings import settings
from app.schemas import (
    AllowlistedAction,
    IssueCategory,
    LdapUserState,
    ParsedTicketIntent,
    RiskLevel,
    TicketStatus,
)


class SecurityPolicyEngine:
    """
    Enforces non-negotiable deterministic security guardrails.
    The AI layer is NEVER trusted with authorization or execution boundaries.
    """

    # Normalized set of privileged group patterns for case-insensitive matching
    PRIVILEGED_GROUP_KEYWORDS: Set[str] = {
        "domain admins",
        "enterprise admins",
        "schema admins",
        "administrators",
        "account operators",
        "server operators",
        "backup operators",
    }

    # Prompt injection detection signatures
    PROMPT_INJECTION_PATTERNS = [
        r"(?i)ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|directives?|rules?|prompts?)",
        r"(?i)system\s*[:\s]*override",
        r"(?i)you\s+are\s+now\s+in\s+developer\s+mode",
        r"(?i)grant\s+(me\s+)?(domain\s+)?admin",
        r"(?i)elevate\s+privileges?",
        r"(?i)add\s+user\s+to\s+domain\s+admins",
        r"(?i)bypass\s+security\s+checks?",
        r"(?i)do\s+anything\s+now|DAN\s+mode",
        r"(?i)format\s+c:|rm\s+-rf\s+/",
        r"(?i)set\s+lockoutTime\s*=\s*0\s+immediately",
        r"(?i)disregard\s+all\s+(guardrails|rules|instructions)",
    ]

    @classmethod
    def scan_for_prompt_injection(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Scans raw ticket subject and body for known prompt injection and jailbreak signatures.
        """
        matches = []
        for pattern in cls.PROMPT_INJECTION_PATTERNS:
            found = re.findall(pattern, text)
            if found:
                matches.append(pattern)
        return len(matches) > 0, matches

    @classmethod
    def is_user_privileged(cls, ldap_state: LdapUserState) -> Tuple[bool, List[str]]:
        """
        CRITICAL SECURITY INVARIANT:
        Checks whether the directory account belongs to any privileged Active Directory group.
        """
        matching_groups = []
        for group_dn in ldap_state.memberOf:
            group_dn_lower = group_dn.lower()
            for priv_keyword in cls.PRIVILEGED_GROUP_KEYWORDS:
                if priv_keyword in group_dn_lower:
                    matching_groups.append(group_dn)
                    break

        return len(matching_groups) > 0, matching_groups

    @classmethod
    def assess_risk(
        cls,
        intent: ParsedTicketIntent,
        ldap_state: Optional[LdapUserState],
    ) -> RiskLevel:
        """Calculate deterministic risk level based on intent and directory state."""
        # 1. Prompt injection is always CRITICAL risk
        if intent.is_injection_suspected or intent.issue_category == IssueCategory.PRIVILEGE_ESCALATION_ATTEMPT:
            return RiskLevel.CRITICAL

        # 2. Privileged user involvement is HIGH/CRITICAL risk
        if ldap_state:
            is_priv, _ = cls.is_user_privileged(ldap_state)
            if is_priv:
                return RiskLevel.CRITICAL

        # 3. High-risk actions
        if intent.suggested_action in (
            AllowlistedAction.REQUEST_FOLDER_ACCESS,
            AllowlistedAction.RESET_PASSWORD,
        ):
            return RiskLevel.HIGH

        # 4. Standard unlock of normal verified account
        if intent.suggested_action == AllowlistedAction.UNLOCK_ACCOUNT:
            return RiskLevel.LOW

        return RiskLevel.MEDIUM

    @classmethod
    def evaluate_execution_policy(
        cls,
        intent: ParsedTicketIntent,
        ldap_state: Optional[LdapUserState],
    ) -> Tuple[TicketStatus, Optional[AllowlistedAction], List[str], str]:
        """
        Core deterministic decision matrix.
        Returns: (status, approved_action_or_none, security_flags, reasoning)
        """
        flags: List[str] = []

        # -------------------------------------------------------------------
        # RULE 1: Prompt Injection / Adversarial Ticket
        # -------------------------------------------------------------------
        if intent.is_injection_suspected or intent.issue_category == IssueCategory.PRIVILEGE_ESCALATION_ATTEMPT:
            flags.append("PROMPT_INJECTION_DETECTED")
            return (
                TicketStatus.BLOCKED_SECURITY_VIOLATION,
                AllowlistedAction.BLOCK_AND_ALERT_SOC,
                flags,
                "Adversarial prompt injection attempt detected in raw payload. Execution blocked.",
            )

        # -------------------------------------------------------------------
        # RULE 2: User Not Found in Active Directory
        # -------------------------------------------------------------------
        if not ldap_state:
            flags.append("USER_NOT_FOUND_IN_DIRECTORY")
            return (
                TicketStatus.ESCALATED_TIER2,
                AllowlistedAction.ESCALATE_TIER2,
                flags,
                f"User '{intent.user_id}' does not exist in Active Directory/LDAP.",
            )

        # -------------------------------------------------------------------
        # RULE 3: Privileged Account Hard Block
        # -------------------------------------------------------------------
        is_priv, priv_groups = cls.is_user_privileged(ldap_state)
        if is_priv:
            flags.append("PRIVILEGED_ACCOUNT_SECURITY_BLOCK")
            flags.extend([f"GROUP:{g}" for g in priv_groups])
            return (
                TicketStatus.ESCALATED_TIER2,
                AllowlistedAction.ESCALATE_TIER2,
                flags,
                f"Target user '{ldap_state.sAMAccountName}' is a member of privileged group(s): "
                f"{', '.join(priv_groups)}. Automated remediation is strictly forbidden.",
            )

        # -------------------------------------------------------------------
        # RULE 4: Human-in-the-Loop Approval Required (Folder Permission, Password Reset)
        # -------------------------------------------------------------------
        if intent.suggested_action in (
            AllowlistedAction.REQUEST_FOLDER_ACCESS,
            AllowlistedAction.RESET_PASSWORD,
        ):
            flags.append("HITL_APPROVAL_REQUIRED")
            return (
                TicketStatus.PENDING_SUPERVISOR_APPROVAL,
                intent.suggested_action,
                flags,
                f"Action '{intent.suggested_action.value}' carries elevated permission risk. Paused for supervisor authorization.",
            )

        # -------------------------------------------------------------------
        # RULE 5: Standard Account Unlock Evaluation
        # -------------------------------------------------------------------
        if intent.suggested_action == AllowlistedAction.UNLOCK_ACCOUNT:
            # Check if actually locked in LDAP
            if not ldap_state.is_locked:
                flags.append("ACCOUNT_ALREADY_UNLOCKED")
                return (
                    TicketStatus.NO_ACTION_REQUIRED,
                    AllowlistedAction.NO_ACTION,
                    flags,
                    f"Account '{ldap_state.sAMAccountName}' is currently not locked in directory (lockoutTime={ldap_state.lockoutTime}).",
                )

            # Check confidence score >= 0.95
            if intent.confidence_score >= settings.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD:
                flags.append("AUTO_REMEDIATION_QUALIFIED")
                return (
                    TicketStatus.AUTO_REMEDIATED,
                    AllowlistedAction.UNLOCK_ACCOUNT,
                    flags,
                    f"High-confidence ({intent.confidence_score*100:.1f}%) locked standard account verified. Auto-remediation approved.",
                )
            elif intent.confidence_score >= settings.HITL_CONFIDENCE_THRESHOLD:
                # Moderate confidence: pause for human review
                flags.append("MODERATE_CONFIDENCE_HITL")
                return (
                    TicketStatus.PENDING_SUPERVISOR_APPROVAL,
                    AllowlistedAction.UNLOCK_ACCOUNT,
                    flags,
                    f"Moderate confidence ({intent.confidence_score*100:.1f}%). Paused for supervisor confirmation.",
                )
            else:
                flags.append("LOW_CONFIDENCE_ESCALATION")
                return (
                    TicketStatus.ESCALATED_TIER2,
                    AllowlistedAction.ESCALATE_TIER2,
                    flags,
                    f"Confidence score {intent.confidence_score*100:.1f}% is below auto-remediation threshold.",
                )

        # -------------------------------------------------------------------
        # RULE 6: Default Escalation for Unhandled or Ambiguous Intents
        # -------------------------------------------------------------------
        flags.append("UNHANDLED_OR_AMBIGUOUS_INTENT")
        return (
            TicketStatus.ESCALATED_TIER2,
            AllowlistedAction.ESCALATE_TIER2,
            flags,
            f"Intent category '{intent.issue_category.value}' requires Tier-2 engineer diagnosis.",
        )
