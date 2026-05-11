# Internship Job Search Automation — Design Spec
**Date:** 2026-05-10
**Owner:** Samantha Lo
**Status:** Approved

---

## Overview

An automated system that scrapes finance and consulting internship postings daily from the Big 5 Canadian banks and job boards, scores each posting against Samantha's profile, sends a daily SMS digest of new postings (with deadlines), and logs everything to Google Sheets for application tracking.

---

## Goals

- Surface relevant new internship postings daily without manual searching
- Prioritize postings that match Samantha's skills and target roles (IB, capital markets, financial transformation, strategy consulting)
- Track applications and deadlines in one place (Google Sheets)
- Receive a concise SMS each morning with only new postings — no text if nothing new
- Run fully automatically with no laptop required (GitHub Actions)

---

## Target Profile (for scoring)

**Candidate:** Samantha Lo, UBC Sauder BCom Finance, Class of 2028 (after 2nd year)
**GPA:** 4.0/4.33, Dean's List
**Key skills:** Bloomberg, Excel (financial modelling), PowerPoint, Tableau, data analysis
**Languages:** English (primary), Cantonese, Mandarin
**Target roles:** Investment banking, capital markets, M&A, financial transformation, FP&A, strategy/management consulting
**Target locations:** Vancouver, Toronto, Hong Kong (location flexible — all considered)
**Target companies:** Big 5 banks (RBC, TD, BMO, CIBC, Scotiabank), Big 4 consulting (Deloitte, KPMG, EY, PwC), and other major finance/consulting firms

---

## Architecture

Five components, each with a single responsibility:

### 1. Scraper
- Scrapes career pages for the Big 5 Canadian banks daily
- Also searches Indeed for finance/consulting internship roles in Vancouver, Toronto, and Hong Kong
- Extracts: job title, company, location, URL, posting date, deadline (where available)
- Target URLs:
  - RBC: `jobs.rbc.com`
  - TD: `jobs.td.com`
  - BMO: `jobs.bmo.com`
  - CIBC: `cibc.wd3.myworkdayjobs.com`
  - Scotiabank: `jobs.scotiabank.com`
  - Indeed: search API / HTML scrape with keywords
- Search keywords: `intern`, `internship`, `co-op`, `analyst`, `associate`, `consulting`, `financial transformation`, `capital markets`, `investment banking`, `FP&A`

### 2. Deduplicator
- Before processing, loads all job URLs already stored in Google Sheets ("Jobs Found" tab)
- Filters scraped results to only jobs not previously seen
- Prevents repeat SMS notifications for the same posting

### 3. Priority Scorer
Scores each new posting out of 10 based on role fit:

| Signal | Points |
|--------|--------|
| Role: IB / Capital Markets / M&A | +4 |
| Role: Asset Management / Wealth Management | +4 |
| Role: Strategy / Management Consulting | +3 |
| Role: FP&A / Corporate Finance / Financial Transformation | +3 |
| Role: General Financial Analyst | +2 |
| Requires Bloomberg or financial modelling | +1 |
| Company: Big 5 Bank or Big 4 Consulting | +2 |
| Company: Scotiabank (referral available) | +2 bonus |
| Mentions Cantonese/Mandarin as asset | +1 |

**Score → Priority:**
- 8–10 → **High**
- 5–7 → **Medium**
- 1–4 → **Low**

### 4. Google Sheets Logger
Writes new postings to the "Jobs Found" tab and maintains the "Applications" tab for manual tracking.

**"Jobs Found" tab columns:**
| Column | Description |
|--------|-------------|
| Title | Job title |
| Company | Employer name |
| Location | City / Remote |
| URL | Direct link to posting |
| Deadline | Application deadline (if found, else "Rolling") |
| Date Found | Date the scraper discovered this posting |
| Priority | High / Medium / Low |
| Priority Reason | E.g. "IB role + Big 5 bank + Bloomberg required" |
| Hiring Manager | Name of recruiter/hiring manager (if found) |
| Manager LinkedIn | LinkedIn profile URL |
| Manager Email | Direct email via Hunter.io (if found) |
| LinkedIn Search | Pre-built search URL as fallback |
| Outreach Message | Claude-drafted personalized message, ready to send |
| Outreach Sent? | Manual field — Yes / No |
| Applied? | Manual field — Yes / No / Considering |

**"Applications" tab columns:**
| Column | Description |
|--------|-------------|
| Company | Employer name |
| Role | Job title |
| Location | City |
| Date Applied | When application was submitted |
| Deadline | Application deadline |
| Status | Applied / Phone Screen / Interview / Final Round / Offer / Rejected |
| Follow-up Date | When to follow up with recruiter |
| Recruiter Contact | Name/email if known |
| Notes | Free text |

### 5. Contact Finder
- For each new **High** priority posting, searches LinkedIn public pages for the recruiter or hiring manager at that company (e.g. "Talent Acquisition RBC Vancouver")
- Also tries Hunter.io free tier (25 searches/month) to find a direct email address
- Outputs: hiring manager name, LinkedIn profile URL, email (if found), and a pre-built LinkedIn search URL as fallback
- Only runs for High priority roles to stay within API limits

### 6. Message Drafter
- Uses the Claude API to generate a personalized LinkedIn outreach message for each High priority contact found
- Message is tailored using: job title, company, Samantha's most relevant experience (Scotiabank, Computershare HK, Capital Markets Challenge), and the role's key requirements
- Tone: concise, professional, genuine — not a template-sounding blast
- Output: a ready-to-send ~150 word LinkedIn connection note or cold email, saved to Google Sheets

**Example drafted message:**
```
Hi [Name], I came across the [Role] opportunity at [Company] and wanted to reach out directly. 
I'm a 2nd-year Finance student at UBC Sauder (4.0 GPA) with experience at Scotiabank and 
Computershare in Hong Kong, where I worked on corporate services and IPO documentation for 
35+ clients. I've also built DCF and M&A models through UBC's Capital Markets Challenge. 
I'd love to connect and learn more about the team. Thanks so much!
– Samantha
```

### 7. SMS Notifier
- Sends a daily SMS via Twilio at 8:00am Pacific Time
- Only sends if there are new postings that day
- Lists postings sorted by priority (High first)
- Shows deadline for each posting where available
- Includes a link to the Google Sheets tracker

**SMS format:**
```
2 new postings today:

[HIGH] RBC – IB Analyst Intern (Toronto)
Deadline: Mar 15
https://jobs.rbc.com/...

[MED] TD – Financial Analyst Intern (Vancouver)
Deadline: Rolling
https://jobs.td.com/...

Tracker: https://docs.google.com/spreadsheets/...
```

---

## Scheduler

- **Platform:** GitHub Actions (free, no server needed)
- **Schedule:** Daily cron at 8:00am Vancouver time (15:00 UTC during PDT)
- **Trigger:** Automated cron + manual trigger available for testing
- All secrets (Twilio credentials, Google Sheets API key, phone number) stored in GitHub Secrets — never in code

---

## Tech Stack

| Component | Tool |
|-----------|------|
| Language | Python 3.11 |
| Scraping | `requests` + `BeautifulSoup4` |
| Google Sheets | `gspread` + Google Service Account |
| SMS | Twilio (`twilio` Python SDK) |
| Contact finding | LinkedIn public search + Hunter.io free tier |
| Message drafting | Claude API (Anthropic) |
| Scheduling | GitHub Actions cron |
| Secrets | GitHub Actions Secrets |

---

## Error Handling

- If a career page is unreachable, log the error and skip that source (don't crash the whole run)
- If Google Sheets write fails, retry once then log error to GitHub Actions console
- If Twilio SMS fails, log error — no retry (avoid duplicate texts)
- If no new postings found, exit silently (no SMS sent)

---

## Cost Estimate

| Service | Cost |
|---------|------|
| GitHub Actions | Free (public repo or within free tier limits) |
| Twilio SMS | ~$0.01/text (≈$0.30/month) |
| Google Sheets API | Free |
| Hunter.io | Free (25 searches/month) |
| Claude API | ~$0.01–0.03 per message drafted (negligible) |
| **Total** | **~$1/month** |

---

## Future Enhancements (Phase 2)

- Auto-apply to roles using stored resume + cover letter templates
- LinkedIn scraping for additional postings
- Weekly summary SMS with application pipeline stats
- Slack/email digest as alternative to SMS
- Expand to Big 4 consulting firm career pages directly
