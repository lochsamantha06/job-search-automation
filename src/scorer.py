# src/scorer.py

# Role tiers — only the highest matching tier counts
ROLE_TIERS = [
    (4, [
        "investment banking", "ib analyst", "capital markets", "m&a",
        "mergers", "acquisitions", "equity research",
        "asset management", "wealth management",
    ]),
    (3, [
        "strategy consulting", "management consulting",
        "financial transformation", "corporate finance",
        "fp&a", "financial planning and analysis",
    ]),
    (2, ["financial analyst", "finance analyst", "business analyst"]),
    (1, ["intern", "co-op", "internship"]),
]

# Company scores (lowercase key for matching)
COMPANY_SCORES = {
    "scotiabank": 4,        # Big 5 (+2) + referral bonus (+2)
    "rbc": 2,
    "royal bank": 2,
    "td bank": 2,
    "toronto-dominion": 2,
    "bmo": 2,
    "bank of montreal": 2,
    "cibc": 2,
    "deloitte": 2,
    "kpmg": 2,
    "ernst & young": 2,
    "pwc": 2,
    "pricewaterhousecoopers": 2,
}

SKILL_KEYWORDS = [
    "bloomberg", "financial modelling", "financial modeling",
    "dcf", "valuation", "excel",
]

LANGUAGE_KEYWORDS = ["cantonese", "mandarin", "chinese"]


def score_job(title: str, company: str, description: str = "") -> tuple:
    """
    Score a job posting against Samantha's profile.
    Returns (score: int, priority: str, reason: str).
    Priority: 'High' (>=8), 'Medium' (5-7), 'Low' (<5).
    """
    score = 0
    reasons = []
    text = f"{title} {description}".lower()
    company_lower = company.lower()

    # Role scoring — highest matching tier only
    for points, keywords in ROLE_TIERS:
        matched = next((kw for kw in keywords if kw in text), None)
        if matched:
            score += points
            reasons.append(f"'{matched}' role (+{points})")
            break

    # Company scoring — first match wins
    for keyword, points in COMPANY_SCORES.items():
        if keyword in company_lower:
            label = (
                "Scotiabank (Big 5 + referral bonus)"
                if keyword == "scotiabank"
                else "Big 5 bank / Big 4 consulting"
            )
            score += points
            reasons.append(f"{label} (+{points})")
            break

    # Skills bonus — at most +1
    for skill in SKILL_KEYWORDS:
        if skill in text:
            score += 1
            reasons.append(f"'{skill}' required (+1)")
            break

    # Language bonus — at most +1
    for lang in LANGUAGE_KEYWORDS:
        if lang in text:
            score += 1
            reasons.append(f"'{lang}' asset (+1)")
            break

    priority = "High" if score >= 8 else "Medium" if score >= 5 else "Low"
    reason = ", ".join(reasons) if reasons else "General posting"
    return score, priority, reason
