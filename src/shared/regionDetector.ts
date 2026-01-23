import { AmazonRegion } from './types';

export function detectAmazonRegion(): AmazonRegion | null {
  const hostname = window.location.hostname;

  if (hostname.includes('amazon.com')) {
    return {
      domain: 'amazon.com',
      currency: 'USD',
      language: 'en',
      defaultReturnWindow: 30,
    };
  }

  if (hostname.includes('amazon.de')) {
    return {
      domain: 'amazon.de',
      currency: 'EUR',
      language: 'de',
      defaultReturnWindow: 14,
    };
  }

  return null;
}

export function detectLanguage(region: AmazonRegion): 'en' | 'de' {
  const htmlLang = document.documentElement.lang;

  if (htmlLang.startsWith('de')) {
    return 'de';
  }

  if (htmlLang.startsWith('en')) {
    return 'en';
  }

  const germanPatterns = /In den Einkaufswagen|Jetzt kaufen|Zum Warenkorb/i;
  if (germanPatterns.test(document.body.textContent || '')) {
    return 'de';
  }

  return region.language;
}
