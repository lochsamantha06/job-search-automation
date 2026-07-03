from src.applicator.portal_detector import detect_portal


def test_detects_workday_myworkdayjobs():
    assert detect_portal("https://rbc.wd3.myworkdayjobs.com/en-US/RBC/job/Toronto/Analyst_R-0001") == "workday"


def test_detects_workday_myworkday():
    assert detect_portal("https://scotiabank.wd3.myworkday.com/scotiabank/job/Toronto/apply") == "workday"


def test_detects_greenhouse():
    assert detect_portal("https://boards.greenhouse.io/deloitte/jobs/12345") == "greenhouse"


def test_detects_lever():
    assert detect_portal("https://jobs.lever.co/pwc/abc-123") == "lever"


def test_returns_none_for_unknown():
    assert detect_portal("https://careers.example.com/jobs/123") is None


def test_returns_none_for_linkedin():
    assert detect_portal("https://www.linkedin.com/jobs/view/123456") is None


def test_case_insensitive():
    assert detect_portal("https://RBC.WD3.MYWORKDAYJOBS.COM/job/123") == "workday"
