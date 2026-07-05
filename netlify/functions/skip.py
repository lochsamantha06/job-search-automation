import json
import os
from pathlib import Path

APPS_FILE = "dashboard/data/applications.json"


def handler(event, context):
    body = json.loads(event.get("body") or "{}")
    token = body.get("token", "")
    job_id = body.get("job_id", "")

    if token != os.environ.get("DASHBOARD_SECRET", ""):
        return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    if not job_id:
        return {"statusCode": 400, "body": json.dumps({"error": "job_id required"})}

    path = Path(APPS_FILE)
    apps = json.loads(path.read_text()) if path.exists() else []
    for app in apps:
        if app["id"] == job_id:
            app["status"] = "skipped"
            break
    path.write_text(json.dumps(apps, indent=2))

    return {"statusCode": 200, "body": json.dumps({"ok": True})}
