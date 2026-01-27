import { ReturnPolicyData } from '../shared/types';
import { UI_TEXT, formatReturnText, formatReturnHTML } from '../shared/i18n';

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
  defectiveText.innerHTML = formatReturnHTML(
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
  regularText.innerHTML = formatReturnHTML(
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

function attachBadgeEventListeners(container: HTMLElement): void {
  const badge = container.querySelector('#creturns-policy-anchor-text') as HTMLElement;
  const popover = container.querySelector('#a-popover-cReturnsPolicyPopover') as HTMLElement;

  if (!badge || !popover) return;

  // Toggle functionality
  badge.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = badge.getAttribute('aria-expanded') === 'true';
    badge.setAttribute('aria-expanded', (!isExpanded).toString());

    if (!isExpanded) {
      popover.style.display = 'block';
      popover.className = 'a-popover-preload a-popover a-popover-modal a-declarative';
    } else {
      popover.style.display = 'none';
      popover.className = 'a-popover-preload';
    }
  });

  // Close popover when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      badge.setAttribute('aria-expanded', 'false');
      popover.style.display = 'none';
      popover.className = 'a-popover-preload';
    }
  });
}

export function createAmazonStyleBadge(
  policyData: ReturnPolicyData,
  language: 'en' | 'de'
): HTMLElement {
  const text = UI_TEXT[language];

  // Create exact Amazon structure with proper container
  const outerContainer = document.createElement('span');
  outerContainer.id = 'amazon-returns-ext-container';
  outerContainer.style.position = 'relative';
  outerContainer.style.display = 'inline-block';

  const container = document.createElement('span');
  container.id = 'creturns-return-policy-message';
  container.className = 'a-inline-block';

  // Popover wrapper
  const popoverWrapper = document.createElement('span');
  popoverWrapper.className = 'a-declarative';

  // Inner widget span
  const widgetSpan = document.createElement('span');
  widgetSpan.className = 'celwidget';

  // Create the link (exactly like Amazon)
  const badge = document.createElement('a');
  badge.id = 'creturns-policy-anchor-text';
  badge.href = 'javascript:void(0)';
  badge.setAttribute('role', 'button');
  badge.className = 'a-popover-trigger a-declarative a-inline-block';
  badge.setAttribute('aria-expanded', 'false');

  // Text content
  const badgeText = document.createTextNode(language === 'en' ? 'Returns' : 'Rücksendung');
  badge.appendChild(badgeText);
  badge.appendChild(document.createTextNode(' '));

  // Icon (Amazon's popover icon)
  const icon = document.createElement('i');
  icon.className = 'a-icon a-icon-popover';

  badge.appendChild(icon);

  // Assemble structure
  widgetSpan.appendChild(badge);
  popoverWrapper.appendChild(widgetSpan);
  container.appendChild(popoverWrapper);
  outerContainer.appendChild(container);

  // Create the popover (Amazon's structure)
  const popover = document.createElement('div');
  popover.className = 'a-popover-preload';
  popover.id = 'a-popover-cReturnsPolicyPopover';
  popover.style.display = 'none';

  const popoverInner = document.createElement('div');
  popoverInner.className = 'celwidget';
  popoverInner.setAttribute('role', 'dialog');

  // Header
  const header = document.createElement('h5');
  header.id = 'creturns-policy-header';
  header.textContent = language === 'en' ? 'Return costs for this item' : 'Rücksendekosten für diesen Artikel';

  // Main content
  const mainContent = document.createElement('p');
  mainContent.id = 'creturns-policy-main-content';
  mainContent.className = 'a-spacing-none a-spacing-top-small';

  // Build content text
  const defectiveText = formatReturnText(
    policyData.defectivePolicy.isFree,
    policyData.defectivePolicy.cost,
    policyData.defectivePolicy.window,
    language
  );
  const regularText = formatReturnText(
    policyData.regularReturnPolicy.isFree,
    policyData.regularReturnPolicy.cost,
    policyData.regularReturnPolicy.window,
    language
  );

  mainContent.innerHTML = `<strong>${text.defectiveItems}:</strong> ${defectiveText}<br><br><strong>${text.regularReturns}:</strong> ${regularText}`;

  popoverInner.appendChild(header);
  popoverInner.appendChild(mainContent);
  popover.appendChild(popoverInner);
  outerContainer.appendChild(popover);

  // Attach event listeners
  attachBadgeEventListeners(outerContainer);

  return outerContainer;
}

export function findDeliveryMessageElement(): HTMLElement | null {
  // Find the specific delivery message element (not the container)
  // Look for the span/div that contains "FREE delivery" or delivery cost
  const deliverySelectors = [
    '[data-csa-c-content-id*="DEXUnifiedCXPDM"]',  // The actual delivery message span
    '#deliveryMessageMirId span',                   // Delivery message inside the container
  ];

  for (const selector of deliverySelectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent?.includes('delivery')) {
      return element.parentElement as HTMLElement;  // Return parent to insert after
    }
  }

  // Fallback: find the delivery block container
  const blockSelectors = [
    '#mir-layout-DELIVERY_BLOCK',
    '#deliveryMessageMirId',
  ];

  for (const selector of blockSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Find the first child that contains delivery text
      const children = element.querySelectorAll('*');
      for (const child of Array.from(children)) {
        if (child.textContent?.includes('delivery') && child.textContent.length < 200) {
          return child.parentElement as HTMLElement;
        }
      }
      return element as HTMLElement;
    }
  }

  return null;
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

export function injectBadge(badge: HTMLElement): void {
  // Inject in MULTIPLE locations - Amazon shows returns info in different places
  const injectionPoints = [
    { selector: '#deliveryBlockContainer', position: 'beforebegin' as const },
    { selector: '#vatMessage_feature_div', position: 'beforebegin' as const },
  ];

  let injected = false;

  for (const point of injectionPoints) {
    const element = document.querySelector(point.selector);
    if (element) {
      // Clone the badge for each location
      const badgeClone = injected ? badge.cloneNode(true) as HTMLElement : badge;
      element.insertAdjacentElement(point.position, badgeClone);

      // Re-attach event listeners for cloned badges
      if (injected) {
        attachBadgeEventListeners(badgeClone);
      }

      injected = true;
    }
  }

  // If we didn't inject anywhere, try fallback locations
  if (!injected) {
    const deliveryElement = findDeliveryMessageElement();
    if (deliveryElement) {
      deliveryElement.insertAdjacentElement('beforebegin', badge);
    } else {
      const injectionPoint = findInjectionPoint();
      if (injectionPoint) {
        injectionPoint.insertAdjacentElement('afterend', badge);
      }
    }
  }
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

export function updateBadge(badge: HTMLElement): void {
  const existingBadge = document.getElementById('amazon-returns-ext-badge');
  if (existingBadge && existingBadge.parentNode) {
    existingBadge.parentNode.replaceChild(badge, existingBadge);
  }
}
