import { ReturnPolicyData } from '../shared/types';
import { UI_TEXT, formatReturnText } from '../shared/i18n';

export function createLoadingWidget(language: 'en' | 'de'): HTMLElement {
  const text = UI_TEXT[language];

  const widget = document.createElement('div');
  widget.className = 'amazon-returns-ext__widget';
  widget.setAttribute('role', 'region');
  widget.setAttribute('aria-label', text.heading);
  widget.id = 'amazon-returns-ext-widget';

  const heading = document.createElement('div');
  heading.className = 'amazon-returns-ext__heading';
  heading.textContent = text.heading;

  const content = document.createElement('div');
  content.className = 'amazon-returns-ext__content amazon-returns-ext__loading';
  content.textContent = language === 'en' ? 'Loading return policy information...' : 'Lade Rückgabeinformationen...';

  widget.appendChild(heading);
  widget.appendChild(content);

  return widget;
}

export function createErrorWidget(language: 'en' | 'de'): HTMLElement {
  const text = UI_TEXT[language];

  const widget = document.createElement('div');
  widget.className = 'amazon-returns-ext__widget';
  widget.setAttribute('role', 'region');
  widget.setAttribute('aria-label', text.heading);
  widget.id = 'amazon-returns-ext-widget';

  const heading = document.createElement('div');
  heading.className = 'amazon-returns-ext__heading';
  heading.textContent = text.heading;

  const content = document.createElement('div');
  content.className = 'amazon-returns-ext__content amazon-returns-ext__error';
  content.textContent = language === 'en'
    ? 'Unable to determine return policy for this product. Please check the product details or seller information.'
    : 'Rückgabebedingungen für dieses Produkt konnten nicht ermittelt werden. Bitte prüfen Sie die Produktdetails oder Verkäuferinformationen.';

  widget.appendChild(heading);
  widget.appendChild(content);

  return widget;
}

export function createReturnInfoWidget(
  policyData: ReturnPolicyData,
  language: 'en' | 'de'
): HTMLElement {
  const text = UI_TEXT[language];

  const widget = document.createElement('div');
  widget.className = 'amazon-returns-ext__widget';
  widget.setAttribute('role', 'region');
  widget.setAttribute('aria-label', text.heading);
  widget.id = 'amazon-returns-ext-widget';

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

  // Show different footer based on whether we have verified seller policy or estimated costs
  if (policyData.isThirdPartySeller && policyData.sellerName) {
    // Check if this is a default/estimated policy (no specific seller data was scraped)
    const isEstimated = !policyData.returnCost ||
                        policyData.returnCost.includes('-') ||
                        policyData.returnCost.includes('€6.50') ||
                        policyData.returnCost.includes('$5.00');

    footer.innerHTML = '⚬ ';
    const textNode = document.createTextNode(isEstimated
      ? (language === 'en'
        ? 'Estimated costs for third-party seller "'
        : 'Geschätzte Kosten für Dritthändler "')
      : (language === 'en'
        ? 'Based on '
        : 'Basierend auf '));

    footer.appendChild(textNode);

    // Use seller page link (clean URL) for seller name, not the return policy URL
    if (policyData.sellerPageLink) {
      const sellerLink = document.createElement('a');
      sellerLink.href = policyData.sellerPageLink;
      sellerLink.textContent = policyData.sellerName;
      sellerLink.target = '_blank';
      sellerLink.rel = 'noopener noreferrer';
      sellerLink.style.color = '#007185';
      sellerLink.style.textDecoration = 'none';
      sellerLink.addEventListener('mouseover', () => {
        sellerLink.style.textDecoration = 'underline';
        sellerLink.style.color = '#C7511F';
      });
      sellerLink.addEventListener('mouseout', () => {
        sellerLink.style.textDecoration = 'none';
        sellerLink.style.color = '#007185';
      });
      footer.appendChild(sellerLink);
    } else {
      footer.appendChild(document.createTextNode(policyData.sellerName));
    }

    if (isEstimated) {
      footer.appendChild(document.createTextNode(language === 'en'
        ? '". Check '
        : '". Prüfen Sie die '));

      if (policyData.sellerLink) {
        const policyLink = document.createElement('a');
        policyLink.href = policyData.sellerLink;
        policyLink.textContent = language === 'en' ? 'seller\'s return policy' : 'Rückgaberichtlinie des Verkäufers';
        policyLink.target = '_blank';
        policyLink.rel = 'noopener noreferrer';
        policyLink.style.color = '#007185';
        policyLink.style.textDecoration = 'none';
        policyLink.addEventListener('mouseover', () => {
          policyLink.style.textDecoration = 'underline';
          policyLink.style.color = '#C7511F';
        });
        policyLink.addEventListener('mouseout', () => {
          policyLink.style.textDecoration = 'none';
          policyLink.style.color = '#007185';
        });
        footer.appendChild(policyLink);
      } else {
        footer.appendChild(document.createTextNode(language === 'en'
          ? 'seller\'s return policy'
          : 'Rückgaberichtlinie des Verkäufers'));
      }

      footer.appendChild(document.createTextNode(language === 'en'
        ? ' for exact details.'
        : ' für genaue Details.'));
    } else {
      footer.appendChild(document.createTextNode(language === 'en'
        ? '\'s return policy'
        : 's Rückgaberichtlinie'));
    }
  } else if (policyData.sellerName) {
    footer.textContent = '⚬ ' + text.basedOnSellerPolicy(policyData.sellerName);
  } else {
    footer.textContent = '⚬ ' + text.basedOnPolicy;
  }

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

export function updateWidget(widget: HTMLElement): void {
  const existingWidget = document.getElementById('amazon-returns-ext-widget');
  if (existingWidget && existingWidget.parentNode) {
    existingWidget.parentNode.replaceChild(widget, existingWidget);
  }
}
