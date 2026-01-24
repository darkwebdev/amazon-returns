export const RETURN_PATTERNS = {
  en: {
    freeReturns: /free returns?|no cost|at no charge|complimentary return/i,
    returnWindow: /(\d+)[\s-]?(day|month)s?\s+returns?/i,
    buyerPays: /buyer pays?|customer pays?|return shipping (fee|cost)|restocking fee/i,
    defective: /defective|damaged|faulty|not as described|wrong item/i,
    nonReturnable: /non-returnable|not eligible for return|cannot be returned|all sales are final|final sale/i,
    sectionHeadings: ['returns & refunds', 'return policy', 'returns policy'],
  },
  de: {
    freeReturns: /kostenlose rücksendung|kostenloser rückversand|ohne kosten/i,
    returnWindow: /(?:rückgabe\s+innerhalb\s+von\s+|innerhalb\s+von\s+)?(\d+)[\s-]?(tag|tage|monat|monate)(?:\s+rückgaberecht)?/i,
    buyerPays: /käufer zahlt|kunde zahlt|rücksendekosten|rücksendegebühr/i,
    defective: /defekt|beschädigt|fehlerhaft|nicht wie beschrieben|falscher artikel/i,
    nonReturnable: /nicht rückgabefähig|keine rückgabe möglich|kann nicht zurückgegeben werden|alle verkäufe sind endgültig/i,
    sectionHeadings: ['rückgabe & erstattung', 'rückgaberecht', 'rückgabebedingungen'],
  },
};

export const UI_TEXT = {
  en: {
    heading: 'Return Cost Information',
    defectiveItems: 'Defective/Damaged Items',
    regularReturns: 'Regular Returns',
    freePattern: (days: number) => `Free returns within ${days}\u00A0days`,
    nonFreePattern: (cost: string, days: number) => `Non-free returns (${cost} shipping cost) within ${days}\u00A0days`,
    basedOnPolicy: 'Based on Amazon\'s return policy',
    basedOnSellerPolicy: (sellerName: string) => `Based on ${sellerName}'s return policy`,
    estimatedThirdPartyCost: (sellerName: string) => `Estimated costs for third-party seller "${sellerName}". Check seller's return policy for exact details.`,
  },
  de: {
    heading: 'Rücksendekosten-Informationen',
    defectiveItems: 'Defekte/Beschädigte Artikel',
    regularReturns: 'Reguläre Rücksendungen',
    freePattern: (days: number) => `Kostenlose Rücksendung innerhalb von ${days}\u00A0Tagen`,
    nonFreePattern: (cost: string, days: number) => `Kostenpflichtige Rücksendung (${cost} Versandkosten) innerhalb von ${days}\u00A0Tagen`,
    basedOnPolicy: 'Basierend auf Amazons Rückgaberichtlinie',
    basedOnSellerPolicy: (sellerName: string) => `Basierend auf ${sellerName}s Rückgaberichtlinie`,
    estimatedThirdPartyCost: (sellerName: string) => `Geschätzte Kosten für Dritthändler "${sellerName}". Prüfen Sie die Rückgaberichtlinie des Verkäufers für genaue Details.`,
  },
};

export function formatReturnText(
  isFree: boolean,
  cost: string | null,
  window: number,
  language: 'en' | 'de'
): string {
  const text = UI_TEXT[language];
  if (isFree) {
    return text.freePattern(window);
  } else {
    return text.nonFreePattern(cost || '?', window);
  }
}
