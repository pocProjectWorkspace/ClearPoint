import puppeteer from 'puppeteer'

const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173'

export async function generateReport(engagementId: string, token: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1.5 })

    const url = `${APP_URL}/report/${engagementId}?token=${encodeURIComponent(token)}`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 })

    // Wait for the report to signal it's ready
    await page.waitForSelector('#report-ready', { timeout: 25000 })

    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
