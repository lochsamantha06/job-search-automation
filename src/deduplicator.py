# src/deduplicator.py
from src.scraper import JobPosting


def filter_new_jobs(jobs: list, seen_urls: set) -> list:
    """
    Return only jobs whose URL has not been seen before.
    Does NOT mutate seen_urls — caller is responsible for updating it.
    """
    return [job for job in jobs if job.url not in seen_urls]
