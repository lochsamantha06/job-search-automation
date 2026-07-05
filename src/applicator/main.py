import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from src.scraper import JobPosting
from src.applicator.portal_detector import detect_portal
from src.applicator.drivers import workday as workday_driver
from src.applicator.drivers import greenhouse as greenhouse_driver
from src.applicator.drivers import lever as lever_driver

DEFAULT_APPS_FILE = "dashboard/data/applications.json"

DRIVER_MODULES = {
    "workday": workday_driver,
    "greenhouse": greenhouse_driver,
    "lever": lever_driver,
}


def _make_job_id(job: JobPosting) -> str:
    return hashlib.md5(job.url.encode()).hexdigest()[:12]


def _load_applications(apps_file: str = DEFAULT_APPS_FILE) -> list:
    path = Path(apps_file)
    if not path.exists():
        return []
    return json.loads(path.read_text())


def _save_applications(apps: list, apps_file: str = DEFAULT_APPS_FILE):
    path = Path(apps_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(apps, indent=2))


def run_applicator(
    jobs_with_scores: list,
    profile: dict,
    apps_file: str = DEFAULT_APPS_FILE,
) -> list:
    """
    For each High/Medium job, detect portal, fill application, save screenshot.
    Returns list of application dicts added this run.
    """
    existing = _load_applications(apps_file)
    existing_ids = {a["id"] for a in existing}
    new_apps = []

    for job, score, priority, reason in jobs_with_scores:
        if priority == "Low":
            continue

        job_id = _make_job_id(job)
        if job_id in existing_ids:
            continue

        portal = detect_portal(job.url)
        entry = {
            "id": job_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "portal": portal or "unknown",
            "job_url": job.url,
            "screenshot": None,
            "score": score,
            "priority": priority,
            "reason": reason,
            "status": "staged",
            "staged_at": datetime.now(timezone.utc).isoformat(),
        }

        if portal is None:
            print(f"[applicator] Unknown portal for {job.company} — skipping auto-fill")
            entry["status"] = "unknown_portal"
        else:
            fill_fn = DRIVER_MODULES[portal].fill_application
            screenshot_path = fill_fn(job.url, profile, job_id)
            if screenshot_path:
                entry["screenshot"] = screenshot_path
                entry["status"] = "staged"
            else:
                entry["status"] = "fill_failed"

        new_apps.append(entry)

    _save_applications(existing + new_apps, apps_file)
    return new_apps
