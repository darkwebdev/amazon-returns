import { RETURN_PATTERNS, UI_TEXT, formatReturnText } from '../src/shared/i18n';

describe('Internationalization', () => {
  describe('English Patterns', () => {
    const patterns = RETURN_PATTERNS.en;

    it('should match free returns phrases', () => {
      expect(patterns.freeReturns.test('FREE Returns')).toBe(true);
      expect(patterns.freeReturns.test('Free return available')).toBe(true);
      expect(patterns.freeReturns.test('No cost to return')).toBe(true);
      expect(patterns.freeReturns.test('At no charge for returns')).toBe(true);
    });

    it('should match buyer pays phrases', () => {
      expect(patterns.buyerPays.test('Buyer pays return shipping')).toBe(true);
      expect(patterns.buyerPays.test('Customer pays return fee')).toBe(true);
      expect(patterns.buyerPays.test('Return shipping cost applies')).toBe(true);
    });

    it('should extract return window', () => {
      const match30 = '30-day returns'.match(patterns.returnWindow);
      expect(match30).not.toBeNull();
      expect(match30![1]).toBe('30');

      const match60 = 'Free 60 day returns'.match(patterns.returnWindow);
      expect(match60).not.toBeNull();
      expect(match60![1]).toBe('60');
    });

    it('should not match non-return text', () => {
      expect(patterns.freeReturns.test('Product description')).toBe(false);
      expect(patterns.buyerPays.test('Fast delivery')).toBe(false);
    });
  });

  describe('German Patterns', () => {
    const patterns = RETURN_PATTERNS.de;

    it('should match kostenlose rücksendung', () => {
      expect(patterns.freeReturns.test('KOSTENLOSE Rücksendung')).toBe(true);
      expect(patterns.freeReturns.test('Kostenloser Rückversand')).toBe(true);
      expect(patterns.freeReturns.test('Ohne Kosten zurücksenden')).toBe(true);
    });

    it('should match käufer zahlt', () => {
      expect(patterns.buyerPays.test('Käufer zahlt Rücksendekosten')).toBe(true);
      expect(patterns.buyerPays.test('Kunde zahlt Versandkosten')).toBe(true);
    });

    it('should extract return window in German', () => {
      const match14 = '14 Tage Rückgaberecht'.match(patterns.returnWindow);
      expect(match14).not.toBeNull();
      expect(match14![1]).toBe('14');

      const match30 = 'Rückgabe innerhalb von 30 Tagen'.match(patterns.returnWindow);
      expect(match30).not.toBeNull();
      expect(match30![1]).toBe('30');
    });
  });

  describe('UI Text Formatting', () => {
    it('should format free returns in English', () => {
      const text = formatReturnText(true, null, 30, 'en');
      expect(text).toBe('Free returns within 30 days');
    });

    it('should format paid returns in English', () => {
      const text = formatReturnText(false, '$15.99', 30, 'en');
      expect(text).toBe('Non-free returns ($15.99 cost) within 30 days');
    });

    it('should format free returns in German', () => {
      const text = formatReturnText(true, null, 14, 'de');
      expect(text).toBe('Kostenlose Rücksendung innerhalb von 14 Tagen');
    });

    it('should format paid returns in German', () => {
      const text = formatReturnText(false, '€12.50', 14, 'de');
      expect(text).toBe('Kostenpflichtige Rücksendung (€12.50 Kosten) innerhalb von 14 Tagen');
    });

    it('should handle missing cost with placeholder', () => {
      const text = formatReturnText(false, null, 30, 'en');
      expect(text).toBe('Non-free returns (? cost) within 30 days');
    });
  });

  describe('UI Text Structure', () => {
    it('should have consistent structure between languages', () => {
      expect(UI_TEXT.en).toHaveProperty('heading');
      expect(UI_TEXT.en).toHaveProperty('defectiveItems');
      expect(UI_TEXT.en).toHaveProperty('regularReturns');
      expect(UI_TEXT.en).toHaveProperty('freePattern');
      expect(UI_TEXT.en).toHaveProperty('nonFreePattern');

      expect(UI_TEXT.de).toHaveProperty('heading');
      expect(UI_TEXT.de).toHaveProperty('defectiveItems');
      expect(UI_TEXT.de).toHaveProperty('regularReturns');
      expect(UI_TEXT.de).toHaveProperty('freePattern');
      expect(UI_TEXT.de).toHaveProperty('nonFreePattern');
    });
  });
});
