from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000/games/15puzzle/game.html")
    page.wait_for_timeout(1000)

    # Screenshot of initial board
    page.screenshot(path="15puzzle_initial.png")

    # Let's change the board size to 3x3 to make things easier
    page.locator("#gridSizeSelect").select_option("3")
    page.wait_for_timeout(1000)

    page.screenshot(path="15puzzle_3x3.png")

    # Test some interactions - try to move tiles with keyboard
    page.keyboard.press("ArrowUp")
    page.wait_for_timeout(500)
    page.keyboard.press("ArrowLeft")
    page.wait_for_timeout(500)
    page.keyboard.press("ArrowDown")
    page.wait_for_timeout(500)
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(1000)

    page.screenshot(path="15puzzle_moved.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(record_video_dir="videos")
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
