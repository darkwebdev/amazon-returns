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
    freeReturns: /kostenlose r체cksendung|kostenloser r체ckversand|ohne kosten/i,
    returnWindow: /(?:r체ckgabe\s+innerhalb\s+von\s+|innerhalb\s+von\s+)?(\d+)[\s-]?(tag|tage|monat|monate)(?:\s+r체ckgaberecht)?/i,
    buyerPays: /k채ufer zahlt|kunde zahlt|r체cksendekosten|r체cksendegeb체hr/i,
    defective: /defekt|besch채digt|fehlerhaft|nicht wie beschrieben|falscher artikel/i,
    nonReturnable: /nicht r체ckgabef채hig|keine r체ckgabe m철glich|kann nicht zur체ckgegeben werden|alle verk채ufe sind endg체ltig/i,
    sectionHeadings: ['r체ckgabe & erstattung', 'r체ckgaberecht', 'r체ckgabebedingungen'],
  },
};

export const UI_TEXT = {
  en: {
    heading: 'Return Cost Information',
    defectiveItems: 'Defective/Damaged Items',
    regularReturns: 'Regular Returns',
    freePattern: (days: number) => `Free returns within ${days}쟡ays`,
    nonFreePattern: (cost: string, days: number) => `Non-free returns (${cost} shipping cost) within ${days}쟡ays`,
    basedOnPolicy: 'Based on Amazon\'s return policy',
    basedOnSellerPolicy: (sellerName: string) => `Based on ${sellerName}'s return policy`,
    estimatedThirdPartyCost: (sellerName: string) => `Estimated costs for third-party seller "${sellerName}". Check seller's return policy for exact details.`,
  },
  de: {
    heading: 'R체cksendekosten-Informationen',
    defectiveItems: 'Defekte/Besch채digte Artikel',
    regularReturns: 'Regul채re R체cksendungen',
    freePattern: (days: number) => `Kostenlose R체cksendung innerhalb von ${days}쟕agen`,
    nonFreePattern: (cost: string, days: number) => `Kostenpflichtige R체cksendung (${cost} Versandkosten) innerhalb von ${days}쟕agen`,
    basedOnPolicy: 'Basierend auf Amazons R체ckgaberichtlinie',
    basedOnSellerPolicy: (sellerName: string) => `Basierend auf ${sellerName}s R체ckgaberichtlinie`,
    estimatedThirdPartyCost: (sellerName: string) => `Gesch채tzte Kosten f체r Dritth채ndler "${sellerName}". Pr체fen Sie die R체ckgaberichtlinie des Verk채ufers f체r genaue Details.`,
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
