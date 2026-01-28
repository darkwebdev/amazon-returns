# Release Skill

IMPORTANT: This skill MUST execute all steps automatically using tools. DO NOT just describe what to do.

## Activation

User types: "release", "create a release", "prepare release", "publish", or "release new version"

## Execution Steps

Execute IN ORDER:

### Step 1: Read Current Version

```bash
# Read package.json
Read tool on package.json
Parse "version" field
```

### Step 2: Analyze Changes Since Last Release

```bash
# Get latest tag
git describe --tags --abbrev=0

# Get commits since last tag
git log <last-tag>..HEAD --oneline

# Get full commit messages for analysis
git log <last-tag>..HEAD --pretty=format:"%s%n%b"
```

Analyze the commits to determine change type:
- **Patch** (bug fixes): Commits with "fix", "bug", "patch", "optimize", performance improvements
- **Minor** (new features): Commits with "add", "implement", "feature", "update" (non-breaking)
- **Major** (breaking changes): Commits with "breaking", "remove", major refactors

Based on analysis, suggest the recommended version.

### Step 3: Ask for New Version

Use AskUserQuestion tool with recommendation.

IMPORTANT: Put the RECOMMENDED option FIRST in the options list.

Example for Minor release recommendation:
```json
{
  "questions": [{
    "question": "What version would you like to release?\n\nCurrent: {CURRENT}\nRecommended: {MINOR} based on {REASON}",
    "header": "Version",
    "multiSelect": false,
    "options": [
      {"label": "{MINOR} (Minor) - Recommended", "description": "New features: {FEATURE_COMMITS}"},
      {"label": "{PATCH} (Patch)", "description": "Bug fixes: {PATCH_COMMITS}"},
      {"label": "{MAJOR} (Major)", "description": "Breaking changes: {BREAKING_COMMITS}"},
      {"label": "Custom", "description": "Enter custom version"}
    ]
  }]
}
```

Add "- Recommended" suffix to the suggested option label and place it FIRST.

If user selects "Custom", ask again for the custom version number.

### Step 4: Update Version Files

Use Edit tool to update:
1. `package.json` - change "version" field
2. `src/manifest.json` - change "version" field

### Step 5: Run Tests

```bash
yarn test
```

If tests fail, ABORT and show errors.

### Step 6: Build Packages

```bash
# Build Chrome and Firefox packages
yarn package:all

# Create source package
zip -r amazon-returns-source.zip src/ tests/ package.json yarn.lock tsconfig.json jest.config.js webpack.config.js generate-icons.js BUILD.md ICON-ATTRIBUTION.md README.md -x "*.DS_Store"
```

### Step 7: Commit and Tag

```bash
# Stage files
git add package.json src/manifest.json

# Commit
git commit -m "Release v{VERSION}

- Update version to {VERSION}
- Build browser store packages

Co-Authored-By: Claude <noreply@anthropic.com>"

# Create tag
git tag v{VERSION} -m "Release v{VERSION}"
```

### Step 8: Push to Remote

```bash
git push
git push --tags
```

### Step 9: Verify and Report

```bash
ls -lh amazon-returns-*.zip
```

Display summary:
```
✅ Release v{VERSION} complete!

Created packages:
- amazon-returns-chrome.zip ({SIZE})
- amazon-returns-firefox.zip ({SIZE})
- amazon-returns-source.zip ({SIZE})

Next steps:
1. Upload amazon-returns-chrome.zip to Chrome Web Store
2. Upload amazon-returns-firefox.zip to Firefox Add-ons
3. Upload amazon-returns-source.zip when Mozilla requests source

Git tag v{VERSION} pushed to GitHub
```

## Error Handling

- Tests fail → Abort, show output
- Version invalid → Ask again
- Git fails → Show error, provide manual steps
- Build fails → Show errors
