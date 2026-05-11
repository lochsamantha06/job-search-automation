# src/sms.py
"""
Send a daily SMS digest via Twilio.

Message format:
  📋 Job Digest – May 11
  3 new postings today

  🔴 HIGH (2)
  • IB Analyst Intern @ Scotiabank – Rolling
  • Capital Markets Co-op @ RBC – Rolling

  🟡 MEDIUM (1)
  • Strategy Consulting @ Deloitte – Rolling

  Full list: https://docs.google.com/spreadsheets/d/<SHEET_ID>
"""

import datetime
from twilio.rest import Client


def _format_digest(jobs_with_scores: list, spreadsheet_id: str) -> str:
    """
    Build the SMS body from a list of (JobPosting, score, priority, reason) tuples.
    Returns the formatted string (Twilio will truncate at 1600 chars if needed).
    """
    today = datetime.date.today().strftime("%b %-d") if hasattr(datetime.date.today(), "strftime") else datetime.date.today().isoformat()
    # strftime with %-d is Linux-only; use lstrip for cross-platform
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

    lines.append(f"Full list: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")
    return "\n".join(lines)


def send_digest(
    jobs_with_scores: list,
    spreadsheet_id: str,
    twilio_account_sid: str,
    twilio_auth_token: str,
    twilio_from_number: str,
    to_number: str,
) -> bool:
    """
    Send the daily digest SMS.
    Returns True on success, False on any error.
    Skips sending if there are no new jobs.
    """
    if not jobs_with_scores:
        print("[sms] No new jobs today — skipping SMS.")
        return True

    body = _format_digest(jobs_with_scores, spreadsheet_id)

    try:
        client = Client(twilio_account_sid, twilio_auth_token)
        message = client.messages.create(
            body=body,
            from_=twilio_from_number,
            to=to_number,
        )
        print(f"[sms] Sent digest. SID: {message.sid}")
        return True
    except Exception as e:
        print(f"[sms] Twilio error: {e}")
        return False
