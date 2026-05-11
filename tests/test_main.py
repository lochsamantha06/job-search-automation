import pytest
from unittest.mock import MagicMock, patch
from src.scraper import JobPosting
from src.main import run, load_config


def _job(title="IB Analyst Intern", company="Scotiabank", url="https://ca.indeed.com/job/1"):
    return JobPosting(title=title, company=company, location="Toronto, ON", url=url)


BASE_CONFIG = {
    "GOOGLE_SHEETS_ID": "sheet_id",
    "GOOGLE_CREDENTIALS_PATH": "creds.json",
    "TWILIO_ACCOUNT_SID": "AC123",
    "TWILIO_AUTH_TOKEN": "auth",
    "TWILIO_FROM_NUMBER": "+15005550006",
    "TO_PHONE_NUMBER": "+16045551234",
    "ANTHROPIC_API_KEY": "sk-test",
    "HUNTER_API_KEY": None,
}


@patch("src.main.send_digest", return_value=True)
@patch("src.main.append_jobs", return_value=0)
@patch("src.main.scrape_all", return_value=[])
@patch("src.main.get_seen_urls", return_value=set())
def test_run_no_jobs_returns_zero_new(mock_seen, mock_scrape, mock_append, mock_sms):
    result = run(BASE_CONFIG)
    assert result["new"] == 0
    assert result["scraped"] == 0
    mock_append.assert_not_called()


@patch("src.main.send_digest", return_value=True)
@patch("src.main.append_jobs", return_value=2)
@patch("src.main.draft_message", return_value="Draft email text")
@patch("src.main.find_contact")
@patch("src.main.scrape_all")
@patch("src.main.get_seen_urls", return_value=set())
def test_run_new_jobs_appended(mock_seen, mock_scrape, mock_contact, mock_draft, mock_append, mock_sms):
    mock_scrape.return_value = [
        _job("IB Analyst Intern", "Scotiabank", "https://ca.indeed.com/job/1"),
        _job("Finance Co-op", "RBC", "https://ca.indeed.com/job/2"),
    ]
    mock_contact.return_value = MagicMock(name="Jane Smith", email="jane@scotiabank.com", linkedin_url="https://linkedin.com")
    mock_contact.return_value.name = "Jane Smith"

    result = run(BASE_CONFIG)
    assert result["new"] == 2
    assert result["appended"] == 2
    mock_append.assert_called_once()


@patch("src.main.send_digest", return_value=True)
@patch("src.main.append_jobs", return_value=1)
@patch("src.main.draft_message", return_value="Draft email")
@patch("src.main.find_contact")
@patch("src.main.scrape_all")
@patch("src.main.get_seen_urls")
def test_run_deduplicates_seen_urls(mock_seen, mock_scrape, mock_contact, mock_draft, mock_append, mock_sms):
    mock_seen.return_value = {"https://ca.indeed.com/job/1"}
    mock_scrape.return_value = [
        _job(url="https://ca.indeed.com/job/1"),  # seen
        _job(url="https://ca.indeed.com/job/2"),  # new
    ]
    mock_contact.return_value = MagicMock()
    mock_contact.return_value.name = ""

    result = run(BASE_CONFIG)
    assert result["scraped"] == 2
    assert result["new"] == 1


@patch("src.main.send_digest", return_value=True)
@patch("src.main.append_jobs", return_value=0)
@patch("src.main.scrape_all", return_value=[])
@patch("src.main.get_seen_urls", return_value=set())
def test_run_sends_sms(mock_seen, mock_scrape, mock_append, mock_sms):
    run(BASE_CONFIG)
    mock_sms.assert_called_once()


@patch("src.main.send_digest", return_value=True)
@patch("src.main.append_jobs", return_value=1)
@patch("src.main.draft_message", return_value="Draft")
@patch("src.main.find_contact")
@patch("src.main.scrape_all")
@patch("src.main.get_seen_urls", return_value=set())
def test_run_only_enriches_high_medium(mock_seen, mock_scrape, mock_contact, mock_draft, mock_append, mock_sms):
    # Low priority job: "Summer Intern" at "Unknown Corp" → score < 5 → Low
    mock_scrape.return_value = [
        _job("Summer Intern", "Unknown Corp", "https://ca.indeed.com/job/low"),
    ]
    mock_contact.return_value = MagicMock()
    mock_contact.return_value.name = ""

    run(BASE_CONFIG)
    # draft_message should NOT be called for Low priority jobs
    mock_draft.assert_not_called()


def test_load_config_raises_on_missing_vars(monkeypatch):
    # Clear all required env vars
    for key in ["GOOGLE_SHEETS_ID", "GOOGLE_CREDENTIALS_PATH",
                 "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
                 "TWILIO_FROM_NUMBER", "TO_PHONE_NUMBER", "ANTHROPIC_API_KEY"]:
        monkeypatch.delenv(key, raising=False)

    with pytest.raises(EnvironmentError, match="Missing required env vars"):
        load_config()
