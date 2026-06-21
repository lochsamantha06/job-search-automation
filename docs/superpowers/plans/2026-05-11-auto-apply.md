# Auto-Apply System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically fill Workday, Greenhouse, and Lever job applications with Playwright, stage screenshots for batch review on a Netlify dashboard, and submit approved applications via GitHub Actions.

**Architecture:** GitHub Actions runs Playwright to fill forms and commit screenshots + `applications.json` to the repo. Netlify auto-deploys the static review dashboard from the repo. Approve clicks call a Netlify Function that triggers `submit.yml` via the GitHub API. The submitter re-fills and clicks Submit for approved jobs.

**Tech Stack:** Python 3.11, Playwright (sync API), HTML/CSS/JS (static dashboard), Python Netlify Functions, GitHub Actions, Gmail API (google-api-python-client), JSON files in repo (no database)

---

## File Map

| File | Role |
|---|---|
| `assets/profile.json` | Candidate profile — single source of truth for all form fillers |
| `assets/resume.pdf` | Resume uploaded to every portal (user provides) |
| `src/applicator/__init__.py` | Empty |
| `src/applicator/portal_detector.py` | Identifies portal from job URL |
| `src/applicator/account_manager.py` | Creates / retrieves portal login credentials |
| `src/applicator/gmail_verifier.py` | Clicks email verification links via Gmail API |
| `src/applicator/drivers/__init__.py` | Empty |
| `src/applicator/drivers/workday.py` | Fills Workday application forms |
| `src/applicator/drivers/greenhouse.py` | Fills Greenhouse application forms |
| `src/applicator/drivers/lever.py` | Fills Lever application forms |
| `src/applicator/main.py` | Orchestrates applicator — loops jobs, calls drivers, commits results |
| `src/applicator/submitter.py` | Re-fills and submits after user approval |
| `dashboard/index.html` | Review dashboard UI |
| `dashboard/app.js` | Fetches applications.json, renders cards, handles approve/skip |
| `dashboard/style.css` | Dashboard styles |
| `dashboard/data/applications.json` | Staging file — committed after each run, read by dashboard |
| `netlify/functions/approve.py` | Netlify Function — validates token, triggers submit.yml |
| `netlify/functions/skip.py` | Netlify Function — validates token, marks job skipped |
| `netlify.toml` | Netlify config |
| `.github/workflows/submit.yml` | On-demand submission workflow |
| `.github/workflows/cleanup.yml` | Weekly screenshot cleanup |
| `tests/test_portal_detector.py` | Portal detector tests |
| `tests/test_account_manager.py` | Account manager tests |
| `tests/test_applicator_main.py` | Applicator orchestrator tests |
| `tests/test_submitter.py` | Submitter tests |
| `tests/test_dashboard_functions.py` | Netlify Function tests |

**Modify existing:**
- `src/main.py` — call applicator after scoring
- `src/sms.py` — add dashboard link to digest
- `.github/workflows/daily_scrape.yml` — add Playwright install + applicator env vars
- `requirements.txt` — add playwright, google-api-python-client, google-auth-oauthlib

---

## ─── PHASE 1: Core Applicator ───

---

### Task 1: Project setup — profile, dependencies, folder structure

**Files:**
- Create: `assets/profile.json`
- Create: `dashboard/data/applications.json`
- Create: `dashboard/data/screenshots/.gitkeep`
- Create: `src/applicator/__init__.py`
- Create: `src/applicator/drivers/__init__.py`
- Modify: `requirements.txt`

- [ ] **Step 1: Add new dependencies to requirements.txt**

Open `requirements.txt` and append:
```
playwright==1.44.0
google-api-python-client==2.126.0
google-auth-oauthlib==1.2.0
pillow==10.3.0
```

- [ ] **Step 2: Create the candidate profile**

Create `assets/profile.json` — fill in Samantha's actual details:
```json
{
  "first_name": "Samantha",
  "last_name": "Lo",
  "full_name": "Samantha Lo",
  "email": "lochsamantha06@gmail.com",
  "phone": "+1XXXXXXXXXX",
  "linkedin": "https://linkedin.com/in/samanthalo",
  "address_line1": "",
  "city": "Vancouver",
  "province": "BC",
  "postal_code": "",
  "country": "Canada",
  "education": {
    "school": "University of British Columbia",
    "faculty": "Sauder School of Business",
    "degree": "Bachelor of Commerce",
    "major": "Finance",
    "gpa": "4.0 / 4.0",
    "start_year": "2022",
    "graduation_year": "2028"
  },
  "work_experience": [],
  "skills": ["Financial Modelling", "DCF Valuation", "Bloomberg Terminal", "Microsoft Excel", "Python", "PowerPoint"],
  "languages": ["English (Fluent)", "Cantonese (Native)"],
  "resume_path": "assets/resume.pdf",
  "cover_letter": "I am a second-year BCom Finance student at UBC Sauder with a 4.0 GPA, passionate about capital markets and financial analysis. I am fluent in English and Cantonese and have strong skills in financial modelling and DCF valuation."
}
```

- [ ] **Step 3: Create the staging file**

Create `dashboard/data/applications.json`:
```json
[]
```

- [ ] **Step 4: Create empty `__init__.py` files**

Create `src/applicator/__init__.py` — empty file.
Create `src/applicator/drivers/__init__.py` — empty file.

- [ ] **Step 5: Create screenshots placeholder**

Create `dashboard/data/screenshots/.gitkeep` — empty file so git tracks the folder.

- [ ] **Step 6: Commit**

```bash
git add assets/profile.json dashboard/data/ src/applicator/ requirements.txt
git commit -m "feat: applicator project setup — profile, dependencies, folder structure"
```

---

### Task 2: Portal detector

**Files:**
- Create: `src/applicator/portal_detector.py`
- Create: `tests/test_portal_detector.py`

- [ ] **Step 1: Write the failing tests**

Create `tests/test_portal_detector.py`:
```python
from src.applicator.portal_detector import detect_portal

def test_detects_workday_myworkdayjobs():
    assert detect_portal("https://rbc.wd3.myworkdayjobs.com/en-US/RBC/job/Toronto/Analyst_R-0001") == "workday"

def test_detects_workday_myworkday():
    assert detect_portal("https://scotiabank.wd3.myworkday.com/scotiabank/job/Toronto/apply") == "workday"

def test_detects_greenhouse():
    assert detect_portal("https://boards.greenhouse.io/deloitte/jobs/12345") == "greenhouse"

def test_detects_lever():
    assert detect_portal("https://jobs.lever.co/pwc/abc-123") == "lever"

def test_returns_none_for_unknown():
    assert detect_portal("https://careers.example.com/jobs/123") is None

def test_returns_none_for_linkedin():
    assert detect_portal("https://www.linkedin.com/jobs/view/123456") is None

def test_case_insensitive():
    assert detect_portal("https://RBC.WD3.MYWORKDAYJOBS.COM/job/123") == "workday"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_portal_detector.py -v
```
Expected: `ModuleNotFoundError: No module named 'src.applicator.portal_detector'`

- [ ] **Step 3: Implement portal detector**

Create `src/applicator/portal_detector.py`:
```python
PORTAL_PATTERNS = {
    "workday": ["myworkdayjobs.com", "myworkday.com"],
    "greenhouse": ["boards.greenhouse.io", "greenhouse.io"],
    "lever": ["jobs.lever.co", "lever.co"],
}


def detect_portal(url: str) -> str | None:
    """Return portal name ('workday', 'greenhouse', 'lever') or None."""
    url_lower = url.lower()
    for portal, patterns in PORTAL_PATTERNS.items():
        if any(p in url_lower for p in patterns):
            return portal
    return None
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_portal_detector.py -v
```
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
git add src/applicator/portal_detector.py tests/test_portal_detector.py
git commit -m "feat: portal detector — identifies Workday, Greenhouse, Lever from URL"
```

---

### Task 3: Account manager

**Files:**
- Create: `src/applicator/account_manager.py`
- Create: `tests/test_account_manager.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_account_manager.py`:
```python
import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
from src.applicator.account_manager import get_credentials, save_credentials, _generate_password

PROFILE = {
    "email": "lochsamantha06@gmail.com",
    "first_name": "Samantha",
    "last_name": "Lo",
}


def test_generate_password_length():
    pwd = _generate_password()
    assert len(pwd) == 16


def test_generate_password_unique():
    assert _generate_password() != _generate_password()


def test_get_credentials_returns_existing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({
        "workday": {"email": "lochsamantha06@gmail.com", "password": "abc123"}
    }))
    creds = get_credentials("workday", accounts_file=str(accounts_file))
    assert creds["email"] == "lochsamantha06@gmail.com"
    assert creds["password"] == "abc123"


def test_get_credentials_returns_none_when_missing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({}))
    assert get_credentials("workday", accounts_file=str(accounts_file)) is None


def test_get_credentials_returns_none_when_file_missing(tmp_path):
    assert get_credentials("workday", accounts_file=str(tmp_path / "missing.json")) is None


def test_save_credentials_writes_file(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    save_credentials("greenhouse", "test@test.com", "pass123", accounts_file=str(accounts_file))
    data = json.loads(accounts_file.read_text())
    assert data["greenhouse"]["email"] == "test@test.com"
    assert data["greenhouse"]["password"] == "pass123"


def test_save_credentials_preserves_existing(tmp_path):
    accounts_file = tmp_path / "portal_accounts.json"
    accounts_file.write_text(json.dumps({"workday": {"email": "a@b.com", "password": "x"}}))
    save_credentials("greenhouse", "c@d.com", "y", accounts_file=str(accounts_file))
    data = json.loads(accounts_file.read_text())
    assert "workday" in data
    assert "greenhouse" in data
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_account_manager.py -v
```
Expected: `ModuleNotFoundError`

- [ ] **Step 3: Implement account manager**

Create `src/applicator/account_manager.py`:
```python
import json
import secrets
import string
from pathlib import Path

DEFAULT_ACCOUNTS_FILE = "data/portal_accounts.json"


def _generate_password() -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return "".join(secrets.choice(alphabet) for _ in range(16))


def get_credentials(portal: str, accounts_file: str = DEFAULT_ACCOUNTS_FILE) -> dict | None:
    """Return saved credentials for portal, or None if not found."""
    path = Path(accounts_file)
    if not path.exists():
        return None
    data = json.loads(path.read_text())
    return data.get(portal)


def save_credentials(portal: str, email: str, password: str, accounts_file: str = DEFAULT_ACCOUNTS_FILE):
    """Save credentials for a portal, preserving existing entries."""
    path = Path(accounts_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    data = json.loads(path.read_text()) if path.exists() else {}
    data[portal] = {"email": email, "password": password}
    path.write_text(json.dumps(data, indent=2))
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_account_manager.py -v
```
Expected: 8 passed

- [ ] **Step 5: Commit**

```bash
git add src/applicator/account_manager.py tests/test_account_manager.py
git commit -m "feat: account manager — store and retrieve portal credentials"
```

---

### Task 4: Gmail verifier

**Files:**
- Create: `src/applicator/gmail_verifier.py`

- [ ] **Step 1: Implement Gmail verifier**

Create `src/applicator/gmail_verifier.py`:
```python
"""
Polls Gmail inbox for an email verification link and returns it.
Uses Gmail API with a service-account-style OAuth2 refresh token.

Required env var: GMAIL_CREDENTIALS_JSON
  {
    "client_id": "...",
    "client_secret": "...",
    "refresh_token": "...",
    "token_uri": "https://oauth2.googleapis.com/token"
  }
"""

import base64
import json
import os
import re
import time

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def _get_service(creds_json: str):
    data = json.loads(creds_json)
    creds = Credentials(
        token=None,
        refresh_token=data["refresh_token"],
        client_id=data["client_id"],
        client_secret=data["client_secret"],
        token_uri=data.get("token_uri", "https://oauth2.googleapis.com/token"),
    )
    return build("gmail", "v1", credentials=creds)


def find_verification_link(sender_domain: str, timeout_seconds: int = 300, poll_interval: int = 10) -> str | None:
    """
    Poll Gmail for a verification email from sender_domain.
    Returns the first https:// link found in the email body, or None on timeout.
    """
    creds_json = os.environ.get("GMAIL_CREDENTIALS_JSON")
    if not creds_json:
        print("[gmail_verifier] GMAIL_CREDENTIALS_JSON not set — skipping verification")
        return None

    service = _get_service(creds_json)
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        results = service.users().messages().list(
            userId="me",
            q=f"from:{sender_domain} is:unread subject:verify",
            maxResults=1,
        ).execute()

        messages = results.get("messages", [])
        if messages:
            msg = service.users().messages().get(
                userId="me", id=messages[0]["id"], format="full"
            ).execute()

            # Extract body
            body = ""
            payload = msg.get("payload", {})
            parts = payload.get("parts", [payload])
            for part in parts:
                data = part.get("body", {}).get("data", "")
                if data:
                    body += base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

            # Find first https link
            links = re.findall(r"https://[^\s\"'>]+", body)
            for link in links:
                if "verif" in link.lower() or "confirm" in link.lower() or "activate" in link.lower():
                    # Mark email as read
                    service.users().messages().modify(
                        userId="me", id=messages[0]["id"],
                        body={"removeLabelIds": ["UNREAD"]}
                    ).execute()
                    return link

        time.sleep(poll_interval)

    print(f"[gmail_verifier] Timeout waiting for verification email from {sender_domain}")
    return None
```

- [ ] **Step 2: Commit**

```bash
git add src/applicator/gmail_verifier.py
git commit -m "feat: gmail verifier — polls inbox for email verification links"
```

---

### Task 5: Workday driver

**Files:**
- Create: `src/applicator/drivers/workday.py`

- [ ] **Step 1: Implement Workday driver**

Create `src/applicator/drivers/workday.py`:
```python
"""
Fills a Workday job application form.
Workday data-automation-id selectors are stable across all Workday instances.
Does NOT submit — takes a screenshot and returns the path.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import Page, sync_playwright

from src.applicator.account_manager import get_credentials, save_credentials, _generate_password
from src.applicator.gmail_verifier import find_verification_link

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    """
    Navigate to job_url, create/login to Workday account, fill all fields,
    screenshot the filled form. Returns screenshot path or None on failure.
    """
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            # Click Apply button
            apply_selectors = [
                "a:has-text('Apply')",
                "button:has-text('Apply')",
                "a:has-text('Apply Now')",
                "[data-automation-id='applyButton']",
            ]
            for sel in apply_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    break

            # Login or create account
            _login_or_create(page, profile, job_url)

            # Fill contact info
            _fill_field(page, '[data-automation-id="legalNameSection_firstName"]', profile["first_name"])
            _fill_field(page, '[data-automation-id="legalNameSection_lastName"]', profile["last_name"])
            _fill_field(page, '[data-automation-id="phone-number"]', profile["phone"])
            _fill_field(page, '[data-automation-id="addressSection_addressLine1"]', profile.get("address_line1", ""))
            _fill_field(page, '[data-automation-id="addressSection_city"]', profile["city"])

            # Upload resume
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                file_inputs = page.locator('input[type="file"]')
                if file_inputs.count() > 0:
                    file_inputs.first.set_input_files(resume_path)
                    time.sleep(2)

            # Fill cover letter / additional text fields
            _fill_field(page, 'textarea[data-automation-id="coverLetter"]', profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[workday] Error filling {job_url}: {e}")
            # Take error screenshot for debugging
            try:
                page.screenshot(path=screenshot_path.replace(".png", "_error.png"))
            except Exception:
                pass
            return None
        finally:
            browser.close()


def _fill_field(page: Page, selector: str, value: str):
    """Fill a field if it exists and value is non-empty."""
    if not value:
        return
    try:
        el = page.locator(selector)
        if el.count() > 0:
            el.first.fill(value)
    except Exception:
        pass


def _login_or_create(page: Page, profile: dict, job_url: str):
    """Log in to Workday or create an account if none exists."""
    from urllib.parse import urlparse
    domain = urlparse(job_url).netloc  # e.g. rbc.wd3.myworkdayjobs.com

    creds = get_credentials("workday")

    # Check if a sign-in form is present
    sign_in_el = page.locator('[data-automation-id="signInButton"], a:has-text("Sign In"), button:has-text("Sign In")')
    create_el = page.locator('[data-automation-id="createAccount"], a:has-text("Create Account")')

    if creds:
        # Try to sign in
        if sign_in_el.count() > 0:
            sign_in_el.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)
            _fill_field(page, '[data-automation-id="email"]', creds["email"])
            _fill_field(page, '[data-automation-id="password"]', creds["password"])
            page.locator('[data-automation-id="signInSubmitButton"], button[type="submit"]').first.click()
            page.wait_for_load_state("networkidle", timeout=10000)
    else:
        # Create new account
        if create_el.count() > 0:
            create_el.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)

        password = _generate_password()
        _fill_field(page, '[data-automation-id="email"]', profile["email"])
        _fill_field(page, '[data-automation-id="password"]', password)
        _fill_field(page, '[data-automation-id="verifyPassword"]', password)

        submit = page.locator('[data-automation-id="createAccountSubmitButton"], button[type="submit"]')
        if submit.count() > 0:
            submit.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)

        # Verify email if prompted
        verify_link = find_verification_link(domain)
        if verify_link:
            page.goto(verify_link, wait_until="networkidle", timeout=15000)

        save_credentials("workday", profile["email"], password)
```

- [ ] **Step 2: Commit**

```bash
git add src/applicator/drivers/workday.py
git commit -m "feat: Workday driver — fills application form and screenshots"
```

---

### Task 6: Greenhouse driver

**Files:**
- Create: `src/applicator/drivers/greenhouse.py`

- [ ] **Step 1: Implement Greenhouse driver**

Create `src/applicator/drivers/greenhouse.py`:
```python
"""
Fills a Greenhouse job application form.
Greenhouse uses standard HTML labels — more straightforward than Workday.
Does NOT submit — screenshots the filled form.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from src.applicator.account_manager import get_credentials, save_credentials, _generate_password

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            # Greenhouse apply form is usually on the same page or one click away
            apply_btn = page.locator("a:has-text('Apply'), button:has-text('Apply for this Job')")
            if apply_btn.count() > 0:
                apply_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=10000)

            # Fill standard fields
            _fill_by_label(page, "First Name", profile["first_name"])
            _fill_by_label(page, "Last Name", profile["last_name"])
            _fill_by_label(page, "Email", profile["email"])
            _fill_by_label(page, "Phone", profile["phone"])
            _fill_by_label(page, "LinkedIn Profile", profile.get("linkedin", ""))

            # Resume upload
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)

            # Cover letter text area
            cover = page.locator('textarea[id*="cover"], textarea[name*="cover"]')
            if cover.count() > 0:
                cover.first.fill(profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[greenhouse] Error filling {job_url}: {e}")
            return None
        finally:
            browser.close()


def _fill_by_label(page, label_text: str, value: str):
    """Find an input associated with a label containing label_text and fill it."""
    if not value:
        return
    try:
        el = page.get_by_label(label_text, exact=False)
        if el.count() > 0:
            el.first.fill(value)
    except Exception:
        pass
```

- [ ] **Step 2: Commit**

```bash
git add src/applicator/drivers/greenhouse.py
git commit -m "feat: Greenhouse driver — fills application form and screenshots"
```

---

### Task 7: Lever driver

**Files:**
- Create: `src/applicator/drivers/lever.py`

- [ ] **Step 1: Implement Lever driver**

Create `src/applicator/drivers/lever.py`:
```python
"""
Fills a Lever job application form.
Lever uses a clean React app with accessible labels.
Does NOT submit — screenshots the filled form.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")

    # Lever apply URL is the job URL + /apply
    apply_url = job_url.rstrip("/") + "/apply"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(apply_url, wait_until="networkidle", timeout=30000)

            page.get_by_label("Full name", exact=False).first.fill(profile["full_name"])
            page.get_by_label("Email", exact=False).first.fill(profile["email"])
            page.get_by_label("Phone", exact=False).first.fill(profile["phone"])

            # Current company / school
            current_company = page.get_by_label("Current company", exact=False)
            if current_company.count() > 0:
                current_company.first.fill(profile["education"]["school"])

            linkedin = page.get_by_label("LinkedIn", exact=False)
            if linkedin.count() > 0:
                linkedin.first.fill(profile.get("linkedin", ""))

            # Resume upload
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)

            # Additional info / cover letter
            additional = page.locator('textarea[name*="additional"], textarea[placeholder*="cover"], textarea[placeholder*="message"]')
            if additional.count() > 0:
                additional.first.fill(profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[lever] Error filling {job_url}: {e}")
            return None
        finally:
            browser.close()
```

- [ ] **Step 2: Commit**

```bash
git add src/applicator/drivers/lever.py
git commit -m "feat: Lever driver — fills application form and screenshots"
```

---

### Task 8: Applicator orchestrator

**Files:**
- Create: `src/applicator/main.py`
- Create: `tests/test_applicator_main.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_applicator_main.py`:
```python
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
    # Only Workday and Greenhouse jobs staged (Unknown skipped)
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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_applicator_main.py -v
```
Expected: `ModuleNotFoundError`

- [ ] **Step 3: Implement applicator orchestrator**

Create `src/applicator/main.py`:
```python
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from src.scraper import JobPosting
from src.applicator.portal_detector import detect_portal
from src.applicator.drivers import workday as workday_driver
from src.applicator.drivers import greenhouse as greenhouse_driver
from src.applicator.drivers import lever as lever_driver

DEFAULT_APPS_FILE = "dashboard/data/applications.json"

DRIVERS = {
    "workday": workday_driver.fill_application,
    "greenhouse": greenhouse_driver.fill_application,
    "lever": lever_driver.fill_application,
}


def _make_job_id(job: JobPosting) -> str:
    return hashlib.md5(job.url.encode()).hexdigest()[:12]


def _load_applications(apps_file: str = DEFAULT_APPS_FILE) -> list:
    path = Path(apps_file)
    if not path.exists():
        return []
    return json.loads(path.read_text())


def _save_applications(apps: list, apps_file: str = DEFAULT_APPS_FILE):
    path = Path(apps_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(apps, indent=2))


def run_applicator(
    jobs_with_scores: list,
    profile: dict,
    apps_file: str = DEFAULT_APPS_FILE,
) -> list:
    """
    For each High/Medium job, detect portal, fill application, save screenshot.
    Returns list of application dicts added this run.
    """
    existing = _load_applications(apps_file)
    existing_ids = {a["id"] for a in existing}
    new_apps = []

    for job, score, priority, reason in jobs_with_scores:
        if priority == "Low":
            continue

        job_id = _make_job_id(job)
        if job_id in existing_ids:
            continue

        portal = detect_portal(job.url)
        entry = {
            "id": job_id,
            "title": job.title,
            "company": job.company,
            "location": job.location,
            "portal": portal or "unknown",
            "job_url": job.url,
            "screenshot": None,
            "score": score,
            "priority": priority,
            "reason": reason,
            "status": "staged",
            "staged_at": datetime.now(timezone.utc).isoformat(),
        }

        if portal is None:
            print(f"[applicator] Unknown portal for {job.company} — skipping auto-fill")
            entry["status"] = "unknown_portal"
        else:
            fill_fn = DRIVERS[portal]
            screenshot_path = fill_fn(job.url, profile, job_id)
            if screenshot_path:
                entry["screenshot"] = screenshot_path
                entry["status"] = "staged"
            else:
                entry["status"] = "fill_failed"

        new_apps.append(entry)

    _save_applications(existing + new_apps, apps_file)
    return new_apps
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
pytest tests/test_applicator_main.py -v
```
Expected: 7 passed

- [ ] **Step 5: Commit**

```bash
git add src/applicator/main.py tests/test_applicator_main.py
git commit -m "feat: applicator orchestrator — detects portals, fills forms, stages screenshots"
```

---

## ─── PHASE 2: Review Dashboard ───

---

### Task 9: Review dashboard (HTML/JS/CSS)

**Files:**
- Create: `dashboard/index.html`
- Create: `dashboard/app.js`
- Create: `dashboard/style.css`

- [ ] **Step 1: Create dashboard HTML**

Create `dashboard/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Job Application Review</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <header>
    <h1>📋 Applications to Review</h1>
    <p id="subtitle">Loading...</p>
  </header>
  <div id="app">
    <div id="loading">Loading applications...</div>
    <div id="cards"></div>
    <div id="empty" hidden>No staged applications today.</div>
  </div>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create dashboard CSS**

Create `dashboard/style.css`:
```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; color: #222; }
header { background: #1a1a2e; color: white; padding: 24px 32px; }
header h1 { font-size: 1.5rem; margin-bottom: 4px; }
header p { opacity: 0.7; font-size: 0.9rem; }
#app { max-width: 900px; margin: 32px auto; padding: 0 16px; }
.card { background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 24px; overflow: hidden; }
.card-header { padding: 20px 24px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; align-items: flex-start; }
.card-title { font-size: 1.1rem; font-weight: 600; }
.card-company { color: #555; font-size: 0.9rem; margin-top: 2px; }
.badge { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
.badge-High { background: #fee2e2; color: #dc2626; }
.badge-Medium { background: #fef9c3; color: #ca8a04; }
.card-screenshot { width: 100%; max-height: 400px; object-fit: cover; object-position: top; display: block; border-bottom: 1px solid #f0f0f0; }
.card-screenshot-missing { padding: 32px; text-align: center; color: #999; background: #fafafa; }
.card-actions { padding: 16px 24px; display: flex; gap: 12px; }
.btn { padding: 10px 24px; border: none; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
.btn:hover { opacity: 0.85; }
.btn-approve { background: #16a34a; color: white; }
.btn-skip { background: #e5e7eb; color: #374151; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.status-label { font-size: 0.85rem; color: #999; padding: 10px 0; }
```

- [ ] **Step 3: Create dashboard JS**

Create `dashboard/app.js`:
```javascript
const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

async function loadApplications() {
  const res = await fetch('data/applications.json?t=' + Date.now());
  if (!res.ok) throw new Error('Failed to load applications.json');
  return res.json();
}

function renderCard(app) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-' + app.id;

  const screenshotEl = app.screenshot
    ? `<img class="card-screenshot" src="${app.screenshot}" alt="Filled application screenshot" />`
    : `<div class="card-screenshot-missing">Screenshot unavailable</div>`;

  const isActionable = app.status === 'staged';
  const statusText = {
    staged: '', approved: '✅ Approved', skipped: '⏭ Skipped',
    submitted: '🚀 Submitted', fill_failed: '⚠️ Fill failed — manual apply',
    unknown_portal: 'ℹ️ Unknown portal — manual apply',
  }[app.status] || app.status;

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">${app.title}</div>
        <div class="card-company">${app.company} · ${app.location} · ${app.portal}</div>
      </div>
      <span class="badge badge-${app.priority}">${app.priority} (${app.score})</span>
    </div>
    ${screenshotEl}
    <div class="card-actions">
      ${isActionable
        ? `<button class="btn btn-approve" onclick="approve('${app.id}', this)">✅ Approve & Submit</button>
           <button class="btn btn-skip" onclick="skip('${app.id}', this)">⏭ Skip</button>`
        : `<span class="status-label">${statusText}</span>`
      }
      <a href="${app.job_url}" target="_blank" style="margin-left:auto;font-size:0.85rem;color:#6366f1;align-self:center;">View job ↗</a>
    </div>`;
  return card;
}

async function approve(jobId, btn) {
  btn.disabled = true;
  btn.nextElementSibling.disabled = true;
  btn.textContent = 'Submitting...';
  const res = await fetch('/.netlify/functions/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, token }),
  });
  const data = await res.json();
  const card = document.getElementById('card-' + jobId);
  card.querySelector('.card-actions').innerHTML =
    `<span class="status-label">${res.ok ? '✅ Submitted!' : '❌ Error: ' + data.error}</span>`;
}

async function skip(jobId, btn) {
  btn.disabled = true;
  btn.previousElementSibling.disabled = true;
  const res = await fetch('/.netlify/functions/skip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, token }),
  });
  const card = document.getElementById('card-' + jobId);
  card.querySelector('.card-actions').innerHTML =
    `<span class="status-label">⏭ Skipped</span>`;
}

(async () => {
  try {
    const apps = await loadApplications();
    document.getElementById('loading').remove();
    const staged = apps.filter(a => a.status === 'staged');
    document.getElementById('subtitle').textContent =
      `${staged.length} application${staged.length !== 1 ? 's' : ''} waiting for review`;
    if (apps.length === 0) {
      document.getElementById('empty').hidden = false;
      return;
    }
    const container = document.getElementById('cards');
    apps.forEach(app => container.appendChild(renderCard(app)));
  } catch (e) {
    document.getElementById('loading').textContent = 'Error loading applications: ' + e.message;
  }
})();
```

- [ ] **Step 4: Commit**

```bash
git add dashboard/index.html dashboard/app.js dashboard/style.css
git commit -m "feat: review dashboard — static HTML/JS for batch approve/skip"
```

---

### Task 10: Netlify Functions (approve + skip)

**Files:**
- Create: `netlify/functions/approve.py`
- Create: `netlify/functions/skip.py`
- Create: `tests/test_dashboard_functions.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_dashboard_functions.py`:
```python
import json
import pytest
from unittest.mock import patch, MagicMock
import importlib
import sys


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

    # Write a staged applications.json
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
```

- [ ] **Step 2: Create netlify functions directory**

```bash
mkdir -p netlify/functions
touch netlify/__init__.py netlify/functions/__init__.py
```

- [ ] **Step 3: Implement approve function**

Create `netlify/functions/approve.py`:
```python
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

    # Trigger GitHub Actions submit.yml
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
```

- [ ] **Step 4: Implement skip function**

Create `netlify/functions/skip.py`:
```python
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
```

- [ ] **Step 5: Run tests**

```bash
pytest tests/test_dashboard_functions.py -v
```
Expected: 4 passed

- [ ] **Step 6: Commit**

```bash
git add netlify/ tests/test_dashboard_functions.py
git commit -m "feat: Netlify Functions — approve triggers GitHub Actions, skip updates status"
```

---

### Task 11: Netlify config + deploy

**Files:**
- Create: `netlify.toml`

- [ ] **Step 1: Create netlify.toml**

Create `netlify.toml`:
```toml
[build]
  publish = "dashboard"
  functions = "netlify/functions"

[build.environment]
  PYTHON_VERSION = "3.11"

[[headers]]
  for = "/data/*"
  [headers.values]
    Cache-Control = "no-cache"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}
```

- [ ] **Step 2: Deploy to Netlify**

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site → Import an existing project**
2. Connect to GitHub → select `lochsamantha06/job-search-automation`
3. Build settings are auto-detected from `netlify.toml` — leave as-is
4. Click **Deploy site**
5. Once deployed, copy your Netlify URL (e.g. `https://job-search-samantha.netlify.app`)

- [ ] **Step 3: Add Netlify environment variables**

In Netlify → **Site settings → Environment variables**, add:

| Key | Value |
|---|---|
| `DASHBOARD_SECRET` | Generate a strong random string (e.g. run `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `GITHUB_PAT` | Your GitHub PAT with `repo` + `workflow` scopes |

- [ ] **Step 4: Commit netlify.toml and push**

```bash
git add netlify.toml
git commit -m "feat: netlify.toml — configure Netlify Functions and publish dir"
git push
```

---

## ─── PHASE 3: Submit Workflow + Integration ───

---

### Task 12: Submitter

**Files:**
- Create: `src/applicator/submitter.py`
- Create: `tests/test_submitter.py`

- [ ] **Step 1: Write failing tests**

Create `tests/test_submitter.py`:
```python
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


@patch("src.applicator.submitter.workday_driver")
def test_submit_job_workday_calls_driver(mock_wd, tmp_path):
    mock_wd.submit_application.return_value = True
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    result = submit_job("abc123", PROFILE, apps_file=str(apps_file))
    assert result is True
    mock_wd.submit_application.assert_called_once()


@patch("src.applicator.submitter.workday_driver")
def test_submit_job_updates_status_on_success(mock_wd, tmp_path):
    mock_wd.submit_application.return_value = True
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    submit_job("abc123", PROFILE, apps_file=str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "submitted"


@patch("src.applicator.submitter.workday_driver")
def test_submit_job_updates_status_on_failure(mock_wd, tmp_path):
    mock_wd.submit_application.return_value = False
    apps_file = tmp_path / "applications.json"
    apps_file.write_text(json.dumps([APP]))
    submit_job("abc123", PROFILE, apps_file=str(apps_file))
    data = json.loads(apps_file.read_text())
    assert data[0]["status"] == "failed"
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
pytest tests/test_submitter.py -v
```
Expected: `ModuleNotFoundError`

- [ ] **Step 3: Add submit_application to Workday driver**

Open `src/applicator/drivers/workday.py` and append:
```python
def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    """Re-fill the Workday form and click Submit. Returns True on success."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context()
        page = context.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            apply_selectors = [
                "a:has-text('Apply')", "button:has-text('Apply')",
                "[data-automation-id='applyButton']",
            ]
            for sel in apply_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    break

            _login_or_create(page, profile, job_url)
            _fill_field(page, '[data-automation-id="legalNameSection_firstName"]', profile["first_name"])
            _fill_field(page, '[data-automation-id="legalNameSection_lastName"]', profile["last_name"])
            _fill_field(page, '[data-automation-id="phone-number"]', profile["phone"])

            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                file_inputs = page.locator('input[type="file"]')
                if file_inputs.count() > 0:
                    file_inputs.first.set_input_files(resume_path)
                    time.sleep(2)

            # Click Submit
            submit_sel = '[data-automation-id="submitButton"], button:has-text("Submit")'
            submit_btn = page.locator(submit_sel)
            if submit_btn.count() > 0:
                submit_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                page.screenshot(path=confirmed_path, full_page=True)
                return True

            return False
        except Exception as e:
            print(f"[workday] Submit error for {job_url}: {e}")
            return False
        finally:
            browser.close()
```

Do the same for `greenhouse.py` and `lever.py` — add a `submit_application` function that re-fills and clicks Submit.

For `greenhouse.py`, append:
```python
def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)
            apply_btn = page.locator("a:has-text('Apply'), button:has-text('Apply for this Job')")
            if apply_btn.count() > 0:
                apply_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=10000)
            _fill_by_label(page, "First Name", profile["first_name"])
            _fill_by_label(page, "Last Name", profile["last_name"])
            _fill_by_label(page, "Email", profile["email"])
            _fill_by_label(page, "Phone", profile["phone"])
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)
            submit = page.locator('button[type="submit"]:has-text("Submit")')
            if submit.count() > 0:
                submit.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                page.screenshot(path=confirmed_path, full_page=True)
                return True
            return False
        except Exception as e:
            print(f"[greenhouse] Submit error: {e}")
            return False
        finally:
            browser.close()
```

For `lever.py`, append:
```python
def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")
    apply_url = job_url.rstrip("/") + "/apply"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(apply_url, wait_until="networkidle", timeout=30000)
            page.get_by_label("Full name", exact=False).first.fill(profile["full_name"])
            page.get_by_label("Email", exact=False).first.fill(profile["email"])
            page.get_by_label("Phone", exact=False).first.fill(profile["phone"])
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)
            submit = page.locator('button[type="submit"]:has-text("Submit")')
            if submit.count() > 0:
                submit.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                page.screenshot(path=confirmed_path, full_page=True)
                return True
            return False
        except Exception as e:
            print(f"[lever] Submit error: {e}")
            return False
        finally:
            browser.close()
```

- [ ] **Step 4: Implement submitter**

Create `src/applicator/submitter.py`:
```python
import json
from pathlib import Path

from src.applicator.drivers import workday as workday_driver
from src.applicator.drivers import greenhouse as greenhouse_driver
from src.applicator.drivers import lever as lever_driver

DEFAULT_APPS_FILE = "dashboard/data/applications.json"

SUBMIT_DRIVERS = {
    "workday": workday_driver.submit_application,
    "greenhouse": greenhouse_driver.submit_application,
    "lever": lever_driver.submit_application,
}


def _update_status(job_id: str, status: str, apps_file: str = DEFAULT_APPS_FILE):
    path = Path(apps_file)
    apps = json.loads(path.read_text()) if path.exists() else []
    for app in apps:
        if app["id"] == job_id:
            app["status"] = status
            break
    path.write_text(json.dumps(apps, indent=2))


def submit_job(job_id: str, profile: dict, apps_file: str = DEFAULT_APPS_FILE) -> bool:
    """
    Load the staged application by job_id, re-fill and submit it.
    Updates status to 'submitted' or 'failed'. Returns True on success.
    """
    path = Path(apps_file)
    apps = json.loads(path.read_text()) if path.exists() else []
    app = next((a for a in apps if a["id"] == job_id), None)

    if not app:
        print(f"[submitter] Job ID {job_id} not found in {apps_file}")
        return False

    portal = app.get("portal")
    submit_fn = SUBMIT_DRIVERS.get(portal)

    if not submit_fn:
        print(f"[submitter] No submit driver for portal '{portal}'")
        _update_status(job_id, "failed", apps_file)
        return False

    success = submit_fn(app["job_url"], profile, job_id)
    _update_status(job_id, "submitted" if success else "failed", apps_file)
    return success
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pytest tests/test_submitter.py -v
```
Expected: 5 passed

- [ ] **Step 6: Commit**

```bash
git add src/applicator/submitter.py src/applicator/drivers/ tests/test_submitter.py
git commit -m "feat: submitter — re-fills and submits approved applications"
```

---

### Task 13: Submit + cleanup GitHub Actions workflows

**Files:**
- Create: `.github/workflows/submit.yml`
- Create: `.github/workflows/cleanup.yml`

- [ ] **Step 1: Create submit.yml**

Create `.github/workflows/submit.yml`:
```yaml
name: Submit Application

on:
  workflow_dispatch:
    inputs:
      job_id:
        description: "Job ID from applications.json"
        required: true
        type: string

jobs:
  submit:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Install Playwright browsers
        run: playwright install chromium --with-deps

      - name: Write portal accounts file
        env:
          PORTAL_ACCOUNTS_JSON: ${{ secrets.PORTAL_ACCOUNTS_JSON }}
        run: |
          mkdir -p data
          echo "$PORTAL_ACCOUNTS_JSON" > data/portal_accounts.json

      - name: Write Gmail credentials
        env:
          GMAIL_CREDENTIALS_JSON: ${{ secrets.GMAIL_CREDENTIALS_JSON }}
        run: echo "$GMAIL_CREDENTIALS_JSON" > /tmp/gmail_creds.json

      - name: Submit application
        env:
          GMAIL_CREDENTIALS_JSON: ${{ secrets.GMAIL_CREDENTIALS_JSON }}
          GOOGLE_SHEETS_ID: ${{ secrets.GOOGLE_SHEETS_ID }}
          GOOGLE_CREDENTIALS_PATH: credentials.json
        run: |
          python -c "
          import json
          from src.applicator.submitter import submit_job
          profile = json.load(open('assets/profile.json'))
          result = submit_job('${{ inputs.job_id }}', profile)
          print('Submitted:', result)
          "

      - name: Update portal accounts secret
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          gh secret set PORTAL_ACCOUNTS_JSON < data/portal_accounts.json

      - name: Commit updated applications.json
        run: |
          git config user.email "actions@github.com"
          git config user.name "GitHub Actions"
          git add dashboard/data/
          git diff --staged --quiet || git commit -m "chore: update application status after submission"
          git push
```

- [ ] **Step 2: Create cleanup.yml**

Create `.github/workflows/cleanup.yml`:
```yaml
name: Weekly Screenshot Cleanup

on:
  schedule:
    - cron: "0 0 * * 0"  # Sundays at midnight UTC
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Remove screenshots older than 14 days
        run: |
          find dashboard/data/screenshots/ -name "*.png" -mtime +14 -delete
          echo "Cleanup complete"

      - name: Commit cleanup
        run: |
          git config user.email "actions@github.com"
          git config user.name "GitHub Actions"
          git add dashboard/data/screenshots/
          git diff --staged --quiet || git commit -m "chore: weekly screenshot cleanup"
          git push
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/submit.yml .github/workflows/cleanup.yml
git commit -m "feat: submit.yml + cleanup.yml GitHub Actions workflows"
```

---

### Task 14: SMS extension — add dashboard link

**Files:**
- Modify: `src/sms.py`

- [ ] **Step 1: Add dashboard link to digest**

Open `src/sms.py`. Replace the `_format_digest` function with:
```python
import datetime
import hashlib
import hmac
import os
from twilio.rest import Client


def _daily_token() -> str:
    """Generate a daily rotating token from DASHBOARD_SECRET + today's date."""
    secret = os.environ.get("DASHBOARD_SECRET", "changeme")
    today = datetime.date.today().isoformat()
    return hmac.new(secret.encode(), today.encode(), hashlib.sha256).hexdigest()[:24]


def _format_digest(jobs_with_scores: list, spreadsheet_id: str, dashboard_url: str = "") -> str:
    today = datetime.date.today().strftime("%b %d").lstrip()

    high = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "High"]
    medium = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "Medium"]
    low = [(j, s, p, r) for j, s, p, r in jobs_with_scores if p == "Low"]

    lines = [
        f"📋 Job Digest – {today}",
        f"{len(jobs_with_scores)} new posting{'s' if len(jobs_with_scores) != 1 else ''} today",
        "",
    ]

    if high:
        lines.append(f"🔴 HIGH ({len(high)})")
        for job, *_ in high:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    if medium:
        lines.append(f"🟡 MEDIUM ({len(medium)})")
        for job, *_ in medium:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    if low:
        lines.append(f"⚪ LOW ({len(low)})")
        for job, *_ in low:
            lines.append(f"• {job.title} @ {job.company} – {job.deadline}")
        lines.append("")

    lines.append(f"📊 Sheets: https://docs.google.com/spreadsheets/d/{spreadsheet_id}")

    if dashboard_url:
        token = _daily_token()
        lines.append(f"✅ Review & approve: {dashboard_url}?token={token}")

    return "\n".join(lines)


def send_digest(
    jobs_with_scores: list,
    spreadsheet_id: str,
    twilio_account_sid: str,
    twilio_auth_token: str,
    twilio_from_number: str,
    to_number: str,
    dashboard_url: str = "",
) -> bool:
    if not jobs_with_scores:
        print("[sms] No new jobs today — skipping SMS.")
        return True

    body = _format_digest(jobs_with_scores, spreadsheet_id, dashboard_url)

    try:
        client = Client(twilio_account_sid, twilio_auth_token)
        message = client.messages.create(body=body, from_=twilio_from_number, to=to_number)
        print(f"[sms] Sent digest. SID: {message.sid}")
        return True
    except Exception as e:
        print(f"[sms] Twilio error: {e}")
        return False
```

- [ ] **Step 2: Commit**

```bash
git add src/sms.py
git commit -m "feat: SMS now includes dashboard link with daily rotating token"
```

---

### Task 15: Wire everything into main.py + update daily_scrape.yml

**Files:**
- Modify: `src/main.py`
- Modify: `.github/workflows/daily_scrape.yml`

- [ ] **Step 1: Update main.py to call applicator and commit results**

Open `src/main.py`. Replace the `run` function with:
```python
import json
import os
import subprocess
from dotenv import load_dotenv

from src.scraper import scrape_all
from src.deduplicator import filter_new_jobs
from src.scorer import score_job
from src.sheets import get_seen_urls, append_jobs
from src.contact_finder import find_contact
from src.message_drafter import draft_message
from src.sms import send_digest
from src.applicator.main import run_applicator


def load_config() -> dict:
    load_dotenv()
    required = [
        "GOOGLE_SHEETS_ID", "GOOGLE_CREDENTIALS_PATH",
        "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN",
        "TWILIO_FROM_NUMBER", "TO_PHONE_NUMBER", "ANTHROPIC_API_KEY",
    ]
    config = {}
    missing = []
    for key in required:
        val = os.environ.get(key)
        if not val:
            missing.append(key)
        config[key] = val
    config["HUNTER_API_KEY"] = os.environ.get("HUNTER_API_KEY")
    config["DASHBOARD_URL"] = os.environ.get("DASHBOARD_URL", "")
    config["DASHBOARD_SECRET"] = os.environ.get("DASHBOARD_SECRET", "")
    if missing:
        raise EnvironmentError(f"Missing required env vars: {', '.join(missing)}")
    return config


def run(config: dict) -> dict:
    sheet_id = config["GOOGLE_SHEETS_ID"]
    creds_path = config["GOOGLE_CREDENTIALS_PATH"]

    print("[main] Reading seen URLs from Google Sheets...")
    seen_urls = get_seen_urls(sheet_id, creds_path)

    print("[main] Scraping Indeed...")
    raw_jobs = scrape_all()
    print(f"[main] Scraped {len(raw_jobs)} raw postings.")

    new_jobs = filter_new_jobs(raw_jobs, seen_urls)
    print(f"[main] {len(new_jobs)} new postings after deduplication.")

    if not new_jobs:
        send_digest([], sheet_id,
                    config["TWILIO_ACCOUNT_SID"], config["TWILIO_AUTH_TOKEN"],
                    config["TWILIO_FROM_NUMBER"], config["TO_PHONE_NUMBER"],
                    config["DASHBOARD_URL"])
        return {"scraped": len(raw_jobs), "new": 0, "appended": 0, "sms_sent": True, "applied": 0}

    jobs_with_scores = []
    for job in new_jobs:
        score, priority, reason = score_job(job.title, job.company, job.description)
        jobs_with_scores.append((job, score, priority, reason))

    # Enrich High/Medium jobs
    enriched = []
    for job, score, priority, reason in jobs_with_scores:
        if priority in ("High", "Medium"):
            contact = find_contact(job.company, config.get("HUNTER_API_KEY"))
            outreach = draft_message(job.title, job.company, contact.name, config["ANTHROPIC_API_KEY"])
            job._contact = contact
            job._outreach = outreach
        enriched.append((job, score, priority, reason))

    # Auto-fill applications
    print("[main] Running applicator...")
    profile_path = "assets/profile.json"
    if os.path.exists(profile_path):
        profile = json.loads(open(profile_path).read())
        new_apps = run_applicator(enriched, profile)
        print(f"[main] {len(new_apps)} applications staged.")

        # Commit updated applications.json + screenshots to repo
        subprocess.run(["git", "config", "user.email", "actions@github.com"], check=False)
        subprocess.run(["git", "config", "user.name", "GitHub Actions"], check=False)
        subprocess.run(["git", "add", "dashboard/data/"], check=False)
        result = subprocess.run(["git", "diff", "--staged", "--quiet"])
        if result.returncode != 0:
            subprocess.run(["git", "commit", "-m", "chore: stage new applications"], check=False)
            subprocess.run(["git", "push"], check=False)
    else:
        new_apps = []
        print("[main] assets/profile.json not found — skipping applicator")

    print("[main] Appending to Google Sheets...")
    appended = append_jobs(enriched, sheet_id, creds_path)

    print("[main] Sending SMS digest...")
    sms_sent = send_digest(
        enriched, sheet_id,
        config["TWILIO_ACCOUNT_SID"], config["TWILIO_AUTH_TOKEN"],
        config["TWILIO_FROM_NUMBER"], config["TO_PHONE_NUMBER"],
        config["DASHBOARD_URL"],
    )

    summary = {
        "scraped": len(raw_jobs), "new": len(new_jobs),
        "appended": appended, "sms_sent": sms_sent, "applied": len(new_apps),
    }
    print(f"[main] Done. {summary}")
    return summary


if __name__ == "__main__":
    cfg = load_config()
    run(cfg)
```

- [ ] **Step 2: Update daily_scrape.yml**

Open `.github/workflows/daily_scrape.yml` and replace the full file with:
```yaml
name: Daily Job Scrape

on:
  schedule:
    - cron: "0 15 * * *"
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python 3.11
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: "pip"

      - name: Install dependencies
        run: pip install -r requirements.txt

      - name: Install Playwright browsers
        run: playwright install chromium --with-deps

      - name: Run tests
        run: pytest tests/ -v --tb=short

      - name: Write Google credentials file
        env:
          GOOGLE_CREDENTIALS_JSON: ${{ secrets.GOOGLE_CREDENTIALS_JSON }}
        run: echo "$GOOGLE_CREDENTIALS_JSON" > credentials.json

      - name: Write portal accounts file
        env:
          PORTAL_ACCOUNTS_JSON: ${{ secrets.PORTAL_ACCOUNTS_JSON }}
        run: |
          mkdir -p data
          echo "$PORTAL_ACCOUNTS_JSON" > data/portal_accounts.json

      - name: Run daily scrape + apply pipeline
        env:
          GOOGLE_SHEETS_ID: ${{ secrets.GOOGLE_SHEETS_ID }}
          GOOGLE_CREDENTIALS_PATH: credentials.json
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_FROM_NUMBER: ${{ secrets.TWILIO_FROM_NUMBER }}
          TO_PHONE_NUMBER: ${{ secrets.TO_PHONE_NUMBER }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          HUNTER_API_KEY: ${{ secrets.HUNTER_API_KEY }}
          DASHBOARD_URL: ${{ secrets.DASHBOARD_URL }}
          DASHBOARD_SECRET: ${{ secrets.DASHBOARD_SECRET }}
          GMAIL_CREDENTIALS_JSON: ${{ secrets.GMAIL_CREDENTIALS_JSON }}
        run: python -m src.main

      - name: Update portal accounts secret
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          if [ -f data/portal_accounts.json ]; then
            gh secret set PORTAL_ACCOUNTS_JSON < data/portal_accounts.json
          fi

      - name: Clean up credentials
        if: always()
        run: rm -f credentials.json data/portal_accounts.json
```

- [ ] **Step 3: Add new secrets to GitHub**

In GitHub repo → Settings → Secrets → Actions, add:

| Secret | Value |
|---|---|
| `PORTAL_ACCOUNTS_JSON` | `{}` (empty JSON object to start) |
| `GMAIL_CREDENTIALS_JSON` | Your Gmail OAuth JSON (see README for setup) |
| `DASHBOARD_URL` | Your Netlify URL e.g. `https://job-search-samantha.netlify.app` |
| `DASHBOARD_SECRET` | Same value you set in Netlify env vars |

- [ ] **Step 4: Commit and push everything**

```bash
git add src/main.py .github/workflows/daily_scrape.yml
git commit -m "feat: wire applicator into main pipeline + update daily_scrape.yml"
git push
```

- [ ] **Step 5: Manual test run**

Go to GitHub → Actions → Daily Job Scrape → **Run workflow**. Watch the logs. Expected flow:
1. Tests pass
2. Scrape runs
3. Applicator fills forms (or logs "Unknown portal — skipping")
4. applications.json committed to repo
5. Netlify auto-deploys dashboard
6. SMS arrives with dashboard link

---

## New secrets summary

| Secret | Where | Purpose |
|---|---|---|
| `PORTAL_ACCOUNTS_JSON` | GitHub | Portal login credentials (starts as `{}`) |
| `GMAIL_CREDENTIALS_JSON` | GitHub | Gmail API OAuth for email verification |
| `DASHBOARD_URL` | GitHub | Your Netlify site URL |
| `DASHBOARD_SECRET` | GitHub + Netlify | Token for dashboard auth |
| `GITHUB_PAT` | Netlify | PAT to trigger submit.yml (use existing token) |
