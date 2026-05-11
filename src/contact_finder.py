# src/contact_finder.py
"""
Find a recruiter / hiring manager contact for a given company.

Strategy:
  1. Try Hunter.io domain search (25 free searches/month)
     — returns the most common email format + any verified contacts
  2. Fall back to a LinkedIn public search URL (no API needed)

Returns a ContactResult dataclass with name, email, and linkedin_url.
Name and email may be empty strings if only LinkedIn search was possible.
"""

import os
import requests
from dataclasses import dataclass

HUNTER_API = "https://api.hunter.io/v2"

# Map display company name → primary domain (Hunter needs the domain, not company name)
COMPANY_DOMAINS = {
    "RBC": "rbc.com",
    "Royal Bank": "rbc.com",
    "TD Bank": "td.com",
    "Toronto-Dominion": "td.com",
    "BMO": "bmo.com",
    "Bank of Montreal": "bmo.com",
    "CIBC": "cibc.com",
    "Scotiabank": "scotiabank.com",
    "Deloitte": "deloitte.ca",
    "KPMG": "kpmg.com",
    "EY": "ey.com",
    "Ernst & Young": "ey.com",
    "PwC": "pwc.com",
    "PricewaterhouseCoopers": "pwc.com",
}


@dataclass
class ContactResult:
    name: str
    email: str
    linkedin_url: str


def _build_linkedin_url(company: str) -> str:
    """Construct a LinkedIn people-search URL for campus recruiters at the company."""
    query = f"{company} campus recruiter internship"
    encoded = query.replace(" ", "%20")
    return f"https://www.linkedin.com/search/results/people/?keywords={encoded}"


def find_contact(company: str, hunter_api_key: str | None = None) -> ContactResult:
    """
    Find a recruiter contact for the given company name.
    Falls back gracefully: Hunter → LinkedIn URL → empty contact.
    Never raises.
    """
    linkedin_url = _build_linkedin_url(company)

    # Resolve domain
    domain = None
    for key, dom in COMPANY_DOMAINS.items():
        if key.lower() in company.lower():
            domain = dom
            break

    if domain and hunter_api_key:
        try:
            resp = requests.get(
                f"{HUNTER_API}/domain-search",
                params={
                    "domain": domain,
                    "api_key": hunter_api_key,
                    "department": "human_resources",
                    "limit": 5,
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json().get("data", {})
            emails = data.get("emails", [])
            if emails:
                first = emails[0]
                full_name = f"{first.get('first_name', '')} {first.get('last_name', '')}".strip()
                return ContactResult(
                    name=full_name,
                    email=first.get("value", ""),
                    linkedin_url=linkedin_url,
                )
        except Exception as e:
            print(f"[contact_finder] Hunter.io error for {company}: {e}")

    return ContactResult(name="", email="", linkedin_url=linkedin_url)
