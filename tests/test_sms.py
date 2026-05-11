import pytest
from unittest.mock import MagicMock, patch
from src.scraper import JobPosting
from src.sms import send_digest, _format_digest


def _job(title="IB Analyst Intern", company="Scotiabank", deadline="Rolling"):
    return JobPosting(title=title, company=company, location="Toronto, ON",
                      url="https://ca.indeed.com/job/1", deadline=deadline)


HIGH = (_job("IB Analyst Intern", "Scotiabank"), 9, "High", "IB + Scotiabank")
MEDIUM = (_job("Strategy Consulting Intern", "Deloitte"), 5, "Medium", "Consulting + Deloitte")
LOW = (_job("Summer Intern", "Unknown Corp"), 2, "Low", "General posting")


def test_format_digest_contains_totals():
    digest = _format_digest([HIGH, MEDIUM, LOW], "sheet123")
    assert "3 new postings today" in digest


def test_format_digest_groups_by_priority():
    digest = _format_digest([HIGH, MEDIUM], "sheet123")
    assert "HIGH" in digest
    assert "MEDIUM" in digest
    assert "LOW" not in digest


def test_format_digest_includes_deadline():
    digest = _format_digest([HIGH], "sheet123")
    assert "Rolling" in digest


def test_format_digest_includes_sheet_link():
    digest = _format_digest([HIGH], "my_sheet_id")
    assert "my_sheet_id" in digest


def test_format_digest_singular_posting():
    digest = _format_digest([HIGH], "sid")
    assert "1 new posting today" in digest


def test_format_digest_empty_list():
    digest = _format_digest([], "sid")
    assert "0 new postings today" in digest


@patch("src.sms.Client")
def test_send_digest_returns_true_on_success(mock_client_cls):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    mock_message = MagicMock()
    mock_message.sid = "SM123"
    mock_client.messages.create.return_value = mock_message

    result = send_digest(
        [HIGH],
        spreadsheet_id="sid",
        twilio_account_sid="AC123",
        twilio_auth_token="auth",
        twilio_from_number="+15005550006",
        to_number="+16045551234",
    )
    assert result is True
    mock_client.messages.create.assert_called_once()


@patch("src.sms.Client")
def test_send_digest_returns_false_on_twilio_error(mock_client_cls):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    mock_client.messages.create.side_effect = Exception("Twilio error")

    result = send_digest(
        [HIGH],
        spreadsheet_id="sid",
        twilio_account_sid="AC123",
        twilio_auth_token="auth",
        twilio_from_number="+15005550006",
        to_number="+16045551234",
    )
    assert result is False


@patch("src.sms.Client")
def test_send_digest_skips_when_no_jobs(mock_client_cls):
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client

    result = send_digest(
        [],
        spreadsheet_id="sid",
        twilio_account_sid="AC123",
        twilio_auth_token="auth",
        twilio_from_number="+15005550006",
        to_number="+16045551234",
    )
    assert result is True
    mock_client.messages.create.assert_not_called()
