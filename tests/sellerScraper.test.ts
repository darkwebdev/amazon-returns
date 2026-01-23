import { readFileSync } from 'fs';
import { join } from 'path';
import { detectThirdPartySeller } from '../src/content/sellerScraper';

describe('Seller Scraper', () => {
  const loadFixture = (filename: string): void => {
    const html = readFileSync(join(__dirname, 'fixtures', filename), 'utf-8');
    document.documentElement.innerHTML = html;
  };

  describe('Amazon-sold products', () => {
    it('should detect Amazon.com as first-party seller', () => {
      loadFixture('amazon-com-free-returns.html');

      const result = detectThirdPartySeller();

      expect(result.isThirdParty).toBe(false);
      expect(result.sellerLink).toBeNull();
      expect(result.sellerId).toBeNull();
    });

    it('should detect Amazon.de as first-party seller', () => {
      loadFixture('amazon-de-free-returns.html');

      const result = detectThirdPartySeller();

      expect(result.isThirdParty).toBe(false);
      expect(result.sellerLink).toBeNull();
      expect(result.sellerId).toBeNull();
    });
  });

  describe('Third-party sellers', () => {
    it('should detect third-party seller', () => {
      loadFixture('amazon-com-paid-returns.html');

      const result = detectThirdPartySeller();

      expect(result.isThirdParty).toBe(true);
      expect(result.sellerName).toBe('ThirdPartyStore');
    });

    it('should extract seller link', () => {
      loadFixture('amazon-com-paid-returns.html');

      const result = detectThirdPartySeller();

      expect(result.sellerLink).toContain('/shops/A1234567890');
    });

    it('should extract seller ID from link', () => {
      loadFixture('amazon-com-paid-returns.html');

      const result = detectThirdPartySeller();

      expect(result.sellerId).toBe('A1234567890');
    });

    it('should detect third-party with free returns', () => {
      loadFixture('amazon-com-third-party-free.html');

      const result = detectThirdPartySeller();

      expect(result.isThirdParty).toBe(true);
      expect(result.sellerName).toBe('BestElectronicsStore');
      expect(result.sellerId).toBe('A1BESTSELLER123');
    });
  });
});
