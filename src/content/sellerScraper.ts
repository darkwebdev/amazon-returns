import { SellerInfo, ReturnPolicyData } from '../shared/types';
import { RETURN_PATTERNS } from '../shared/i18n';

export function detectThirdPartySeller(): SellerInfo {
  const sellerSelectors = [
    '#sellerProfileTriggerId',
    '[id*="merchant-info"]',
    '#merchant-info',
    '[data-feature-name="bylineInfo"]',
  ];

  for (const selector of sellerSelectors) {
    const sellerElement = document.querySelector(selector);
    if (!sellerElement) continue;

    const sellerText = sellerElement.textContent || '';

    const isAmazon = /Amazon\.com|Amazon\.de|Amazon\s*$/i.test(sellerText);
    if (isAmazon) {
      return {
        isThirdParty: false,
        sellerLink: null,
        sellerId: null,
        sellerName: null,
      };
    }

    const sellerLink = sellerElement.querySelector('a')?.href || null;

    let sellerId: string | null = null;
    if (sellerLink) {
      const sellerIdMatch = sellerLink.match(/seller=([A-Z0-9]+)/i) || sellerLink.match(/shops\/([A-Z0-9]+)/i);
      if (sellerIdMatch) {
        sellerId = sellerIdMatch[1];
      }
    }

    const sellerNameElement = sellerElement.querySelector('a');
    const sellerName = sellerNameElement?.textContent?.trim() || null;

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
    if (!response.ok) return null;

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    return parseSellerReturnPolicy(doc, language, defaultWindow);
  } catch (error) {
    console.error('Failed to fetch seller policy:', error);
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
