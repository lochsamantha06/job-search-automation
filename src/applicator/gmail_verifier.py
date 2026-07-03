"""
Polls Gmail inbox for an email verification link and returns it.
Uses Gmail API with OAuth2 refresh token from env var GMAIL_CREDENTIALS_JSON.
"""

import base64
import json
import os
import re
import time

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _get_service(creds_json: str):
    data = json.loads(creds_json)
    creds = Credentials(
        token=None,
        refresh_token=data["refresh_token"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
    )
    return build("gmail", "v1", credentials=creds)


def find_verification_link(sender_domain: str, timeout_seconds: int = 300, poll_interval: int = 10) -> str | None:
    """
    Poll Gmail for a verification email from sender_domain.
    Returns the first https:// verification link found, or None on timeout.
    """
    creds_json = os.environ.get("GMAIL_CREDENTIALS_JSON")
    if not creds_json:
        print("[gmail_verifier] GMAIL_CREDENTIALS_JSON not set — skipping verification")
        return None

    service = _get_service(creds_json)
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        results = service.users().messages().list(
            userId="me",
            q=f"from:{sender_domain} is:unread subject:verify",
            maxResults=1,
        ).execute()

        messages = results.get("messages", [])
        if messages:
            msg = service.users().messages().get(
                userId="me", id=messages[0]["id"], format="full"
            ).execute()

            body = ""
            payload = msg.get("payload", {})
            parts = payload.get("parts", [payload])
            for part in parts:
                data = part.get("body", {}).get("data", "")
                if data:
                    body += base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

            links = re.findall(r"https://[^\s\"'>]+", body)
            for link in links:
                if "verif" in link.lower() or "confirm" in link.lower() or "activate" in link.lower():
                    service.users().messages().modify(
                        userId="me", id=messages[0]["id"],
                        body={"removeLabelIds": ["UNREAD"]}
                    ).execute()
                    return link

        time.sleep(poll_interval)

    print(f"[gmail_verifier] Timeout waiting for verification email from {sender_domain}")
    return None
