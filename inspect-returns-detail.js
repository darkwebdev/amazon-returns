/**
 * Detailed Return Policy Inspector
 *
 * Scrolls to product details and extracts ALL return-related information
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function inspectReturns() {
  console.log('🔍 Inspecting return policy details...\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Handle cookies
  try {
    const acceptButton = await page.waitForSelector('button[data-action="accept"]', { timeout: 3000 });
    if (acceptButton) {
      await acceptButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (e) {}

  // Wait for page to load
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Extract comprehensive return info
  const returnData = await page.evaluate(() => {
    const data = {
      freeReturnsBadge: null,
      deliveryBlockHTML: null,
      returnPolicyText: [],
      productDetailReturns: null,
      allReturnMentions: []
    };

    // Check for FREE Returns badge specifically
    const possibleBadges = [
      '#mir-layout-DELIVERY_BLOCK',
      '[data-feature-name="deliveryBlock"]',
      '[data-feature-name="returns"]'
    ];

    possibleBadges.forEach(selector => {
      const elem = document.querySelector(selector);
      if (elem) {
        const html = elem.innerHTML;
        const text = elem.innerText;
        if (text.toLowerCase().includes('return')) {
          data.deliveryBlockHTML = html;
          data.freeReturnsBadge = {
            selector: selector,
            text: text,
            hasFREE: text.includes('FREE Returns') || text.includes('FREE returns')
          };
        }
      }
    });

    // Look for return policy in structured data
    const detailsSections = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #productDetails_db_sections tr');
    detailsSections.forEach(row => {
      const th = row.querySelector('th');
      const td = row.querySelector('td');
      if (th && td) {
        const key = th.textContent.trim().toLowerCase();
        if (key.includes('return') || key.includes('rück')) {
          data.productDetailReturns = {
            label: th.textContent.trim(),
            value: td.textContent.trim()
          };
        }
      }
    });

    // Find ALL text nodes mentioning returns
    function getAllText(node) {
      let text = '';
      if (node.nodeType === Node.TEXT_NODE) {
        text = node.textContent.trim();
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        for (let child of node.childNodes) {
          text += getAllText(child) + ' ';
        }
      }
      return text;
    }

    const bodyText = getAllText(document.body);
    const sentences = bodyText.split(/[.!?\n]/);
    sentences.forEach(sentence => {
      const lower = sentence.toLowerCase().trim();
      if ((lower.includes('return') || lower.includes('rück')) &&
          sentence.trim().length > 10 &&
          sentence.trim().length < 200) {
        data.allReturnMentions.push(sentence.trim());
      }
    });

    return data;
  });

  console.log('━'.repeat(70));
  console.log('📍 FREE RETURNS BADGE');
  console.log('━'.repeat(70));
  if (returnData.freeReturnsBadge) {
    console.log('✅ FOUND:');
    console.log('   Selector:', returnData.freeReturnsBadge.selector);
    console.log('   Contains "FREE Returns":', returnData.freeReturnsBadge.hasFREE ? 'YES ✅' : 'NO ❌');
    console.log('   Full text:');
    console.log('   ' + returnData.freeReturnsBadge.text.split('\n').join('\n   '));
  } else {
    console.log('❌ NOT FOUND');
  }

  console.log('\n' + '━'.repeat(70));
  console.log('📊 PRODUCT DETAILS - Return Policy');
  console.log('━'.repeat(70));
  if (returnData.productDetailReturns) {
    console.log('✅ FOUND:');
    console.log('   Label:', returnData.productDetailReturns.label);
    console.log('   Value:', returnData.productDetailReturns.value);
  } else {
    console.log('❌ NOT FOUND in product details table');
  }

  console.log('\n' + '━'.repeat(70));
  console.log('💬 ALL RETURN MENTIONS ON PAGE');
  console.log('━'.repeat(70));
  const uniqueMentions = [...new Set(returnData.allReturnMentions)].filter(m => m.length > 0);
  if (uniqueMentions.length === 0) {
    console.log('❌ No return mentions found');
  } else {
    uniqueMentions.slice(0, 15).forEach((mention, i) => {
      console.log(`${i + 1}. ${mention}`);
    });
    if (uniqueMentions.length > 15) {
      console.log(`... and ${uniqueMentions.length - 15} more mentions`);
    }
  }

  // Scroll to product details
  await page.evaluate(() => {
    const details = document.querySelector('#productDetails_detailBullets_sections1') ||
                    document.querySelector('#detailBullets_feature_div');
    if (details) {
      details.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // Take screenshot of product details area
  await page.screenshot({
    path: '/tmp/returns-detail.jpg',
    type: 'jpeg',
    quality: 85,
    fullPage: false
  });

  console.log('\n📸 Screenshot: /tmp/returns-detail.jpg');
  console.log('\n👀 Browser stays open for inspection - close manually');

  await new Promise(resolve => setTimeout(resolve, 15000));
  await browser.close();
}

inspectReturns().catch(console.error);
