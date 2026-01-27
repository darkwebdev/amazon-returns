# Amazon Returns Extension - Project Instructions

## Package Manager

**REQUIRED**: Use `yarn` (v1.x) for all package management tasks.

**NEVER** use `npm`. This project uses Yarn 1.x.

Examples:
```bash
# Correct
yarn install
yarn build
yarn dev
yarn test

# Wrong - DO NOT USE
npm install
npm run build
npm run dev
npm test
```

## Chrome MCP Testing

**CRITICAL**: NEVER kill Chrome MCP processes - they may be used by others.

When testing with Chrome MCP:
- Find an existing Chrome MCP session that you can use
- If none exists or all are busy, open a new Chrome MCP instance
- NEVER use `pkill`, `kill -9`, or similar commands on Chrome processes
- NEVER kill processes on port 9222

Examples:
```bash
# ❌ WRONG - DO NOT DO THIS
pkill -f chrome
kill -9 <chrome-pid>
lsof -ti:9222 | xargs kill -9

# ✅ CORRECT - Find and use existing MCP
# Use mcp__chrome-devtools__list_pages to find available pages
# Or open a new page if needed
```
