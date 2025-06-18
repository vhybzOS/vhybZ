import puppeteer from "puppeteer";

/**
 * Pauses execution for a specified number of milliseconds using setTimeout.
 * @param ms The number of milliseconds to sleep.
 * @returns A Promise that resolves after the specified duration.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}


/**
 * Renders an HTML string and captures a screenshot as an image.
 * 
 * @param html - The HTML content to render.
 * @param outputPath - The file path where the screenshot will be saved.
 * @param width - Width of the browser viewport.
 * @param height - Height of the browser viewport.
 */
export async function renderHtmlToImage(
  html: string,
  width: number = 360,
  height: number = 800
): Promise<String> {
  // Launch a headless browser instance
  const browser = await puppeteer.launch({
    headless: true, // Ensures headless mode (modern behavior as of Puppeteer 20+)
  });

  // Open a new tab in the browser
  const page = await browser.newPage();

  // Set the viewport size for consistent rendering
  await page.setViewport({ width, height });

  // Load the HTML content into the page
  await page.setContent(html, {
    waitUntil: 'networkidle0', // Wait until network is idle to ensure full load
  });


  // Capture a screenshot of the full page and save it to the given path
  const img = await page.screenshot({
    fullPage: true,
    encoding: 'base64'
  });

  // Close the browser
  await browser.close();

  return img
}


export function extractHTML(str: string): string[] {
  const htmlMatches = str.match(/```html([\s\S]*?)```|(<html[\s\S]*?<\/html>)/gi);
  const htmlSnippets = htmlMatches?.map(match =>
    match.replace(/```html|```/g, "").trim()
  ) || [];
  return htmlSnippets
}
