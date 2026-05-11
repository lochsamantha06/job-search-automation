import pytest
from src.scorer import score_job


def test_ib_scotiabank_bloomberg_scores_high():
    score, priority, reason = score_job(
        title="Investment Banking Analyst Intern",
        company="Scotiabank",
        description="Bloomberg required, DCF modelling",
    )
    assert score >= 8
    assert priority == "High"
    assert "Scotiabank" in reason


def test_general_intern_unknown_company_scores_low():
    score, priority, reason = score_job(
        title="Summer Intern",
        company="Unknown Corp",
        description="",
    )
    assert priority == "Low"
    assert score < 5


def test_consulting_deloitte_scores_medium_or_high():
    score, priority, reason = score_job(
        title="Strategy Consulting Intern",
        company="Deloitte",
        description="",
    )
    assert priority in ("Medium", "High")
    assert score >= 5


def test_scotiabank_gets_referral_bonus():
    _, _, reason = score_job(
        title="Analyst Intern",
        company="Scotiabank",
        description="",
    )
    assert "referral" in reason.lower() or "Scotiabank" in reason


def test_bloomberg_adds_one_skill_point():
    score1, _, _ = score_job("Financial Analyst Intern", "RBC", "")
    score2, _, _ = score_job("Financial Analyst Intern", "RBC", "Bloomberg required")
    assert score2 == score1 + 1


def test_mandarin_adds_one_language_point():
    score1, _, _ = score_job("Analyst Intern", "CIBC", "")
    score2, _, _ = score_job("Analyst Intern", "CIBC", "Mandarin preferred")
    assert score2 == score1 + 1


def test_asset_management_scores_four_role_points():
    score, _, _ = score_job("Asset Management Intern", "Unknown Corp", "")
    assert score >= 4


def test_wealth_management_scores_four_role_points():
    score, _, _ = score_job("Wealth Management Associate Intern", "Unknown Corp", "")
    assert score >= 4


def test_fp_and_a_scores_three_role_points():
    score, _, _ = score_job("FP&A Intern", "Unknown Corp", "")
    assert score >= 3


def test_priority_boundaries():
    s_high, p_high, _ = score_job("Investment Banking Intern", "Scotiabank", "Bloomberg")
    assert p_high == "High"
    _, p_med, _ = score_job("Strategy Consulting Intern", "Deloitte", "")
    assert p_med in ("Medium", "High")
