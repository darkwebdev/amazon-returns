# Build Instructions for Amazon Returns Extension

This document provides complete step-by-step instructions to reproduce the exact extension package from source code.

## Operating System Requirements

- **Tested on**: macOS (Darwin 24.4.0), but should work on Linux and Windows
- **Required**: POSIX-compatible shell (bash/zsh) for build scripts

## Required Software

### Node.js
- **Version**: 18.0.0 or higher (tested with 22.14.0)
- **Installation**:
  - macOS: `brew install node` or download from https://nodejs.org/
  - Linux: Use your package manager or https://nodejs.org/
  - Windows: Download from https://nodejs.org/

Verify installation:
```bash
node --version  # Should output v18.0.0 or higher
```

### Yarn Package Manager
- **Version**: 4.6.0 (automatically managed via packageManager field in package.json)
- **Installation**: Yarn is included in the project via Corepack (built into Node.js 16.10+)
- **Enable Corepack** (if not already enabled):
```bash
corepack enable
```

Verify installation:
```bash
yarn --version  # Should output 4.6.0
```

## Step-by-Step Build Instructions

### 1. Extract Source Code

Extract the source code package to a directory:
```bash
unzip amazon-returns-source.zip -d amazon-returns
cd amazon-returns
```

### 2. Install Dependencies

Install all required npm packages:
```bash
yarn install
```

This will install:
- TypeScript compiler and type definitions
- Webpack and loaders (ts-loader, css-loader, style-loader)
- webextension-polyfill for cross-browser compatibility
- Development tools (Jest for testing, Puppeteer for icon generation)

Expected output: Dependencies installed in `.yarn/cache/` and `node_modules/` created

### 3. Build the Extension

Run the production build:
```bash
yarn build
```

Or use the packaging script:
```bash
yarn package:firefox
```

This will:
1. Compile TypeScript files from `src/` to JavaScript
2. Bundle all files using Webpack
3. Minify the output for production
4. Copy manifest.json and icons to `dist/`
5. Create `amazon-returns-firefox.zip` in the project root

Expected output: `dist/` folder created with:
- `content.js` (29 KB, minified) - Bundle of all TypeScript source files
- `manifest.json` (868 bytes) - Extension manifest
- `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` - Square PNG icons
- `icons/icon-package.png` - Source icon file

### 4. Verify the Build

The `dist/` folder is the complete extension that can be loaded in Firefox.

Compare with the submitted package:
```bash
cd dist
zip -r ../verify.zip *
cd ..
# verify.zip should be identical to amazon-returns-firefox.zip
```

## Build Tools Used

1. **Webpack 5.104.1** - Module bundler
   - Combines multiple source files into a single output file
   - Minifies JavaScript in production mode
   - Configuration: `webpack.config.js`

2. **TypeScript 5.9.3** - TypeScript compiler
   - Transpiles `.ts` files to JavaScript
   - Type checking and validation
   - Configuration: `tsconfig.json`

3. **ts-loader 9.5.4** - TypeScript loader for Webpack
   - Integrates TypeScript compiler with Webpack

4. **css-loader 7.1.2 & style-loader 4.0.0** - CSS processing
   - Processes CSS files and injects into JavaScript bundle

5. **copy-webpack-plugin 13.0.1** - File copying
   - Copies manifest.json and icons to output directory

## Source Code Structure

All source files are original, unminified TypeScript and CSS:

- `src/content/content.ts` - Main entry point, content script initialization
- `src/content/policyScraper.ts` - Amazon return policy scraping logic
- `src/content/sellerScraper.ts` - Third-party seller detection
- `src/content/ui.ts` - Widget rendering and DOM manipulation
- `src/content/styles.css` - Widget CSS styles
- `src/shared/i18n.ts` - Internationalization (English & German)
- `src/shared/types.ts` - TypeScript type definitions
- `src/shared/policyData.ts` - Default return policy data
- `src/shared/regionDetector.ts` - Amazon region detection
- `src/manifest.json` - Extension manifest (copied to dist/)
- `src/icons/` - Icon source files

## Testing (Optional)

Run automated tests to verify functionality:
```bash
yarn test
```

This runs 50 unit tests covering:
- Return policy scraping from real Amazon HTML
- Internationalization patterns
- Seller detection logic

## Development Build (Optional)

For development with source maps and watch mode:
```bash
yarn dev
```

This builds in development mode with:
- Unminified output
- Source maps for debugging
- File watching for automatic rebuilds

## Icon Generation (Optional - Icons Already Included)

Icons are pre-generated and included in `src/icons/`. To regenerate:

```bash
yarn node generate-icons.js
```

This uses Puppeteer (headless Chrome) to render SVG to PNG at required sizes.

## Reproducibility

The exact same output can be reproduced by:
1. Using the same Node.js version (18+)
2. Running `yarn install` to install locked dependency versions (from `yarn.lock`)
3. Running `yarn build` to execute the build process

The `yarn.lock` file ensures all developers get identical dependency versions.

## Third-Party Libraries

All third-party libraries are open-source and installed via npm:
- **webextension-polyfill** (Mozilla MPL 2.0) - Cross-browser WebExtension API
- **webpack**, **typescript**, and build tools (MIT licensed)
- See `package.json` for complete list

## Package Scripts

- `yarn build` - Production build only
- `yarn package:firefox` - Build and create ZIP package
- `yarn package:chrome` - Build and create Chrome ZIP package
- `yarn package:all` - Build both packages
- `yarn dev` - Development build with watch mode
- `yarn test` - Run unit tests

## Contact

For build issues or questions, please file an issue on the GitHub repository.
