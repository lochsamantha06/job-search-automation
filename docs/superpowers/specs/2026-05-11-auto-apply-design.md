# Auto-Apply System Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically fill job applications on Workday, Greenhouse, and Lever portals, stage screenshots for batch review, and submit approved applications — all orchestrated via GitHub Actions + Netlify.

**Architecture:** GitHub Actions runs daily browser automation (Playwright) to fill forms and take screenshots, committing results to the repo. Netlify auto-deploys the review dashboard from the repo. When the user approves a job, a Netlify Function triggers a GitHub Actions `submit.yml` workflow that re-fills and submits the application.

**Tech Stack:** Python 3.11, Playwright, Flask-free (static HTML + Netlify Functions), SQLite-free (JSON files in repo), GitHub Actions, Netlify, Gmail API (email verification), Twilio (existing)

---

## 1. Components

### 1.1 Profile Store
`assets/profile.json` — Samantha's full candidate profile. Single source of truth used by all portal drivers.

```json
{
  "name": "Samantha Lo",
  "email": "lochsamantha06@gmail.com",
  "phone": "+1XXXXXXXXXX",
  "linkedin": "https://linkedin.com/in/samanthalo",
  "address": "Vancouver, BC",
  "education": {
    "school": "University of British Columbia",
    "faculty": "Sauder School of Business",
    "degree": "Bachelor of Commerce",
    "major": "Finance",
    "gpa": "4.0",
    "graduation": "2028"
  },
  "work_experience": [],
  "skills": ["Financial Modelling", "DCF", "Bloomberg", "Excel", "Python"],
  "languages": ["English", "Cantonese"],
  "resume_path": "assets/resume.pdf"
}
```

`assets/resume.pdf` — Resume file uploaded to every portal.

### 1.2 Portal Detector
`src/applicator/portal_detector.py`

Identifies which ATS a job URL belongs to by matching URL patterns:
- **Workday:** `myworkdayjobs.com`, `myworkday.com`
- **Greenhouse:** `boards.greenhouse.io`, `greenhouse.io`
- **Lever:** `jobs.lever.co`, `lever.co`
- **Unknown:** returns `None` → logged to Sheets as "Manual apply needed"

### 1.3 Account Manager
`src/applicator/account_manager.py`

Handles portal account creation and login. Credentials stored in `data/portal_accounts.json` (gitignored).

Flow:
1. Check `portal_accounts.json` for existing account on this portal
2. If none: register with Samantha's email + generated password
3. Call Gmail API (read-only) to find verification email → extract link → navigate to it
4. Save credentials to `portal_accounts.json`
5. Return credentials for the driver to use

CAPTCHA handling: if Playwright detects a CAPTCHA challenge, skip this job and log "CAPTCHA blocked — manual apply needed" to Sheets.

### 1.4 Portal Drivers
Three dedicated drivers, each implementing the same interface:

```python
def fill_application(page, job_url: str, profile: dict) -> str:
    """Fill the application form. Returns screenshot path. Does NOT submit."""
```

- `src/applicator/drivers/workday.py`
- `src/applicator/drivers/greenhouse.py`
- `src/applicator/drivers/lever.py`

Each driver:
1. Navigates to the job URL
2. Logs in (or creates account via account manager)
3. Fills all standard fields: name, email, phone, education, GPA, work experience, resume upload
4. Takes a full-page screenshot → saves to `data/staged/screenshots/<job_id>.png`
5. Returns the screenshot path — does NOT click Submit

### 1.5 Staging File
`data/staged/applications.json` — committed to the repo after each daily run. Netlify reads this to render the dashboard.

```json
[
  {
    "id": "abc123",
    "title": "Investment Banking Analyst Intern",
    "company": "Scotiabank",
    "portal": "workday",
    "job_url": "https://...",
    "screenshot": "data/staged/screenshots/abc123.png",
    "score": 9,
    "priority": "High",
    "status": "staged",
    "staged_at": "2026-05-11T08:30:00"
  }
]
```

Status values: `staged` → `approved` / `skipped` → `submitted` / `failed`

### 1.6 Applicator Orchestrator
`src/applicator/main.py`

Called from the existing `src/main.py` pipeline after scoring. For each High/Medium job:
1. Run portal detector → skip if unknown portal
2. Fill application via appropriate driver → save screenshot
3. Append entry to `applications.json`
4. Commit `applications.json` + screenshots to repo (triggers Netlify deploy)

### 1.7 Review Dashboard (Netlify)
`dashboard/index.html` + `dashboard/app.js`

Static site auto-deployed by Netlify from the repo. Reads `applications.json` and renders:
- Job title, company, priority badge
- Screenshot of the filled form
- **Approve** and **Skip** buttons

On Approve → calls `/.netlify/functions/approve` with the job `id`.
On Skip → calls `/.netlify/functions/skip` with the job `id`.

Secured by a daily rotating token passed in the SMS URL: `https://your-app.netlify.app/?token=abc123`

### 1.8 Netlify Functions
`netlify/functions/approve.py` and `netlify/functions/skip.py`

Both validate the token, then:
- **approve:** calls GitHub API `POST /repos/.../actions/workflows/submit.yml/dispatches` with `job_id` as input
- **skip:** updates `applications.json` status to `skipped`, commits to repo

Token stored as Netlify environment variable `DASHBOARD_SECRET`.

### 1.9 Submit Workflow
`.github/workflows/submit.yml`

Triggered by `workflow_dispatch` with input `job_id`. Runs the submitter:
1. Load `applications.json` → find entry by `job_id`
2. Load portal credentials from `portal_accounts.json` secret
3. Re-navigate to job URL, re-login, re-fill form (fresh session)
4. Click Submit
5. Screenshot confirmation page → save to `data/staged/screenshots/<job_id>_confirmed.png`
6. Update `applications.json` status → `submitted`
7. Update Google Sheets row → Status: "Applied"
8. Commit changes → Netlify re-deploys

### 1.10 SMS Extension
Extends existing `src/sms.py`. When staged applications exist, adds to the daily text:

```
📋 Job Digest – May 11
4 new postings · 3 applications staged

Review & approve:
https://your-app.netlify.app/?token=abc123
```

---

## 2. Data Flow

```
Daily GitHub Actions run (daily_scrape.yml)
  │
  ├── [existing] Scrape → Score → Find Contact → Draft Email → Log to Sheets
  │
  └── [new] For each High/Medium job:
        ├── Detect portal
        ├── Fill application (Playwright) → screenshot
        ├── Append to applications.json
        └── Commit to repo → Netlify auto-deploys

Morning SMS → user taps link → Netlify dashboard

User taps Approve
  └── Netlify Function → GitHub API → triggers submit.yml
        └── Re-fill → Submit → Update Sheets + applications.json → Netlify re-deploys
```

---

## 3. New GitHub Secrets

| Secret | Purpose |
|---|---|
| `GMAIL_CREDENTIALS_JSON` | Gmail API OAuth credentials for email verification |
| `PORTAL_ACCOUNTS_JSON` | Encrypted portal login credentials |
| `GITHUB_TOKEN` | Already available in Actions — used to trigger submit.yml |
| `DASHBOARD_SECRET` | Daily token for dashboard auth (also set in Netlify env vars) |

---

## 4. New Dependencies

```
playwright==1.44.0
google-api-python-client==2.126.0  # Gmail API
google-auth-oauthlib==1.2.0
pillow==10.3.0                      # Screenshots
```

---

## 5. File Structure (new files only)

```
assets/
  profile.json          ← candidate profile
  resume.pdf            ← resume for upload

src/applicator/
  __init__.py
  main.py               ← orchestrator
  portal_detector.py
  account_manager.py
  submitter.py
  drivers/
    __init__.py
    workday.py
    greenhouse.py
    lever.py

dashboard/
  index.html            ← review UI
  app.js                ← fetches applications.json, renders cards
  style.css

netlify/functions/
  approve.py
  skip.py

netlify.toml            ← Netlify config (publish dir, functions dir)

data/staged/
  applications.json     ← staging file (committed to repo)
  screenshots/          ← filled-form screenshots (committed, auto-cleaned weekly)
  .gitkeep

.github/workflows/
  submit.yml            ← on-demand submission workflow (new)
  cleanup.yml           ← weekly screenshot cleanup (new)

tests/
  test_portal_detector.py
  test_account_manager.py
  test_applicator_main.py
```

---

## 6. Error Handling

| Scenario | Behaviour |
|---|---|
| Unknown portal | Log to Sheets: "Manual apply needed", skip |
| CAPTCHA blocked | Log to Sheets: "CAPTCHA blocked — manual apply", skip |
| Account creation fails | Log error, skip job |
| Gmail verification times out (5 min) | Log error, skip job |
| Form field not found | Log warning, fill what's possible, still screenshot |
| Submission fails | Update status to `failed`, log to Sheets, notify via SMS next day |

---

## 7. Scope Limits (Phase 1)

- Portals covered: Workday, Greenhouse, Lever only
- No support for multi-step applications requiring custom essays (flagged as "Manual apply needed")
- Resume upload only — no cover letter upload (outreach email serves as cover letter)
- Option C (auto-send outreach emails) is a separate future add-on, not included here
