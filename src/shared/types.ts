export interface AmazonRegion {
  domain: string;
  currency: string;
  language: 'en' | 'de';
  defaultReturnWindow: number;
}

export interface ReturnPolicyData {
  isFreeReturn: boolean;
  returnCost: string | null;
  returnWindow: number;
  defectivePolicy: {
    isFree: boolean;
    cost: string | null;
    window: number;
  };
  regularReturnPolicy: {
    isFree: boolean;
    cost: string | null;
    window: number;
  };
  sellerName?: string;
  isThirdPartySeller: boolean;
}

export interface SellerInfo {
  isThirdParty: boolean;
  sellerLink: string | null;
  sellerId: string | null;
  sellerName: string | null;
}
