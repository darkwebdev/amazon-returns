import { SellerInfo, ReturnPolicyData } from '../shared/types';
import { RETURN_PATTERNS } from '../shared/i18n';

export function detectThirdPartySeller(): SellerInfo {

  // First, check URL for seller ID (smid parameter)
  const urlParams = new URLSearchParams(window.location.search);
  const smid = urlParams.get('smid');

  const sellerSelectors = [
    '#sellerProfileTriggerId',
    '[id*="merchant-info"]',
    '#merchant-info',
    '[data-feature-name="bylineInfo"]',
    '#tabular-buybox',
  ];

  for (const selector of sellerSelectors) {
    const sellerElement = document.querySelector(selector);
    if (!sellerElement) {
      continue;
    }

    const sellerText = sellerElement.textContent || '';

    // Check if it's Amazon or if it's just a brand link (like "Visit the X Store")
    const isAmazon = /Amazon\.com|Amazon\.de|Amazon\s*$/i.test(sellerText);
    const isBrandStore = /Visit the .+ Store/i.test(sellerText);

    if (isAmazon || isBrandStore) {
      return {
        isThirdParty: false,
        sellerLink: null,
        sellerId: null,
        sellerName: null,
      };
    }

    // Try to find seller link from element
    let sellerLink = sellerElement.querySelector('a')?.href || null;

    // Try to find seller link in the entire page if not found in the element
    if (!sellerLink) {
      const allLinks = Array.from(document.querySelectorAll('a'));
      const sellerPageLink = allLinks.find(link =>
        link.href.includes('/sp?seller=') ||
        link.href.includes('/shops/') ||
        link.href.includes('seller=')
      );
      sellerLink = sellerPageLink?.href || null;
    }


    let sellerId: string | null = null;

    // Extract seller ID from link
    if (sellerLink) {
      const sellerIdMatch = sellerLink.match(/seller=([A-Z0-9]+)/i) || sellerLink.match(/shops\/([A-Z0-9]+)/i);
      if (sellerIdMatch) {
        sellerId = sellerIdMatch[1];
      }
    }

    // If no seller ID from link, use smid from URL
    if (!sellerId && smid) {
      sellerId = smid;
      // Construct seller link from seller ID
      const domain = window.location.hostname;
      sellerLink = `https://${domain}/sp?seller=${sellerId}`;
    }

    const sellerNameElement = sellerElement.querySelector('a');
    const sellerName = sellerNameElement?.textContent?.trim() || sellerText.trim() || null;

    return {
      isThirdParty: true,
      sellerLink,
      sellerId,
      sellerName,
    };
  }

  return {
    isThirdParty: false,
    sellerLink: null,
    sellerId: null,
    sellerName: null,
  };
}

export async function fetchSellerReturnPolicy(
  sellerLink: string,
  language: 'en' | 'de',
  defaultWindow: number
): Promise<ReturnPolicyData | null> {
  try {
    const response = await fetch(sellerLink);
    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const policy = parseSellerReturnPolicy(doc, language, defaultWindow);
    return policy;
  } catch (error) {
    console.error('[Amazon Returns Extension] Failed to fetch seller policy:', error);
    return null;
  }
}

function parseSellerReturnPolicy(
  doc: Document,
  language: 'en' | 'de',
  defaultWindow: number
): ReturnPolicyData | null {
  const patterns = RETURN_PATTERNS[language];


  const returnsSections = Array.from(doc.querySelectorAll('*')).filter(el => {
    const text = el.textContent || '';
    return patterns.sectionHeadings.some(heading => text.toLowerCase().includes(heading));
  });


  if (returnsSections.length === 0) {
    // Log a sample of the page content to understand what's there
    const bodyText = doc.body?.textContent?.substring(0, 500) || '';
    return null;
  }

  let isFreeReturn = true;
  let returnCost: string | null = null;
  let returnWindow = defaultWindow;

  for (const section of returnsSections) {
    const text = section.textContent || '';

    if (patterns.freeReturns.test(text)) {
      isFreeReturn = true;
    } else if (patterns.buyerPays.test(text)) {
      isFreeReturn = false;
      const costMatch = text.match(/[\$€£]\d+(?:\.\d{2})?/);
      if (costMatch) {
        returnCost = costMatch[0];
      }
    }

    const windowMatch = text.match(patterns.returnWindow);
    if (windowMatch) {
      returnWindow = parseInt(windowMatch[1], 10);
    }
  }

  return {
    isFreeReturn,
    returnCost,
    returnWindow,
    defectivePolicy: {
      isFree: true,
      cost: null,
      window: returnWindow,
    },
    regularReturnPolicy: {
      isFree: isFreeReturn,
      cost: returnCost,
      window: returnWindow,
    },
    isThirdPartySeller: true,
  };
}
