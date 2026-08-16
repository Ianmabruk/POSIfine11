const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const VIEWPORTS = [320, 360, 375, 390, 393, 412, 430];
const SCREENSHOTS_DIR = path.join('/tmp', 'mobile-cashier-test');

function apiRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function dismissAllOverlays(page) {
  await page.evaluate(() => {
    // Only hide overlays, never remove elements to avoid breaking the app
    const hideSelectors = [
      '.fixed.inset-0.bg-black\\/50',
      '.fixed.inset-0.z-50',
      '[class*="bg-black/50"]',
      '.cookie-banner',
      '.cookie-consent',
      '[class*="Cookie Preferences"]',
      '[class*="Today\'s Reminders"]'
    ];
    
    hideSelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Skip bottom nav and its children
          if (el.closest('nav') || el.closest('[class*="bottom-0"]') && el.closest('[class*="z-50"]')) {
            return;
          }
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.setAttribute('data-kilo-hidden', 'true');
        });
      } catch (e) {
        // Ignore selector errors
      }
    });
    
    // Hide by text content
    const allDivs = document.querySelectorAll('div');
    allDivs.forEach(el => {
      const text = (el.textContent || '').trim();
      if ((text.includes('Cookie Preferences') || text.includes("Today's Reminders")) && text.length < 500) {
        // Skip if it's part of the bottom nav
        if (el.closest('nav')) return;
        el.style.display = 'none';
        el.style.visibility = 'hidden';
      }
    });
  });
  await page.waitForTimeout(500);
}

async function run() {
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  console.log('Getting auth token...');
  const loginResult = await apiRequest({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ email: 'test_mobile_cashier@test.com', password: 'Test1234' }));

  if (!loginResult.token) {
    throw new Error(`Login failed: ${JSON.stringify(loginResult)}`);
  }
  const token = loginResult.token;
  const user = loginResult.user;
  console.log(`Logged in as: ${user.email} (role: ${user.role})`);

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const width of VIEWPORTS) {
    const height = Math.round(Math.max(width * 2.2, 700));
    const context = await browser.newContext({
      viewport: { width, height },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36',
      deviceScaleFactor: 2,
      isMobile: true,
    });
    const page = await context.newPage();

    const consoleErrors = [];
    const consoleWarnings = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message || String(err));
    });
    page.on('dialog', async dialog => {
      await dialog.dismiss();
    });

    const result = { width, height, consoleErrors: [], consoleWarnings: [], screenshots: [] };

    try {
      console.log(`[${width}px] Setting auth token and navigating...`);
      await page.addInitScript({
        content: `
          localStorage.setItem('token', '${token}');
          localStorage.setItem('user', '${JSON.stringify(JSON.stringify(user))}');
          localStorage.setItem('csrfToken', 'init-csrf-token');
          localStorage.setItem('reminderShown', 'true');
          localStorage.setItem('adminReminderShown', 'true');
          localStorage.setItem('cookie_consent', 'accepted');
        `
      });

      await page.goto('http://localhost:3000/dashboard/cashier/mobile', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Dismiss modals/overlays
      await dismissAllOverlays(page);
      await page.waitForTimeout(1000);

      // Take screenshot of home screen
      const homeScreenshot = path.join(SCREENSHOTS_DIR, `home_${width}px.png`);
      await page.screenshot({ path: homeScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'home', path: homeScreenshot });

      console.log(`[${width}px] Initial load errors: ${consoleErrors.length}`);

      // Check nav buttons
      const navButtonCount = await page.evaluate(() => {
        return document.querySelectorAll('nav button').length;
      });
      console.log(`[${width}px] Nav buttons found: ${navButtonCount}`);

      // Navigate to sales screen - use JS click on the 2nd nav button
      console.log(`[${width}px] Clicking Sales tab...`);
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('nav button');
        if (buttons.length >= 2) {
          buttons[1].click();
        }
      });
      await page.waitForTimeout(2000);

      const salesScreenshot = path.join(SCREENSHOTS_DIR, `sales_${width}px.png`);
      await page.screenshot({ path: salesScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'sales', path: salesScreenshot });

      // Add a product to cart
      console.log(`[${width}px] Adding product to cart...`);
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('Burger')) {
            btn.click();
            return true;
          }
        }
        // Try clicking first product button
        const productBtns = document.querySelectorAll('button.bg-white');
        if (productBtns.length > 0) productBtns[0].click();
        return false;
      });
      await page.waitForTimeout(1000);

      // Check cart badge
      const cartBadgeText = await page.evaluate(() => {
        const badges = document.querySelectorAll('nav button span');
        return Array.from(badges).map(b => b.textContent.trim()).filter(t => t);
      });
      console.log(`[${width}px] Nav badges:`, cartBadgeText);

      // Navigate to cart
      console.log(`[${width}px] Clicking Cart tab...`);
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('nav button');
        if (buttons.length >= 3) {
          buttons[2].click();
        }
      });
      await page.waitForTimeout(2000);

      const cartScreenshot = path.join(SCREENSHOTS_DIR, `cart_${width}px.png`);
      await page.screenshot({ path: cartScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'cart', path: cartScreenshot });

      // Click proceed to payment
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('Proceed to Payment')) {
            btn.click();
            return;
          }
        }
      });
      await page.waitForTimeout(2000);

      const paymentScreenshot = path.join(SCREENSHOTS_DIR, `payment_${width}px.png`);
      await page.screenshot({ path: paymentScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'payment', path: paymentScreenshot });

      // Enter cash amount and complete sale
      await page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="number"]');
        if (inputs.length > 0) {
          const input = inputs[0];
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(input, '1000');
          const event = new Event('input', { bubbles: true, cancelable: true });
          Object.defineProperty(event, 'target', { value: input, writable: false });
          Object.defineProperty(event, 'currentTarget', { value: input, writable: false });
          input.dispatchEvent(event);
        }
      });
      await page.waitForTimeout(1000);

      // Click Complete Sale (dialog handler will auto-dismiss clock-in prompt)
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        for (const btn of buttons) {
          if (btn.textContent.includes('Complete Sale')) {
            btn.click();
            return;
          }
        }
      });
      await page.waitForTimeout(8000);

      const successScreenshot = path.join(SCREENSHOTS_DIR, `success_${width}px.png`);
      await page.screenshot({ path: successScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'success', path: successScreenshot });

      // Navigate to More screen
      console.log(`[${width}px] Clicking More tab...`);
      await page.evaluate(() => {
        const buttons = document.querySelectorAll('nav button');
        if (buttons.length >= 4) {
          buttons[3].click();
        }
      });
      await page.waitForTimeout(2000);

      const moreScreenshot = path.join(SCREENSHOTS_DIR, `more_${width}px.png`);
      await page.screenshot({ path: moreScreenshot, fullPage: true });
      result.screenshots.push({ screen: 'more', path: moreScreenshot });

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        const body = document.body;
        return {
          bodyWidth: body.scrollWidth,
          viewportWidth: window.innerWidth,
          hasHorizontalScroll: body.scrollWidth > window.innerWidth
        };
      });

      result.overflowCheck = overflow;
      if (overflow.hasHorizontalScroll) {
        console.log(`[${width}px] WARNING: Horizontal overflow! bodyWidth=${overflow.bodyWidth}, viewport=${overflow.viewportWidth}`);
      } else {
        console.log(`[${width}px] No horizontal overflow`);
      }

      result.consoleErrors = [...consoleErrors];
      result.consoleWarnings = [...consoleWarnings];

    } catch (error) {
      console.error(`[${width}px] Error:`, error.message || error);
      result.error = error.message || String(error);
      try {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `error_${width}px.png`), fullPage: true });
      } catch (e) {
        console.log(`[${width}px] Could not take error screenshot: ${e.message}`);
      }
    }

    await page.close();
    await context.close();
    results.push(result);
  }

  await browser.close();

  // Summary
  console.log('\n========== TEST SUMMARY ==========');
  for (const r of results) {
    console.log(`\n[${r.width}px]`);
    if (r.error) {
      console.log(`  ERROR: ${r.error}`);
    } else {
      console.log(`  Screens: ${r.screenshots.map(s => s.screen).join(', ')}`);
      console.log(`  Console errors: ${r.consoleErrors.length}`);
      if (r.consoleErrors.length > 0) {
        r.consoleErrors.slice(0, 5).forEach(e => console.log(`    - ${e.substring(0, 150)}`));
      }
      console.log(`  Console warnings: ${r.consoleWarnings.length}`);
      if (r.consoleWarnings.length > 0) {
        r.consoleWarnings.slice(0, 3).forEach(w => console.log(`    - ${w.substring(0, 150)}`));
      }
      if (r.overflowCheck?.hasHorizontalScroll) {
        console.log(`  HORIZONTAL OVERFLOW: ${r.overflowCheck.bodyWidth} > ${r.overflowCheck.viewportWidth}`);
      } else if (r.overflowCheck) {
        console.log(`  No horizontal overflow`);
      }
    }
  }

  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\nDetailed results saved to: ${path.join(SCREENSHOTS_DIR, 'results.json')}`);
}

run().catch(console.error);
