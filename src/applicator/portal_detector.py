PORTAL_PATTERNS = {
    "workday": ["myworkdayjobs.com", "myworkday.com"],
    "greenhouse": ["boards.greenhouse.io", "greenhouse.io"],
    "lever": ["jobs.lever.co", "lever.co"],
}


def detect_portal(url: str) -> str | None:
    """Return portal name ('workday', 'greenhouse', 'lever') or None."""
    url_lower = url.lower()
    for portal, patterns in PORTAL_PATTERNS.items():
        if any(p in url_lower for p in patterns):
            return portal
    return None
