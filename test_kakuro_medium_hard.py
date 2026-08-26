from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000/games/kakuro/game.html")
    page.wait_for_timeout(1000)

    # Try medium layout
    page.locator("#difficultySelect").select_option("medium")
    page.wait_for_timeout(500)

    # Show solution for medium
    page.on("dialog", lambda dialog: dialog.accept()) # Accept the confirm dialog
    page.get_by_role("button", name="حل خودکار").click()
    page.wait_for_timeout(1500)
    page.screenshot(path="kakuro_medium_solved.png")

    # Try hard layout
    page.locator("#difficultySelect").select_option("hard")
    page.wait_for_timeout(500)

    # Show solution for hard
    page.get_by_role("button", name="حل خودکار").click()
    page.wait_for_timeout(1500)
    page.screenshot(path="kakuro_hard_solved.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="videos"
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
