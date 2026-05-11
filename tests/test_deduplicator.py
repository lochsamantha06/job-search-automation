import pytest
from src.scraper import JobPosting
from src.deduplicator import filter_new_jobs


def _job(url: str) -> JobPosting:
    return JobPosting(title="Analyst Intern", company="RBC", location="Toronto, ON", url=url)


def test_filters_seen_urls():
    jobs = [_job("https://ca.indeed.com/job/1"), _job("https://ca.indeed.com/job/2")]
    seen = {"https://ca.indeed.com/job/1"}
    result = filter_new_jobs(jobs, seen)
    assert len(result) == 1
    assert result[0].url == "https://ca.indeed.com/job/2"


def test_empty_seen_returns_all():
    jobs = [_job("https://ca.indeed.com/job/1"), _job("https://ca.indeed.com/job/2")]
    result = filter_new_jobs(jobs, set())
    assert result == jobs


def test_all_seen_returns_empty():
    jobs = [_job("https://ca.indeed.com/job/1"), _job("https://ca.indeed.com/job/2")]
    seen = {"https://ca.indeed.com/job/1", "https://ca.indeed.com/job/2"}
    result = filter_new_jobs(jobs, seen)
    assert result == []


def test_empty_jobs_returns_empty():
    result = filter_new_jobs([], {"https://ca.indeed.com/job/1"})
    assert result == []


def test_preserves_order():
    urls = [f"https://ca.indeed.com/job/{i}" for i in range(5)]
    jobs = [_job(u) for u in urls]
    seen = {"https://ca.indeed.com/job/1", "https://ca.indeed.com/job/3"}
    result = filter_new_jobs(jobs, seen)
    assert [j.url for j in result] == [
        "https://ca.indeed.com/job/0",
        "https://ca.indeed.com/job/2",
        "https://ca.indeed.com/job/4",
    ]


def test_does_not_mutate_seen_urls():
    jobs = [_job("https://ca.indeed.com/job/1")]
    seen = set()
    filter_new_jobs(jobs, seen)
    assert seen == set()
