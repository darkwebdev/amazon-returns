/**
 * Automated Extension Test with Puppeteer
 *
 * This script:
 * 1. Launches Chrome with the extension loaded
 * 2. Navigates to Amazon.de product page
 * 3. Waits for extension widget to appear
 * 4. Captures console logs
 * 5. Takes screenshot
 * 6. Validates the extension behavior
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, 'dist');
const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function testExtension() {
  console.log('🚀 Starting extension test...');
  console.log(`📦 Extension path: ${EXTENSION_PATH}`);
  console.log(`🔗 Test URL: ${TEST_URL}`);

  // Launch Chrome with extension
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const page = await browser.newPage();

  // Collect console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('[Amazon Returns Extension]')) {
      console.log('📝', text);
    }
  });

  try {
    console.log('🌐 Navigating to Amazon product page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Handle cookie dialog if present
    try {
      await page.waitForSelector('button[data-action="accept"]', { timeout: 5000 });
      console.log('🍪 Accepting cookies...');
      await page.click('button[data-action="accept"]');
      await page.waitForTimeout(1000);
    } catch (e) {
      // No cookie dialog or already accepted
    }

    // Wait for extension widget
    console.log('⏳ Waiting for extension widget...');
    const widgetSelector = '.amazon-returns-ext__widget';

    try {
      await page.waitForSelector(widgetSelector, { timeout: 10000 });
      console.log('✅ Extension widget found!');
    } catch (e) {
      console.log('❌ Extension widget NOT found after 10 seconds');

      // Check if content script loaded
      const extensionLogs = logs.filter(log => log.includes('[Amazon Returns Extension]'));
      if (extensionLogs.length === 0) {
        console.log('❌ No extension console logs found - content script may not be running');
      } else {
        console.log('📋 Extension logs found:', extensionLogs.length);
        extensionLogs.forEach(log => console.log('  -', log));
      }
    }

    // Take screenshot
    const screenshotPath = '/tmp/extension-test-screenshot.jpg';
    await page.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 85,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);

    // Check widget content if present
    const widgetExists = await page.$(widgetSelector);
    if (widgetExists) {
      const widgetText = await page.evaluate(() => {
        const widget = document.querySelector('.amazon-returns-ext__widget');
        return widget ? widget.innerText : null;
      });

      console.log('\n📦 Widget Content:');
      console.log('─'.repeat(50));
      console.log(widgetText);
      console.log('─'.repeat(50));

      // Validate expected content
      const hasDefectiveSection = widgetText.includes('Defective') || widgetText.includes('Defekte');
      const hasRegularSection = widgetText.includes('Regular') || widgetText.includes('Reguläre');
      const hasCostInfo = widgetText.includes('€') || widgetText.includes('Free') || widgetText.includes('Kostenlos');

      console.log('\n✓ Validation:');
      console.log(`  Defective section: ${hasDefectiveSection ? '✅' : '❌'}`);
      console.log(`  Regular section: ${hasRegularSection ? '✅' : '❌'}`);
      console.log(`  Cost information: ${hasCostInfo ? '✅' : '❌'}`);

      if (hasDefectiveSection && hasRegularSection && hasCostInfo) {
        console.log('\n🎉 Extension test PASSED!');
      } else {
        console.log('\n⚠️  Extension test INCOMPLETE - missing expected content');
      }
    }

    // Keep browser open for inspection
    console.log('\n👀 Browser will stay open for 10 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

testExtension().catch(console.error);
