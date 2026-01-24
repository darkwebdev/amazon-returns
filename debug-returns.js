/**
 * Debug Return Policy Detection
 *
 * Scrapes the actual Amazon page to see what return policy info exists
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function debugReturns() {
  console.log('🔍 Debugging return policy on:', TEST_URL);

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Handle cookies
  try {
    const acceptButton = await page.waitForSelector('button[data-action="accept"], input[name="accept"]', { timeout: 3000 });
    if (acceptButton) {
      await acceptButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {}

  // Extract return policy information
  const returnInfo = await page.evaluate(() => {
    const results = {
      badges: [],
      deliveryBlock: null,
      productDetails: [],
      returnTexts: []
    };

    // Check for FREE Returns badge
    const deliveryBlock = document.querySelector('#mir-layout-DELIVERY_BLOCK');
    if (deliveryBlock) {
      results.deliveryBlock = deliveryBlock.innerText;

      // Look for badge text
      const badges = deliveryBlock.querySelectorAll('span, div');
      badges.forEach(badge => {
        const text = badge.textContent.trim();
        if (text.toLowerCase().includes('return') || text.toLowerCase().includes('rück')) {
          results.badges.push(text);
        }
      });
    }

    // Check product details table
    const detailsTable = document.querySelector('#productDetails_detailBullets_sections1');
    if (detailsTable) {
      const rows = detailsTable.querySelectorAll('tr');
      rows.forEach(row => {
        const header = row.querySelector('th');
        const data = row.querySelector('td');
        if (header && data) {
          const headerText = header.textContent.trim();
          const dataText = data.textContent.trim();
          if (headerText.toLowerCase().includes('return') ||
              headerText.toLowerCase().includes('rück') ||
              dataText.toLowerCase().includes('return') ||
              dataText.toLowerCase().includes('rück')) {
            results.productDetails.push({
              header: headerText,
              data: dataText
            });
          }
        }
      });
    }

    // Find all text containing "return" or "rück"
    const allText = document.body.innerText;
    const lines = allText.split('\n');
    lines.forEach(line => {
      const lower = line.toLowerCase();
      if ((lower.includes('return') || lower.includes('rück')) &&
          (lower.includes('free') || lower.includes('kostenlos') ||
           lower.includes('cost') || lower.includes('kosten') ||
           lower.includes('€') || lower.includes('shipping'))) {
        results.returnTexts.push(line.trim());
      }
    });

    return results;
  });

  console.log('\n📋 DELIVERY BLOCK:');
  console.log('─'.repeat(60));
  console.log(returnInfo.deliveryBlock || 'Not found');
  console.log('─'.repeat(60));

  console.log('\n🏷️  RETURN BADGES FOUND:');
  console.log('─'.repeat(60));
  if (returnInfo.badges.length === 0) {
    console.log('No badges found');
  } else {
    returnInfo.badges.forEach((badge, i) => {
      console.log(`${i + 1}. ${badge}`);
    });
  }
  console.log('─'.repeat(60));

  console.log('\n📊 PRODUCT DETAILS (Return-related):');
  console.log('─'.repeat(60));
  if (returnInfo.productDetails.length === 0) {
    console.log('No return details found in product details table');
  } else {
    returnInfo.productDetails.forEach((detail, i) => {
      console.log(`\n${i + 1}. ${detail.header}:`);
      console.log(`   ${detail.data}`);
    });
  }
  console.log('─'.repeat(60));

  console.log('\n💬 RETURN-RELATED TEXT ON PAGE:');
  console.log('─'.repeat(60));
  const uniqueTexts = [...new Set(returnInfo.returnTexts)];
  if (uniqueTexts.length === 0) {
    console.log('No return-related text found');
  } else {
    uniqueTexts.slice(0, 10).forEach((text, i) => {
      console.log(`${i + 1}. ${text}`);
    });
    if (uniqueTexts.length > 10) {
      console.log(`... and ${uniqueTexts.length - 10} more`);
    }
  }
  console.log('─'.repeat(60));

  // Take screenshot
  await page.screenshot({
    path: '/tmp/debug-returns.jpg',
    type: 'jpeg',
    quality: 85,
    fullPage: false
  });
  console.log('\n📸 Screenshot saved: /tmp/debug-returns.jpg');

  console.log('\n👀 Browser will stay open for 10 seconds for inspection...');
  await new Promise(resolve => setTimeout(resolve, 10000));

  await browser.close();
  console.log('\n✅ Debug complete');
}

debugReturns().catch(console.error);
