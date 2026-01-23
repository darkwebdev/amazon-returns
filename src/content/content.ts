import './styles.css';
import { detectAmazonRegion, detectLanguage } from '../shared/regionDetector';
import { scrapeProductPagePolicy, getFallbackPolicy } from './policyScraper';
import { detectThirdPartySeller, fetchSellerReturnPolicy } from './sellerScraper';
import { createReturnInfoWidget, injectWidget } from './ui';
import { ReturnPolicyData } from '../shared/types';

async function main() {
  const region = detectAmazonRegion();
  if (!region) {
    console.log('[Amazon Returns Extension] Not on a supported Amazon domain');
    return;
  }

  const language = detectLanguage(region);

  if (!document.querySelector('#productTitle') && !document.querySelector('#price')) {
    console.log('[Amazon Returns Extension] Product details not found, waiting...');
    await waitForProductDetails();
  }

  const existingWidget = document.querySelector('.amazon-returns-ext__widget');
  if (existingWidget) {
    console.log('[Amazon Returns Extension] Widget already exists');
    return;
  }

  let policyData: ReturnPolicyData | null = null;

  const sellerInfo = detectThirdPartySeller();

  if (sellerInfo.isThirdParty && sellerInfo.sellerLink) {
    console.log('[Amazon Returns Extension] Third-party seller detected:', sellerInfo.sellerName);

    const cachedPolicy = await getCachedSellerPolicy(sellerInfo.sellerId || '', region.domain);
    if (cachedPolicy) {
      policyData = cachedPolicy;
      policyData.sellerName = sellerInfo.sellerName || undefined;
    } else {
      const sellerPolicy = await fetchSellerReturnPolicy(
        sellerInfo.sellerLink,
        language,
        region.defaultReturnWindow
      );

      if (sellerPolicy) {
        policyData = sellerPolicy;
        policyData.sellerName = sellerInfo.sellerName || undefined;
        await cacheSellerPolicy(sellerInfo.sellerId || '', region.domain, sellerPolicy);
      }
    }
  }

  if (!policyData) {
    try {
      policyData = await scrapeProductPagePolicy(region, language);
    } catch (error) {
      console.error('[Amazon Returns Extension] Error scraping policy:', error);
    }
  }

  // If we still don't have policy data, DO NOT show the widget
  // Never guess or assume - only show verified information
  if (!policyData) {
    console.log('[Amazon Returns Extension] Unable to determine return policy - widget not displayed');
    return;
  }

  const widget = createReturnInfoWidget(policyData, language);
  injectWidget(widget);

  console.log('[Amazon Returns Extension] Widget injected successfully with verified data');
}

function waitForProductDetails(): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (document.querySelector('#productTitle') || document.querySelector('#price')) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 500);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 5000);
  });
}

async function getCachedSellerPolicy(sellerId: string, domain: string): Promise<ReturnPolicyData | null> {
  const cacheKey = `seller-${sellerId}-${domain}`;
  try {
    const result = await chrome.storage.local.get(cacheKey);
    if (result[cacheKey]) {
      const cached = result[cacheKey] as { policy: ReturnPolicyData; timestamp: number };
      const now = Date.now();
      const ttl = 7 * 24 * 60 * 60 * 1000;

      if (now - cached.timestamp < ttl) {
        return cached.policy;
      }
    }
  } catch (error) {
    console.error('[Amazon Returns Extension] Error reading cache:', error);
  }
  return null;
}

async function cacheSellerPolicy(sellerId: string, domain: string, policy: ReturnPolicyData): Promise<void> {
  const cacheKey = `seller-${sellerId}-${domain}`;
  try {
    await chrome.storage.local.set({
      [cacheKey]: {
        policy,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    console.error('[Amazon Returns Extension] Error writing cache:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
