import { readFileSync } from 'fs';
import { join } from 'path';
import { scrapeProductPagePolicy } from '../src/content/policyScraper';
import { AmazonRegion } from '../src/shared/types';

describe('Policy Scraper', () => {
  const loadFixture = (filename: string): void => {
    const html = readFileSync(join(__dirname, 'fixtures', filename), 'utf-8');
    document.documentElement.innerHTML = html;
  };

  const US_REGION: AmazonRegion = {
    domain: 'amazon.com',
    currency: 'USD',
    language: 'en',
    defaultReturnWindow: 30,
  };

  const DE_REGION: AmazonRegion = {
    domain: 'amazon.de',
    currency: 'EUR',
    language: 'de',
    defaultReturnWindow: 14,
  };

  describe('Amazon.com - Free Returns', () => {
    beforeEach(() => {
      loadFixture('amazon-com-free-returns.html');
    });

    it('should return null when Amazon shows FREE Returns', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // When Amazon displays FREE Returns badge, extension should not show anything
      expect(result).toBeNull();
    });
  });

  describe('Amazon.de - Free Returns (German)', () => {
    beforeEach(() => {
      loadFixture('amazon-de-free-returns.html');
    });

    it('should return null when Amazon shows FREE Returns', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      // When Amazon displays FREE Returns badge, extension should not show anything
      expect(result).toBeNull();
    });
  });

  describe('Amazon.com - Paid Returns', () => {
    beforeEach(() => {
      loadFixture('amazon-com-paid-returns.html');
    });

    it('should detect paid returns', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.isFreeReturn).toBe(false);
    });

    it('should extract return cost', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.returnCost).toBe('$15.99');
    });

    it('should set regular return policy with cost', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.regularReturnPolicy.isFree).toBe(false);
      expect(result!.regularReturnPolicy.cost).toBe('$15.99');
    });

    it('should keep defective policy as free', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.defectivePolicy.isFree).toBe(true);
    });
  });

  describe('Amazon.de - Paid Returns (German)', () => {
    beforeEach(() => {
      loadFixture('amazon-de-paid-returns.html');
    });

    it('should detect käufer zahlt rücksendekosten', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      expect(result!.isFreeReturn).toBe(false);
    });

    it('should extract euro cost', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      expect(result!.returnCost).toBe('€12.50');
    });
  });

  describe('Amazon.com - No Return Information', () => {
    beforeEach(() => {
      loadFixture('amazon-com-no-return-info.html');
    });

    it('should return null when no return info found', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).toBeNull();
    });

    it('should not guess or assume free returns', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // CRITICAL: Never guess - if no info found, return null
      expect(result).toBeNull();
    });
  });

  describe('Amazon.com - Third Party Free Returns', () => {
    beforeEach(() => {
      loadFixture('amazon-com-third-party-free.html');
    });

    it('should return null when Amazon shows FREE Returns', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // When Amazon displays FREE Returns badge, extension should not show anything
      expect(result).toBeNull();
    });
  });

  describe('Safety - Never Guess Policy', () => {
    it('should never return free returns by default without evidence', async () => {
      // Load fixture with no return info
      loadFixture('amazon-com-no-return-info.html');

      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // CRITICAL SAFETY: Must return null, not assume free returns
      expect(result).toBeNull();
    });

    it('should require explicit return information to display widget', async () => {
      loadFixture('amazon-com-no-return-info.html');

      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // If we can't find return info, don't show anything
      // This prevents users from making incorrect assumptions about return costs
      expect(result).toBeNull();
    });
  });

  describe('Amazon.com - Restocking Fee (Software)', () => {
    beforeEach(() => {
      loadFixture('amazon-com-restocking-fee.html');
    });

    it('should detect restocking fee warning', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      // Restocking fee makes it a non-free return
      expect(result!.isFreeReturn).toBe(false);
    });

    it('should detect 30-day return window despite restocking fee', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.returnWindow).toBe(30);
    });
  });

  describe('Amazon.com - Non-Returnable Digital Product', () => {
    beforeEach(() => {
      loadFixture('amazon-com-non-returnable.html');
    });

    it('should return null for non-returnable items', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // Non-returnable items should return null - no widget shown
      expect(result).toBeNull();
    });
  });

  describe('Amazon.com - Extended Holiday Returns', () => {
    beforeEach(() => {
      loadFixture('amazon-com-extended-holiday.html');
    });

    it('should return null when Amazon shows FREE Returns', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      // When Amazon displays FREE Returns badge, extension should not show anything
      expect(result).toBeNull();
    });
  });

  describe('Amazon.com - Large Item with Return Shipping Fee', () => {
    beforeEach(() => {
      loadFixture('amazon-com-large-item-fee.html');
    });

    it('should detect paid returns for large items', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.isFreeReturn).toBe(false);
    });

    it('should extract large item return shipping cost', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.returnCost).toBe('$89.99');
    });

    it('should detect standard 30-day window for large items', async () => {
      const result = await scrapeProductPagePolicy(US_REGION, 'en');

      expect(result).not.toBeNull();
      expect(result!.returnWindow).toBe(30);
    });
  });

  describe('Amazon.de - Restocking Fee (German Software)', () => {
    beforeEach(() => {
      loadFixture('amazon-de-restocking-fee.html');
    });

    it('should detect restocking fee in German', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      expect(result!.isFreeReturn).toBe(false);
    });

    it('should detect 14-day window for German software', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      expect(result!.returnWindow).toBe(14);
    });
  });

  describe('Amazon.de - No FREE Returns Badge (Paid Shipping)', () => {
    beforeEach(() => {
      loadFixture('amazon-de-no-free-badge.html');
    });

    it('should detect defective items as free', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      // Defective items always free per EU law
      expect(result!.defectivePolicy.isFree).toBe(true);
      expect(result!.defectivePolicy.cost).toBeNull();
    });

    it('should detect regular returns as paid shipping', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      // Without FREE Returns badge, customer pays shipping
      expect(result!.regularReturnPolicy.isFree).toBe(false);
      expect(result!.regularReturnPolicy.cost).toBe('€6.50-€13.00');
    });

    it('should detect 14-day return window', async () => {
      const result = await scrapeProductPagePolicy(DE_REGION, 'de');

      expect(result).not.toBeNull();
      expect(result!.returnWindow).toBe(14);
    });
  });
});
