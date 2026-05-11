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
