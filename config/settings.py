"""
Enterprise Helpdesk & Triage Engine Configuration Settings
"""
import os
from typing import List
# Settings configuration

class Settings:
    def __init__(self):
        # Environment
        self.ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
        self.LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
        
        # LDAP / Active Directory Settings
        self.LDAP_SERVER_URI: str = os.getenv("LDAP_SERVER_URI", "ldap://localhost:389")
        self.LDAP_BIND_DN: str = os.getenv("LDAP_BIND_DN", "cn=admin,dc=corp,dc=example,dc=test")
        self.LDAP_BIND_PASSWORD: str = os.getenv("LDAP_BIND_PASSWORD", "")
        self.LDAP_BASE_DN: str = os.getenv("LDAP_BASE_DN", "dc=corp,dc=example,dc=test")
        self.LDAP_USERS_OU: str = os.getenv("LDAP_USERS_OU", "ou=Users,dc=corp,dc=example,dc=test")
        self.LDAP_GROUPS_OU: str = os.getenv("LDAP_GROUPS_OU", "ou=Groups,dc=corp,dc=example,dc=test")
        self.LDAP_MOCK_MODE: bool = os.getenv("LDAP_MOCK_MODE", "true").lower() in ("true", "1", "yes")

        # Redis Settings
        self.REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
        self.REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
        self.REDIS_PASSWORD: str = os.getenv("REDIS_PASSWORD", "")
        self.REDIS_MOCK_MODE: bool = os.getenv("REDIS_MOCK_MODE", "true").lower() in ("true", "1", "yes")
        self.IDEMPOTENCY_TTL_SECONDS: int = int(os.getenv("IDEMPOTENCY_TTL_SECONDS", "3600"))

        # AI Engine Settings
        self.AI_PROVIDER: str = os.getenv("AI_PROVIDER", "fallback")  # "ollama" | "claude" | "fallback"
        self.OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "mistral:latest")
        self.ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
        self.CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-opus-4-8")
        self.LLM_TIMEOUT_SECONDS: float = float(os.getenv("LLM_TIMEOUT_SECONDS", "8.0"))
        self.LLM_MAX_RETRIES: int = int(os.getenv("LLM_MAX_RETRIES", "2"))

        # Deterministic Policy Thresholds
        self.AUTO_REMEDIATION_CONFIDENCE_THRESHOLD: float = 0.95
        self.HITL_CONFIDENCE_THRESHOLD: float = 0.80

        # Privileged Active Directory Groups (Hard Block List)
        self.PRIVILEGED_GROUPS: List[str] = [
            "CN=Domain Admins,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Enterprise Admins,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Schema Admins,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Administrators,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Account Operators,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Server Operators,OU=Groups,DC=corp,dc=example,dc=test",
            "CN=Backup Operators,OU=Groups,DC=corp,dc=example,dc=test",
        ]

        # Security Authentication
        self.SUPERVISOR_API_KEY: str = os.getenv("SUPERVISOR_API_KEY", "")

settings = Settings()
