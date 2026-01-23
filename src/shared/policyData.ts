import { ReturnPolicyData } from './types';

export const DEFAULT_POLICIES: Record<string, ReturnPolicyData> = {
  'amazon.com': {
    isFreeReturn: true,
    returnCost: null,
    returnWindow: 30,
    defectivePolicy: {
      isFree: true,
      cost: null,
      window: 30,
    },
    regularReturnPolicy: {
      isFree: true,
      cost: null,
      window: 30,
    },
    isThirdPartySeller: false,
  },
  'amazon.de': {
    isFreeReturn: true,
    returnCost: null,
    returnWindow: 14,
    defectivePolicy: {
      isFree: true,
      cost: null,
      window: 14,
    },
    regularReturnPolicy: {
      isFree: true,
      cost: null,
      window: 14,
    },
    isThirdPartySeller: false,
  },
};

export function getDefaultPolicyForRegion(domain: string): ReturnPolicyData {
  return DEFAULT_POLICIES[domain] || DEFAULT_POLICIES['amazon.com'];
}
