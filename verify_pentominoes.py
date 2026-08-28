from playwright.sync_api import sync_playwright

def run_cuj(page):
    page.goto("http://localhost:8000/index.html")
    page.wait_for_timeout(1000)

    # Click on the pentominoes game card
    page.click("a[href='games/pentominoes/game.html']")
    page.wait_for_timeout(2000)

    # Change board size to 5x12
    page.select_option("#boardSize", "5x12")
    page.wait_for_timeout(1000)

    # Click the Hint button a few times
    for _ in range(3):
        page.click("#btnHint")
        page.wait_for_timeout(1500)

    # Click the Solve button
    page.click("#btnSolve")
    page.wait_for_timeout(5000) # Give it time to solve

    # Take screenshot at the final state
    page.screenshot(path="/home/jules/verification/screenshots/pentominoes_solved.png")
    page.wait_for_timeout(2000)

if __name__ == "__main__":
    import os
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={'width': 1280, 'height': 800}
        )
        page = context.new_page()
        try:
            run_cuj(page)
        finally:
            context.close()
            browser.close()
