# Lighthouse Accessibility Audit Tool

A Node.js script that uses Google Chrome Lighthouse to perform accessibility audits and converts the HTML reports to high-quality JPG images.

## Features

- 🔍 Runs Lighthouse accessibility audits
- 📄 Generates HTML reports
- 📸 Converts HTML reports to JPG images (100% quality)
- 🚀 Command-line interface
- ⚡ Fast and efficient

## Prerequisites

- Node.js v18+ (tested with v21.6.2)
- Google Chrome or Chromium installed

## Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

## Usage

### Basic Usage

\`\`\`bash
# Desktop audit (default)
node scripts/lighthouse-audit.js https://example.com

# Mobile audit
node scripts/lighthouse-audit.js https://example.com --platform=mobile
\`\`\`

### All Syntax Options

\`\`\`bash
# Desktop
node scripts/lighthouse-audit.js https://example.com --platform=desktop
node scripts/lighthouse-audit.js --url=https://example.com --platform=desktop

# Mobile
node scripts/lighthouse-audit.js https://example.com --platform=mobile
node scripts/lighthouse-audit.js --url=https://example.com --platform=mobile

# Using npm scripts
npm run audit https://example.com -- --platform=mobile
\`\`\`

### Platform Differences

**Desktop Configuration:**
- Viewport: 1350x940
- No CPU throttling
- No network throttling
- Desktop user agent

**Mobile Configuration:**
- Viewport: 375x667 (iPhone-like)
- 4x CPU throttling
- 3G network simulation
- Mobile user agent
- Touch events enabled

## Output

The script generates two files with platform identifier:
- `lighthouse-accessibility-{domain}-{platform}-{timestamp}.html` - Full HTML report
- `lighthouse-accessibility-{domain}-{platform}-{timestamp}.jpg` - JPG image of the report

## Example Output

\`\`\`
🚀 Starting Lighthouse accessibility audit for: https://example.com
📱 Platform: mobile
🔧 Launching Chrome...
🔍 Running Lighthouse audit...
📄 HTML report saved: /path/to/lighthouse-accessibility-example-com-mobile-2024-01-15T10-30-45.html
🖼️  Converting HTML report to JPG...
📸 JPG image saved: /path/to/lighthouse-accessibility-example-com-mobile-2024-01-15T10-30-45.jpg

📊 Audit Summary:
   URL: https://example.com
   Platform: mobile
   Accessibility Score: 95/100
   Total Audits: 45
   Failed Audits: 2

✅ Audit completed successfully!
\`\`\`

## Configuration

The script is configured to:
- Run only accessibility audits (\`--only-categories="accessibility"\`)
- Generate JPG images at 100% quality
- Use headless Chrome
- Set viewport to 1200x800 for optimal screenshots

## Troubleshooting

### Chrome/Chromium Issues
If you encounter Chrome-related errors, ensure Chrome or Chromium is installed:

**Ubuntu/Debian:**
\`\`\`bash
sudo apt-get install chromium-browser
\`\`\`

**macOS:**
\`\`\`bash
brew install --cask google-chrome
\`\`\`

### Permission Issues
If you get permission errors, try running with additional flags:
\`\`\`bash
node scripts/lighthouse-audit.js https://example.com --no-sandbox
\`\`\`

## Dependencies

- \`lighthouse\`: Google's Lighthouse audit tool
- \`chrome-launcher\`: Launches Chrome programmatically
- \`node-html-to-image\`: Converts HTML to images using Puppeteer
