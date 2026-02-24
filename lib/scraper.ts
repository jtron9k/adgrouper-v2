import { LandingPageData, AIProvider } from '@/types';
import { callLLM } from './providers';
import { formatPrompt } from './prompts';
import { chromium, Browser } from 'playwright-core';
import TurndownService from 'turndown';

const NAVIGATION_TIMEOUT = 30000;

function createTurndownService(): TurndownService {
  const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });
  // Remove images to keep output text-focused
  turndown.addRule('removeImages', {
    filter: 'img',
    replacement: () => '',
  });
  return turndown;
}

async function launchBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}

async function scrapeUrl(
  browser: Browser,
  url: string,
  turndown: TurndownService
): Promise<{ title: string; metaDescription: string; markdown: string }> {
  const page = await browser.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: NAVIGATION_TIMEOUT });

    const title = await page.title() || 'No title found';

    const metaDescription = await page.$eval(
      'meta[name="description"]',
      (el) => el.getAttribute('content') || ''
    ).catch(() => 'No meta description found') || 'No meta description found';

    // Remove non-content elements, then grab main or body
    const html = await page.evaluate(() => {
      const selectorsToRemove = [
        'nav', 'header', 'footer', 'script', 'style', 'noscript',
        '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
        '.cookie-banner', '.cookie-consent', '#cookie-banner',
      ];
      selectorsToRemove.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });
      const main = document.querySelector('main') || document.querySelector('[role="main"]');
      return (main || document.body).innerHTML;
    });

    const markdown = turndown.turndown(html);
    return { title, metaDescription, markdown };
  } finally {
    await page.close();
  }
}

export async function scrapeAndExtractLandingPage(
  url: string,
  extractionPrompt: string,
  provider: AIProvider
): Promise<LandingPageData> {
  console.log('[Scraper] === Starting scrape and extraction for single URL ===');
  console.log('[Scraper] URL:', url);
  console.log('[Scraper] Provider:', provider.name, provider.model);

  const browser = await launchBrowser();
  try {
    const turndown = createTurndownService();
    const { title, metaDescription, markdown } = await scrapeUrl(browser, url, turndown);

    console.log('[Scraper] Extracted title:', title);
    console.log('[Scraper] Extracted meta description:', metaDescription);

    if (!markdown) {
      console.warn('[Scraper] No content found, using fallback summary');
      return { url, title, metaDescription, summary: 'No content available to summarize' };
    }

    const maxMarkdownLength = 50000;
    const truncatedMarkdown = markdown.length > maxMarkdownLength
      ? markdown.substring(0, maxMarkdownLength) + '\n\n[... content truncated ...]'
      : markdown;

    const llmPrompt = formatPrompt(extractionPrompt, { pageText: truncatedMarkdown });

    console.log('[Scraper] Calling LLM for summary extraction...');
    let summary: string;
    try {
      summary = await callLLM(provider, llmPrompt);
      console.log('[Scraper] Summary generated successfully');
    } catch (err: any) {
      console.error('[Scraper] LLM summary extraction failed:', err.message);
      summary = `Summary extraction failed: ${err.message || 'Unknown error'}`;
    }

    return { url, title, metaDescription, summary: summary || 'No summary generated' };
  } finally {
    await browser.close();
  }
}

export async function scrapeAndExtractMultipleLandingPages(
  urls: string[],
  extractionPrompt: string,
  provider: AIProvider,
  onProgress?: (current: number, total: number) => void
): Promise<LandingPageData[]> {
  console.log('[Scraper] === Starting scrape and extraction for multiple URLs ===');
  console.log('[Scraper] URLs:', urls);
  console.log('[Scraper] Provider:', provider.name, provider.model);

  const browser = await launchBrowser();
  const turndown = createTurndownService();
  const results: LandingPageData[] = [];

  try {
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[Scraper] Processing URL ${i + 1}/${urls.length}: ${url}`);

      try {
        const { title, metaDescription, markdown } = await scrapeUrl(browser, url, turndown);

        console.log('[Scraper] Extracted title:', title);
        console.log('[Scraper] Extracted meta description:', metaDescription);

        if (!markdown) {
          results.push({ url, title, metaDescription, summary: 'No content available to summarize' });
        } else {
          const maxMarkdownLength = 50000;
          const truncatedMarkdown = markdown.length > maxMarkdownLength
            ? markdown.substring(0, maxMarkdownLength) + '\n\n[... content truncated ...]'
            : markdown;

          const llmPrompt = formatPrompt(extractionPrompt, { pageText: truncatedMarkdown });

          console.log('[Scraper] Calling LLM for summary extraction...');
          let summary: string;
          try {
            summary = await callLLM(provider, llmPrompt);
            console.log('[Scraper] Summary generated successfully');
          } catch (err: any) {
            console.error('[Scraper] LLM summary extraction failed:', err.message);
            summary = `Summary extraction failed: ${err.message || 'Unknown error'}`;
          }

          results.push({ url, title, metaDescription, summary: summary || 'No summary generated' });
        }

        console.log(`[Scraper] Successfully scraped and extracted: ${url}`);
      } catch (err: any) {
        console.error(`[Scraper] Error scraping/extracting ${url}:`, err.message);
        results.push({
          url,
          title: 'Error extracting page',
          metaDescription: 'Error extracting page',
          summary: `Failed to extract: ${err.message || 'Unknown error'}`,
        });
      }

      if (onProgress) {
        onProgress(i + 1, urls.length);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('[Scraper] === Scrape and extraction complete ===');
  return results;
}
