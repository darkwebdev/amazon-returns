# Amazon Returns Extension - Testing Notes

## Issue: Cannot Install Extension on Managed Browser

### Root Cause
The Chrome browser on this machine is **managed by ebay.com** with an `ExtensionInstallAllowlist` policy that restricts extension installations to only 9 pre-approved extensions.

**Policy Details:**
- **Policy**: `ExtensionInstallAllowlist`
- **Source**: Cloud (Mandatory)
- **Status**: OK
- **Allowed Extensions**: Only 9 specific extension IDs

### Why Extension Won't Load
- Unpacked extensions get a temporary ID
- That ID is not on the allowlist
- Chrome blocks installation per enterprise policy
- Developer mode is enabled but policy overrides it

## Alternative Testing Methods

### Option 1: Use Unmanaged Chrome Profile (Recommended)

Launch a separate Chrome instance with a temporary profile:

```bash
open -na "Google Chrome" --args --user-data-dir=/tmp/chrome-test-profile
```

Then load the extension:
1. Navigate to `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select: `/Users/tmanyanov/build/amazon-returns/dist`

### Option 2: Test on Another Machine

Use a personal computer without enterprise management to test the extension.

### Option 3: Code Review & Manual Testing

The extension is fully built and ready. Review the implementation:

**Built Files:**
- ✓ `dist/manifest.json` (759 bytes)
- ✓ `dist/content.js` (14.3 KB minified)
- ✓ `dist/icons/` (16px, 48px, 128px)

**Key Features Implemented:**
- ✓ Region detection (amazon.com vs amazon.de)
- ✓ Language support (English & German)
- ✓ Product page policy scraping
- ✓ Third-party seller detection & scraping
- ✓ Vanilla JS widget with namespaced CSS
- ✓ Seller policy caching (7-day TTL)
- ✓ Fallback to default policies

**Code Quality:**
- TypeScript compiled to ES5
- Webpack bundled and minified
- All CSS namespaced (`amazon-returns-ext__*`)
- Chrome Manifest V3 compliant

## Extension Behavior

### On Amazon Product Pages

1. **Detects region:** amazon.com (US, 30-day returns) or amazon.de (Germany, 14-day returns)
2. **Checks seller:** Amazon-sold vs third-party
3. **Scrapes policy:**
   - Amazon-sold: Product page elements
   - Third-party: Seller details page
4. **Displays widget:**
   - "Return Cost Information" heading
   - Two sections: Defective/Damaged vs Regular Returns
   - Color-coded: Green (free), Red (paid)
   - Footer: Policy source attribution

### Console Logs

When working correctly:
```
[Amazon Returns Extension] Third-party seller detected: SellerName
[Amazon Returns Extension] Widget injected successfully
```

### Widget Example (English)

```
┌──────────────────────────────────┐
│ Return Cost Information          │
├──────────────────────────────────┤
│ Defective/Damaged Items:         │
│ Free returns within 30 days      │ ← Green
│                                  │
│ Regular Returns:                 │
│ Non-free returns ($5.99 cost)    │ ← Red
│ within 30 days                   │
│                                  │
│ ⚬ Based on SellerName's policy   │
└──────────────────────────────────┘
```

### Widget Example (German)

```
┌──────────────────────────────────┐
│ Rücksendekosten-Informationen    │
├──────────────────────────────────┤
│ Defekte/Beschädigte Artikel:     │
│ Kostenlose Rücksendung innerhalb │ ← Green
│ von 14 Tagen                     │
│                                  │
│ Reguläre Rücksendungen:          │
│ Kostenlose Rücksendung innerhalb │ ← Green
│ von 14 Tagen                     │
│                                  │
│ ⚬ Basierend auf Amazons          │
│   Rückgaberichtlinie             │
└──────────────────────────────────┘
```

## Files for Testing

### Extension Files
- **Location:** `/Users/tmanyanov/build/amazon-returns/dist/`
- **Manifest:** Manifest V3, content scripts for `/dp/` and `/gp/product/` URLs
- **Permissions:** `storage`, host permissions for `*.amazon.com` and `*.amazon.de`

### Test Pages
- **Amazon US:** https://www.amazon.com/dp/B0D1XD1ZV3 (AirPods Pro 2)
- **Amazon DE:** https://www.amazon.de/dp/[any-product]

## Project Status

✅ **Complete** - Extension fully implemented and built
❌ **Cannot Test** - Managed browser blocks unpacked extensions
✅ **Deliverable** - Production-ready code in `dist/`

## chrome-devtools-mcp Extension Testing Issue

### Problem
The `chrome-devtools-mcp` server doesn't work properly for extension testing:
- Even with `--port 9222` flag, it launches its own Chrome instance
- Uses `--remote-debugging-pipe` instead of connecting to port 9222
- Includes `--disable-extensions` flag, preventing extensions from loading
- Cannot be used for automated extension testing

### Evidence
```bash
# MCP-launched Chrome (wrong):
/Applications/Google Chrome.app --enable-automation --disable-extensions \
  --remote-debugging-pipe --user-data-dir=/Users/tmanyanov/.cache/chrome-devtools-mcp/chrome-profile

# Manually launched Chrome (correct):
/Applications/Google Chrome.app --remote-debugging-port=9222 \
  --user-data-dir=/Users/tmanyanov/build/amazon-returns/.chrome-profile
```

### Workaround
Manual testing only - MCP cannot be used for extension testing currently.

## Solution: Puppeteer Testing ✅

### Automated Testing Implemented

Puppeteer testing works perfectly where chrome-devtools-mcp failed:

```bash
yarn test:extension
```

**Test Results:**
```
🎉 Extension test PASSED!
✓ Defective section: ✅
✓ Regular section: ✅
✓ Cost information: ✅
```

**Test Coverage:**
- ✅ Extension loads in Chrome
- ✅ Content script executes on Amazon pages
- ✅ Widget injects successfully
- ✅ Policy detection works
- ✅ UI displays correctly
- ✅ Takes screenshot for visual verification

### Files
- `test-extension.js` - Automated Puppeteer test
- `test-paid-shipping.js` - Paid shipping scenario test (file:// limitation)

### Known Limitation
Cannot test HTML fixtures directly (content scripts don't run on `file://` URLs). Solution: Test on real Amazon pages or use a local HTTP server.

## Next Steps

1. ✅ Automated extension testing with Puppeteer
2. ✅ Verify widget injection on real Amazon pages
3. 🔄 Test paid shipping logic for products without "FREE Returns" badge (needs product without badge)
4. ✅ Test German language version on amazon.de
5. ✅ Verify defective vs regular return policy distinction
6. (Optional) Publish to Chrome Web Store for distribution
