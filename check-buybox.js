/**
 * Check Buy Box Area for Return Information
 */

const puppeteer = require('puppeteer');

const TEST_URL = 'https://www.amazon.de/-/en/AlloverPower-E61-Group-Head-Coffee/dp/B0BNQ66ZN1';

async function checkBuyBox() {
  console.log('🔍 Checking buy box area for return info...\n');

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
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (e) {}

  // Scroll to top
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Extract buy box and return info
  const info = await page.evaluate(() => {
    const result = {
      mirLayout: null,
      returnsFeature: null,
      allReturnElements: [],
      buyBoxHTML: null
    };

    // Check MIR layout (returns/delivery block)
    const mir = document.querySelector('#mir-layout-DELIVERY_BLOCK');
    if (mir) {
      result.mirLayout = mir.innerText;
    }

    // Check for returns feature
    const returnsDiv = document.querySelector('[data-feature-name="returns"]');
    if (returnsDiv) {
      result.returnsFeature = returnsDiv.innerText;
    }

    // Find all elements containing "return" text
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const text = el.textContent;
      if (text && text.length < 500 && text.length > 5) {
        const lower = text.toLowerCase();
        if ((lower.includes('free returns') || lower.includes('return')) &&
            !lower.includes('javascript') && !lower.includes('function')) {
          // Get element info
          const rect = el.getBoundingClientRect();
          if (rect.height > 0 && rect.width > 0) {  // Visible element
            result.allReturnElements.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              text: text.trim().substring(0, 200),
              isVisible: rect.top >= 0 && rect.top <= window.innerHeight
            });
          }
        }
      }
    });

    // Get buy box HTML
    const buyBox = document.querySelector('#buybox') || document.querySelector('#desktop_buybox');
    if (buyBox) {
      result.buyBoxHTML = buyBox.innerHTML.substring(0, 5000);
    }

    return result;
  });

  console.log('━'.repeat(70));
  console.log('📦 MIR LAYOUT (Delivery Block)');
  console.log('━'.repeat(70));
  console.log(info.mirLayout || '❌ NOT FOUND');

  console.log('\n' + '━'.repeat(70));
  console.log('🔄 RETURNS FEATURE DIV');
  console.log('━'.repeat(70));
  console.log(info.returnsFeature || '❌ NOT FOUND');

  console.log('\n' + '━'.repeat(70));
  console.log('🔍 ALL VISIBLE RETURN-RELATED ELEMENTS');
  console.log('━'.repeat(70));

  const visibleElements = info.allReturnElements.filter(e => e.isVisible);
  const uniqueTexts = [...new Map(visibleElements.map(e => [e.text, e])).values()];

  if (uniqueTexts.length === 0) {
    console.log('❌ No visible return elements found');
  } else {
    uniqueTexts.slice(0, 10).forEach((elem, i) => {
      console.log(`\n${i + 1}. Tag: <${elem.tag}> ${elem.id ? `id="${elem.id}"` : ''}`);
      console.log(`   Text: ${elem.text.substring(0, 150)}`);
    });
  }

  // Take screenshot of top area
  await page.screenshot({
    path: '/tmp/buybox-returns.jpg',
    type: 'jpeg',
    quality: 85,
    fullPage: false
  });

  console.log('\n📸 Screenshot: /tmp/buybox-returns.jpg');

  // Now check what the extension is actually detecting
  console.log('\n' + '━'.repeat(70));
  console.log('🔬 SIMULATING EXTENSION SCRAPER');
  console.log('━'.repeat(70));

  const scraperResult = await page.evaluate(() => {
    // Simulate the extension's scraping logic
    const freeReturnsPatterns = /free returns?|kostenlose rücksendung/i;
    const returnWindowPattern = /(\d+)[\s-]?(day|tag)s?\s+returns?/i;

    let foundFreeReturns = false;
    let foundReturnWindow = null;
    let foundInElement = null;

    // Check delivery block
    const deliveryBlock = document.querySelector('#mir-layout-DELIVERY_BLOCK');
    if (deliveryBlock) {
      const text = deliveryBlock.textContent;
      if (freeReturnsPatterns.test(text)) {
        foundFreeReturns = true;
        foundInElement = 'mir-layout-DELIVERY_BLOCK';
      }
      const match = text.match(returnWindowPattern);
      if (match) {
        foundReturnWindow = match[1];
      }
    }

    // Check product details
    const details = document.querySelector('#productDetails_detailBullets_sections1');
    if (details) {
      const text = details.textContent;
      if (freeReturnsPatterns.test(text)) {
        foundFreeReturns = true;
        foundInElement = foundInElement || 'productDetails';
      }
      const match = text.match(returnWindowPattern);
      if (match) {
        foundReturnWindow = foundReturnWindow || match[1];
      }
    }

    return {
      foundFreeReturns,
      foundReturnWindow,
      foundInElement
    };
  });

  console.log('Scraper found "FREE Returns":', scraperResult.foundFreeReturns ? 'YES ✅' : 'NO ❌');
  console.log('Found in element:', scraperResult.foundInElement || 'N/A');
  console.log('Return window:', scraperResult.foundReturnWindow || 'Not found');

  console.log('\n👀 Browser stays open for 15 seconds...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  await browser.close();
  console.log('\n✅ Complete');
}

checkBuyBox().catch(console.error);
