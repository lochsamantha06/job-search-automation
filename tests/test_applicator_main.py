import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from src.scraper import JobPosting
from src.applicator.main import run_applicator, _load_applications, _save_applications, _make_job_id

WORKDAY_JOB = JobPosting(
    title="IB Analyst Intern",
    company="Scotiabank",
    location="Toronto, ON",
    url="https://scotiabank.wd3.myworkdayjobs.com/en-US/Global/job/Toronto/IB-Analyst_R001",
)
GREENHOUSE_JOB = JobPosting(
    title="Consulting Intern",
    company="Deloitte",
    location="Vancouver, BC",
    url="https://boards.greenhouse.io/deloitte/jobs/12345",
)
UNKNOWN_JOB = JobPosting(
    title="Finance Intern",
    company="Unknown Corp",
    location="Toronto, ON",
    url="https://careers.unknowncorp.com/jobs/123",
)

PROFILE = {
    "first_name": "Samantha", "last_name": "Lo", "full_name": "Samantha Lo",
    "email": "test@test.com", "phone": "+1234567890",
    "education": {"school": "UBC"}, "resume_path": "assets/resume.pdf",
    "cover_letter": "Test cover letter",
}


def test_make_job_id_is_deterministic():
    id1 = _make_job_id(WORKDAY_JOB)
    id2 = _make_job_id(WORKDAY_JOB)
    assert id1 == id2


def test_make_job_id_differs_for_different_jobs():
    assert _make_job_id(WORKDAY_JOB) != _make_job_id(GREENHOUSE_JOB)


def test_load_applications_returns_empty_list_when_file_missing(tmp_path):
    result = _load_applications(str(tmp_path / "missing.json"))
    assert result == []


def test_save_and_load_applications(tmp_path):
    path = str(tmp_path / "apps.json")
    apps = [{"id": "abc", "title": "Test", "status": "staged"}]
    _save_applications(apps, path)
    loaded = _load_applications(path)
    assert loaded == apps


@patch("src.applicator.main.workday_driver.fill_application", return_value="/path/to/screenshot.png")
@patch("src.applicator.main.greenhouse_driver.fill_application", return_value=None)
def test_run_applicator_processes_known_portals(mock_gh, mock_wd, tmp_path):
    apps_file = str(tmp_path / "applications.json")
    jobs_with_scores = [
        (WORKDAY_JOB, 9, "High", "IB + Scotiabank"),
        (GREENHOUSE_JOB, 5, "Medium", "Consulting + Deloitte"),
        (UNKNOWN_JOB, 3, "Low", "General"),
    ]
    run_applicator(jobs_with_scores, PROFILE, apps_file=apps_file)
    apps = _load_applications(apps_file)
    # Only Workday and Greenhouse jobs staged (Unknown skipped — Low priority)
    assert len(apps) == 2
    assert mock_wd.call_count == 1
    assert mock_gh.call_count == 1


@patch("src.applicator.main.workday_driver.fill_application", return_value=None)
def test_run_applicator_skips_failed_screenshots(mock_wd, tmp_path):
    apps_file = str(tmp_path / "applications.json")
    jobs_with_scores = [(WORKDAY_JOB, 9, "High", "reason")]
    run_applicator(jobs_with_scores, PROFILE, apps_file=apps_file)
    apps = _load_applications(apps_file)
    # Failed screenshot → status is "fill_failed"
    assert apps[0]["status"] == "fill_failed"
