from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000/games/kakuro/game.html")
    page.wait_for_timeout(1000)

    # We are in Kakuro game.
    # Take a screenshot of empty board
    page.screenshot(path="kakuro_empty.png")

    # Let's interact with it
    # Click hint to fill a cell
    page.get_by_role("button", name="راهنمایی 💡").click()
    page.wait_for_timeout(500)

    # Select cell 1,1 (first playable)
    page.locator(".cell-playable").first.click()
    page.wait_for_timeout(500)

    # Use virtual numpad
    page.get_by_role("button", name="۵").click()
    page.wait_for_timeout(500)

    # Check
    page.get_by_role("button", name="بررسی").click()
    page.wait_for_timeout(1000)

    page.screenshot(path="kakuro_interacted.png")

    # Show solution
    page.on("dialog", lambda dialog: dialog.accept()) # Accept the confirm dialog
    page.get_by_role("button", name="حل خودکار").click()
    page.wait_for_timeout(1500)

    page.screenshot(path="kakuro_solved.png")

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
