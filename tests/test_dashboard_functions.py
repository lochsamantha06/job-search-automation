import json
import pytest
from unittest.mock import patch, MagicMock


def _make_event(body: dict, token: str = "valid_token") -> dict:
    return {
        "httpMethod": "POST",
        "body": json.dumps({**body, "token": token}),
        "headers": {},
    }


@patch.dict("os.environ", {"DASHBOARD_SECRET": "valid_token", "GITHUB_PAT": "ghp_test"})
@patch("requests.post")
def test_approve_triggers_github_workflow(mock_post, tmp_path):
    mock_post.return_value = MagicMock(status_code=204)

    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([{"id": "abc123", "status": "staged", "title": "IB Intern"}]))

    import netlify.functions.approve as approve_fn
    with patch.object(approve_fn, "APPS_FILE", str(apps_file)):
        result = approve_fn.handler(_make_event({"job_id": "abc123"}), {})

    assert result["statusCode"] == 200
    mock_post.assert_called_once()


@patch.dict("os.environ", {"DASHBOARD_SECRET": "valid_token", "GITHUB_PAT": "ghp_test"})
def test_approve_rejects_invalid_token():
    import netlify.functions.approve as approve_fn
    result = approve_fn.handler(_make_event({"job_id": "abc123"}, token="wrong"), {})
    assert result["statusCode"] == 401


@patch.dict("os.environ", {"DASHBOARD_SECRET": "valid_token"})
def test_skip_updates_status(tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([{"id": "abc123", "status": "staged", "title": "IB Intern"}]))

    import netlify.functions.skip as skip_fn
    with patch.object(skip_fn, "APPS_FILE", str(apps_file)):
        result = skip_fn.handler(_make_event({"job_id": "abc123"}), {})

    assert result["statusCode"] == 200
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "skipped"
