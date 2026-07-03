"""
Fills a Lever job application form.
Lever uses a React app with accessible labels.
Does NOT submit — screenshots the filled form.
"""

import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright

SCREENSHOTS_DIR = Path("dashboard/data/screenshots")


def fill_application(job_url: str, profile: dict, job_id: str) -> str | None:
    SCREENSHOTS_DIR.mkdir(parents=True, exist_ok=True)
    screenshot_path = str(SCREENSHOTS_DIR / f"{job_id}.png")
    apply_url = job_url.rstrip("/") + "/apply"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(apply_url, wait_until="networkidle", timeout=30000)

            page.get_by_label("Full name", exact=False).first.fill(profile["full_name"])
            page.get_by_label("Email", exact=False).first.fill(profile["email"])
            page.get_by_label("Phone", exact=False).first.fill(profile["phone"])

            current_company = page.get_by_label("Current company", exact=False)
            if current_company.count() > 0:
                current_company.first.fill(profile["education"]["school"])

            linkedin = page.get_by_label("LinkedIn", exact=False)
            if linkedin.count() > 0:
                linkedin.first.fill(profile.get("linkedin", ""))

            resume_path = os.path.abspath(profile["resume_path"])
            if os.path.exists(resume_path):
                upload = page.locator('input[type="file"]')
                if upload.count() > 0:
                    upload.first.set_input_files(resume_path)
                    time.sleep(2)

            additional = page.locator('textarea[name*="additional"], textarea[placeholder*="cover"], textarea[placeholder*="message"]')
            if additional.count() > 0:
                additional.first.fill(profile.get("cover_letter", ""))

            page.screenshot(path=screenshot_path, full_page=True)
            return screenshot_path

        except Exception as e:
            print(f"[lever] Error filling {job_url}: {e}")
            return None
        finally:
            browser.close()


def submit_application(job_url: str, profile: dict, job_id: str) -> bool:
    confirmed_path = str(SCREENSHOTS_DIR / f"{job_id}_confirmed.png")
    apply_url = job_url.rstrip("/") + "/apply"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page()
        try:
            page.goto(apply_url, wait_until="networkidle", timeout=30000)
            page.get_by_label("Full name", exact=False).first.fill(profile["full_name"])
            page.get_by_label("Email", exact=False).first.fill(profile["email"])
            page.get_by_label("Phone", exact=False).first.fill(profile["phone"])
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
            print(f"[lever] Submit error: {e}")
            return False
        finally:
            browser.close()
