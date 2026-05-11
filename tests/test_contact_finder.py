import pytest
import responses as responses_lib
from src.contact_finder import find_contact, _build_linkedin_url, ContactResult, HUNTER_API


def test_linkedin_url_contains_company():
    url = _build_linkedin_url("Scotiabank")
    assert "Scotiabank" in url or "scotiabank" in url.lower()
    assert "linkedin.com" in url


def test_linkedin_url_is_valid_format():
    url = _build_linkedin_url("RBC")
    assert url.startswith("https://www.linkedin.com/search/results/people/")


@responses_lib.activate
def test_find_contact_uses_hunter_when_key_provided():
    responses_lib.add(
        responses_lib.GET,
        f"{HUNTER_API}/domain-search",
        json={
            "data": {
                "emails": [
                    {
                        "value": "jane.smith@scotiabank.com",
                        "first_name": "Jane",
                        "last_name": "Smith",
                    }
                ]
            }
        },
        status=200,
    )
    result = find_contact("Scotiabank", hunter_api_key="test_key")
    assert result.email == "jane.smith@scotiabank.com"
    assert result.name == "Jane Smith"
    assert "linkedin.com" in result.linkedin_url


@responses_lib.activate
def test_find_contact_falls_back_to_linkedin_on_empty_hunter_results():
    responses_lib.add(
        responses_lib.GET,
        f"{HUNTER_API}/domain-search",
        json={"data": {"emails": []}},
        status=200,
    )
    result = find_contact("RBC", hunter_api_key="test_key")
    assert result.email == ""
    assert result.name == ""
    assert "linkedin.com" in result.linkedin_url


@responses_lib.activate
def test_find_contact_falls_back_to_linkedin_on_hunter_error():
    responses_lib.add(
        responses_lib.GET,
        f"{HUNTER_API}/domain-search",
        body=Exception("Connection refused"),
    )
    result = find_contact("TD Bank", hunter_api_key="test_key")
    assert result.email == ""
    assert "linkedin.com" in result.linkedin_url


def test_find_contact_no_api_key_returns_linkedin_only():
    result = find_contact("CIBC", hunter_api_key=None)
    assert isinstance(result, ContactResult)
    assert result.email == ""
    assert "linkedin.com" in result.linkedin_url


def test_find_contact_unknown_company_returns_linkedin():
    result = find_contact("Unknown Corp", hunter_api_key="test_key")
    # No domain mapping → Hunter not called → LinkedIn fallback
    assert result.email == ""
    assert "linkedin.com" in result.linkedin_url


@responses_lib.activate
def test_find_contact_hunter_http_error_falls_back():
    responses_lib.add(
        responses_lib.GET,
        f"{HUNTER_API}/domain-search",
        status=401,
    )
    result = find_contact("Deloitte", hunter_api_key="bad_key")
    assert result.email == ""
    assert "linkedin.com" in result.linkedin_url
