"""
Deterministic LDAP & Active Directory Execution Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
import logging
import os
from typing import Any, Dict, List, Optional
import ldap3
from ldap3 import ALL, Connection, MODIFY_REPLACE, Server, MOCK_SYNC
from config.settings import settings
from app.schemas import LdapUserState

logger = logging.getLogger(__name__)


class LdapEngine:
    """
    Interacts with OpenLDAP / Active Directory using ldap3.
    Provides strict querying of user state and atomic write-verify execution.
    Supports in-memory mock mode for zero-dependency test verification.
    """

    def __init__(self, use_mock: bool = False, ldif_seed_path: Optional[str] = None):
        self.use_mock = use_mock or settings.LDAP_MOCK_MODE
        self.ldif_seed_path = ldif_seed_path or os.path.join(
            os.path.dirname(__file__), "..", "config", "ldap_init", "02_initial_data.ldif"
        )
        self.server: Optional[Server] = None
        self._connection: Optional[Connection] = None
        self._init_connection()

    def _init_connection(self):
        if self.use_mock:
            logger.info("Initializing ldap3 in MOCK_SYNC strategy.")
            self.server = Server("mock_ad_dc01.corp.example.test")
            self._connection = Connection(
                self.server,
                authentication=ldap3.ANONYMOUS,
                client_strategy=MOCK_SYNC,
            )
            self._connection.bind()
            self._seed_mock_data()
        else:
            try:
                logger.info(f"Connecting to live LDAP server: {settings.LDAP_SERVER_URI}")
                self.server = Server(settings.LDAP_SERVER_URI, get_info=ALL, connect_timeout=1)
                self._connection = Connection(
                    self.server,
                    user=settings.LDAP_BIND_DN,
                    password=settings.LDAP_BIND_PASSWORD,
                    auto_bind=True,
                    receive_timeout=1,
                )
                logger.info("Connected and bound to LDAP directory successfully.")
            except Exception as exc:
                logger.warning(
                    f"Failed to connect to live LDAP ({exc}). Initializing in MOCK_SYNC mode."
                )
                self.use_mock = True
                self.server = Server("mock_ad_dc01.corp.example.test")
                self._connection = Connection(
                    self.server,
                    authentication=ldap3.ANONYMOUS,
                    client_strategy=MOCK_SYNC,
                )
                self._connection.bind()
                self._seed_mock_data()

    def _seed_mock_data(self):
        """Seed directory tree into in-memory mock connection from LDIF fixture."""
        if not self._connection or not hasattr(self._connection, "strategy"):
            return

        # Initialize base domain
        self._connection.strategy.add_entry(
            settings.LDAP_BASE_DN, {"dc": "corp", "objectClass": ["top", "domain"]}
        )

        if os.path.exists(self.ldif_seed_path):
            with open(self.ldif_seed_path, "r", encoding="utf-8") as f:
                content = f.read()
            self._load_ldif_entries(content)
        else:
            logger.warning(f"Seed LDIF not found at {self.ldif_seed_path}. Seeding built-in defaults.")
            self._seed_hardcoded_defaults()

    def _load_ldif_entries(self, ldif_content: str):
        blocks = [b.strip() for b in ldif_content.split("\n\n") if b.strip()]
        for block in blocks:
            lines = [l.strip() for l in block.splitlines() if l.strip() and not l.startswith("#")]
            if not lines:
                continue
            dn = None
            attrs: Dict[str, List[str]] = {}
            for line in lines:
                if ":" not in line:
                    continue
                k, v = line.split(":", 1)
                k = k.strip()
                v = v.strip()
                if k == "dn":
                    dn = v
                else:
                    if k not in attrs:
                        attrs[k] = []
                    attrs[k].append(v)
            if dn and self._connection:
                self._connection.strategy.add_entry(dn, attrs)

    def _seed_hardcoded_defaults(self):
        """Fallback hardcoded directory entries for tests if LDIF file is missing."""
        base = settings.LDAP_BASE_DN
        users_ou = f"ou=Users,{base}"
        groups_ou = f"ou=Groups,{base}"
        self._connection.strategy.add_entry(users_ou, {"ou": "Users", "objectClass": ["top", "organizationalUnit"]})
        self._connection.strategy.add_entry(groups_ou, {"ou": "Groups", "objectClass": ["top", "organizationalUnit"]})

        # Groups
        self._connection.strategy.add_entry(
            f"cn=Domain Admins,{groups_ou}",
            {"cn": "Domain Admins", "objectClass": ["top", "groupOfNames"], "member": [f"cn=Demo User 03,{users_ou}"]}
        )
        self._connection.strategy.add_entry(
            f"cn=Standard Users,{groups_ou}",
            {"cn": "Standard Users", "objectClass": ["top", "groupOfNames"], "member": [f"cn=Demo User 01,{users_ou}"]}
        )

        # Users
        self._connection.strategy.add_entry(
            f"cn=Demo User 01,{users_ou}",
            {
                "cn": "Demo User 01",
                "sAMAccountName": "demo.user01",
                "mail": "demo.user01@corp.example.test",
                "userAccountControl": "512",
                "lockoutTime": "133500000000000000",
                "memberOf": [f"cn=Standard Users,{groups_ou}"],
                "objectClass": ["top", "person", "organizationalPerson", "inetOrgPerson", "adAccount"]
            }
        )
        self._connection.strategy.add_entry(
            f"cn=Demo User 06,{users_ou}",
            {
                "cn": "Demo User 06",
                "sAMAccountName": "demo.user06",
                "mail": "demo.user06@corp.example.test",
                "userAccountControl": "512",
                "lockoutTime": "133500000000000000",
                "memberOf": [f"cn=Standard Users,{groups_ou}"],
                "objectClass": ["top", "person", "organizationalPerson", "inetOrgPerson", "adAccount"],
            },
        )
        self._connection.strategy.add_entry(
            f"cn=Demo User 07,{users_ou}",
            {
                "cn": "Demo User 07",
                "sAMAccountName": "demo.user07",
                "mail": "demo.user07@corp.example.test",
                "userAccountControl": "512",
                "lockoutTime": "0",
                "memberOf": [f"cn=Standard Users,{groups_ou}"],
                "objectClass": ["top", "person", "organizationalPerson", "inetOrgPerson", "adAccount"],
            },
        )
        self._connection.strategy.add_entry(
            f"cn=Demo User 08,{users_ou}",
            {
                "cn": "Demo User 08",
                "sAMAccountName": "demo.user08",
                "mail": "demo.user08@corp.example.test",
                "userAccountControl": "512",
                "lockoutTime": "133500000000000000",
                "memberOf": [f"cn=Domain Admins,{groups_ou}"],
                "objectClass": ["top", "person", "organizationalPerson", "inetOrgPerson", "adAccount"],
            },
        )
        for username, full_name, email in [
            ("demo.user11", "Demo User 11", "demo.user11@corp.example.test"),
            ("demo.user12", "Demo User 12", "demo.user12@corp.example.test"),
            ("demo.user13", "Demo User 13", "demo.user13@corp.example.test"),
            ("demo.user14", "Demo User 14", "demo.user14@corp.example.test"),
            ("demo.user15", "Demo User 15", "demo.user15@corp.example.test"),
            ("demo.user16", "Demo User 16", "demo.user16@corp.example.test"),
            ("demo.user17", "Demo User 17", "demo.user17@corp.example.test"),
            ("demo.user18", "Demo User 18", "demo.user18@corp.example.test"),
            ("demo.user19", "Demo User 19", "demo.user19@corp.example.test"),
            ("demo.user20", "Demo User 20", "demo.user20@corp.example.test"),
            ("demo.user21", "Demo User 21", "demo.user21@corp.example.test"),
            ("demo.user22", "Demo User 22", "demo.user22@corp.example.test"),
        ]:
            self._connection.strategy.add_entry(
                f"cn={full_name},{users_ou}",
                {
                    "cn": full_name,
                    "sAMAccountName": username,
                    "mail": email,
                    "userAccountControl": "512",
                    "lockoutTime": "0",
                    "memberOf": [f"cn=Standard Users,{groups_ou}"],
                    "objectClass": ["top", "person", "organizationalPerson", "inetOrgPerson", "adAccount"],
                },
            )

    def get_user_by_samaccountname(self, sam_account_name: str) -> Optional[LdapUserState]:
        """
        Query Active Directory for a user by sAMAccountName.
        Extracts userAccountControl, lockoutTime, and memberOf group memberships.
        """
        if not self._connection:
            self._init_connection()

        search_filter = f"(sAMAccountName={sam_account_name})"
        attributes = [
            "distinguishedName",
            "sAMAccountName",
            "mail",
            "userAccountControl",
            "lockoutTime",
            "memberOf",
            "department",
        ]

        try:
            self._connection.search(
                search_base=settings.LDAP_BASE_DN,
                search_filter=search_filter,
                attributes=attributes,
            )

            if not self._connection.entries:
                logger.warning(f"LDAP search: user '{sam_account_name}' not found.")
                return None

            entry = self._connection.entries[0]
            dn = entry.entry_dn

            # Extract attributes safely
            uac = 512
            if hasattr(entry, "userAccountControl") and entry.userAccountControl.value:
                try:
                    uac = int(entry.userAccountControl.value)
                except (ValueError, TypeError):
                    uac = 512

            lock_time = "0"
            if hasattr(entry, "lockoutTime") and entry.lockoutTime.value is not None:
                lock_time = str(entry.lockoutTime.value)

            member_of = []
            if hasattr(entry, "memberOf") and entry.memberOf.values:
                member_of = [str(m) for m in entry.memberOf.values]

            email = str(entry.mail.value) if hasattr(entry, "mail") and entry.mail.value else None
            dept = str(entry.department.value) if hasattr(entry, "department") and entry.department.value else None

            return LdapUserState(
                dn=dn,
                sAMAccountName=str(entry.sAMAccountName.value),
                mail=email,
                userAccountControl=uac,
                lockoutTime=lock_time,
                memberOf=member_of,
                department=dept,
            )
        except Exception as exc:
            logger.error(f"Error querying LDAP for user '{sam_account_name}': {exc}")
            return None

    def unlock_ad_account(self, sam_account_name: str) -> bool:
        """
        DETERMINISTIC EXECUTION & VERIFICATION:
        1. Modifies the account's lockoutTime attribute to '0' in LDAP.
        2. Queries back the directory state to mathematically verify the write took effect.
        Returns True only if the post-modification state confirms lockoutTime == '0'.
        """
        if not self._connection:
            self._init_connection()

        # Step 1: Look up user DN
        user_state = self.get_user_by_samaccountname(sam_account_name)
        if not user_state:
            logger.error(f"Cannot unlock '{sam_account_name}': account not found in directory.")
            return False

        dn = user_state.dn

        # Step 2: Execute LDAP modify to set lockoutTime = 0
        try:
            modify_success = self._connection.modify(
                dn=dn,
                changes={"lockoutTime": [(MODIFY_REPLACE, ["0"])]},
            )
            if not modify_success:
                logger.error(
                    f"LDAP modify operation failed for '{dn}': {self._connection.result}"
                )
                return False

            # Step 3: Programmatic verification of state change
            verified_user = self.get_user_by_samaccountname(sam_account_name)
            if verified_user and not verified_user.is_locked:
                logger.info(
                    f"Successfully unlocked and verified account '{sam_account_name}' (lockoutTime={verified_user.lockoutTime})."
                )
                return True
            else:
                logger.critical(
                    f"Verification failure: account '{sam_account_name}' modify reported success but post-query still indicates locked state!"
                )
                return False
        except Exception as exc:
            logger.error(f"Exception during account unlock for '{sam_account_name}': {exc}")
            return False

    def reset_account_lock_for_test(self, sam_account_name: str, lock_val: str = "133500000000000000"):
        """Utility for test suites to set an account back to locked state."""
        user = self.get_user_by_samaccountname(sam_account_name)
        if user and self._connection:
            self._connection.modify(
                dn=user.dn,
                changes={"lockoutTime": [(MODIFY_REPLACE, [lock_val])]},
            )

    def list_all_users(self) -> List[LdapUserState]:
        """List all Active Directory users in directory with current attributes."""
        if not self._connection:
            self._init_connection()

        attributes = [
            "distinguishedName",
            "sAMAccountName",
            "mail",
            "userAccountControl",
            "lockoutTime",
            "memberOf",
            "department",
        ]
        try:
            self._connection.search(
                search_base=settings.LDAP_BASE_DN,
                search_filter="(sAMAccountName=*)",
                attributes=attributes,
            )
            users = []
            for entry in self._connection.entries:
                uac = 512
                if hasattr(entry, "userAccountControl") and entry.userAccountControl.value:
                    try:
                        uac = int(entry.userAccountControl.value)
                    except (ValueError, TypeError):
                        uac = 512

                lock_time = "0"
                if hasattr(entry, "lockoutTime") and entry.lockoutTime.value is not None:
                    lock_time = str(entry.lockoutTime.value)

                member_of = []
                if hasattr(entry, "memberOf") and entry.memberOf.values:
                    member_of = [str(m) for m in entry.memberOf.values]

                email = str(entry.mail.value) if hasattr(entry, "mail") and entry.mail.value else None
                dept = str(entry.department.value) if hasattr(entry, "department") and entry.department.value else None

                users.append(
                    LdapUserState(
                        dn=entry.entry_dn,
                        sAMAccountName=str(entry.sAMAccountName.value),
                        mail=email,
                        userAccountControl=uac,
                        lockoutTime=lock_time,
                        memberOf=member_of,
                        department=dept,
                    )
                )
            return users
        except Exception as exc:
            logger.error(f"Error listing LDAP users: {exc}")
            return []

    def toggle_user_lock(self, sam_account_name: str) -> bool:
        """Toggle an account between locked and unlocked state for live UI testing."""
        user = self.get_user_by_samaccountname(sam_account_name)
        if not user or not self._connection:
            return False
        new_val = "0" if user.is_locked else "133500000000000000"
        return bool(
            self._connection.modify(
                dn=user.dn,
                changes={"lockoutTime": [(MODIFY_REPLACE, [new_val])]},
            )
        )

    def reset_directory_state(self) -> bool:
        """Reset directory state back to initial seed data."""
        self._init_connection()
        return True

    def is_healthy(self) -> bool:
        """Health check probe."""
        if not self._connection:
            return False
        try:
            self._connection.search(
                search_base=settings.LDAP_BASE_DN,
                search_filter="(objectClass=*)",
                attributes=["dn"],
                size_limit=1,
            )
            return True
        except Exception:
            return False


# Singleton LDAP Engine instance
ldap_engine = LdapEngine()
