import json
import secrets
import string
from pathlib import Path

DEFAULT_ACCOUNTS_FILE = "data/portal_accounts.json"


def _generate_password() -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(16))


def get_credentials(portal: str, accounts_file: str = DEFAULT_ACCOUNTS_FILE) -> dict | None:
    """Return saved credentials for portal, or None if not found."""
    path = Path(accounts_file)
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    return data.get(portal)


def save_credentials(portal: str, email: str, password: str, accounts_file: str = DEFAULT_ACCOUNTS_FILE):
    """Save credentials for a portal, preserving existing entries."""
    path = Path(accounts_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(path.read_text()) if path.exists() else {}
    data[portal] = {"email": email, "password": password}
    path.write_text(json.dumps(data, indent=2))
