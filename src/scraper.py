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

# Broad role-based search queries — any company can appear in results
SEARCH_QUERIES = [
    "investment banking internship co-op",
    "capital markets internship co-op",
    "equity research internship co-op",
    "asset management internship co-op",
    "wealth management internship co-op",
    "mergers acquisitions internship co-op",
    "strategy consulting internship co-op",
    "management consulting internship co-op",
    "financial analyst internship co-op",
    "corporate finance internship co-op",
    "fp&a internship co-op",
    "financial planning analysis internship",
    "business analyst finance internship co-op",
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


def scrape_indeed(query: str, location: str) -> list:
    """
    Scrape ca.indeed.com for jobs matching the search query at location.
    Returns list of JobPosting. Never raises — returns [] on any error.
    """
    jobs = []
    params = {
        "q": query,
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
                company=company_el.get_text(strip=True) if company_el else "",
                location=location_el.get_text(strip=True) if location_el else location,
                url=job_url,
            ))

        time.sleep(1)  # Polite delay between requests

    except Exception as e:
        print(f"[scraper] Error scraping Indeed for '{query}' in {location}: {e}")

    return jobs


def scrape_all() -> list:
    """Scrape all query+location combinations. Returns combined list of JobPosting."""
    all_jobs = []
    for query in SEARCH_QUERIES:
        for location in LOCATIONS:
            jobs = scrape_indeed(query, location)
            all_jobs.extend(jobs)
    return all_jobs
