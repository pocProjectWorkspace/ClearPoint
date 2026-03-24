const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173'

export async function generateReport(engagementId: string, token: string): Promise<Buffer> {
  let puppeteer: any
  try {
    puppeteer = (await import('puppeteer')).default
  } catch {
    throw new Error('PDF export requires puppeteer. Install it locally with: pnpm --filter @mindssparc/api add puppeteer')
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 900, deviceScaleFactor: 1.5 })

    const url = `${APP_URL}/report/${engagementId}?token=${encodeURIComponent(token)}`
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 })

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
