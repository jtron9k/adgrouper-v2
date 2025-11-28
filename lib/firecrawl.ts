import { LandingPageData } from '@/types';

export async function extractLandingPage(
  url: string,
  apiKey: string,
  extractionPrompt: string
): Promise<LandingPageData> {
  const response = await fetch('https://api.firecrawl.dev/v1/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      extractorOptions: {
        extractionPrompt,
        extractionSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'The page title',
            },
            metaDescription: {
              type: 'string',
              description: 'The meta description',
            },
            summary: {
              type: 'string',
              description: 'A summary of what is valuable to a user who is being sent to this page based on the keyword and ad copy',
            },
          },
          required: ['title', 'metaDescription', 'summary'],
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl API error: ${error}`);
  }

  const data = await response.json();
  
  return {
    url,
    title: data.data?.title || 'No title found',
    metaDescription: data.data?.metaDescription || 'No meta description found',
    summary: data.data?.summary || 'No summary found',
  };
}

export async function extractMultipleLandingPages(
  urls: string[],
  apiKey: string,
  extractionPrompt: string,
  onProgress?: (current: number, total: number) => void
): Promise<LandingPageData[]> {
  const results: LandingPageData[] = [];

  for (let i = 0; i < urls.length; i++) {
    try {
      const data = await extractLandingPage(urls[i], apiKey, extractionPrompt);
      results.push(data);
    } catch (error) {
      console.error(`Error extracting ${urls[i]}:`, error);
      // Continue with other URLs even if one fails
      results.push({
        url: urls[i],
        title: 'Error extracting page',
        metaDescription: 'Error extracting page',
        summary: `Failed to extract data from ${urls[i]}`,
      });
    }
    
    if (onProgress) {
      onProgress(i + 1, urls.length);
    }
  }

  return results;
}

