import pytest
from unittest.mock import MagicMock, patch, call
from src.scraper import JobPosting
from src.sheets import get_seen_urls, append_jobs, SHEET_HEADER


def _mock_ws(existing_rows=None):
    """Return a mock gspread worksheet."""
    ws = MagicMock()
    if existing_rows is None:
        existing_rows = []
    ws.row_count = len(existing_rows)
    ws.row_values.return_value = SHEET_HEADER if existing_rows else []
    # col_values(5) returns URL column including header
    url_values = (
        [SHEET_HEADER[4]] + [r[4] for r in existing_rows]
        if existing_rows
        else []
    )
    ws.col_values.return_value = url_values
    return ws


def _job(url="https://ca.indeed.com/job/1") -> JobPosting:
    return JobPosting(
        title="IB Analyst Intern",
        company="Scotiabank",
        location="Toronto, ON",
        url=url,
    )


@patch("src.sheets._get_worksheet")
def test_get_seen_urls_returns_url_set(mock_get_ws):
    ws = _mock_ws(
        existing_rows=[
            ["2026-05-11", "Title", "Co", "Loc", "https://ca.indeed.com/job/1",
             8, "High", "reason", "Rolling", "", "", "", "", "New"],
        ]
    )
    mock_get_ws.return_value = ws
    seen = get_seen_urls("sheet_id", "creds.json")
    assert "https://ca.indeed.com/job/1" in seen


@patch("src.sheets._get_worksheet")
def test_get_seen_urls_empty_sheet_returns_empty_set(mock_get_ws):
    ws = MagicMock()
    ws.row_count = 0
    ws.row_values.return_value = []
    ws.col_values.return_value = []
    mock_get_ws.return_value = ws
    seen = get_seen_urls("sheet_id", "creds.json")
    assert seen == set()


@patch("src.sheets._get_worksheet")
def test_get_seen_urls_returns_empty_on_error(mock_get_ws):
    mock_get_ws.side_effect = Exception("API error")
    seen = get_seen_urls("sheet_id", "creds.json")
    assert seen == set()


@patch("src.sheets._get_worksheet")
def test_append_jobs_returns_count(mock_get_ws):
    ws = MagicMock()
    ws.row_count = 1
    ws.row_values.return_value = SHEET_HEADER
    mock_get_ws.return_value = ws

    jobs_with_scores = [
        (_job("https://ca.indeed.com/job/1"), 9, "High", "IB + Scotiabank"),
        (_job("https://ca.indeed.com/job/2"), 5, "Medium", "Consulting"),
    ]
    count = append_jobs(jobs_with_scores, "sheet_id", "creds.json")
    assert count == 2
    ws.append_rows.assert_called_once()


@patch("src.sheets._get_worksheet")
def test_append_jobs_empty_list_returns_zero(mock_get_ws):
    count = append_jobs([], "sheet_id", "creds.json")
    assert count == 0
    mock_get_ws.assert_not_called()


@patch("src.sheets._get_worksheet")
def test_append_jobs_returns_zero_on_error(mock_get_ws):
    mock_get_ws.side_effect = Exception("API error")
    jobs_with_scores = [(_job(), 8, "High", "reason")]
    count = append_jobs(jobs_with_scores, "sheet_id", "creds.json")
    assert count == 0


@patch("src.sheets._get_worksheet")
def test_appended_row_has_correct_columns(mock_get_ws):
    ws = MagicMock()
    ws.row_count = 1
    ws.row_values.return_value = SHEET_HEADER
    mock_get_ws.return_value = ws

    job = _job("https://ca.indeed.com/job/42")
    append_jobs([(job, 9, "High", "IB + Scotiabank (+4), Scotiabank referral (+4)")], "sid", "c.json")

    appended = ws.append_rows.call_args[0][0]
    row = appended[0]
    assert row[1] == "IB Analyst Intern"   # title
    assert row[2] == "Scotiabank"           # company
    assert row[4] == "https://ca.indeed.com/job/42"  # url
    assert row[5] == 9                      # score
    assert row[6] == "High"                 # priority
    assert row[13] == "New"                 # status default
