import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://realcollab-livid.vercel.app';
const screenshotsDir = path.resolve(__dirname, '../screenshots');

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function main() {
  console.log('Launching browser via Microsoft Edge channel...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  const page = await context.newPage();

  // 1. Capture Login Page
  console.log('1. Capturing Login Page...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotsDir, '01-auth-login.png') });

  // 2. Capture Signup Page
  console.log('2. Capturing Signup Page...');
  await page.goto(`${BASE_URL}/signup`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(screenshotsDir, '02-auth-signup.png') });

  // 3. Register user to get into dashboard
  console.log('3. Registering demo user through UI...');
  const demoEmail = `demo_${Date.now()}@realcollab.dev`;
  await page.fill('input[placeholder="Alice Johnson"]', 'Alex Rivera');
  await page.fill('input[placeholder="alice@example.com"]', demoEmail);
  await page.fill('input[type="password"]', 'Multiplayer123!');
  await page.click('button[type="submit"]');

  // Wait for dashboard load
  await page.waitForURL(`${BASE_URL}/`, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(3000); // Wait for workspace, Yjs websocket connection & awareness

  // 4. Capture Main Collaborative Workspace & Editor
  console.log('4. Capturing Main Collaborative Workspace...');
  await page.screenshot({ path: path.join(screenshotsDir, '03-workspace-editor.png') });

  // 5. Open Version History Sidebar
  console.log('5. Capturing Version History Sidebar...');
  const historyBtn = page.locator('button:has-text("History")');
  if (await historyBtn.isVisible()) {
    await historyBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, '04-version-history.png') });
  }

  // 6. Open Comments Sidebar
  console.log('6. Capturing Comments Sidebar...');
  const commentsBtn = page.locator('button:has-text("Comments")');
  if (await commentsBtn.isVisible()) {
    await commentsBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, '05-threaded-comments.png') });
  }

  // 7. Open Share Modal
  console.log('7. Capturing Share / Manage Members Modal...');
  const shareBtn = page.locator('button:has-text("Share")');
  if (await shareBtn.isVisible()) {
    await shareBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotsDir, '06-manage-members-modal.png') });
  }

  await browser.close();
  console.log('🎉 All high-resolution product screenshots captured successfully!');
}

main().catch(console.error);
