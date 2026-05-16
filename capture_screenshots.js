const { chromium, devices } = require('playwright');
const path = require('path');
const fs = require('fs');

async function capture() {
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const browser = await chromium.launch();

  const configs = [
    { name: 'Desktop', width: 1280, height: 720 },
    { name: 'Mobile', ...devices['iPhone 12'] }
  ];

  for (const config of configs) {
    const context = await browser.newContext(config);
    const page = await context.newPage();

    // Using absolute path for local index.html
    const filePath = 'file://' + path.join(__dirname, 'index.html');
    await page.goto(filePath);

    // Initial wait for load
    await page.waitForLoadState('networkidle');

    // Trigger GSAP ScrollTriggers by scrolling to the bottom and back up
    await page.evaluate(async () => {
      const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
      const scrollHeight = document.body.scrollHeight;
      const step = 100;
      for (let i = 0; i < scrollHeight; i += step) {
        window.scrollTo(0, i);
        await delay(50);
      }
      window.scrollTo(0, 0);
      await delay(500); // Wait for animations to settle
    });

    // Capture Top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${config.name.toLowerCase()}_top.png` });

    // Capture Middle
    await page.evaluate(() => {
      const middle = document.body.scrollHeight / 2;
      window.scrollTo(0, middle);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${config.name.toLowerCase()}_middle.png` });

    // Capture Nearly the End (Targeting #emergencies section)
    await page.evaluate(() => {
      const el = document.getElementById('emergencies');
      if (el) {
        el.scrollIntoView();
      } else {
        window.scrollTo(0, document.body.scrollHeight * 0.8);
      }
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${config.name.toLowerCase()}_nearly_end.png` });

    // Capture End (Footer)
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `screenshots/${config.name.toLowerCase()}_end.png` });

    await context.close();
  }

  await browser.close();
}

capture().catch(err => {
  console.error(err);
  process.exit(1);
});
