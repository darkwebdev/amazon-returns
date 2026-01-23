/**
 * Demo Extension in Browser
 *
 * Opens Chrome with the extension loaded and navigates to Amazon page.
 * Browser stays open for manual inspection.
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, 'dist');
const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function demoExtension() {
  console.log('🚀 Opening Chrome with extension...');
  console.log(`📦 Extension: ${EXTENSION_PATH}`);
  console.log(`🔗 URL: ${TEST_URL}`);
  console.log('\n💡 Browser will stay open - close it manually when done\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
    defaultViewport: {
      width: 1400,
      height: 900
    }
  });

  const page = await browser.newPage();

  // Show console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Amazon Returns Extension]')) {
      console.log('📝', text);
    }
  });

  console.log('🌐 Navigating to Amazon page...');
  await page.goto(TEST_URL, { waitUntil: 'networkidle2' });

  // Handle cookie dialog
  try {
    const acceptButton = await page.waitForSelector('button[data-action="accept"], input[name="accept"]', { timeout: 3000 });
    if (acceptButton) {
      console.log('🍪 Accepting cookies...');
      await acceptButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {
    // No cookie dialog
  }

  // Wait for widget
  console.log('⏳ Waiting for widget...');
  try {
    await page.waitForSelector('.amazon-returns-ext__widget', { timeout: 10000 });
    console.log('✅ Widget loaded!');

    const widgetText = await page.evaluate(() => {
      const widget = document.querySelector('.amazon-returns-ext__widget');
      return widget ? widget.innerText : null;
    });

    console.log('\n📦 Widget Content:');
    console.log('─'.repeat(50));
    console.log(widgetText);
    console.log('─'.repeat(50));
  } catch (e) {
    console.log('⚠️  Widget not found yet (may still be loading)');
  }

  console.log('\n👀 Browser is now open for inspection');
  console.log('   - Check the widget on the page');
  console.log('   - Open DevTools to see console logs');
  console.log('   - Navigate to other Amazon products');
  console.log('   - Press Ctrl+C here or close browser when done\n');

  // Keep process alive - browser will stay open
  await new Promise(() => {});  // Never resolves
}

demoExtension().catch(console.error);
