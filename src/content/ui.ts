import { ReturnPolicyData } from '../shared/types';
import { UI_TEXT, formatReturnText } from '../shared/i18n';

export function createReturnInfoWidget(
  policyData: ReturnPolicyData,
  language: 'en' | 'de'
): HTMLElement {
  const text = UI_TEXT[language];

  const widget = document.createElement('div');
  widget.className = 'amazon-returns-ext__widget';
  widget.setAttribute('role', 'region');
  widget.setAttribute('aria-label', text.heading);

  const heading = document.createElement('div');
  heading.className = 'amazon-returns-ext__heading';
  heading.textContent = text.heading;

  const content = document.createElement('div');
  content.className = 'amazon-returns-ext__content';

  const defectiveSection = document.createElement('div');
  defectiveSection.className = 'amazon-returns-ext__section';

  const defectiveLabel = document.createElement('div');
  defectiveLabel.className = 'amazon-returns-ext__label';
  defectiveLabel.textContent = text.defectiveItems + ':';

  const defectiveText = document.createElement('div');
  defectiveText.className = `amazon-returns-ext__text ${
    policyData.defectivePolicy.isFree ? 'amazon-returns-ext__text--free' : 'amazon-returns-ext__text--paid'
  }`;
  defectiveText.textContent = formatReturnText(
    policyData.defectivePolicy.isFree,
    policyData.defectivePolicy.cost,
    policyData.defectivePolicy.window,
    language
  );

  defectiveSection.appendChild(defectiveLabel);
  defectiveSection.appendChild(defectiveText);

  const regularSection = document.createElement('div');
  regularSection.className = 'amazon-returns-ext__section';

  const regularLabel = document.createElement('div');
  regularLabel.className = 'amazon-returns-ext__label';
  regularLabel.textContent = text.regularReturns + ':';

  const regularText = document.createElement('div');
  regularText.className = `amazon-returns-ext__text ${
    policyData.regularReturnPolicy.isFree ? 'amazon-returns-ext__text--free' : 'amazon-returns-ext__text--paid'
  }`;
  regularText.textContent = formatReturnText(
    policyData.regularReturnPolicy.isFree,
    policyData.regularReturnPolicy.cost,
    policyData.regularReturnPolicy.window,
    language
  );

  regularSection.appendChild(regularLabel);
  regularSection.appendChild(regularText);

  const footer = document.createElement('div');
  footer.className = 'amazon-returns-ext__footer';
  footer.textContent = '⚬ ' + (
    policyData.sellerName
      ? text.basedOnSellerPolicy(policyData.sellerName)
      : text.basedOnPolicy
  );

  content.appendChild(defectiveSection);
  content.appendChild(regularSection);

  widget.appendChild(heading);
  widget.appendChild(content);
  widget.appendChild(footer);

  return widget;
}

export function findInjectionPoint(): HTMLElement | null {
  const selectors = [
    '#addToCart_feature_div',
    '#buybox',
    '#buy-now-button',
    '#productTitle',
    '#ppd',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element as HTMLElement;
    }
  }

  return null;
}

export function injectWidget(widget: HTMLElement): void {
  const injectionPoint = findInjectionPoint();

  if (injectionPoint) {
    injectionPoint.insertAdjacentElement('afterend', widget);
  } else {
    const productDetails = document.querySelector('#centerCol, #ppd');
    if (productDetails) {
      productDetails.insertBefore(widget, productDetails.firstChild);
    }
  }
}
