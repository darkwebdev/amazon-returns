# Testing Guide

## Automated Tests

### 1. Unit Tests (Jest)
```bash
yarn test              # Run all 50 unit tests
yarn test:watch        # Watch mode
yarn test:coverage     # With coverage
```

### 2. Extension Test (Single URL)
```bash
yarn test:extension
```
Tests the extension on the default Amazon.de product page.

### 3. Dynamic Testing (Multiple URLs)
```bash
yarn test:dynamic
```
Runs the full test suite with all configured test cases.

### 4. Test Custom URL
```bash
yarn node test-dynamic.js "https://www.amazon.de/dp/PRODUCT_ID"
```

**Examples:**
```bash
# Test a specific Amazon.de product
yarn node test-dynamic.js "https://www.amazon.de/dp/B0BNQ66ZN1"

# Test an Amazon.com product
yarn node test-dynamic.js "https://www.amazon.com/dp/B0D1XD1ZV3"

# Test a third-party seller product
yarn node test-dynamic.js "https://www.amazon.de/dp/XXXXXXXXXX"
```

## Adding New Test Cases

Edit `test-dynamic.js` and add to the `TEST_CASES` array:

```javascript
const TEST_CASES = [
  {
    name: 'Amazon.de - Product WITHOUT Free Returns',
    url: 'https://www.amazon.de/dp/B0XXXXXXXXX',
    region: 'de',
    expectedBehavior: {
      hasWidget: true,
      defectiveFree: true,
      regularFree: false,  // Expects paid shipping
      hasCost: true,       // Should show €6.50-€13.00
      language: 'de'
    }
  },
  // Add more test cases...
];
```

## Test Output

### Successful Test
```
🎉 TEST PASSED
✓ Has defective section: ✅
✓ Has regular section: ✅
✓ Shows free returns: ✅
```

### Failed Test
```
❌ TEST FAILED
⚠️ Expected widget but none found
📋 Extension logs:
  - [Amazon Returns Extension] No return information found
```

## Screenshots

All tests save screenshots to `/tmp/`:
- `test-extension-screenshot.jpg` - Basic extension test
- `test-[test-name].jpg` - Dynamic test screenshots
- `debug-[timestamp].jpg` - Debug screenshots on failure

## Finding Products for Testing

### Products WITHOUT "FREE Returns" Badge
To test paid shipping logic (€6.50-€13.00), find products on Amazon.de that:
- Don't show "FREE Returns" badge
- Still allow returns within 14 days
- Usually lower-priced items or specific categories

### Products WITH "FREE Returns" Badge
Most Amazon Prime-eligible products have this badge.

### Third-Party Sellers
Look for "Sold by [SellerName]" instead of "Sold by Amazon"

## Debugging

If widget doesn't appear:
1. Check console logs in test output
2. Look at debug screenshot in `/tmp/`
3. Verify extension is loaded (check browser during test)
4. Check if URL matches content_scripts patterns in manifest.json

## Browser Behavior

- Browser launches in **non-headless mode** (visible)
- Stays open for 5-10 seconds after test for inspection
- Extension is loaded via `--load-extension` flag
- Cookies are accepted automatically
- Network waits for idle before testing

## Continuous Integration

For CI/CD, modify `test-dynamic.js`:
- Set `headless: true` in launch options
- Remove the "stay open" delays
- Save screenshots only on failure
