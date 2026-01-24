/**
 * Dynamic Extension Testing on Real Amazon URLs
 *
 * Tests the extension on multiple real Amazon product pages
 * to verify different scenarios:
 * - Products with FREE Returns badge
 * - Products without FREE Returns badge (paid shipping)
 * - Amazon.com vs Amazon.de
 * - Third-party sellers vs Amazon-sold
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, 'dist');

// Test URLs - Add more as needed
const TEST_CASES = [
  {
    name: 'Amazon.de - Coffee Machine (FREE Returns)',
    url: 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1',
    region: 'de',
    expectedBehavior: {
      hasWidget: true,
      defectiveFree: true,
      regularFree: true, // This product has FREE Returns badge
      language: 'en'
    }
  },
  // Add more test cases here
  // {
  //   name: 'Amazon.de - Product WITHOUT Free Returns',
  //   url: 'https://www.amazon.de/dp/[PRODUCT_ID]',
  //   region: 'de',
  //   expectedBehavior: {
  //     hasWidget: true,
  //     defectiveFree: true,
  //     regularFree: false, // Should show €6.50-€13.00
  //     hasCost: true,
  //     language: 'de'
  //   }
  // },
];

async function testProduct(browser, testCase) {
  console.log('\n' + '='.repeat(60));
  console.log(`Testing: ${testCase.name}`);
  console.log(`URL: ${testCase.url}`);
  console.log('='.repeat(60));

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
    console.log('🌐 Navigating to product page...');
    await page.goto(testCase.url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Handle cookie dialog if present
    try {
      const acceptButton = await page.waitForSelector('button[data-action="accept"], input[name="accept"]', { timeout: 3000 });
      if (acceptButton) {
        console.log('🍪 Accepting cookies...');
        await acceptButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      // No cookie dialog or already accepted
    }

    // Wait for extension widget
    console.log('⏳ Waiting for extension widget...');
    const widgetSelector = '.amazon-returns-ext__widget';

    let widgetFound = false;
    try {
      await page.waitForSelector(widgetSelector, { timeout: 10000 });
      widgetFound = true;
      console.log('✅ Extension widget found!');
    } catch (e) {
      console.log('❌ Extension widget NOT found');
    }

    if (!widgetFound && testCase.expectedBehavior.hasWidget) {
      console.log('⚠️  Expected widget but none found');

      // Debug: Check extension logs
      const extensionLogs = logs.filter(log => log.includes('[Amazon Returns Extension]'));
      if (extensionLogs.length > 0) {
        console.log('\n📋 Extension logs:');
        extensionLogs.forEach(log => console.log('  -', log));
      } else {
        console.log('❌ No extension logs - content script may not be running');
      }

      // Take debug screenshot
      const debugPath = `/tmp/debug-${Date.now()}.jpg`;
      await page.screenshot({ path: debugPath, type: 'jpeg', quality: 85, fullPage: false });
      console.log(`📸 Debug screenshot: ${debugPath}`);

      return { success: false, testCase: testCase.name, error: 'Widget not found' };
    }

    // Analyze widget content
    const widgetText = await page.evaluate(() => {
      const widget = document.querySelector('.amazon-returns-ext__widget');
      return widget ? widget.innerText : null;
    });

    console.log('\n📦 Widget Content:');
    console.log('─'.repeat(50));
    console.log(widgetText);
    console.log('─'.repeat(50));

    // Validate expectations
    const results = {
      hasDefective: widgetText.includes('Defective') || widgetText.includes('Defekte'),
      hasRegular: widgetText.includes('Regular') || widgetText.includes('Reguläre'),
      isFree: widgetText.includes('Free') || widgetText.includes('Kostenlos'),
      hasCost: widgetText.includes('€') || widgetText.includes('$'),
      has14Days: widgetText.includes('14'),
      has30Days: widgetText.includes('30'),
    };

    console.log('\n✓ Validation Results:');
    console.log(`  Has defective section: ${results.hasDefective ? '✅' : '❌'}`);
    console.log(`  Has regular section: ${results.hasRegular ? '✅' : '❌'}`);
    console.log(`  Shows free returns: ${results.isFree ? '✅' : '❌'}`);
    console.log(`  Shows cost info: ${results.hasCost ? '✅' : '❌'}`);

    // Check if regular returns show paid shipping when expected
    if (testCase.expectedBehavior.regularFree === false) {
      const showsPaidShipping = widgetText.includes('€6.50') || widgetText.includes('€13.00');
      console.log(`  Shows paid shipping cost: ${showsPaidShipping ? '✅' : '❌'}`);

      if (!showsPaidShipping) {
        console.log('⚠️  Expected paid shipping (€6.50-€13.00) but not found');
      }
    }

    // Take screenshot
    const screenshotName = testCase.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const screenshotPath = `/tmp/test-${screenshotName}.jpg`;
    await page.screenshot({
      path: screenshotPath,
      type: 'jpeg',
      quality: 85,
      fullPage: false
    });
    console.log(`\n📸 Screenshot: ${screenshotPath}`);

    // Overall pass/fail
    const passed = results.hasDefective && results.hasRegular;
    console.log(`\n${passed ? '🎉 TEST PASSED' : '❌ TEST FAILED'}`);

    return {
      success: passed,
      testCase: testCase.name,
      results,
      widgetText,
      screenshotPath
    };

  } catch (error) {
    console.error('❌ Test error:', error.message);
    return { success: false, testCase: testCase.name, error: error.message };
  } finally {
    await page.close();
  }
}

async function runDynamicTests() {
  console.log('🚀 Starting dynamic extension tests...');
  console.log(`📦 Extension path: ${EXTENSION_PATH}`);
  console.log(`📋 Test cases: ${TEST_CASES.length}`);

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  const results = [];

  for (const testCase of TEST_CASES) {
    const result = await testProduct(browser, testCase);
    results.push(result);

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`\nTotal: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);

  console.log('\nResults:');
  results.forEach((r, i) => {
    const icon = r.success ? '✅' : '❌';
    console.log(`  ${icon} ${r.testCase}`);
    if (r.error) {
      console.log(`      Error: ${r.error}`);
    }
  });

  console.log('\n👀 Browser will stay open for 5 seconds...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  await browser.close();

  console.log('\n✅ All tests complete');

  // Exit with error code if any tests failed
  process.exit(failed > 0 ? 1 : 0);
}

// Command-line usage: yarn node test-dynamic.js [URL]
if (process.argv[2]) {
  const customUrl = process.argv[2];
  console.log('🔍 Testing custom URL:', customUrl);

  TEST_CASES.length = 0; // Clear default tests
  TEST_CASES.push({
    name: 'Custom URL Test',
    url: customUrl,
    region: customUrl.includes('.de') ? 'de' : 'com',
    expectedBehavior: {
      hasWidget: true,
      defectiveFree: true,
      language: 'auto'
    }
  });
}

runDynamicTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
