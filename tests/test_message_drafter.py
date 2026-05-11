import pytest
from unittest.mock import MagicMock, patch
from src.message_drafter import draft_message


def _mock_anthropic_response(text: str):
    """Build a minimal mock that mimics anthropic.Anthropic.messages.create response."""
    content_block = MagicMock()
    content_block.text = text
    response = MagicMock()
    response.content = [content_block]
    return response


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_returns_string(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_anthropic_response(
        "Dear Jane,\n\nI am excited to apply...\n\nBest,\nSamantha Lo"
    )

    result = draft_message(
        job_title="Investment Banking Analyst Intern",
        company="Scotiabank",
        contact_name="Jane Smith",
        anthropic_api_key="sk-test",
    )
    assert isinstance(result, str)
    assert len(result) > 0


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_uses_contact_name(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_anthropic_response(
        "Dear Jane Smith,\n\nHello...\n\nBest,\nSamantha Lo"
    )

    draft_message("IB Intern", "RBC", "Jane Smith", "sk-test")

    call_kwargs = mock_client.messages.create.call_args
    prompt_text = call_kwargs[1]["messages"][0]["content"]
    assert "Jane Smith" in prompt_text


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_no_contact_uses_hiring_team(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_anthropic_response(
        "Dear Hiring Team,\n\nI am applying...\n\nBest,\nSamantha Lo"
    )

    draft_message("Finance Co-op", "CIBC", "", "sk-test")

    call_kwargs = mock_client.messages.create.call_args
    prompt_text = call_kwargs[1]["messages"][0]["content"]
    assert "Dear Hiring Team" in prompt_text


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_falls_back_on_api_error(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.side_effect = Exception("API unavailable")

    result = draft_message("Analyst Intern", "Deloitte", "Bob Jones", "sk-test")
    # Should return the fallback template, not raise
    assert isinstance(result, str)
    assert "Deloitte" in result
    assert "Samantha Lo" in result


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_includes_company_in_prompt(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_anthropic_response("Draft email text.")

    draft_message("Strategy Consulting Intern", "McKinsey", "", "sk-test")

    call_kwargs = mock_client.messages.create.call_args
    prompt_text = call_kwargs[1]["messages"][0]["content"]
    assert "McKinsey" in prompt_text
    assert "Strategy Consulting Intern" in prompt_text


@patch("src.message_drafter.anthropic.Anthropic")
def test_draft_message_uses_haiku_model(mock_anthropic_cls):
    mock_client = MagicMock()
    mock_anthropic_cls.return_value = mock_client
    mock_client.messages.create.return_value = _mock_anthropic_response("Email text.")

    draft_message("IB Intern", "BMO", "", "sk-test")

    call_kwargs = mock_client.messages.create.call_args
    assert call_kwargs[1]["model"] == "claude-3-5-haiku-20241022"
