import json
import os
import requests

APPS_FILE = "dashboard/data/applications.json"
GITHUB_REPO = "lochsamantha06/job-search-automation"


def handler(event, context):
    body = json.loads(event.get("body") or "{}")
    token = body.get("token", "")
    job_id = body.get("job_id", "")

    if token != os.environ.get("DASHBOARD_SECRET", ""):
        return {"statusCode": 401, "body": json.dumps({"error": "Unauthorized"})}

    if not job_id:
        return {"statusCode": 400, "body": json.dumps({"error": "job_id required"})}

    github_pat = os.environ.get("GITHUB_PAT", "")
    resp = requests.post(
        f"https://api.github.com/repos/{GITHUB_REPO}/actions/workflows/submit.yml/dispatches",
        headers={
            "Authorization": f"token {github_pat}",
            "Accept": "application/vnd.github.v3+json",
        },
        json={"ref": "main", "inputs": {"job_id": job_id}},
        timeout=10,
    )

    if resp.status_code == 204:
        return {"statusCode": 200, "body": json.dumps({"ok": True})}
    return {
        "statusCode": 500,
        "body": json.dumps({"error": f"GitHub API returned {resp.status_code}"}),
    }
