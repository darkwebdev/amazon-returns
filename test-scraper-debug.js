/**
 * Debug what the extension is actually scraping
 */

const puppeteer = require('puppeteer');
const path = require('path');

const EXTENSION_PATH = path.join(__dirname, 'dist');
const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function debugScraper() {
  console.log('🔍 Debugging extension scraper logic...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
    ],
  });

  const page = await browser.newPage();

  // Capture console logs
  const extensionLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Amazon Returns Extension]')) {
      extensionLogs.push(text);
    }
  });

  await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Accept cookies
  try {
    await page.waitForSelector('#sp-cc-accept, button[data-action="accept"]', { timeout: 3000 });
    await page.click('#sp-cc-accept, button[data-action="accept"]');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (e) {}

  // Wait for extension to run
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Check if widget exists
  const widgetExists = await page.$('.amazon-returns-ext__widget');

  console.log('═'.repeat(70));
  console.log('EXTENSION STATUS');
  console.log('═'.repeat(70));
  console.log('Widget present:', widgetExists ? '✅ YES' : '❌ NO');
  console.log('Extension logs captured:', extensionLogs.length);

  if (extensionLogs.length > 0) {
    console.log('\n' + '═'.repeat(70));
    console.log('EXTENSION CONSOLE LOGS');
    console.log('═'.repeat(70));
    extensionLogs.forEach(log => console.log(log));
  }

  // Run scraper logic manually in page context to see what it finds
  const pageData = await page.evaluate(() => {
    const data = {
      creturnsMessage: null,
      creturnsAnchor: null,
      mirLayout: null,
      returnableText: null,
      allFreeReturnsText: []
    };

    // Check specific elements we added
    const creturnsMsg = document.querySelector('#creturns-return-policy-message');
    if (creturnsMsg) {
      data.creturnsMessage = creturnsMsg.textContent.substring(0, 200);
    }

    const creturnsAnchor = document.querySelector('#creturns-policy-anchor-text');
    if (creturnsAnchor) {
      data.creturnsAnchor = creturnsAnchor.textContent.substring(0, 200);
    }

    const mir = document.querySelector('#mir-layout-DELIVERY_BLOCK');
    if (mir) {
      data.mirLayout = mir.textContent.substring(0, 200);
    }

    // Find "Returnable if requested" text
    const spans = document.querySelectorAll('span, div');
    for (const span of spans) {
      const text = span.textContent;
      if (text && text.includes('Returnable if requested within')) {
        data.returnableText = text.substring(0, 200);
        break;
      }
    }

    // Find all "FREE Returns" mentions
    const all = document.querySelectorAll('*');
    for (const elem of all) {
      const text = elem.textContent;
      if (text && text.length < 300 && text.toLowerCase().includes('free returns')) {
        const rect = elem.getBoundingClientRect();
        if (rect.height > 0) {
          data.allFreeReturnsText.push({
            tag: elem.tagName,
            id: elem.id,
            text: text.substring(0, 150)
          });
        }
      }
    }

    return data;
  });

  console.log('\n' + '═'.repeat(70));
  console.log('PAGE DATA FOUND');
  console.log('═'.repeat(70));
  console.log('\n#creturns-return-policy-message:');
  console.log(pageData.creturnsMessage || '❌ NOT FOUND');

  console.log('\n#creturns-policy-anchor-text:');
  console.log(pageData.creturnsAnchor || '❌ NOT FOUND');

  console.log('\n#mir-layout-DELIVERY_BLOCK:');
  console.log(pageData.mirLayout || '❌ NOT FOUND');

  console.log('\n"Returnable if requested" text:');
  console.log(pageData.returnableText || '❌ NOT FOUND');

  console.log('\nAll "FREE Returns" elements found:', pageData.allFreeReturnsText.length);
  if (pageData.allFreeReturnsText.length > 0) {
    pageData.allFreeReturnsText.slice(0, 5).forEach((elem, i) => {
      console.log(`\n${i + 1}. <${elem.tag}> id="${elem.id}"`);
      console.log(`   ${elem.text}`);
    });
  }

  // Get widget data if it exists
  if (widgetExists) {
    const widgetData = await page.evaluate(() => {
      const widget = document.querySelector('.amazon-returns-ext__widget');
      return widget ? widget.innerText : null;
    });

    console.log('\n' + '═'.repeat(70));
    console.log('WIDGET CONTENT');
    console.log('═'.repeat(70));
    console.log(widgetData);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('CONCLUSION');
  console.log('═'.repeat(70));

  if (pageData.creturnsMessage && pageData.creturnsMessage.includes('FREE Returns')) {
    console.log('✅ FREE Returns badge IS present on page');
    console.log('✅ Extension SHOULD detect it with updated selectors');
  } else {
    console.log('❌ FREE Returns badge NOT found in expected location');
  }

  if (extensionLogs.length === 0) {
    console.log('⚠️  NO extension logs - content script may not be running');
  }

  await new Promise(resolve => setTimeout(resolve, 10000));
  await browser.close();
}

debugScraper().catch(console.error);
