"""
Fills a Workday job application form using data-automation-id selectors.
Does NOT submit — screenshots the filled form and returns the path.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import Page, sync_playwright

from src.applicator.account_manager import get_credentials, save_credentials, _generate_password
from src.applicator.gmail_verifier import find_verification_link

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    """Fill application form, take screenshot. Returns screenshot path or None on failure."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context(
            user_agent=(
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        )
        page = context.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            apply_selectors = [
                "a:has-text('Apply')",
                "button:has-text('Apply')",
                "a:has-text('Apply Now')",
                "[data-automation-id='applyButton']",
            ]
            for sel in apply_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    break

            _login_or_create(page, profile, job_url)

            _fill_field(page, '[data-automation-id="legalNameSection_firstName"]', profile["first_name"])
            _fill_field(page, '[data-automation-id="legalNameSection_lastName"]', profile["last_name"])
            _fill_field(page, '[data-automation-id="phone-number"]', profile["phone"])
            _fill_field(page, '[data-automation-id="addressSection_addressLine1"]', profile.get("address_line1", ""))
            _fill_field(page, '[data-automation-id="addressSection_city"]', profile["city"])

            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                file_inputs = page.locator('input[type="file"]')
                if file_inputs.count() > 0:
                    file_inputs.first.set_input_files(resume_path)
                    time.sleep(2)

            _fill_field(page, 'textarea[data-automation-id="coverLetter"]', profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[workday] Error filling {job_url}: {e}")
            try:
                page.screenshot(path=screenshot_path.replace(".png", "_error.png"))
            except Exception:
                pass
            return None
        finally:
            browser.close()


def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    """Re-fill the Workday form and click Submit. Returns True on success."""
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        context = browser.new_context()
        page = context.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            apply_selectors = [
                "a:has-text('Apply')", "button:has-text('Apply')",
                "[data-automation-id='applyButton']",
            ]
            for sel in apply_selectors:
                if page.locator(sel).count() > 0:
                    page.locator(sel).first.click()
                    page.wait_for_load_state("networkidle", timeout=15000)
                    break

            _login_or_create(page, profile, job_url)
            _fill_field(page, '[data-automation-id="legalNameSection_firstName"]', profile["first_name"])
            _fill_field(page, '[data-automation-id="legalNameSection_lastName"]', profile["last_name"])
            _fill_field(page, '[data-automation-id="phone-number"]', profile["phone"])

            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                file_inputs = page.locator('input[type="file"]')
                if file_inputs.count() > 0:
                    file_inputs.first.set_input_files(resume_path)
                    time.sleep(2)

            submit_sel = '[data-automation-id="submitButton"], button:has-text("Submit")'
            submit_btn = page.locator(submit_sel)
            if submit_btn.count() > 0:
                submit_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                page.screenshot(path=confirmed_path, full_page=True)
                return True

            return False
        except Exception as e:
            print(f"[workday] Submit error for {job_url}: {e}")
            return False
        finally:
            browser.close()


def _fill_field(page: Page, selector: str, value: str):
    """Fill a field if it exists and value is non-empty."""
    if not value:
        return
    try:
        el = page.locator(selector)
        if el.count() > 0:
            el.first.fill(value)
    except Exception:
        pass


def _login_or_create(page: Page, profile: dict, job_url: str):
    """Log in to Workday or create an account if none exists."""
    from urllib.parse import urlparse
    domain = urlparse(job_url).netloc

    creds = get_credentials("workday")

    sign_in_el = page.locator('[data-automation-id="signInButton"], a:has-text("Sign In"), button:has-text("Sign In")')
    create_el = page.locator('[data-automation-id="createAccount"], a:has-text("Create Account")')

    if creds:
        if sign_in_el.count() > 0:
            sign_in_el.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)
            _fill_field(page, '[data-automation-id="email"]', creds["email"])
            _fill_field(page, '[data-automation-id="password"]', creds["password"])
            page.locator('[data-automation-id="signInSubmitButton"], button[type="submit"]').first.click()
            page.wait_for_load_state("networkidle", timeout=10000)
    else:
        if create_el.count() > 0:
            create_el.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)

        password = _generate_password()
        _fill_field(page, '[data-automation-id="email"]', profile["email"])
        _fill_field(page, '[data-automation-id="password"]', password)
        _fill_field(page, '[data-automation-id="verifyPassword"]', password)

        submit = page.locator('[data-automation-id="createAccountSubmitButton"], button[type="submit"]')
        if submit.count() > 0:
            submit.first.click()
            page.wait_for_load_state("networkidle", timeout=10000)

        verify_link = find_verification_link(domain)
        if verify_link:
            page.goto(verify_link, wait_until="networkidle", timeout=15000)

        save_credentials("workday", profile["email"], password)
