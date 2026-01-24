# Chrome Extension Testing Guide

## Overview

This project uses **Puppeteer** for automated Chrome extension testing. The chrome-devtools-mcp does NOT work for extension testing because it launches Chrome with `--disable-extensions` flag.

## Why Puppeteer?

❌ **chrome-devtools-mcp** - Does NOT work for extensions:
- Launches Chrome with `--disable-extensions`
- Cannot load extensions even with `--port` flag
- Uses `--remote-debugging-pipe` instead of connecting to external port

✅ **Puppeteer** - Works perfectly for extensions:
- `--disable-extensions-except` and `--load-extension` flags work
- Full control over Chrome launch options
- Extensions load and run properly
- Reliable for automated testing

## Test Structure

### 1. Unit Tests (Jest)
```bash
yarn test              # 50 tests covering core logic
yarn test:coverage     # With coverage report
```

**What it tests:**
- Policy scraping logic
- Seller detection
- i18n patterns
- Edge cases (non-returnable, restocking fees, paid shipping)

### 2. Extension Integration Test
```bash
yarn test:extension
```

**What it does:**
- Launches Chrome with extension loaded
- Navigates to Amazon.de product page
- Waits for widget injection
- Validates widget content
- Takes screenshot
- Shows browser for 10 seconds

**Test file:** `test-extension.js`

### 3. Dynamic URL Testing
```bash
# Test with predefined URLs
yarn test:dynamic

# Test any Amazon product
yarn node test-dynamic.js "https://www.amazon.de/dp/PRODUCT_ID"
```

**What it does:**
- Runs multiple test cases
- Tests any Amazon URL dynamically
- Validates widget behavior
- Takes screenshots for each test
- Generates pass/fail report

**Test file:** `test-dynamic.js`

## Test Files

```
test-extension.js      # Single URL integration test
test-dynamic.js        # Multi-URL dynamic testing
test-paid-shipping.js  # Paid shipping scenario (experimental)
```

## Adding New Test Cases

Edit `test-dynamic.js` and add to `TEST_CASES`:

```javascript
const TEST_CASES = [
  {
    name: 'Amazon.de - Product WITHOUT Free Returns',
    url: 'https://www.amazon.de/dp/B0XXXXXXXXX',
    region: 'de',
    expectedBehavior: {
      hasWidget: true,
      defectiveFree: true,      // Defective items always free
      regularFree: false,        // Regular returns paid
      hasCost: true,             // Should show €6.50-€13.00
      language: 'de'
    }
  },
];
```

## Common Test Scenarios

### 1. FREE Returns Badge Present
```bash
yarn node test-dynamic.js "https://www.amazon.de/dp/B0BNQ66ZN1"
```
**Expected:** Both defective and regular returns show "Free"

### 2. NO FREE Returns Badge (Paid Shipping)
Find products without badge and test:
```bash
yarn node test-dynamic.js "https://www.amazon.de/dp/XXXXXXXXXX"
```
**Expected:**
- Defective: Free
- Regular: €6.50-€13.00 cost

### 3. Third-Party Seller
```bash
yarn node test-dynamic.js "https://www.amazon.de/dp/XXXXXXXXXX"
```
**Expected:** Widget shows seller-specific policy

## Debugging Failed Tests

### Widget Not Found
1. Check console output for `[Amazon Returns Extension]` logs
2. Look at debug screenshot in `/tmp/debug-*.jpg`
3. Verify URL matches `manifest.json` content_scripts patterns
4. Check if page has return policy information

### Extension Not Loading
1. Verify `dist/` folder exists and has built files
2. Run `yarn build` to rebuild extension
3. Check Puppeteer launch args include `--load-extension`
4. Look for browser console errors during test

### Wrong Content Displayed
1. Check extension logs in test output
2. Verify HTML structure matches scraper selectors
3. Update `policyScraper.ts` if Amazon changed their HTML
4. Add new test fixtures for edge cases

## Screenshots

All tests save screenshots to `/tmp/`:
- `extension-test-screenshot.jpg` - Basic test
- `test-[name].jpg` - Dynamic tests
- `debug-[timestamp].jpg` - Failures

## CI/CD Integration

For automated CI/CD pipelines:

```javascript
// Modify launch options in test files
const browser = await puppeteer.launch({
  headless: true,  // Run without UI
  args: [
    '--disable-extensions-except=' + EXTENSION_PATH,
    '--load-extension=' + EXTENSION_PATH,
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',  // Prevent memory issues
  ],
});

// Remove "stay open" delays
// Don't wait to inspect browser
```

## Best Practices

1. **Always rebuild before testing:**
   ```bash
   yarn build && yarn test:extension
   ```

2. **Test multiple scenarios:**
   - Products with/without FREE Returns badge
   - Different regions (amazon.com, amazon.de)
   - Third-party sellers
   - Edge cases (non-returnable, restocking fees)

3. **Keep test cases updated:**
   - Add new URLs when you find edge cases
   - Update expected behaviors when policy changes
   - Remove broken product URLs (products get delisted)

4. **Use descriptive test names:**
   - Include product type and expected behavior
   - Example: "Amazon.de - Electronics WITHOUT Free Returns Badge"

## Troubleshooting

### "Cannot find module 'puppeteer'"
```bash
yarn install  # Reinstall dependencies
```

### Extension doesn't load in test
```bash
yarn build    # Rebuild extension
ls dist/      # Verify built files exist
```

### Chrome crashes during test
```bash
# Add to launch args:
'--disable-dev-shm-usage'
'--disable-gpu'
```

### Tests pass locally but fail in CI
- Use headless mode in CI
- Add `--disable-dev-shm-usage` flag
- Increase timeouts for slower CI environments
- Ensure Chrome/Chromium is installed in CI image

## Resources

- **Puppeteer Docs:** https://pptr.dev/
- **Chrome Extension Manifest:** https://developer.chrome.com/docs/extensions/mv3/
- **Jest Docs:** https://jestjs.io/

## Summary

✅ Use Puppeteer for extension testing (NOT chrome-devtools-mcp)
✅ Three test levels: Unit (Jest), Integration (single URL), Dynamic (multiple URLs)
✅ Test any Amazon product with `yarn node test-dynamic.js "URL"`
✅ Add test cases to `test-dynamic.js` for regression testing
✅ Screenshots saved to `/tmp/` for debugging
