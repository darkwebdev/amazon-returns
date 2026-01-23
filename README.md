# Amazon Returns Cost Information - Chrome Extension

A Chrome extension that displays return cost information on Amazon product pages for US (amazon.com) and Germany (amazon.de).

## Features

- Displays return costs for both defective/damaged items and regular returns
- Supports Amazon.com (US) and Amazon.de (Germany)
- Multi-language support (English & German)
- Detects third-party sellers and fetches their return policies
- Caches seller policies to reduce repeated fetches
- Clean, non-intrusive UI that matches Amazon's design

## Installation

### Development Installation

1. Install dependencies:
```bash
yarn install
```

2. Build the extension:
```bash
yarn build
```

3. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist/` folder from this project

### Development Mode (Watch)

To automatically rebuild on file changes:
```bash
yarn dev
```

After making changes, reload the extension in `chrome://extensions` and refresh the Amazon product page.

## Testing

### Unit Tests (Jest)
```bash
yarn test              # Run all tests
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage report
```

**50 tests covering:**
- Policy scraping (Amazon.com and Amazon.de)
- Seller detection
- Internationalization (i18n)
- Edge cases (restocking fees, non-returnable items, paid shipping)

### Extension Testing (Puppeteer)

#### Basic Test
```bash
yarn test:extension
```

**Automated integration test:**
- Launches Chrome with the extension loaded
- Navigates to a real Amazon.de product page
- Waits for the widget to appear
- Validates widget content
- Takes a screenshot (`/tmp/extension-test-screenshot.jpg`)
- Keeps browser open for 10 seconds for inspection

**Expected output:**
```
🎉 Extension test PASSED!
✓ Defective section: ✅
✓ Regular section: ✅
✓ Cost information: ✅
```

#### Dynamic URL Testing
```bash
# Test with default URLs
yarn test:dynamic

# Test any Amazon product page
yarn node test-dynamic.js "https://www.amazon.de/dp/PRODUCT_ID"

# Examples
yarn node test-dynamic.js "https://www.amazon.com/dp/B0D1XD1ZV3"
yarn node test-dynamic.js "https://www.amazon.de/dp/B0BNQ66ZN1"
```

**Features:**
- ✅ Test any Amazon product URL dynamically
- ✅ Multiple test cases in one run
- ✅ Validates widget content automatically
- ✅ Screenshots saved for each test
- ✅ Detailed console logs and extension logs
- ✅ Pass/fail summary report

**See `TEST_USAGE.md` for detailed testing guide.**

### Manual Testing

1. Visit Amazon product pages:
   - US: https://www.amazon.com/dp/[PRODUCT_ID]
   - Germany: https://www.amazon.de/dp/[PRODUCT_ID]

2. Look for the "Return Cost Information" widget near the buy box

3. Test cases to verify:
   - Products with "FREE Returns" badge (should show free for both)
   - Products without "FREE Returns" badge (should show €6.50-€13.00 for regular returns)
   - Products sold by third-party sellers
   - Different product categories
   - Both amazon.com and amazon.de domains

## Project Structure

```
src/
├── content/
│   ├── content.ts           # Main orchestrator
│   ├── policyScraper.ts     # Product page policy extraction
│   ├── sellerScraper.ts     # Third-party seller detection & scraping
│   ├── ui.ts                # Widget creation and injection
│   └── styles.css           # Widget styles
├── shared/
│   ├── types.ts             # TypeScript interfaces
│   ├── regionDetector.ts    # Amazon domain detection
│   ├── policyData.ts        # Static policy guidelines
│   └── i18n.ts              # Language patterns & UI text
└── manifest.json            # Chrome extension manifest
```

## How It Works

1. Detects Amazon region (amazon.com or amazon.de) and language
2. Checks if the seller is Amazon or a third-party seller
3. For third-party sellers: Fetches and parses their return policy from their seller details page
4. For Amazon-sold items: Scrapes return policy from product page
5. **Paid Shipping Detection (Amazon.de):**
   - Defective items: Always free per EU consumer law
   - Regular returns: Free only if "FREE Returns" badge is present
   - Without badge: Shows €6.50-€13.00 shipping cost (customer pays)
6. Falls back to default regional policies if scraping fails
7. Displays the information in a clean, color-coded widget
8. Caches third-party seller policies for 7 days to improve performance

## Return Policy Logic (Amazon.de)

### Defective/Damaged Items
- ✅ Always free return shipping (EU consumer law requirement)
- ✅ 14-day return window

### Regular Returns
- ✅ **With "FREE Returns" badge**: Free shipping, 14 days
- ⚠️  **Without "FREE Returns" badge**: €6.50-€13.00 shipping cost, 14 days
- ℹ️  The extension detects the absence of the badge and displays the cost

### Widget Example (Paid Shipping)

```
┌──────────────────────────────────┐
│ Rücksendekosten-Informationen    │
├──────────────────────────────────┤
│ Defekte/Beschädigte Artikel:     │
│ Kostenlose Rücksendung innerhalb │ ← Green
│ von 14 Tagen                     │
│                                  │
│ Reguläre Rücksendungen:          │
│ Nicht kostenlose Rücksendung     │ ← Red/Orange
│ (€6.50-€13.00 Kosten)            │
│ innerhalb von 14 Tagen           │
│                                  │
│ ⚬ Basierend auf Amazons          │
│   Rückgaberichtlinie             │
└──────────────────────────────────┘
```

## Technologies

- TypeScript
- Webpack 5
- Chrome Extension Manifest V3
- Vanilla JavaScript (no frameworks)

## Supported Regions

- United States (amazon.com) - English
- Germany (amazon.de) - German

## Development Documentation

See `.claude/CHROME_EXTENSION_TESTING.md` for comprehensive testing guide.

## License

MIT
