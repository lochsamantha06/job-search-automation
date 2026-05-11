# src/sheets.py
"""
Google Sheets logger.
Appends scored job postings to a spreadsheet and reads back seen URLs
so the deduplicator can filter jobs already logged.

Sheet columns (1-indexed):
  A  Date Added        (YYYY-MM-DD)
  B  Job Title
  C  Company
  D  Location
  E  URL
  F  Score
  G  Priority          (High / Medium / Low)
  H  Reason
  I  Deadline
  J  Contact Name
  K  Contact Email
  L  LinkedIn Search
  M  Outreach Draft
  N  Status            (default: "New")
"""

import datetime
import gspread
from google.oauth2.service_account import Credentials

SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.readonly",
]

SHEET_HEADER = [
    "Date Added", "Job Title", "Company", "Location", "URL",
    "Score", "Priority", "Reason", "Deadline",
    "Contact Name", "Contact Email", "LinkedIn Search",
    "Outreach Draft", "Status",
]


def _get_worksheet(spreadsheet_id: str, credentials_path: str):
    """Authenticate and return the first worksheet of the spreadsheet."""
    creds = Credentials.from_service_account_file(credentials_path, scopes=SCOPES)
    client = gspread.authorize(creds)
    sh = client.open_by_key(spreadsheet_id)
    ws = sh.sheet1

    # Write header if the sheet is empty
    if ws.row_count == 0 or not ws.row_values(1):
        ws.append_row(SHEET_HEADER, value_input_option="RAW")

    return ws


def get_seen_urls(spreadsheet_id: str, credentials_path: str) -> set:
    """
    Return the set of job URLs already logged in the sheet (column E).
    Returns empty set on any error so the pipeline can continue.
    """
    try:
        ws = _get_worksheet(spreadsheet_id, credentials_path)
        url_col = ws.col_values(5)  # column E (1-indexed)
        # Skip the header row
        return set(url_col[1:]) if len(url_col) > 1 else set()
    except Exception as e:
        print(f"[sheets] Error reading seen URLs: {e}")
        return set()


def append_jobs(jobs_with_scores: list, spreadsheet_id: str, credentials_path: str) -> int:
    """
    Append a list of (JobPosting, score, priority, reason) tuples to the sheet.
    Returns the number of rows successfully appended.
    """
    if not jobs_with_scores:
        return 0

    try:
        ws = _get_worksheet(spreadsheet_id, credentials_path)
        today = datetime.date.today().isoformat()
        rows = []
        for job, score, priority, reason in jobs_with_scores:
            rows.append([
                today,
                job.title,
                job.company,
                job.location,
                job.url,
                score,
                priority,
                reason,
                job.deadline,
                "",   # Contact Name (filled later by contact_finder)
                "",   # Contact Email
                "",   # LinkedIn Search
                "",   # Outreach Draft
                "New",
            ])
        ws.append_rows(rows, value_input_option="RAW")
        return len(rows)
    except Exception as e:
        print(f"[sheets] Error appending jobs: {e}")
        return 0
