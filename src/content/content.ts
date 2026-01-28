import './styles.css';
import browser from 'webextension-polyfill';
import { detectAmazonRegion, detectLanguage } from '../shared/regionDetector';
import { scrapeProductPagePolicy, getFallbackPolicy } from './policyScraper';
import { detectThirdPartySeller, fetchSellerReturnPolicy } from './sellerScraper';
import { createReturnInfoWidget, createLoadingWidget, createErrorWidget, injectWidget, updateWidget, createAmazonStyleBadge, injectBadge, updateBadge } from './ui';
import { ReturnPolicyData } from '../shared/types';

async function main() {
  const region = detectAmazonRegion();
  if (!region) {
    return;
  }

  const language = detectLanguage(region);

  if (!document.querySelector('#productTitle') && !document.querySelector('#price')) {
    await waitForProductDetails();
  }

  // Check if badge or widget already exists
  const existingBadge = document.getElementById('amazon-returns-ext-container');
  const existingWidget = document.getElementById('amazon-returns-ext-widget');
  if (existingBadge || existingWidget) {
    return;
  }

  // Quick check: if Amazon shows FREE Returns, exit immediately
  const hasAmazonFreeReturns = checkAmazonFreeReturns();
  if (hasAmazonFreeReturns) {
    return;
  }

  let policyData: ReturnPolicyData | null = null;

  const sellerInfo = detectThirdPartySeller();

  if (sellerInfo.isThirdParty && sellerInfo.sellerLink) {

    const cachedPolicy = await getCachedSellerPolicy(sellerInfo.sellerId || '', region.domain);
    if (cachedPolicy) {
      policyData = cachedPolicy;
      policyData.sellerName = sellerInfo.sellerName || undefined;
      policyData.sellerLink = sellerInfo.sellerLink || undefined;
      // Construct clean seller page URL from seller ID
      if (sellerInfo.sellerId) {
        policyData.sellerPageLink = `https://${region.domain}/sp?seller=${sellerInfo.sellerId}`;
      }
    } else {
      const sellerPolicy = await fetchSellerReturnPolicy(
        sellerInfo.sellerLink,
        language,
        region.defaultReturnWindow
      );

      if (sellerPolicy) {
        policyData = sellerPolicy;
        policyData.sellerName = sellerInfo.sellerName || undefined;
        policyData.sellerLink = sellerInfo.sellerLink || undefined;
        // Construct clean seller page URL from seller ID
        if (sellerInfo.sellerId) {
          policyData.sellerPageLink = `https://${region.domain}/sp?seller=${sellerInfo.sellerId}`;
        }
        await cacheSellerPolicy(sellerInfo.sellerId || '', region.domain, sellerPolicy);
      } else {
        // Use default third-party seller policy
        policyData = {
          isFreeReturn: false,
          returnCost: region.domain === 'amazon.de' ? '€6.50-€13.00' : '$5.00-$10.00',
          returnWindow: region.defaultReturnWindow,
          defectivePolicy: {
            isFree: true,
            cost: null,
            window: region.defaultReturnWindow,
          },
          regularReturnPolicy: {
            isFree: false,
            cost: region.domain === 'amazon.de' ? '€6.50-€13.00' : '$5.00-$10.00',
            window: region.defaultReturnWindow,
          },
          isThirdPartySeller: true,
          sellerName: sellerInfo.sellerName || undefined,
          sellerLink: sellerInfo.sellerLink || undefined,
          sellerPageLink: sellerInfo.sellerId ? `https://${region.domain}/sp?seller=${sellerInfo.sellerId}` : undefined,
        };
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

  // Show badge if we have policy data (meaning non-free returns)
  if (policyData) {
    const badge = createAmazonStyleBadge(policyData, language);
    injectBadge(badge);
  }
  // If no policy data, don't show anything (either free returns already shown by Amazon, or no info available)
}

function checkAmazonFreeReturns(): boolean {
  // Quick check if Amazon already shows FREE Returns badge
  const returnsContainers = [
    '#shippingMessageInsideBuyBox_feature_div',
    '#freeReturns_feature_div',
  ];

  for (const containerSelector of returnsContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      const returnsContent = container.querySelector('#creturns-return-policy-content');
      if (returnsContent) {
        const text = returnsContent.textContent?.trim() || '';
        if (text.match(/FREE.*Return|GRATIS.*Rück|Kostenlose/i)) {
          return true;
        }
      }
    }
  }
  return false;
}

function waitForProductDetails(): Promise<void> {
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      if (document.querySelector('#productTitle') || document.querySelector('#price')) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100); // Check every 100ms instead of 500ms

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 2000); // Reduce timeout from 5s to 2s
  });
}

async function getCachedSellerPolicy(sellerId: string, domain: string): Promise<ReturnPolicyData | null> {
  const cacheKey = `seller-${sellerId}-${domain}`;
  try {
    const result = await browser.storage.local.get(cacheKey);
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
    await browser.storage.local.set({
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
