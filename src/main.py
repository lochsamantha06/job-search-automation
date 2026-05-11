# src/main.py
"""
Daily job search pipeline orchestrator.

Run order:
  1. Load config from environment variables
  2. Read seen URLs from Google Sheets (deduplication)
  3. Scrape Indeed for all company+location combos
  4. Filter to new-only jobs
  5. Score each job
  6. For High/Medium jobs: find recruiter contact + draft outreach message
  7. Append all new jobs to Google Sheets
  8. Send SMS digest
"""

import os
from dotenv import load_dotenv

from src.scraper import scrape_all
from src.deduplicator import filter_new_jobs
from src.scorer import score_job
from src.sheets import get_seen_urls, append_jobs
from src.contact_finder import find_contact
from src.message_drafter import draft_message
from src.sms import send_digest


def load_config() -> dict:
    """Load and validate required environment variables. Raises on missing keys."""
    load_dotenv()
    required = [
        "GOOGLE_SHEETS_ID",
        "GOOGLE_CREDENTIALS_PATH",
        "TWILIO_ACCOUNT_SID",
        "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER",
        "TO_PHONE_NUMBER",
        "ANTHROPIC_API_KEY",
    ]
    config = {}
    missing = []
    for key in required:
        val = os.environ.get(key)
        if not val:
            missing.append(key)
        config[key] = val

    # Hunter.io is optional (falls back to LinkedIn URL)
    config["HUNTER_API_KEY"] = os.environ.get("HUNTER_API_KEY")

    if missing:
        raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")
    return config


def run(config: dict) -> dict:
    """
    Execute the full pipeline.
    Returns a summary dict: {scraped, new, appended, sms_sent}.
    """
    sheet_id = config["GOOGLE_SHEETS_ID"]
    creds_path = config["GOOGLE_CREDENTIALS_PATH"]

    # Step 1: Get seen URLs for deduplication
    print("[main] Reading seen URLs from Google Sheets...")
    seen_urls = get_seen_urls(sheet_id, creds_path)
    print(f"[main] {len(seen_urls)} URLs already logged.")

    # Step 2: Scrape
    print("[main] Scraping Indeed...")
    raw_jobs = scrape_all()
    print(f"[main] Scraped {len(raw_jobs)} raw postings.")

    # Step 3: Deduplicate
    new_jobs = filter_new_jobs(raw_jobs, seen_urls)
    print(f"[main] {len(new_jobs)} new postings after deduplication.")

    if not new_jobs:
        print("[main] No new jobs. Sending empty digest and exiting.")
        send_digest([], sheet_id,
                    config["TWILIO_ACCOUNT_SID"], config["TWILIO_AUTH_TOKEN"],
                    config["TWILIO_FROM_NUMBER"], config["TO_PHONE_NUMBER"])
        return {"scraped": len(raw_jobs), "new": 0, "appended": 0, "sms_sent": True}

    # Step 4: Score each job
    jobs_with_scores = []
    for job in new_jobs:
        score, priority, reason = score_job(job.title, job.company, job.description)
        jobs_with_scores.append((job, score, priority, reason))

    # Step 5: Enrich High/Medium jobs with contact + outreach draft
    enriched = []
    for job, score, priority, reason in jobs_with_scores:
        contact_name = ""
        if priority in ("High", "Medium"):
            contact = find_contact(job.company, config.get("HUNTER_API_KEY"))
            contact_name = contact.name
            outreach = draft_message(
                job.title, job.company, contact_name, config["ANTHROPIC_API_KEY"]
            )
            # Attach enrichment back onto the job object fields
            job.description = job.description  # keep existing
            # Store for sheet appending via side-channel (sheet.py uses flat tuple)
            job._contact = contact
            job._outreach = outreach
        enriched.append((job, score, priority, reason))

    # Step 6: Append to Google Sheets
    print("[main] Appending to Google Sheets...")
    appended = append_jobs(enriched, sheet_id, creds_path)
    print(f"[main] Appended {appended} rows.")

    # Step 7: Send SMS
    print("[main] Sending SMS digest...")
    sms_sent = send_digest(
        enriched,
        sheet_id,
        config["TWILIO_ACCOUNT_SID"],
        config["TWILIO_AUTH_TOKEN"],
        config["TWILIO_FROM_NUMBER"],
        config["TO_PHONE_NUMBER"],
    )

    summary = {
        "scraped": len(raw_jobs),
        "new": len(new_jobs),
        "appended": appended,
        "sms_sent": sms_sent,
    }
    print(f"[main] Done. Summary: {summary}")
    return summary


if __name__ == "__main__":
    cfg = load_config()
    run(cfg)
