# Internship Job Search Automation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a daily automated pipeline that scrapes finance/consulting internship postings, scores them against Samantha's profile, finds hiring manager contacts, drafts personalized outreach messages, logs everything to Google Sheets, and sends an SMS digest each morning.

**Architecture:** GitHub Actions runs `main.py` on a daily cron. Each component (scraper → deduplicator → scorer → contact finder → message drafter → sheets logger → SMS notifier) is an independent module called in sequence by the orchestrator.

**Tech Stack:** Python 3.11, requests, BeautifulSoup4, gspread, anthropic, twilio, Hunter.io API, GitHub Actions

---

## Task 1: Project Setup

**Files:**
- Create: `src/__init__.py`
- Create: `tests/__init__.py`
- Create: `requirements.txt`
- Create: `.env.example`

- [ ] **Step 1: Create directory structure**

```bash
cd C:\Users\lochs\job-search-automation
mkdir src tests .github\workflows
```

- [ ] **Step 2: Create `requirements.txt`**

```
requests==2.31.0
beautifulsoup4==4.12.3
gspread==6.1.2
google-auth==2.29.0
twilio==9.0.4
anthropic==0.25.0
pytest==8.1.2
pytest-mock==3.14.0
responses==0.25.3
python-dotenv==1.0.1
```

- [ ] **Step 3: Create `src/__init__.py` and `tests/__init__.py`** (both empty files)

- [ ] **Step 4: Create `.env.example`**

```
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
GOOGLE_CREDENTIALS_PATH=credentials.json
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
TO_PHONE_NUMBER=+17788683289
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
HUNTER_API_KEY=your_hunter_api_key_here
```

- [ ] **Step 5: Install dependencies**

```bash
pip install -r requirements.txt
```

Expected: All packages install without error.

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: project setup with dependencies"
```

---

## Task 2: Scorer

**Files:**
- Create: `src/scorer.py`
- Create: `tests/test_scorer.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_scorer.py`:

```python
import pytest
from src.scorer import score_job


def test_ib_scotiabank_bloomberg_scores_high():
    score, priority, reason = score_job(
        title="Investment Banking Analyst Intern",
        company="Scotiabank",
        description="Bloomberg required, DCF modelling"
    )
    assert score >= 8
    assert priority == "High"
    assert "Scotiabank" in reason


def test_general_intern_unknown_company_scores_low():
    score, priority, reason = score_job(
        title="Summer Intern",
        company="Unknown Corp",
        description=""
    )
    assert priority == "Low"
    assert score < 5


def test_consulting_deloitte_scores_medium_or_high():
    score, priority, reason = score_job(
        title="Strategy Consulting Intern",
        company="Deloitte",
        description=""
    )
    assert priority in ("Medium", "High")
    assert score >= 5


def test_scotiabank_gets_referral_bonus():
    _, _, reason = score_job(
        title="Analyst Intern",
        company="Scotiabank",
        description=""
    )
    assert "referral" in reason.lower() or "Scotiabank" in reason


def test_bloomberg_adds_one_skill_point():
    score1, _, _ = score_job("Financial Analyst Intern", "RBC", "")
    score2, _, _ = score_job("Financial Analyst Intern", "RBC", "Bloomberg required")
    assert score2 == score1 + 1


def test_mandarin_adds_one_language_point():
    score1, _, _ = score_job("Analyst Intern", "CIBC", "")
    score2, _, _ = score_job("Analyst Intern", "CIBC", "Mandarin preferred")
    assert score2 == score1 + 1


def test_asset_management_scores_four_role_points():
    score, _, _ = score_job("Asset Management Intern", "Unknown Corp", "")
    assert score >= 4


def test_wealth_management_scores_four_role_points():
    score, _, _ = score_job("Wealth Management Associate Intern", "Unknown Corp", "")
    assert score >= 4


def test_fp_and_a_scores_three_role_points():
    score, _, _ = score_job("FP&A Intern", "Unknown Corp", "")
    assert score >= 3


def test_priority_boundaries():
    # High: >= 8, Medium: 5-7, Low: < 5
    s_high, p_high, _ = score_job("Investment Banking Intern", "Scotiabank", "Bloomberg")
    assert p_high == "High"
    s_med, p_med, _ = score_job("Strategy Consulting Intern", "Deloitte", "")
    assert p_med in ("Medium", "High")
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_scorer.py -v
```

Expected: `ModuleNotFoundError` or `ImportError` — `src.scorer` does not exist yet.

- [ ] **Step 3: Implement `src/scorer.py`**

```python
# src/scorer.py

# Role tiers — only the highest matching tier counts
ROLE_TIERS = [
    (4, [
        "investment banking", "ib analyst", "capital markets", "m&a",
        "mergers", "acquisitions", "equity research",
        "asset management", "wealth management",
    ]),
    (3, [
        "strategy consulting", "management consulting",
        "financial transformation", "corporate finance",
        "fp&a", "financial planning and analysis",
    ]),
    (2, ["financial analyst", "finance analyst", "business analyst"]),
    (1, ["intern", "co-op", "internship"]),
]

# Company scores (lowercase key for matching)
COMPANY_SCORES = {
    "scotiabank": 4,        # Big 5 (+2) + referral bonus (+2)
    "rbc": 2,
    "royal bank": 2,
    "td ": 2,               # trailing space avoids matching "td" in other words
    "toronto-dominion": 2,
    "bmo": 2,
    "bank of montreal": 2,
    "cibc": 2,
    "deloitte": 2,
    "kpmg": 2,
    "ey ": 2,
    "ernst & young": 2,
    "pwc": 2,
    "pricewaterhousecoopers": 2,
}

SKILL_KEYWORDS = [
    "bloomberg", "financial modelling", "financial modeling",
    "dcf", "valuation", "excel",
]

LANGUAGE_KEYWORDS = ["cantonese", "mandarin", "chinese"]


def score_job(title: str, company: str, description: str = "") -> tuple:
    """
    Score a job posting against Samantha's profile.
    Returns (score: int, priority: str, reason: str).
    Priority: 'High' (>=8), 'Medium' (5-7), 'Low' (<5).
    """
    score = 0
    reasons = []
    text = f"{title} {description}".lower()
    company_lower = company.lower() + " "  # trailing space for safe substring match

    # Role scoring — highest matching tier only
    for points, keywords in ROLE_TIERS:
        matched = next((kw for kw in keywords if kw in text), None)
        if matched:
            score += points
            reasons.append(f"'{matched}' role (+{points})")
            break

    # Company scoring — first match wins
    for keyword, points in COMPANY_SCORES.items():
        if keyword in company_lower:
            label = (
                "Scotiabank (Big 5 + referral bonus)"
                if keyword == "scotiabank"
                else "Big 5 bank / Big 4 consulting"
            )
            score += points
            reasons.append(f"{label} (+{points})")
            break

    # Skills bonus — at most +1
    for skill in SKILL_KEYWORDS:
        if skill in text:
            score += 1
            reasons.append(f"'{skill}' required (+1)")
            break

    # Language bonus — at most +1
    for lang in LANGUAGE_KEYWORDS:
        if lang in text:
            score += 1
            reasons.append(f"'{lang}' asset (+1)")
            break

    priority = "High" if score >= 8 else "Medium" if score >= 5 else "Low"
    reason = ", ".join(reasons) if reasons else "General posting"
    return score, priority, reason
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_scorer.py -v
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scorer.py tests/test_scorer.py
git commit -m "feat: priority scorer with role, company, skill, language signals"
```

---

## Task 3: Deduplicator

**Files:**
- Create: `src/deduplicator.py`
- Create: `tests/test_deduplicator.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_deduplicator.py`:

```python
from src.deduplicator import filter_new_jobs
from src.scraper import JobPosting


def _job(url: str) -> JobPosting:
    return JobPosting(title="Analyst", company="RBC", location="Toronto", url=url)


def test_filters_out_seen_urls():
    jobs = [_job("https://example.com/1"), _job("https://example.com/2")]
    result = filter_new_jobs(jobs, seen_urls={"https://example.com/1"})
    assert len(result) == 1
    assert result[0].url == "https://example.com/2"


def test_empty_seen_returns_all():
    jobs = [_job("https://example.com/1")]
    result = filter_new_jobs(jobs, seen_urls=set())
    assert len(result) == 1


def test_all_seen_returns_empty():
    jobs = [_job("https://example.com/1")]
    result = filter_new_jobs(jobs, seen_urls={"https://example.com/1"})
    assert result == []


def test_empty_jobs_returns_empty():
    result = filter_new_jobs([], seen_urls={"https://example.com/1"})
    assert result == []


def test_preserves_order():
    jobs = [_job(f"https://example.com/{i}") for i in range(5)]
    result = filter_new_jobs(jobs, seen_urls={"https://example.com/2"})
    urls = [j.url for j in result]
    assert urls == [
        "https://example.com/0",
        "https://example.com/1",
        "https://example.com/3",
        "https://example.com/4",
    ]
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_deduplicator.py -v
```

Expected: `ImportError` — `src.scraper` and `src.deduplicator` don't exist yet. That's fine — create the scraper stub first.

- [ ] **Step 3: Create `src/scraper.py` stub** (full implementation comes in Task 4)

```python
# src/scraper.py
from dataclasses import dataclass, field


@dataclass
class JobPosting:
    title: str
    company: str
    location: str
    url: str
    deadline: str = "Rolling"
    description: str = ""
```

- [ ] **Step 4: Implement `src/deduplicator.py`**

```python
# src/deduplicator.py
from src.scraper import JobPosting


def filter_new_jobs(jobs: list, seen_urls: set) -> list:
    """Return only jobs whose URL has not been seen before."""
    return [job for job in jobs if job.url not in seen_urls]
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pytest tests/test_deduplicator.py -v
```

Expected: All 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/scraper.py src/deduplicator.py tests/test_deduplicator.py
git commit -m "feat: deduplicator + JobPosting dataclass stub"
```

---

## Task 4: Scraper

**Files:**
- Modify: `src/scraper.py` (full implementation)
- Create: `tests/test_scraper.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_scraper.py`:

```python
import responses
import pytest
from src.scraper import scrape_indeed, scrape_all, JobPosting

SAMPLE_INDEED_HTML = """
<html><body>
<div data-testid="job-card">
  <h2><span data-testid="jobTitle">Financial Analyst Intern</span></h2>
  <a data-testid="job-title-link" href="/pagead/clk?mo=r&ad=-6NYlbfkN0"></a>
  <span data-testid="company-name">RBC</span>
  <div data-testid="text-location">Toronto, ON</div>
</div>
<div data-testid="job-card">
  <h2><span data-testid="jobTitle">IB Summer Analyst</span></h2>
  <a data-testid="job-title-link" href="/pagead/clk?mo=r&ad=-9ABcdef123"></a>
  <span data-testid="company-name">Scotiabank</span>
  <div data-testid="text-location">Vancouver, BC</div>
</div>
</body></html>
"""


@responses.activate
def test_scrape_indeed_returns_job_postings():
    responses.add(
        responses.GET,
        "https://ca.indeed.com/jobs",
        body=SAMPLE_INDEED_HTML,
        status=200,
        match_querystring=False,
    )
    jobs = scrape_indeed("RBC", "finance internship", "Toronto, ON")
    assert isinstance(jobs, list)
    for job in jobs:
        assert isinstance(job, JobPosting)
        assert job.url.startswith("https://ca.indeed.com")


@responses.activate
def test_scrape_indeed_handles_http_error_gracefully():
    responses.add(
        responses.GET,
        "https://ca.indeed.com/jobs",
        status=403,
        match_querystring=False,
    )
    jobs = scrape_indeed("RBC", "finance internship", "Toronto, ON")
    assert jobs == []


@responses.activate
def test_scrape_indeed_handles_empty_page():
    responses.add(
        responses.GET,
        "https://ca.indeed.com/jobs",
        body="<html><body></body></html>",
        status=200,
        match_querystring=False,
    )
    jobs = scrape_indeed("RBC", "finance internship", "Toronto, ON")
    assert jobs == []


def test_job_posting_defaults():
    job = JobPosting(title="Intern", company="TD", location="Vancouver", url="https://example.com")
    assert job.deadline == "Rolling"
    assert job.description == ""
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_scraper.py -v
```

Expected: `ImportError` on `scrape_indeed` — not yet implemented.

- [ ] **Step 3: Implement full `src/scraper.py`**

```python
# src/scraper.py
import time
from dataclasses import dataclass
import requests
from bs4 import BeautifulSoup

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}

# (company display name, search keywords) pairs
SEARCH_QUERIES = [
    ("RBC", "finance internship co-op analyst"),
    ("TD Bank", "finance internship co-op analyst"),
    ("BMO", "finance internship co-op analyst"),
    ("CIBC", "finance internship co-op analyst"),
    ("Scotiabank", "finance internship co-op analyst"),
    ("Deloitte", "consulting finance internship analyst"),
    ("KPMG", "consulting finance internship"),
    ("EY", "consulting finance internship analyst"),
    ("PwC", "consulting finance internship"),
]

LOCATIONS = ["Vancouver, BC", "Toronto, ON", "Hong Kong"]


@dataclass
class JobPosting:
    title: str
    company: str
    location: str
    url: str
    deadline: str = "Rolling"
    description: str = ""


def scrape_indeed(company: str, keywords: str, location: str) -> list:
    """
    Scrape ca.indeed.com for jobs matching company+keywords at location.
    Returns list of JobPosting. Never raises — returns [] on any error.
    """
    jobs = []
    params = {
        "q": f"{company} {keywords}",
        "l": location,
        "sort": "date",
        "fromage": "1",  # Only jobs posted in last 1 day
    }

    try:
        resp = requests.get(
            "https://ca.indeed.com/jobs",
            params=params,
            headers=HEADERS,
            timeout=15,
        )
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        for card in soup.select('[data-testid="job-card"]')[:10]:
            title_el = card.select_one('[data-testid="jobTitle"]')
            company_el = card.select_one('[data-testid="company-name"]')
            location_el = card.select_one('[data-testid="text-location"]')
            link_el = card.select_one('a[data-testid="job-title-link"]')

            if not title_el or not link_el:
                continue

            href = link_el.get("href", "")
            job_url = f"https://ca.indeed.com{href}" if href.startswith("/") else href

            jobs.append(JobPosting(
                title=title_el.get_text(strip=True),
                company=company_el.get_text(strip=True) if company_el else company,
                location=location_el.get_text(strip=True) if location_el else location,
                url=job_url,
            ))

        time.sleep(1)  # Polite delay between requests

    except Exception as e:
        print(f"[scraper] Error scraping Indeed for {company} in {location}: {e}")

    return jobs


def scrape_all() -> list:
    """Scrape all company+location combinations. Returns combined list of JobPosting."""
    all_jobs = []
    for company, keywords in SEARCH_QUERIES:
        for location in LOCATIONS:
            jobs = scrape_indeed(company, keywords, location)
            all_jobs.extend(jobs)
    return all_jobs
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_scraper.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/scraper.py tests/test_scraper.py
git commit -m "feat: Indeed scraper for Big 5 banks and Big 4 consulting"
```

---

## Task 5: Google Sheets Client

**Files:**
- Create: `src/sheets.py`
- Create: `tests/test_sheets.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_sheets.py`:

```python
import pytest
from unittest.mock import MagicMock, patch, call
from src.sheets import SheetsClient, JOBS_HEADERS, APPS_HEADERS


@pytest.fixture
def mock_sheets_client():
    with patch("src.sheets.gspread.authorize") as mock_auth, \
         patch("src.sheets.Credentials.from_service_account_file"):
        mock_gc = MagicMock()
        mock_auth.return_value = mock_gc

        mock_spreadsheet = MagicMock()
        mock_gc.open_by_key.return_value = mock_spreadsheet

        jobs_ws = MagicMock()
        jobs_ws.title = "Jobs Found"
        apps_ws = MagicMock()
        apps_ws.title = "Applications"
        mock_spreadsheet.worksheets.return_value = [jobs_ws, apps_ws]
        mock_spreadsheet.worksheet.side_effect = lambda name: (
            jobs_ws if name == "Jobs Found" else apps_ws
        )

        client = SheetsClient("fake_creds.json", "fake_spreadsheet_id")
        yield client, mock_spreadsheet, jobs_ws, apps_ws


def test_get_seen_urls_returns_set(mock_sheets_client):
    client, _, jobs_ws, _ = mock_sheets_client
    jobs_ws.get_all_records.return_value = [
        {"URL": "https://example.com/1"},
        {"URL": "https://example.com/2"},
        {"URL": ""},
    ]
    urls = client.get_seen_urls()
    assert urls == {"https://example.com/1", "https://example.com/2"}


def test_append_job_writes_row_in_header_order(mock_sheets_client):
    client, _, jobs_ws, _ = mock_sheets_client
    job = {
        "Title": "IB Intern",
        "Company": "Scotiabank",
        "Location": "Toronto",
        "URL": "https://jobs.scotiabank.com/1",
        "Deadline": "Mar 15",
        "Date Found": "2026-05-11",
        "Priority": "High",
        "Priority Reason": "IB role",
        "Hiring Manager": "Jane Smith",
        "Manager LinkedIn": "https://linkedin.com/in/jane",
        "Manager Email": "jane@scotiabank.com",
        "LinkedIn Search": "https://linkedin.com/search",
        "Outreach Message": "Hi Jane...",
        "Outreach Sent?": "No",
        "Applied?": "No",
    }
    client.append_job(job)
    expected_row = [job.get(h, "") for h in JOBS_HEADERS]
    jobs_ws.append_row.assert_called_once_with(expected_row)


def test_append_job_fills_missing_columns_with_empty_string(mock_sheets_client):
    client, _, jobs_ws, _ = mock_sheets_client
    client.append_job({"Title": "Intern", "Company": "TD"})
    row = jobs_ws.append_row.call_args[0][0]
    assert len(row) == len(JOBS_HEADERS)
    assert "" in row  # Missing fields filled with ""


def test_jobs_headers_contain_required_columns():
    required = [
        "Title", "Company", "Location", "URL", "Deadline", "Date Found",
        "Priority", "Priority Reason", "Hiring Manager", "Manager LinkedIn",
        "Manager Email", "LinkedIn Search", "Outreach Message",
        "Outreach Sent?", "Applied?",
    ]
    for col in required:
        assert col in JOBS_HEADERS
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_sheets.py -v
```

Expected: `ImportError` — `src.sheets` does not exist.

- [ ] **Step 3: Implement `src/sheets.py`**

```python
# src/sheets.py
import gspread
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]

JOBS_HEADERS = [
    "Title", "Company", "Location", "URL", "Deadline", "Date Found",
    "Priority", "Priority Reason", "Hiring Manager", "Manager LinkedIn",
    "Manager Email", "LinkedIn Search", "Outreach Message",
    "Outreach Sent?", "Applied?",
]

APPS_HEADERS = [
    "Company", "Role", "Location", "Date Applied", "Deadline",
    "Status", "Follow-up Date", "Recruiter Contact", "Notes",
]


class SheetsClient:
    def __init__(self, credentials_path: str, spreadsheet_id: str):
        creds = Credentials.from_service_account_file(credentials_path, scopes=SCOPES)
        gc = gspread.authorize(creds)
        self._sheet = gc.open_by_key(spreadsheet_id)
        self._ensure_tabs()

    def _ensure_tabs(self):
        existing = {ws.title for ws in self._sheet.worksheets()}
        if "Jobs Found" not in existing:
            ws = self._sheet.add_worksheet("Jobs Found", rows=1000, cols=20)
            ws.append_row(JOBS_HEADERS)
        if "Applications" not in existing:
            ws = self._sheet.add_worksheet("Applications", rows=1000, cols=10)
            ws.append_row(APPS_HEADERS)

    def get_seen_urls(self) -> set:
        """Return set of all job URLs already logged."""
        ws = self._sheet.worksheet("Jobs Found")
        records = ws.get_all_records()
        return {r["URL"] for r in records if r.get("URL")}

    def append_job(self, job: dict) -> None:
        """Append a job dict to the Jobs Found tab, columns in JOBS_HEADERS order."""
        ws = self._sheet.worksheet("Jobs Found")
        row = [job.get(h, "") for h in JOBS_HEADERS]
        ws.append_row(row)
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_sheets.py -v
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/sheets.py tests/test_sheets.py
git commit -m "feat: Google Sheets client with jobs and applications tabs"
```

---

## Task 6: Contact Finder

**Files:**
- Create: `src/contact_finder.py`
- Create: `tests/test_contact_finder.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_contact_finder.py`:

```python
import responses
import pytest
from src.contact_finder import build_linkedin_search, get_company_domain, find_contact


def test_build_linkedin_search_contains_company_and_linkedin():
    url = build_linkedin_search("Scotiabank", "Vancouver")
    assert "linkedin.com" in url
    assert "Scotiabank" in url or "scotiabank" in url.lower()


def test_get_company_domain_rbc():
    assert get_company_domain("RBC") == "rbc.com"


def test_get_company_domain_scotiabank():
    assert get_company_domain("Scotiabank") == "scotiabank.com"


def test_get_company_domain_td_bank():
    assert get_company_domain("TD Bank") == "td.com"


def test_get_company_domain_deloitte():
    assert get_company_domain("Deloitte") == "deloitte.com"


def test_get_company_domain_unknown_returns_none():
    assert get_company_domain("Obscure Corp Ltd") is None


def test_find_contact_always_returns_linkedin_search(monkeypatch):
    monkeypatch.setenv("HUNTER_API_KEY", "")
    result = find_contact("Scotiabank", "Vancouver")
    assert "linkedin_search" in result
    assert "linkedin.com" in result["linkedin_search"]


@responses.activate
def test_find_contact_uses_hunter_when_api_key_set(monkeypatch):
    monkeypatch.setenv("HUNTER_API_KEY", "fakekey123")
    responses.add(
        responses.GET,
        "https://api.hunter.io/v2/domain-search",
        json={
            "data": {
                "emails": [
                    {
                        "value": "recruiter@scotiabank.com",
                        "first_name": "Jane",
                        "last_name": "Smith",
                    }
                ]
            }
        },
        status=200,
    )
    result = find_contact("Scotiabank", "Vancouver")
    assert result["email"] == "recruiter@scotiabank.com"
    assert result["name"] == "Jane Smith"


@responses.activate
def test_find_contact_graceful_on_hunter_error(monkeypatch):
    monkeypatch.setenv("HUNTER_API_KEY", "fakekey123")
    responses.add(
        responses.GET,
        "https://api.hunter.io/v2/domain-search",
        status=500,
    )
    result = find_contact("Scotiabank", "Vancouver")
    assert result["email"] == ""
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_contact_finder.py -v
```

Expected: `ImportError` — `src.contact_finder` does not exist.

- [ ] **Step 3: Implement `src/contact_finder.py`**

```python
# src/contact_finder.py
import os
import requests

HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")

COMPANY_DOMAINS = {
    "rbc": "rbc.com",
    "royal bank": "rbc.com",
    "td ": "td.com",
    "td bank": "td.com",
    "toronto-dominion": "td.com",
    "bmo": "bmo.com",
    "bank of montreal": "bmo.com",
    "cibc": "cibc.com",
    "scotiabank": "scotiabank.com",
    "deloitte": "deloitte.com",
    "kpmg": "kpmg.com",
    "ey ": "ey.com",
    "ernst & young": "ey.com",
    "pwc": "pwc.com",
    "pricewaterhousecoopers": "pwc.com",
}


def build_linkedin_search(company: str, location: str) -> str:
    """Return a LinkedIn people search URL for talent acquisition at company."""
    query = f"talent acquisition recruiter {company} {location}"
    encoded = requests.utils.quote(query)
    return f"https://www.linkedin.com/search/results/people/?keywords={encoded}"


def get_company_domain(company: str):
    """Map company name to email domain. Returns None if unknown."""
    company_lower = company.lower() + " "
    for key, domain in COMPANY_DOMAINS.items():
        if key in company_lower:
            return domain
    return None


def _search_hunter(domain: str) -> dict:
    """Query Hunter.io for a recruiter email at domain. Returns {} on failure."""
    try:
        resp = requests.get(
            "https://api.hunter.io/v2/domain-search",
            params={
                "domain": domain,
                "department": "hr",
                "limit": 1,
                "api_key": HUNTER_API_KEY,
            },
            timeout=10,
        )
        resp.raise_for_status()
        emails = resp.json().get("data", {}).get("emails", [])
        return emails[0] if emails else {}
    except Exception:
        return {}


def find_contact(company: str, location: str) -> dict:
    """
    Find a recruiter/hiring manager for the given company.
    Always returns a dict with: name, email, linkedin_url, linkedin_search.
    """
    result = {
        "name": "",
        "email": "",
        "linkedin_url": "",
        "linkedin_search": build_linkedin_search(company, location),
    }

    api_key = os.getenv("HUNTER_API_KEY", "")
    if api_key:
        domain = get_company_domain(company)
        if domain:
            contact = _search_hunter(domain)
            if contact:
                first = contact.get("first_name", "")
                last = contact.get("last_name", "")
                result["name"] = f"{first} {last}".strip()
                result["email"] = contact.get("value", "")

    return result
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_contact_finder.py -v
```

Expected: All 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contact_finder.py tests/test_contact_finder.py
git commit -m "feat: contact finder with Hunter.io + LinkedIn search URL fallback"
```

---

## Task 7: Message Drafter

**Files:**
- Create: `src/message_drafter.py`
- Create: `tests/test_message_drafter.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_message_drafter.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from src.message_drafter import draft_message, CANDIDATE_PROFILE


def _mock_anthropic_response(text: str):
    mock_client = MagicMock()
    mock_content = MagicMock()
    mock_content.text = text
    mock_client.messages.create.return_value = MagicMock(content=[mock_content])
    return mock_client


def test_draft_message_returns_string(monkeypatch):
    with patch("src.message_drafter.anthropic.Anthropic") as mock_cls:
        mock_cls.return_value = _mock_anthropic_response("Hi Jane, I'm Samantha...")
        result = draft_message("IB Analyst Intern", "Scotiabank", "Jane Smith")
    assert isinstance(result, str)
    assert len(result) > 0


def test_draft_message_calls_claude_api(monkeypatch):
    with patch("src.message_drafter.anthropic.Anthropic") as mock_cls:
        mock_client = _mock_anthropic_response("Hi there, I'm Samantha...")
        mock_cls.return_value = mock_client
        draft_message("Consulting Intern", "Deloitte", "")
        mock_client.messages.create.assert_called_once()


def test_draft_message_includes_company_in_prompt(monkeypatch):
    captured_prompts = []
    with patch("src.message_drafter.anthropic.Anthropic") as mock_cls:
        mock_client = _mock_anthropic_response("Hi, I'm Samantha...")
        mock_cls.return_value = mock_client
        draft_message("Analyst Intern", "KPMG", "Bob Lee")
        call_kwargs = mock_client.messages.create.call_args[1]
        prompt_text = call_kwargs["messages"][0]["content"]
        assert "KPMG" in prompt_text


def test_draft_message_graceful_on_api_error():
    with patch("src.message_drafter.anthropic.Anthropic") as mock_cls:
        mock_client = MagicMock()
        mock_client.messages.create.side_effect = Exception("API error")
        mock_cls.return_value = mock_client
        result = draft_message("Intern", "RBC", "")
    assert result == ""


def test_candidate_profile_contains_key_facts():
    assert "Samantha" in CANDIDATE_PROFILE
    assert "Scotiabank" in CANDIDATE_PROFILE
    assert "Computershare" in CANDIDATE_PROFILE
    assert "Bloomberg" in CANDIDATE_PROFILE
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_message_drafter.py -v
```

Expected: `ImportError` — `src.message_drafter` does not exist.

- [ ] **Step 3: Implement `src/message_drafter.py`**

```python
# src/message_drafter.py
import os
import anthropic

CANDIDATE_PROFILE = """
Name: Samantha Lo
University: UBC Sauder School of Business, BCom Finance, Class of 2028
GPA: 4.0/4.33, Dean's List (Honours)
Relevant courses: Quantitative Decision (93%), Statistics in Business (89%), Financial Accounting (92%)

Key experience:
- Scotiabank, Customer Experience Associate (Vancouver, current): banking operations, client relationships, product recommendations
- Computershare Investor Services, Corporate Services Intern (Hong Kong): IPO documentation, securities data for 35+ clients, AGM reports, dividend summaries
- Kiokii Inc., Retail Sales Associate (Vancouver): daily financial reporting, POS reconciliation, $13K-$30K daily revenue tracking

Key achievements:
- Accenture National Innovation Challenge: Finalist (top 4 of 300+ teams) — Tableau dashboards, climate adaptation framework presented to senior leaders
- UBC Sauder Capital Markets Challenge: Semi-Finalist — built DCF model, comparable company analysis, 5-year M&A forecast for Nike
- UBC BizChina VP Events: managed CAD $50,000 budget, grew attendance 125%

Skills: Bloomberg, Excel (financial modelling), PowerPoint, Tableau, data analysis
Languages: English (primary), Cantonese, Mandarin
"""


def draft_message(job_title: str, company: str, contact_name: str = "") -> str:
    """
    Draft a personalized LinkedIn outreach message using Claude.
    Returns empty string on any API error.
    """
    greeting = f"Hi {contact_name.split()[0]}," if contact_name else "Hi there,"

    prompt = f"""Write a personalized LinkedIn connection request message from Samantha Lo \
to a recruiter at {company} for a {job_title} internship role.

Candidate profile:
{CANDIDATE_PROFILE}

Requirements:
- Open with: "{greeting}"
- Maximum 150 words
- Reference 1-2 experiences from her profile most relevant to {job_title} at {company}
- Sound genuine and specific — not a generic template
- End with "– Samantha"
- Professional but warm tone
- Do not use phrases like "I am writing to" or "I hope this message finds you well"
"""

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY", ""))
        response = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=400,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text
    except Exception as e:
        print(f"[message_drafter] Claude API error: {e}")
        return ""
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_message_drafter.py -v
```

Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/message_drafter.py tests/test_message_drafter.py
git commit -m "feat: Claude-powered personalized outreach message drafter"
```

---

## Task 8: SMS Notifier

**Files:**
- Create: `src/sms.py`
- Create: `tests/test_sms.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_sms.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from src.sms import format_digest, send_sms


def _job(priority="High", company="RBC", title="IB Intern",
         location="Toronto", deadline="Mar 15", url="https://jobs.rbc.com/1"):
    return dict(priority=priority, company=company, title=title,
                location=location, deadline=deadline, url=url)


def test_format_digest_one_job():
    msg = format_digest([_job()], "https://sheets.url")
    assert "1 new posting" in msg
    assert "RBC" in msg
    assert "[High]" in msg
    assert "Mar 15" in msg
    assert "sheets.url" in msg


def test_format_digest_plural_postings():
    msg = format_digest([_job(), _job(company="TD")], "https://sheets.url")
    assert "2 new postings" in msg


def test_format_digest_zero_jobs():
    msg = format_digest([], "https://sheets.url")
    assert "0 new" in msg


def test_format_digest_caps_display_at_five():
    jobs = [_job(company=f"Co{i}", url=f"https://example.com/{i}") for i in range(8)]
    msg = format_digest(jobs, "https://sheets.url")
    assert "3 more" in msg


def test_format_digest_includes_tracker_link():
    msg = format_digest([_job()], "https://docs.google.com/spreadsheets/d/abc123")
    assert "docs.google.com" in msg


def test_send_sms_raises_without_credentials(monkeypatch):
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    monkeypatch.delenv("TWILIO_AUTH_TOKEN", raising=False)
    monkeypatch.delenv("TWILIO_PHONE_NUMBER", raising=False)
    with pytest.raises(ValueError, match="Missing Twilio credentials"):
        send_sms("test", "+17781234567")


@patch("src.sms.Client")
def test_send_sms_calls_twilio_create(mock_client_cls, monkeypatch):
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC123")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "token")
    monkeypatch.setenv("TWILIO_PHONE_NUMBER", "+12223334444")
    mock_client = MagicMock()
    mock_client_cls.return_value = mock_client
    result = send_sms("Hello", "+17781234567")
    assert result is True
    mock_client.messages.create.assert_called_once_with(
        body="Hello", from_="+12223334444", to="+17781234567"
    )
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_sms.py -v
```

Expected: `ImportError` — `src.sms` does not exist.

- [ ] **Step 3: Implement `src/sms.py`**

```python
# src/sms.py
import os
from twilio.rest import Client


def format_digest(jobs: list, sheets_url: str) -> str:
    """
    Format a list of job dicts into an SMS digest string.
    Shows up to 5 jobs. Each job dict needs: priority, company, title, location, deadline, url.
    """
    count = len(jobs)
    lines = [f"{count} new posting{'s' if count != 1 else ''} today:\n"]

    for job in jobs[:5]:
        lines.append(
            f"[{job['priority']}] {job['company']} – {job['title']} ({job['location']})"
        )
        lines.append(f"Deadline: {job.get('deadline', 'Rolling')}")
        url = job["url"]
        lines.append(url[:70] + ("..." if len(url) > 70 else ""))
        lines.append("")

    if count > 5:
        lines.append(f"+ {count - 5} more in tracker")
        lines.append("")

    lines.append(f"Tracker: {sheets_url}")
    return "\n".join(lines)


def send_sms(message: str, to: str) -> bool:
    """
    Send SMS via Twilio. Returns True on success.
    Raises ValueError if credentials are missing.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_PHONE_NUMBER")

    if not all([account_sid, auth_token, from_number]):
        raise ValueError("Missing Twilio credentials in environment variables")

    client = Client(account_sid, auth_token)
    client.messages.create(body=message, from_=from_number, to=to)
    return True
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_sms.py -v
```

Expected: All 7 tests PASS.

- [ ] **Step 5: Run full test suite to confirm nothing broke**

```bash
pytest tests/ -v
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/sms.py tests/test_sms.py
git commit -m "feat: Twilio SMS notifier with daily digest formatter"
```

---

## Task 9: Main Orchestrator

**Files:**
- Create: `src/main.py`
- Create: `tests/test_main.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_main.py`:

```python
import pytest
from unittest.mock import patch, MagicMock, call
from src.scraper import JobPosting


@pytest.fixture
def sample_jobs():
    return [
        JobPosting(
            title="Investment Banking Analyst Intern",
            company="Scotiabank",
            location="Toronto",
            url="https://jobs.scotiabank.com/1",
            deadline="Mar 15",
        ),
        JobPosting(
            title="Financial Analyst Intern",
            company="TD Bank",
            location="Vancouver",
            url="https://jobs.td.com/2",
        ),
    ]


@patch("src.main.send_sms")
@patch("src.main.SheetsClient")
@patch("src.main.scrape_all")
def test_run_sends_sms_when_new_jobs(mock_scrape, mock_sheets_cls, mock_sms, sample_jobs, monkeypatch):
    monkeypatch.setenv("GOOGLE_SPREADSHEET_ID", "sheet123")
    monkeypatch.setenv("TO_PHONE_NUMBER", "+17781234567")

    mock_scrape.return_value = sample_jobs
    mock_sheets = MagicMock()
    mock_sheets.get_seen_urls.return_value = set()
    mock_sheets_cls.return_value = mock_sheets

    from src.main import run
    run()

    mock_sms.assert_called_once()
    mock_sheets.append_job.assert_called()


@patch("src.main.send_sms")
@patch("src.main.SheetsClient")
@patch("src.main.scrape_all")
def test_run_skips_sms_when_no_new_jobs(mock_scrape, mock_sheets_cls, mock_sms, sample_jobs, monkeypatch):
    monkeypatch.setenv("GOOGLE_SPREADSHEET_ID", "sheet123")
    monkeypatch.setenv("TO_PHONE_NUMBER", "+17781234567")

    mock_scrape.return_value = sample_jobs
    mock_sheets = MagicMock()
    # All jobs already seen
    mock_sheets.get_seen_urls.return_value = {j.url for j in sample_jobs}
    mock_sheets_cls.return_value = mock_sheets

    from src.main import run
    run()

    mock_sms.assert_not_called()


@patch("src.main.send_sms")
@patch("src.main.SheetsClient")
@patch("src.main.scrape_all")
def test_run_calls_contact_finder_for_high_priority(mock_scrape, mock_sheets_cls, mock_sms, monkeypatch):
    monkeypatch.setenv("GOOGLE_SPREADSHEET_ID", "sheet123")
    monkeypatch.setenv("TO_PHONE_NUMBER", "+17781234567")

    # Scotiabank IB role = High priority
    mock_scrape.return_value = [
        JobPosting(title="Investment Banking Intern", company="Scotiabank",
                   location="Toronto", url="https://scotiabank.com/1")
    ]
    mock_sheets = MagicMock()
    mock_sheets.get_seen_urls.return_value = set()
    mock_sheets_cls.return_value = mock_sheets

    with patch("src.main.find_contact") as mock_finder, \
         patch("src.main.draft_message") as mock_drafter:
        mock_finder.return_value = {"name": "", "email": "", "linkedin_url": "", "linkedin_search": ""}
        mock_drafter.return_value = "Hi there..."
        from src.main import run
        run()
        mock_finder.assert_called_once()
        mock_drafter.assert_called_once()
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_main.py -v
```

Expected: `ImportError` — `src.main` does not exist.

- [ ] **Step 3: Implement `src/main.py`**

```python
# src/main.py
import os
from datetime import date

from src.scraper import scrape_all
from src.deduplicator import filter_new_jobs
from src.scorer import score_job
from src.sheets import SheetsClient
from src.contact_finder import find_contact
from src.message_drafter import draft_message
from src.sms import send_sms, format_digest

PRIORITY_ORDER = {"High": 0, "Medium": 1, "Low": 2}


def run():
    print(f"[main] Starting job search — {date.today()}")

    spreadsheet_id = os.getenv("GOOGLE_SPREADSHEET_ID")
    credentials_path = os.getenv("GOOGLE_CREDENTIALS_PATH", "credentials.json")
    to_phone = os.getenv("TO_PHONE_NUMBER")
    sheets_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}"

    # 1. Scrape
    print("[main] Scraping job boards...")
    all_jobs = scrape_all()
    print(f"[main] {len(all_jobs)} total postings found")

    # 2. Deduplicate
    sheets = SheetsClient(credentials_path, spreadsheet_id)
    seen_urls = sheets.get_seen_urls()
    new_jobs = filter_new_jobs(all_jobs, seen_urls)
    print(f"[main] {len(new_jobs)} new postings after deduplication")

    if not new_jobs:
        print("[main] Nothing new today. Exiting.")
        return

    # 3. Score, find contact, draft message
    enriched = []
    for job in new_jobs:
        _, priority, reason = score_job(job.title, job.company, job.description)

        contact = {"name": "", "email": "", "linkedin_url": "", "linkedin_search": ""}
        message = ""
        if priority == "High":
            contact = find_contact(job.company, job.location)
            message = draft_message(job.title, job.company, contact.get("name", ""))

        enriched.append({
            "Title": job.title,
            "Company": job.company,
            "Location": job.location,
            "URL": job.url,
            "Deadline": job.deadline,
            "Date Found": str(date.today()),
            "Priority": priority,
            "Priority Reason": reason,
            "Hiring Manager": contact.get("name", ""),
            "Manager LinkedIn": contact.get("linkedin_url", ""),
            "Manager Email": contact.get("email", ""),
            "LinkedIn Search": contact.get("linkedin_search", ""),
            "Outreach Message": message,
            "Outreach Sent?": "No",
            "Applied?": "No",
        })

    # 4. Log to Sheets
    for job in enriched:
        sheets.append_job(job)
    print(f"[main] Logged {len(enriched)} jobs to Google Sheets")

    # 5. Send SMS (High priority first)
    sorted_jobs = sorted(enriched, key=lambda j: PRIORITY_ORDER.get(j["Priority"], 9))
    digest_jobs = [
        {
            "priority": j["Priority"],
            "company": j["Company"],
            "title": j["Title"],
            "location": j["Location"],
            "deadline": j["Deadline"],
            "url": j["URL"],
        }
        for j in sorted_jobs
    ]
    digest = format_digest(digest_jobs, sheets_url)
    send_sms(digest, to_phone)
    print("[main] SMS sent successfully")


if __name__ == "__main__":
    run()
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_main.py -v
```

Expected: All 3 tests PASS.

- [ ] **Step 5: Run full test suite**

```bash
pytest tests/ -v
```

Expected: All tests across all files PASS.

- [ ] **Step 6: Commit**

```bash
git add src/main.py tests/test_main.py
git commit -m "feat: main orchestrator — scrape, score, enrich, log, notify"
```

---

## Task 10: GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/daily_scrape.yml`

- [ ] **Step 1: Create the workflow file**

Create `.github/workflows/daily_scrape.yml`:

```yaml
name: Daily Internship Job Search

on:
  schedule:
    - cron: '0 15 * * *'   # 8:00am Vancouver PDT (UTC-7 = 15:00 UTC)
  workflow_dispatch:          # Allow manual trigger from GitHub UI

jobs:
  search:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Write Google credentials file
        run: echo '${{ secrets.GOOGLE_CREDENTIALS_JSON }}' > credentials.json

      - name: Run job search
        env:
          GOOGLE_SPREADSHEET_ID: ${{ secrets.GOOGLE_SPREADSHEET_ID }}
          GOOGLE_CREDENTIALS_PATH: credentials.json
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_PHONE_NUMBER: ${{ secrets.TWILIO_PHONE_NUMBER }}
          TO_PHONE_NUMBER: ${{ secrets.TO_PHONE_NUMBER }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          HUNTER_API_KEY: ${{ secrets.HUNTER_API_KEY }}
        run: python -m src.main
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/daily_scrape.yml
git commit -m "feat: GitHub Actions daily cron job at 8am Vancouver time"
```

---

## Task 11: Accounts & Secrets Setup

This task sets up all external services. Do this before pushing to GitHub.

- [ ] **Step 1: Create a Google Sheet**
  1. Go to [sheets.new](https://sheets.new) — create a blank sheet
  2. Copy the spreadsheet ID from the URL: `docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`
  3. Save this ID — it's your `GOOGLE_SPREADSHEET_ID`

- [ ] **Step 2: Create Google Service Account**
  1. Go to [console.cloud.google.com](https://console.cloud.google.com)
  2. Create a new project (or use existing)
  3. Enable **Google Sheets API**: APIs & Services → Enable APIs → search "Google Sheets API" → Enable
  4. Create credentials: APIs & Services → Credentials → Create Credentials → Service Account
  5. Name it `job-search-bot`, click Done
  6. Click the service account → Keys tab → Add Key → JSON → Download
  7. This is your `credentials.json` file — **keep this file secret, never commit it**
  8. Copy the service account email (looks like `job-search-bot@your-project.iam.gserviceaccount.com`)
  9. In your Google Sheet: Share → paste the service account email → give Editor access

- [ ] **Step 3: Set up Twilio**
  1. Sign up at [twilio.com](https://twilio.com) (free trial gives ~$15 credit)
  2. Dashboard → Get a trial number → choose a Canadian or US number
  3. Note your **Account SID**, **Auth Token**, and **phone number**
  4. Add your personal number (+1 778 868-3289) as a verified caller ID (required on trial)

- [ ] **Step 4: Get Anthropic API key**
  1. Go to [console.anthropic.com](https://console.anthropic.com)
  2. API Keys → Create Key → copy it

- [ ] **Step 5: Get Hunter.io API key (optional but recommended)**
  1. Sign up at [hunter.io](https://hunter.io) — free tier: 25 searches/month
  2. Dashboard → API → copy your API key

- [ ] **Step 6: Push repo to GitHub**
  1. Create a new **private** repo at [github.com/new](https://github.com/new)
  2. Name it `job-search-automation`
  3. Run:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/job-search-automation.git
  git push -u origin main
  ```

- [ ] **Step 7: Add GitHub Secrets**
  In your GitHub repo: Settings → Secrets and variables → Actions → New repository secret

  Add each of these:

  | Secret name | Value |
  |-------------|-------|
  | `GOOGLE_SPREADSHEET_ID` | The spreadsheet ID from Step 1 |
  | `GOOGLE_CREDENTIALS_JSON` | Paste the **entire contents** of your credentials.json file |
  | `TWILIO_ACCOUNT_SID` | From Twilio dashboard |
  | `TWILIO_AUTH_TOKEN` | From Twilio dashboard |
  | `TWILIO_PHONE_NUMBER` | Your Twilio number e.g. `+16041234567` |
  | `TO_PHONE_NUMBER` | Your personal number `+17788683289` |
  | `ANTHROPIC_API_KEY` | From Anthropic console |
  | `HUNTER_API_KEY` | From Hunter.io (or leave empty string if skipping) |

---

## Task 12: End-to-End Test

- [ ] **Step 1: Trigger a manual run on GitHub Actions**
  1. Go to your repo on GitHub → Actions tab
  2. Click "Daily Internship Job Search" → "Run workflow" → Run workflow
  3. Watch the logs in real time

- [ ] **Step 2: Verify Google Sheets**
  - Open your Google Sheet
  - "Jobs Found" tab should have new rows with Priority, Outreach Message, LinkedIn Search URL populated
  - High priority Scotiabank postings should have Outreach Message filled

- [ ] **Step 3: Verify SMS received**
  - Check your phone for a text from your Twilio number
  - Should show new postings sorted High → Medium → Low with deadlines

- [ ] **Step 4: If no SMS received (nothing new that day), force a test**

  Create a local `.env` file (copy from `.env.example`, fill in real values) then run:
  ```bash
  pip install python-dotenv
  python -c "from dotenv import load_dotenv; load_dotenv(); from src.main import run; run()"
  ```

- [ ] **Step 5: Final commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
git push
```
