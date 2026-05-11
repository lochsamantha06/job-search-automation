# Internship Job Search Automation

Automated daily scraper that finds finance and consulting internships at Canadian Big 5 banks and Big 4 consulting firms, scores them against Samantha's profile, drafts personalised outreach emails, logs everything to Google Sheets, and sends an SMS digest every morning.

## How it works

1. **Scraper** — searches Indeed Canada for each company × location (Vancouver, Toronto, Hong Kong) daily
2. **Deduplicator** — skips jobs already logged in Google Sheets
3. **Scorer** — ranks each posting (High / Medium / Low) based on role type, company, skills, and language match
4. **Contact Finder** — looks up a recruiter email via Hunter.io; falls back to a LinkedIn search URL
5. **Message Drafter** — uses Claude to write a personalised cold-outreach email for High/Medium jobs
6. **Sheets Logger** — appends new jobs with all enrichment to a Google Sheet
7. **SMS Digest** — sends a Twilio text at 8 am Pacific with today's new postings

## Scoring

| Factor | Points |
|---|---|
| Investment Banking / Capital Markets / Asset & Wealth Management | +4 |
| Strategy / Management Consulting / FP&A / Corporate Finance | +3 |
| Financial Analyst / Business Analyst | +2 |
| Intern / Co-op (catch-all) | +1 |
| Big 5 Bank / Big 4 Consulting | +2 |
| Scotiabank (+ referral bonus) | +4 |
| Bloomberg / DCF / Valuation / Excel mentioned | +1 |
| Cantonese / Mandarin / Chinese mentioned | +1 |

**High** ≥ 8 · **Medium** 5–7 · **Low** < 5

## Setup

### 1. Clone & install

```bash
git clone https://github.com/<your-username>/job-search-automation.git
cd job-search-automation
pip install -r requirements.txt
```

### 2. Google Sheets API

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → Create a new project
2. Enable **Google Sheets API** and **Google Drive API**
3. Create a **Service Account** → download the JSON key → save as `credentials.json` (gitignored)
4. Create a new Google Sheet → share it with the service account email (Editor)
5. Copy the Sheet ID from the URL: `docs.google.com/spreadsheets/d/<SHEET_ID>/edit`

### 3. Twilio SMS

1. Sign up at [twilio.com](https://www.twilio.com/) (free trial gives ~$15 credit)
2. Get a phone number from the Console
3. Note your **Account SID**, **Auth Token**, and **From Number**

### 4. Anthropic API

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Create an API key

### 5. Hunter.io (optional — free tier: 25 searches/month)

1. Sign up at [hunter.io](https://hunter.io/)
2. Copy your API key from the dashboard

### 6. Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_CREDENTIALS_PATH=credentials.json
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
TO_PHONE_NUMBER=+1XXXXXXXXXX
ANTHROPIC_API_KEY=sk-ant-...
HUNTER_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx   # optional
```

### 7. GitHub Actions secrets

In your GitHub repo → **Settings → Secrets and variables → Actions**, add:

| Secret name | Value |
|---|---|
| `GOOGLE_SHEETS_ID` | Your Sheet ID |
| `GOOGLE_CREDENTIALS_JSON` | **Full contents** of your `credentials.json` file |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_FROM_NUMBER` | Twilio phone number (e.g. `+16041234567`) |
| `TO_PHONE_NUMBER` | Your phone number |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `HUNTER_API_KEY` | Hunter.io API key (optional) |

> **GOOGLE_CREDENTIALS_JSON** — open `credentials.json`, select all text, paste as the secret value.

## Running locally

```bash
python -m src.main
```

## Running tests

```bash
pytest tests/ -v
```

## Schedule

The workflow runs automatically every day at **08:00 AM Pacific (15:00 UTC)**. You can also trigger it manually from the **Actions** tab in GitHub.

## Google Sheet columns

| Column | Content |
|---|---|
| A | Date Added |
| B | Job Title |
| C | Company |
| D | Location |
| E | URL |
| F | Score |
| G | Priority |
| H | Reason |
| I | Deadline |
| J | Contact Name |
| K | Contact Email |
| L | LinkedIn Search |
| M | Outreach Draft |
| N | Status |
