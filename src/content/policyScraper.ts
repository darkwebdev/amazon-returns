import { ReturnPolicyData, AmazonRegion } from '../shared/types';
import { RETURN_PATTERNS } from '../shared/i18n';
import { getDefaultPolicyForRegion } from '../shared/policyData';

export async function scrapeProductPagePolicy(
  region: AmazonRegion,
  language: 'en' | 'de'
): Promise<ReturnPolicyData | null> {
  const patterns = RETURN_PATTERNS[language];

  let returnWindow = region.defaultReturnWindow;
  let isFreeReturn: boolean | null = null;  // null means not found
  let returnCost: string | null = null;
  let foundAnyReturnInfo = false;

  // Check for free returns badge (multiple possible locations)
  const badgeSelectors = [
    '#creturns-return-policy-message',  // Primary location for "FREE Returns" badge
    '#creturns-policy-anchor-text',     // Backup - link text
    '[id*="freeReturns"]',
    '[class*="free-returns"]',
    '[id*="mir-layout-DELIVERY_BLOCK"]',
    '#deliveryMessageMirId',
    '[data-csa-c-content-id*="DEXUnifiedCXPDM"]',
    '.a-section.a-spacing-none.a-spacing-top-mini'
  ];

  for (const selector of badgeSelectors) {
    const badges = document.querySelectorAll(selector);
    for (const badge of Array.from(badges)) {
      const badgeText = badge.textContent || '';
      if (badgeText.length > 5) {  // Ignore empty/tiny elements
        console.log('[Amazon Returns Extension] Checking badge:', badgeText.substring(0, 100));

        // Check for non-returnable items first
        if (patterns.nonReturnable.test(badgeText)) {
          console.log('[Amazon Returns Extension] ✗ Item is non-returnable');
          return null;  // Don't display widget for non-returnable items
        }

        if (patterns.freeReturns.test(badgeText)) {
          isFreeReturn = true;
          foundAnyReturnInfo = true;
          console.log('[Amazon Returns Extension] ✓ Found FREE returns indicator');
        }

        if (patterns.buyerPays.test(badgeText)) {
          isFreeReturn = false;
          foundAnyReturnInfo = true;
          console.log('[Amazon Returns Extension] ✓ Found PAID returns indicator');
          const costMatch = badgeText.match(/[\$€£]\d+(?:\.\d{2})?/);
          if (costMatch) {
            returnCost = costMatch[0];
          }
        }

        const windowMatch = badgeText.match(patterns.returnWindow);
        if (windowMatch) {
          returnWindow = parseInt(windowMatch[1], 10);
          foundAnyReturnInfo = true;
          console.log('[Amazon Returns Extension] ✓ Found return window:', returnWindow, 'days');
        }
      }
    }
  }

  // Check for "Returnable if requested within X days" text (common on Amazon)
  const returnableElements = document.querySelectorAll('span, div');
  for (const elem of Array.from(returnableElements)) {
    const text = elem.textContent || '';
    const returnableMatch = text.match(/Returnable if requested within (\d+) days?/i);
    if (returnableMatch) {
      returnWindow = parseInt(returnableMatch[1], 10);
      foundAnyReturnInfo = true;
      console.log('[Amazon Returns Extension] ✓ Found returnable window:', returnWindow, 'days');
    }
  }

  // Check product details table
  const productDetails = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #prodDetails tr, .prodDetTable tr');
  for (const row of Array.from(productDetails)) {
    const text = row.textContent || '';

    if (patterns.sectionHeadings.some(heading => text.toLowerCase().includes(heading))) {
      console.log('[Amazon Returns Extension] Found return policy in product details:', text.substring(0, 100));
      foundAnyReturnInfo = true;

      // Check for non-returnable in policy details
      if (patterns.nonReturnable.test(text)) {
        console.log('[Amazon Returns Extension] ✗ Item marked as non-returnable in policy');
        return null;
      }

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
  }

  // Check expandable sections
  const expandableSections = document.querySelectorAll('[id*="returnPolicy"], [id*="returns"], [data-csa-c-content-id*="return"]');
  for (const section of Array.from(expandableSections)) {
    const text = section.textContent || '';

    if (text && text.trim().length > 10) {  // Only process sections with meaningful content
      console.log('[Amazon Returns Extension] Checking expandable section, length:', text.length);

      if (patterns.freeReturns.test(text)) {
        isFreeReturn = true;
        foundAnyReturnInfo = true;
      } else if (patterns.buyerPays.test(text)) {
        isFreeReturn = false;
        foundAnyReturnInfo = true;
        const costMatch = text.match(/[\$€£]\d+(?:\.\d{2})?/);
        if (costMatch) {
          returnCost = costMatch[0];
        }
      }

      const windowMatch = text.match(patterns.returnWindow);
      if (windowMatch) {
        returnWindow = parseInt(windowMatch[1], 10);
        foundAnyReturnInfo = true;
      }
    }
  }

  // If we didn't find any return information at all, return null - DO NOT GUESS
  if (!foundAnyReturnInfo) {
    console.log('[Amazon Returns Extension] No return information found on page - will not display widget');
    return null;
  }

  // Determine default return shipping cost based on region if not explicitly free
  // Amazon.de charges €6.50-€13.00 for regular returns unless "FREE Returns" badge present
  // Defective items are always free per EU law
  let regularReturnCost = returnCost;
  let regularReturnFree: boolean;

  if (isFreeReturn === true) {
    // Explicitly found "FREE Returns" badge
    regularReturnFree = true;
    regularReturnCost = null;
    console.log('[Amazon Returns Extension] ✓ FREE Returns badge found - no shipping cost');
  } else if (isFreeReturn === false) {
    // Explicitly found paid returns indicator
    regularReturnFree = false;
    // If no explicit cost was extracted, apply regional defaults
    if (!returnCost && region.domain === 'amazon.de') {
      regularReturnCost = '€6.50-€13.00';
      console.log('[Amazon Returns Extension] ✗ Paid returns detected (applying default cost)');
    } else {
      regularReturnCost = returnCost;
      console.log('[Amazon Returns Extension] ✗ Paid returns detected');
    }
  } else {
    // isFreeReturn === null: We found return window/policy but NO "FREE Returns" badge
    // This means customer pays standard return shipping (unless item is defective)
    if (region.domain === 'amazon.de') {
      regularReturnFree = false;
      regularReturnCost = '€6.50-€13.00';
      console.log('[Amazon Returns Extension] No FREE Returns badge - customer pays return shipping (€6.50-€13.00)');
    } else {
      // For other regions, if we're not sure, don't show widget
      console.log('[Amazon Returns Extension] Unclear return policy - will not display widget');
      return null;
    }
  }

  console.log('[Amazon Returns Extension] Scraped policy - Regular Return Free:', regularReturnFree, 'Cost:', regularReturnCost, 'Window:', returnWindow);

  return {
    isFreeReturn: regularReturnFree,  // Overall return status based on regular returns
    returnCost: regularReturnCost,
    returnWindow,
    defectivePolicy: {
      isFree: true,  // Always free for defective items (EU consumer law)
      cost: null,
      window: returnWindow,
    },
    regularReturnPolicy: {
      isFree: regularReturnFree,
      cost: regularReturnCost,
      window: returnWindow,
    },
    isThirdPartySeller: false,
  };
}

export function getFallbackPolicy(region: AmazonRegion): ReturnPolicyData {
  return getDefaultPolicyForRegion(region.domain);
}
