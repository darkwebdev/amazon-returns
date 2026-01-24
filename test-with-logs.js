/**
 * Test Extension with Console Logs Visible
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, 'dist');
const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function testWithLogs() {
  console.log('🚀 Testing extension with full console logs...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();

  // Capture ALL console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log('📝', text);
  });

  await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Handle cookies
  try {
    const acceptButton = await page.waitForSelector('#sp-cc-accept, button[data-action="accept"], input[name="accept"]', { timeout: 3000 });
    if (acceptButton) {
      console.log('🍪 Accepting cookies...');
      await acceptButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {
    console.log('⚠️  No cookie dialog found');
  }

  // Wait for widget
  console.log('\n⏳ Waiting for extension widget...\n');
  await page.waitForSelector('.amazon-returns-ext__widget', { timeout: 10000 });

  const widgetText = await page.evaluate(() => {
    const widget = document.querySelector('.amazon-returns-ext__widget');
    return widget ? widget.innerText : null;
  });

  console.log('\n' + '═'.repeat(60));
  console.log('📦 WIDGET CONTENT');
  console.log('═'.repeat(60));
  console.log(widgetText);
  console.log('═'.repeat(60));

  console.log('\n' + '═'.repeat(60));
  console.log('📋 EXTENSION LOGS SUMMARY');
  console.log('═'.repeat(60));
  const extensionLogs = logs.filter(log => log.includes('[Amazon Returns Extension]'));
  extensionLogs.forEach(log => console.log(log));
  console.log('═'.repeat(60));

  console.log('\n✅ Test complete - browser stays open for 10 seconds');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
}

testWithLogs().catch(console.error);
