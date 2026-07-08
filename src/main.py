import json
import os
import subprocess
from dotenv import load_dotenv

from src.scraper import scrape_all
from src.deduplicator import filter_new_jobs
from src.scorer import score_job
from src.sheets import get_seen_urls, append_jobs
from src.contact_finder import find_contact
from src.message_drafter import draft_message
from src.sms import send_digest
from src.applicator.main import run_applicator


def load_config() -> dict:
    load_dotenv()
    required = [
        "GOOGLE_SHEETS_ID", "GOOGLE_CREDENTIALS_PATH",
        "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER", "TO_PHONE_NUMBER", "ANTHROPIC_API_KEY",
    ]
    config = {}
    missing = []
    for key in required:
        val = os.environ.get(key)
        if not val:
            missing.append(key)
        config[key] = val
    config["HUNTER_API_KEY"] = os.environ.get("HUNTER_API_KEY")
    config["DASHBOARD_URL"] = os.environ.get("DASHBOARD_URL", "")
    config["DASHBOARD_SECRET"] = os.environ.get("DASHBOARD_SECRET", "")
    if missing:
        raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")
    return config


def run(config: dict) -> dict:
    sheet_id = config["GOOGLE_SHEETS_ID"]
    creds_path = config["GOOGLE_CREDENTIALS_PATH"]

    print("[main] Reading seen URLs from Google Sheets...")
    seen_urls = get_seen_urls(sheet_id, creds_path)

    print("[main] Scraping Indeed...")
    raw_jobs = scrape_all()
    print(f"[main] Scraped {len(raw_jobs)} raw postings.")

    new_jobs = filter_new_jobs(raw_jobs, seen_urls)
    print(f"[main] {len(new_jobs)} new postings after deduplication.")

    if not new_jobs:
        send_digest([], sheet_id,
                    config["TWILIO_ACCOUNT_SID"], config["TWILIO_AUTH_TOKEN"],
                    config["TWILIO_FROM_NUMBER"], config["TO_PHONE_NUMBER"],
                    config.get("DASHBOARD_URL", ""))
        return {"scraped": len(raw_jobs), "new": 0, "appended": 0, "sms_sent": True, "applied": 0}

    jobs_with_scores = []
    for job in new_jobs:
        score, priority, reason = score_job(job.title, job.company, job.description)
        jobs_with_scores.append((job, score, priority, reason))

    enriched = []
    for job, score, priority, reason in jobs_with_scores:
        if priority in ("High", "Medium"):
            contact = find_contact(job.company, config.get("HUNTER_API_KEY"))
            outreach = draft_message(job.title, job.company, contact.name, config["ANTHROPIC_API_KEY"])
            job._contact = contact
            job._outreach = outreach
        enriched.append((job, score, priority, reason))

    print("[main] Running applicator...")
    profile_path = "assets/profile.json"
    if os.path.exists(profile_path):
        profile = json.loads(open(profile_path).read())
        new_apps = run_applicator(enriched, profile)
        print(f"[main] {len(new_apps)} applications staged.")

        subprocess.run(["git", "config", "user.email", "actions@github.com"], check=False)
        subprocess.run(["git", "config", "user.name", "GitHub Actions"], check=False)
        subprocess.run(["git", "add", "dashboard/data/"], check=False)
        result = subprocess.run(["git", "diff", "--staged", "--quiet"])
        if result.returncode != 0:
            subprocess.run(["git", "commit", "-m", "chore: stage new applications"], check=False)
            subprocess.run(["git", "push"], check=False)
    else:
        new_apps = []
        print("[main] assets/profile.json not found — skipping applicator")

    print("[main] Appending to Google Sheets...")
    appended = append_jobs(enriched, sheet_id, creds_path)

    print("[main] Sending SMS digest...")
    sms_sent = send_digest(
        enriched, sheet_id,
        config["TWILIO_ACCOUNT_SID"], config["TWILIO_AUTH_TOKEN"],
        config["TWILIO_FROM_NUMBER"], config["TO_PHONE_NUMBER"],
        config.get("DASHBOARD_URL", ""),
    )

    summary = {
        "scraped": len(raw_jobs), "new": len(new_jobs),
        "appended": appended, "sms_sent": sms_sent, "applied": len(new_apps),
    }
    print(f"[main] Done. {summary}")
    return summary


if __name__ == "__main__":
    cfg = load_config()
    run(cfg)
