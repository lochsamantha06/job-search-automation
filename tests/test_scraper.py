import responses as responses_lib
import pytest
from src.scraper import scrape_indeed, scrape_all, JobPosting, SEARCH_QUERIES, LOCATIONS

MOCK_HTML = """
<html><body>
  <div data-testid="job-card">
    <h2 data-testid="jobTitle">Investment Banking Analyst Intern</h2>
    <span data-testid="company-name">Scotiabank</span>
    <div data-testid="text-location">Toronto, ON</div>
    <a data-testid="job-title-link" href="/rc/clk?jk=abc123">View Job</a>
  </div>
  <div data-testid="job-card">
    <h2 data-testid="jobTitle">Finance Co-op</h2>
    <span data-testid="company-name">RBC</span>
    <div data-testid="text-location">Vancouver, BC</div>
    <a data-testid="job-title-link" href="/rc/clk?jk=def456">View Job</a>
  </div>
</body></html>
"""


@responses_lib.activate
def test_scrape_indeed_returns_job_postings():
    responses_lib.add(
        responses_lib.GET,
        "https://ca.indeed.com/jobs",
        body=MOCK_HTML,
        status=200,
    )
    jobs = scrape_indeed("Scotiabank", "finance internship", "Toronto, ON")
    assert len(jobs) == 2
    assert isinstance(jobs[0], JobPosting)
    assert jobs[0].title == "Investment Banking Analyst Intern"
    assert jobs[0].company == "Scotiabank"
    assert jobs[0].url.startswith("https://ca.indeed.com")


@responses_lib.activate
def test_scrape_indeed_returns_empty_on_http_error():
    responses_lib.add(
        responses_lib.GET,
        "https://ca.indeed.com/jobs",
        status=403,
    )
    jobs = scrape_indeed("RBC", "finance internship", "Vancouver, BC")
    assert jobs == []


@responses_lib.activate
def test_scrape_indeed_returns_empty_on_network_error():
    responses_lib.add(
        responses_lib.GET,
        "https://ca.indeed.com/jobs",
        body=Exception("Connection refused"),
    )
    jobs = scrape_indeed("BMO", "finance", "Toronto, ON")
    assert jobs == []


@responses_lib.activate
def test_scrape_indeed_skips_cards_without_title():
    html = """
    <html><body>
      <div data-testid="job-card">
        <span data-testid="company-name">CIBC</span>
        <a data-testid="job-title-link" href="/rc/clk?jk=xyz">View</a>
      </div>
    </body></html>
    """
    responses_lib.add(responses_lib.GET, "https://ca.indeed.com/jobs", body=html, status=200)
    jobs = scrape_indeed("CIBC", "finance", "Toronto, ON")
    # No jobTitle element — should be skipped
    assert jobs == []


@responses_lib.activate
def test_scrape_all_calls_every_combination():
    """scrape_all should attempt every SEARCH_QUERIES × LOCATIONS combination."""
    responses_lib.add(
        responses_lib.GET,
        "https://ca.indeed.com/jobs",
        body="<html><body></body></html>",
        status=200,
    )
    jobs = scrape_all()
    expected_calls = len(SEARCH_QUERIES) * len(LOCATIONS)
    assert len(responses_lib.calls) == expected_calls
    assert jobs == []  # no real cards in mock HTML


@responses_lib.activate
def test_job_posting_url_is_absolute():
    responses_lib.add(
        responses_lib.GET,
        "https://ca.indeed.com/jobs",
        body=MOCK_HTML,
        status=200,
    )
    jobs = scrape_indeed("Scotiabank", "finance internship", "Toronto, ON")
    for job in jobs:
        assert job.url.startswith("https://")
