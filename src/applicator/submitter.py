import json
from pathlib import Path

from src.applicator.drivers import workday as workday_driver
from src.applicator.drivers import greenhouse as greenhouse_driver
from src.applicator.drivers import lever as lever_driver

DEFAULT_APPS_FILE = "dashboard/data/applications.json"

SUBMIT_DRIVERS = {
    "workday": workday_driver,
    "greenhouse": greenhouse_driver,
    "lever": lever_driver,
}


def _update_status(job_id: str, status: str, apps_file: str = DEFAULT_APPS_FILE):
    path = Path(apps_file)
    apps = json.loads(path.read_text()) if path.exists() else []
    for app in apps:
        if app["id"] == job_id:
            app["status"] = status
            break
    path.write_text(json.dumps(apps, indent=2))


def submit_job(job_id: str, profile: dict, apps_file: str = DEFAULT_APPS_FILE) -> bool:
    """Load the staged application by job_id, re-fill and submit. Returns True on success."""
    path = Path(apps_file)
    apps = json.loads(path.read_text()) if path.exists() else []
    app = next((a for a in apps if a["id"] == job_id), None)

    if not app:
        print(f"[submitter] Job ID {job_id} not found in {apps_file}")
        return False

    portal = app.get("portal")
    driver_module = SUBMIT_DRIVERS.get(portal)

    if not driver_module:
        print(f"[submitter] No submit driver for portal '{portal}'")
        _update_status(job_id, "failed", apps_file)
        return False

    success = driver_module.submit_application(app["job_url"], profile, job_id)
    _update_status(job_id, "submitted" if success else "failed", apps_file)
    return success
