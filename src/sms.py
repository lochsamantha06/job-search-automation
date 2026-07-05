import datetime
import hashlib
import hmac
import os

from twilio.rest import Client


def _daily_token() -> str:
    """Generate a daily rotating token from DASHBOARD_SECRET + today's date."""
    secret = os.environ.get("DASHBOARD_SECRET", "changeme")
    today = datetime.date.today().isoformat()
    return hmac.new(secret.encode(), today.encode(), hashlib.sha256).hexdigest()[:24]


def _format_digest(jobs_with_scores: list, spreadsheet_id: str, dashboard_url: str = "") -> str:
    today = datetime.date.today().strftime("%b %d").lstrip()

    high = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "High"]
    medium = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "Medium"]
    low = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "Low"]

    lines = [
        f"📋 Job Digest – {today}",
        f"{len(jobs_with_scores)} new posting{'s' if len(jobs_with_scores) != 1 else ''} today",
        "",
    ]

    if high:
        lines.append(f"🔴 HIGH ({len(high)})")
        for job, *_ in high:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    if medium:
        lines.append(f"🟡 MEDIUM ({len(medium)})")
        for job, *_ in medium:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    if low:
        lines.append(f"⚪ LOW ({len(low)})")
        for job, *_ in low:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    lines.append(f"📊 Sheets: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")

    if dashboard_url:
        token = _daily_token()
        lines.append(f"✅ Review & approve: {dashboard_url}?token={token}")

    return "\n".join(lines)


def send_digest(
    jobs_with_scores: list,
    spreadsheet_id: str,
    twilio_account_sid: str,
    twilio_auth_token: str,
    twilio_from_number: str,
    to_number: str,
    dashboard_url: str = "",
) -> bool:
    if not jobs_with_scores:
        print("[sms] No new jobs today — skipping SMS.")
        return True

    body = _format_digest(jobs_with_scores, spreadsheet_id, dashboard_url)

    try:
        client = Client(twilio_account_sid, twilio_auth_token)
        message = client.messages.create(body=body, from_=twilio_from_number, to=to_number)
        print(f"[sms] Sent digest. SID: {message.sid}")
        return True
    except Exception as e:
        print(f"[sms] Twilio error: {e}")
        return False
