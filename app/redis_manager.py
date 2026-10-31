"""
Redis State, Idempotency & HITL Queue Manager
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import json
import logging
from typing import Any, Dict, List, Optional
import redis
import fakeredis
from config.settings import settings

logger = logging.getLogger(__name__)


class RedisManager:
    """
    Manages idempotency caching, distributed locks, and Human-in-the-Loop (HITL) supervisor queues.
    Seamlessly supports production Redis and in-memory fakeredis for zero-dependency test suites.
    """

    def __init__(self, use_mock: bool = False):
        self.use_mock = use_mock or settings.REDIS_MOCK_MODE
        self.client: redis.Redis = self._initialize_client()

    def _initialize_client(self) -> redis.Redis:
        if self.use_mock:
            logger.info("Initializing in-memory FakeRedis client.")
            return fakeredis.FakeRedis(decode_responses=True)

        try:
            client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                password=settings.REDIS_PASSWORD if settings.REDIS_PASSWORD else None,
                decode_responses=True,
                socket_timeout=0.5,
                socket_connect_timeout=0.5,
            )
            # Test connectivity
            client.ping()
            logger.info(f"Connected to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            return client
        except Exception as exc:
            logger.warning(
                f"Failed to connect to Redis ({exc}). Falling back to in-memory FakeRedis."
            )
            return fakeredis.FakeRedis(decode_responses=True)

    # -----------------------------------------------------------------------
    # Idempotency Operations
    # -----------------------------------------------------------------------
    def check_and_set_idempotency(self, key: str, ttl_seconds: Optional[int] = None) -> bool:
        """
        Atomically check if key exists. If not, set it with TTL.
        Returns True if this is a NEW request (lock acquired).
        Returns False if duplicate request already exists (idempotency violation).
        """
        ttl = ttl_seconds or settings.IDEMPOTENCY_TTL_SECONDS
        redis_key = f"idempotency:{key}"
        # SET NX (set if not exists)
        is_new = self.client.set(redis_key, "IN_PROGRESS", nx=True, ex=ttl)
        return bool(is_new)

    def cache_decision(self, key: str, decision_json: str, ttl_seconds: Optional[int] = None):
        """Store the final processed decision for idempotent replay."""
        ttl = ttl_seconds or settings.IDEMPOTENCY_TTL_SECONDS
        redis_key = f"decision:{key}"
        self.client.set(redis_key, decision_json, ex=ttl)

    def get_cached_decision(self, key: str) -> Optional[str]:
        """Retrieve previously cached decision if duplicate ticket is received."""
        redis_key = f"decision:{key}"
        return self.client.get(redis_key)

    # -----------------------------------------------------------------------
    # Human-in-the-Loop (HITL) Supervisor Queue
    # -----------------------------------------------------------------------
    def push_pending_approval(self, ticket_id: str, data: Dict[str, Any], ttl_seconds: int = 86400):
        """Store a ticket requiring supervisor authorization."""
        key = f"pending_hitl:{ticket_id}"
        self.client.set(key, json.dumps(data, default=str), ex=ttl_seconds)
        # Add to index set
        self.client.sadd("pending_hitl_set", ticket_id)
        logger.info(f"Ticket {ticket_id} pushed to HITL supervisor approval queue.")

    def get_pending_approval(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Fetch pending ticket details for supervisor review."""
        key = f"pending_hitl:{ticket_id}"
        raw = self.client.get(key)
        if raw:
            return json.loads(raw)
        return None

    def list_all_pending_approvals(self) -> List[Dict[str, Any]]:
        """List all tickets currently awaiting supervisor decision."""
        ticket_ids = self.client.smembers("pending_hitl_set")
        results = []
        for tid in ticket_ids:
            item = self.get_pending_approval(tid)
            if item:
                results.append(item)
            else:
                # Clean up expired index
                self.client.srem("pending_hitl_set", tid)
        return results

    def pop_pending_approval(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        """Remove and return pending ticket upon supervisor approval/rejection."""
        key = f"pending_hitl:{ticket_id}"
        raw = self.client.get(key)
        if raw:
            self.client.delete(key)
            self.client.srem("pending_hitl_set", ticket_id)
            return json.loads(raw)
        return None

    def flush(self):
        """Flush keys for clean test runs."""
        self.client.flushdb()


# Singleton Redis Manager
redis_manager = RedisManager()
