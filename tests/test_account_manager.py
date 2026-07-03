import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from src.applicator.account_manager import get_credentials, save_credentials, _generate_password

PROFILE = {
    "email": "lochsamantha06@gmail.com",
    "first_name": "Samantha",
    "last_name": "Lo",
}


def test_generate_password_length():
    pwd = _generate_password()
    assert len(pwd) == 16


def test_generate_password_unique():
    assert _generate_password() != _generate_password()


def test_get_credentials_returns_existing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({
        "workday": {"email": "lochsamantha06@gmail.com", "password": "abc123"}
    }))
    creds = get_credentials("workday", accounts_file=str(accounts_file))
    assert creds["email"] == "lochsamantha06@gmail.com"
    assert creds["password"] == "abc123"


def test_get_credentials_returns_none_when_missing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({}))
    assert get_credentials("workday", accounts_file=str(accounts_file)) is None


def test_get_credentials_returns_none_when_file_missing(tmp_path):
    assert get_credentials("workday", accounts_file=str(tmp_path / "missing.json")) is None


def test_save_credentials_writes_file(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    save_credentials("greenhouse", "test@test.com", "pass123", accounts_file=str(accounts_file))
    data = json.loads(accounts_file.read_text())
    assert data["greenhouse"]["email"] == "test@test.com"
    assert data["greenhouse"]["password"] == "pass123"


def test_save_credentials_preserves_existing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({"workday": {"email": "a@b.com", "password": "x"}}))
    save_credentials("greenhouse", "c@d.com", "y", accounts_file=str(accounts_file))
    data = json.loads(accounts_file.read_text())
    assert "workday" in data
    assert "greenhouse" in data
