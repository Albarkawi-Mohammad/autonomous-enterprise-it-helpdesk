"""
Unit Tests for Deterministic LDAP Engine
Autonomous Enterprise IT Helpdesk & Triage Engine
"""
from app.ldap_engine import ldap_engine


def test_ldap_get_standard_locked_user():
    user = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user is not None
    assert user.sAMAccountName == "demo.user01"
    assert user.is_locked is True
    assert user.lockoutTime != "0"
    assert any("Finance Department" in g for g in user.memberOf)


def test_ldap_get_privileged_admin_user():
    user = ldap_engine.get_user_by_samaccountname("demo.user03")
    assert user is not None
    assert user.sAMAccountName == "demo.user03"
    assert any("Domain Admins" in g for g in user.memberOf)


def test_ldap_get_nonexistent_user():
    user = ldap_engine.get_user_by_samaccountname("ghost_user_999")
    assert user is None


def test_ldap_unlock_account_and_verify_state_change():
    # Verify locked before
    user_before = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user_before.is_locked is True

    # Execute deterministic unlock
    success = ldap_engine.unlock_ad_account("demo.user01")
    assert success is True

    # Programmatically verify state changed in LDAP directory
    user_after = ldap_engine.get_user_by_samaccountname("demo.user01")
    assert user_after.is_locked is False
    assert user_after.lockoutTime == "0"


def test_ldap_unlock_nonexistent_user():
    success = ldap_engine.unlock_ad_account("nonexistent_user")
    assert success is False
