import lighthouse from "lighthouse"
import * as chromeLauncher from "chrome-launcher"
import nodeHtmlToImage from "node-html-to-image"
import fs from "fs/promises"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  let url = null
  let platform = "desktop" // default to desktop

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--url=")) {
      url = args[i].split("=")[1]
    } else if (args[i] === "--url" && i + 1 < args.length) {
      url = args[i + 1]
    } else if (args[i].startsWith("--platform=")) {
      platform = args[i].split("=")[1].toLowerCase()
    } else if (args[i] === "--platform" && i + 1 < args.length) {
      platform = args[i + 1].toLowerCase()
    } else if (!args[i].startsWith("--") && !url) {
      // If no --url flag, treat first non-flag argument as URL
      url = args[i]
    }
  }

  return { url, platform }
}

// Validate platform
function isValidPlatform(platform) {
  return ["desktop", "mobile"].includes(platform.toLowerCase())
}

// Validate URL
function isValidUrl(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Generate timestamp for filename
function getTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5)
}

// Main function
async function runLighthouseAudit() {
  const { url, platform } = parseArgs()

  if (!url) {
    console.error("❌ Error: Please provide a URL to audit")
    console.log("Usage: node lighthouse-audit.js <URL> [--platform=desktop|mobile]")
    console.log("   or: node lighthouse-audit.js --url=<URL> --platform=<desktop|mobile>")
    console.log("Example: node lighthouse-audit.js https://example.com --platform=mobile")
    process.exit(1)
  }

  if (!isValidUrl(url)) {
    console.error("❌ Error: Invalid URL provided")
    process.exit(1)
  }

  if (!isValidPlatform(platform)) {
    console.error("❌ Error: Invalid platform. Use 'desktop' or 'mobile'")
    process.exit(1)
  }

  console.log(`🚀 Starting Lighthouse accessibility audit for: ${url}`)
  console.log(`📱 Platform: ${platform}`)

  let chrome

  try {
    // Launch Chrome
    console.log("🔧 Launching Chrome...")
    chrome = await chromeLauncher.launch({
      chromeFlags: ["--headless", "--no-sandbox", "--disable-dev-shm-usage"],
    })

    console.log('platform', platform)
    // Configure platform-specific settings
    const platformConfig =
      platform === "mobile"
        ? {
            // Mobile emulation settings
            formFactor: "mobile",
            screenEmulation: {
              mobile: true,
              width: 375,
              height: 667,
              deviceScaleFactor: 2,
              disabled: false,
            },
            throttling: {
              rttMs: 150,
              throughputKbps: 1638.4,
              cpuSlowdownMultiplier: 4,
              requestLatencyMs: 150,
              downloadThroughputKbps: 1638.4,
              uploadThroughputKbps: 675,
            },
          }
        : {
            // Desktop settings
            formFactor: "desktop",
            screenEmulation: {
              mobile: false,
              width: 1350,
              height: 940,
              deviceScaleFactor: 1,
              disabled: false,
            },
            throttling: {
              rttMs: 40,
              throughputKbps: 10240,
              cpuSlowdownMultiplier: 1,
              requestLatencyMs: 0,
              downloadThroughputKbps: 0,
              uploadThroughputKbps: 0,
            },
          }

    // Lighthouse options - only accessibility category with platform config
    const options = {
      logLevel: "info",
      output: "html",
      onlyCategories: ["accessibility"],
      port: chrome.port,
      ...platformConfig,
    }

    // Run Lighthouse
    console.log("🔍 Running Lighthouse audit...")
    const runnerResult = await lighthouse(url, options)

    if (!runnerResult) {
      throw new Error("Lighthouse audit failed to return results")
    }

    // Get the HTML report
    const htmlReport = runnerResult.report

    // Generate filename with timestamp and platform
    const timestamp = getTimestamp()
    const domain = new URL(url).hostname.replace(/[^a-zA-Z0-9]/g, "-")
    const baseFilename = `lighthouse-accessibility-${domain}-${platform}-${timestamp}`

    // Save HTML report
    const htmlFilePath = path.join(__dirname, `${baseFilename}.html`)
    await fs.writeFile(htmlFilePath, htmlReport)
    console.log(`📄 HTML report saved: ${htmlFilePath}`)

    // Convert HTML to JPG with platform-appropriate viewport
    console.log("🖼️  Converting HTML report to JPG...")
    const jpgFilePath = path.join(__dirname, `${baseFilename}.jpg`)

    const viewportConfig =
      platform === "mobile"
        ? { width: 375, height: 800, deviceScaleFactor: 2 }
        : { width: 1200, height: 800, deviceScaleFactor: 1 }

    await nodeHtmlToImage({
      output: jpgFilePath,
      html: htmlReport,
      type: "jpeg",
      quality: 100,
      puppeteerArgs: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
      beforeScreenshot: async (page) => {
        // Wait for any dynamic content to load
        await page.waitForTimeout(2000)

        // Set viewport based on platform
        await page.setViewport(viewportConfig)
      },
    })

    console.log(`📸 JPG image saved: ${jpgFilePath}`)

    // Display audit summary
    const lhr = runnerResult.lhr
    const accessibilityScore = lhr.categories.accessibility.score
    const scorePercentage = Math.round(accessibilityScore * 100)

    console.log("\n📊 Audit Summary:")
    console.log(`   URL: ${url}`)
    console.log(`   Platform: ${platform}`)
    console.log(`   Accessibility Score: ${scorePercentage}/100`)
    console.log(`   Total Audits: ${Object.keys(lhr.audits).length}`)

    // Show failed audits
    const failedAudits = Object.values(lhr.audits).filter((audit) => audit.score !== null && audit.score < 1).length

    if (failedAudits > 0) {
      console.log(`   Failed Audits: ${failedAudits}`)
    }

    console.log("\n✅ Audit completed successfully!")
  } catch (error) {
    console.error("❌ Error during audit:", error.message)
    process.exit(1)
  } finally {
    if (chrome) {
      await chrome.kill()
    }
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason)
  process.exit(1)
})

// Run the audit
runLighthouseAudit()
