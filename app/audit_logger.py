"""
Cryptographic Immutable Audit Logger
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from app.schemas import AuditEntry


class ImmutableAuditLogger:
    """
    Append-only, cryptographically linked audit ledger.
    Every remediation or security decision is chained via SHA-256 hashes,
    guaranteeing non-repudiation and tamper detection.
    """

    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"

    def __init__(self):
        self._ledger: List[AuditEntry] = []

    def _compute_hash(
        self,
        index: int,
        prev_hash: str,
        timestamp_iso: str,
        ticket_id: str,
        action: str,
        target_user: Optional[str],
        status: str,
        actor: str,
        details: Dict[str, Any],
    ) -> str:
        # Canonical JSON serialization for deterministic hashing
        details_str = json.dumps(details, sort_keys=True, default=str)
        payload = f"{index}|{prev_hash}|{timestamp_iso}|{ticket_id}|{action}|{target_user or ''}|{status}|{actor}|{details_str}"
        return hashlib.sha256(payload.encode("utf-8")).hexdigest()

    def record(
        self,
        ticket_id: str,
        action: str,
        target_user: Optional[str],
        status: str,
        actor: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> AuditEntry:
        """Append an immutable audit entry to the cryptographic ledger."""
        details = details or {}
        now = datetime.now(timezone.utc)
        now_iso = now.isoformat()

        index = len(self._ledger)
        prev_hash = self._ledger[-1].entry_hash if index > 0 else self.GENESIS_HASH

        entry_hash = self._compute_hash(
            index=index,
            prev_hash=prev_hash,
            timestamp_iso=now_iso,
            ticket_id=ticket_id,
            action=action,
            target_user=target_user,
            status=status,
            actor=actor,
            details=details,
        )

        entry = AuditEntry(
            entry_id=str(uuid.uuid4()),
            index=index,
            prev_hash=prev_hash,
            entry_hash=entry_hash,
            timestamp=now,
            ticket_id=ticket_id,
            action=action,
            target_user=target_user,
            status=status,
            actor=actor,
            details=details,
        )
        self._ledger.append(entry)
        return entry

    def reset(self):
        """Reset audit ledger to empty genesis state."""
        self._ledger = []

    def get_entries(self) -> List[AuditEntry]:
        """Return a copy of the ledger entries."""
        return list(self._ledger)

    def verify_integrity(self) -> Tuple[bool, Optional[str]]:
        """
        Verify the mathematical integrity of the cryptographic chain.
        Returns (True, None) if completely valid, or (False, reason) if tampered.
        """
        for i, entry in enumerate(self._ledger):
            expected_prev_hash = self.GENESIS_HASH if i == 0 else self._ledger[i - 1].entry_hash
            if entry.prev_hash != expected_prev_hash:
                return False, f"Broken chain at index {i}: prev_hash mismatch."

            recomputed_hash = self._compute_hash(
                index=entry.index,
                prev_hash=entry.prev_hash,
                timestamp_iso=entry.timestamp.isoformat(),
                ticket_id=entry.ticket_id,
                action=entry.action,
                target_user=entry.target_user,
                status=entry.status,
                actor=entry.actor,
                details=entry.details,
            )
            if entry.entry_hash != recomputed_hash:
                return False, f"Tampered entry detected at index {i}: hash mismatch."

        return True, None

    def clear(self):
        """Reset ledger (used exclusively for clean test harnesses)."""
        self._ledger.clear()


# Global audit logger instance
audit_logger = ImmutableAuditLogger()
