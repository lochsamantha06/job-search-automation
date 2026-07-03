"""
Fills a Greenhouse job application form.
Greenhouse uses standard HTML labels — more straightforward than Workday.
Does NOT submit — screenshots the filled form.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

from src.applicator.account_manager import get_credentials, save_credentials, _generate_password

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)

            apply_btn = page.locator("a:has-text('Apply'), button:has-text('Apply for this Job')")
            if apply_btn.count() > 0:
                apply_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=10000)

            _fill_by_label(page, "First Name", profile["first_name"])
            _fill_by_label(page, "Last Name", profile["last_name"])
            _fill_by_label(page, "Email", profile["email"])
            _fill_by_label(page, "Phone", profile["phone"])
            _fill_by_label(page, "LinkedIn Profile", profile.get("linkedin", ""))

            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)

            cover = page.locator('textarea[id*="cover"], textarea[name*="cover"]')
            if cover.count() > 0:
                cover.first.fill(profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[greenhouse] Error filling {job_url}: {e}")
            return None
        finally:
            browser.close()


def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(job_url, wait_until="networkidle", timeout=30000)
            apply_btn = page.locator("a:has-text('Apply'), button:has-text('Apply for this Job')")
            if apply_btn.count() > 0:
                apply_btn.first.click()
                page.wait_for_load_state("networkidle", timeout=10000)
            _fill_by_label(page, "First Name", profile["first_name"])
            _fill_by_label(page, "Last Name", profile["last_name"])
            _fill_by_label(page, "Email", profile["email"])
            _fill_by_label(page, "Phone", profile["phone"])
            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)
            submit = page.locator('button[type="submit"]:has-text("Submit")')
            if submit.count() > 0:
                submit.first.click()
                page.wait_for_load_state("networkidle", timeout=15000)
                page.screenshot(path=confirmed_path, full_page=True)
                return True
            return False
        except Exception as e:
            print(f"[greenhouse] Submit error: {e}")
            return False
        finally:
            browser.close()


def _fill_by_label(page, label_text: str, value: str):
    """Find an input associated with a label containing label_text and fill it."""
    if not value:
        return
    try:
        el = page.get_by_label(label_text, exact=False)
        if el.count() > 0:
            el.first.fill(value)
    except Exception:
        pass
