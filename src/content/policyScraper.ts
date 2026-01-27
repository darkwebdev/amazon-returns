import { ReturnPolicyData, AmazonRegion } from '../shared/types';
import { RETURN_PATTERNS } from '../shared/i18n';
import { getDefaultPolicyForRegion } from '../shared/policyData';

export async function scrapeProductPagePolicy(
  region: AmazonRegion,
  language: 'en' | 'de'
): Promise<ReturnPolicyData | null> {
  const patterns = RETURN_PATTERNS[language];
  // Check both English and German patterns since user can use any language on any domain
  const patternsEn = RETURN_PATTERNS.en;
  const patternsDe = RETURN_PATTERNS.de;

  let returnWindow = region.defaultReturnWindow;
  let isFreeReturn: boolean | null = null;  // null means not found
  let returnCost: string | null = null;
  let foundAnyReturnInfo = false;

  // First, check if Amazon already shows returns information in multiple locations
  const returnsContainers = [
    '#shippingMessageInsideBuyBox_feature_div',  // Location 1: Inside buy box shipping message
    '#freeReturns_feature_div',                   // Location 2: Separate free returns section
  ];

  for (const containerSelector of returnsContainers) {
    const container = document.querySelector(containerSelector);
    if (container) {
      // Look for Amazon's returns content
      const returnsContent = container.querySelector('#creturns-return-policy-content');

      if (returnsContent) {
        // Amazon has returns content - check if it's FREE returns
        const text = returnsContent.textContent?.trim() || '';
        if (text.match(/FREE.*Return|GRATIS.*Rück|Kostenlose/i)) {
          // Amazon shows FREE returns, don't show our badge
          return null;
        }
      }
    }
  }

  // Check for free returns badge (multiple possible locations)
  const badgeSelectors = [
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

        // Check for non-returnable items first (check both languages)
        if (patternsEn.nonReturnable.test(badgeText) || patternsDe.nonReturnable.test(badgeText)) {
          return null;  // Don't display widget for non-returnable items
        }

        // Check for free returns in both languages
        if (patternsEn.freeReturns.test(badgeText) || patternsDe.freeReturns.test(badgeText)) {
          isFreeReturn = true;
          foundAnyReturnInfo = true;
        }

        // Check for buyer pays in both languages
        if (patternsEn.buyerPays.test(badgeText) || patternsDe.buyerPays.test(badgeText)) {
          isFreeReturn = false;
          foundAnyReturnInfo = true;
          const costMatch = badgeText.match(/[\$€£]\d+(?:\.\d{2})?/);
          if (costMatch) {
            returnCost = costMatch[0];
          }
        }

        // Check return window in both languages
        let windowMatch = badgeText.match(patternsEn.returnWindow);
        if (!windowMatch) {
          windowMatch = badgeText.match(patternsDe.returnWindow);
        }
        if (windowMatch) {
          returnWindow = parseInt(windowMatch[1], 10);
          foundAnyReturnInfo = true;
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
    }
  }

  // Check product details table
  const productDetails = document.querySelectorAll('#productDetails_detailBullets_sections1 tr, #prodDetails tr, .prodDetTable tr');
  for (const row of Array.from(productDetails)) {
    const text = row.textContent || '';

    // Check both English and German section headings
    const allHeadings = [...patternsEn.sectionHeadings, ...patternsDe.sectionHeadings];
    if (allHeadings.some(heading => text.toLowerCase().includes(heading))) {
      foundAnyReturnInfo = true;

      // Check for non-returnable in policy details (both languages)
      if (patternsEn.nonReturnable.test(text) || patternsDe.nonReturnable.test(text)) {
        return null;
      }

      // Check for free returns (both languages)
      if (patternsEn.freeReturns.test(text) || patternsDe.freeReturns.test(text)) {
        isFreeReturn = true;
      } else if (patternsEn.buyerPays.test(text) || patternsDe.buyerPays.test(text)) {
        isFreeReturn = false;
        const costMatch = text.match(/[\$€£]\d+(?:\.\d{2})?/);
        if (costMatch) {
          returnCost = costMatch[0];
        }
      }

      // Check return window (both languages)
      let windowMatch = text.match(patternsEn.returnWindow);
      if (!windowMatch) {
        windowMatch = text.match(patternsDe.returnWindow);
      }
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

      // Check for free returns (both languages)
      if (patternsEn.freeReturns.test(text) || patternsDe.freeReturns.test(text)) {
        isFreeReturn = true;
        foundAnyReturnInfo = true;
      } else if (patternsEn.buyerPays.test(text) || patternsDe.buyerPays.test(text)) {
        isFreeReturn = false;
        foundAnyReturnInfo = true;
        const costMatch = text.match(/[\$€£]\d+(?:\.\d{2})?/);
        if (costMatch) {
          returnCost = costMatch[0];
        }
      }

      // Check return window (both languages)
      let windowMatch = text.match(patternsEn.returnWindow);
      if (!windowMatch) {
        windowMatch = text.match(patternsDe.returnWindow);
      }
      if (windowMatch) {
        returnWindow = parseInt(windowMatch[1], 10);
        foundAnyReturnInfo = true;
      }
    }
  }

  // If we didn't find any return information at all, return null - DO NOT GUESS
  if (!foundAnyReturnInfo) {
    return null;
  }

  // If we found free returns badge, don't show our widget - Amazon already shows it
  if (isFreeReturn === true) {
    return null;
  }

  // Determine default return shipping cost based on region
  // If isFreeReturn is null (no explicit info found), assume paid returns for amazon.de
  // Amazon.de charges €6.50-€13.00 for regular returns unless "FREE Returns" badge present
  // Defective items are always free per EU law
  let regularReturnCost = returnCost;
  let regularReturnFree: boolean;

  if (isFreeReturn === false) {
    // Explicitly found paid returns indicator
    regularReturnFree = false;
    if (!returnCost && region.domain === 'amazon.de') {
      regularReturnCost = '€6.50-€13.00';
    } else {
      regularReturnCost = returnCost;
    }
  } else {
    // isFreeReturn === null: No explicit free/paid indicator found
    // For amazon.de, assume paid returns (conservative approach to show costs)
    if (region.domain === 'amazon.de') {
      regularReturnFree = false;
      regularReturnCost = '€6.50-€13.00';
    } else {
      // For other regions, don't show if we're not sure
      return null;
    }
  }


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
