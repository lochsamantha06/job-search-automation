import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from src.applicator.submitter import submit_job, _update_status

PROFILE = {
    "first_name": "Samantha", "last_name": "Lo", "full_name": "Samantha Lo",
    "email": "test@test.com", "phone": "+1234567890",
    "education": {"school": "UBC"}, "resume_path": "assets/resume.pdf",
    "cover_letter": "Test",
}
APP = {
    "id": "abc123",
    "title": "IB Intern",
    "company": "Scotiabank",
    "portal": "workday",
    "job_url": "https://scotiabank.wd3.myworkdayjobs.com/job/123",
    "status": "approved",
}


def test_update_status_changes_status(tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    _update_status("abc123", "submitted", str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "submitted"


def test_update_status_no_op_for_missing_id(tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    _update_status("nonexistent", "submitted", str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "approved"  # unchanged


@patch("src.applicator.drivers.workday.submit_application", return_value=True)
def test_submit_job_workday_calls_driver(mock_submit, tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    result = submit_job("abc123", PROFILE, apps_file=str(apps_file))
    assert result is True
    mock_submit.assert_called_once()


@patch("src.applicator.drivers.workday.submit_application", return_value=True)
def test_submit_job_updates_status_on_success(mock_submit, tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    submit_job("abc123", PROFILE, apps_file=str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "submitted"


@patch("src.applicator.drivers.workday.submit_application", return_value=False)
def test_submit_job_updates_status_on_failure(mock_submit, tmp_path):
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    submit_job("abc123", PROFILE, apps_file=str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "failed"
