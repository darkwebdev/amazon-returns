/**
 * Test Extension with Paid Shipping Scenario
 *
 * Tests the extension on a fixture page that simulates
 * an Amazon.de product WITHOUT "FREE Returns" badge
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const EXTENSION_PATH = path.join(__dirname, 'dist');
const FIXTURE_PATH = path.join(__dirname, 'tests', 'fixtures', 'amazon-de-no-free-badge.html');

async function testPaidShipping() {
  console.log('🚀 Testing paid shipping scenario...');
  console.log(`📦 Extension path: ${EXTENSION_PATH}`);
  console.log(`📄 Fixture: ${FIXTURE_PATH}`);

  // Verify fixture exists
  if (!fs.existsSync(FIXTURE_PATH)) {
    console.error('❌ Fixture file not found:', FIXTURE_PATH);
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: false,
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
    // Load fixture as file:// URL
    const fixtureUrl = `file://${FIXTURE_PATH}`;
    console.log('🌐 Loading fixture:', fixtureUrl);
    await page.goto(fixtureUrl, { waitUntil: 'networkidle2' });

    // Inject amazon.de domain detection
    await page.evaluate(() => {
      // Override location.hostname for the extension
      Object.defineProperty(window.location, 'hostname', {
        value: 'www.amazon.de',
        writable: false
      });
    });

    // Wait for extension widget
    console.log('⏳ Waiting for extension widget...');
    const widgetSelector = '.amazon-returns-ext__widget';

    await page.waitForSelector(widgetSelector, { timeout: 10000 });
    console.log('✅ Extension widget found!');

    // Get widget content
    const widgetText = await page.evaluate(() => {
      const widget = document.querySelector('.amazon-returns-ext__widget');
      return widget ? widget.innerText : null;
    });

    console.log('\n📦 Widget Content:');
    console.log('─'.repeat(50));
    console.log(widgetText);
    console.log('─'.repeat(50));

    // Validate paid shipping scenario
    const hasDefectiveFree = widgetText.includes('Defective') && widgetText.includes('Free');
    const hasRegularPaid = widgetText.includes('Regular') && widgetText.includes('€6.50-€13.00');
    const has14Days = widgetText.includes('14');

    console.log('\n✓ Validation:');
    console.log(`  Defective items are free: ${hasDefectiveFree ? '✅' : '❌'}`);
    console.log(`  Regular returns show cost: ${hasRegularPaid ? '✅' : '❌'}`);
    console.log(`  14-day window displayed: ${has14Days ? '✅' : '❌'}`);

    if (hasDefectiveFree && hasRegularPaid && has14Days) {
      console.log('\n🎉 Paid shipping test PASSED!');
      console.log('✓ Extension correctly shows €6.50-€13.00 for regular returns');
      console.log('✓ Extension correctly shows free for defective items');
    } else {
      console.log('\n❌ Paid shipping test FAILED!');
      console.log('Expected to see:');
      console.log('  - Defective: Free returns');
      console.log('  - Regular: €6.50-€13.00 cost');
      console.log('\nActual widget text:', widgetText);
    }

    // Screenshot
    const screenshotPath = '/tmp/paid-shipping-test.jpg';
    await page.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 85
    });
    console.log(`\n📸 Screenshot: ${screenshotPath}`);

    // Keep browser open briefly
    console.log('👀 Browser will stay open for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

  } catch (error) {
    console.error('❌ Test failed:', error.message);

    // Show extension logs if any
    const extensionLogs = logs.filter(log => log.includes('[Amazon Returns Extension]'));
    if (extensionLogs.length > 0) {
      console.log('\n📋 Extension logs:');
      extensionLogs.forEach(log => console.log('  -', log));
    }

    throw error;
  } finally {
    await browser.close();
    console.log('\n✅ Test complete');
  }
}

testPaidShipping().catch(error => {
  console.error(error);
  process.exit(1);
});
