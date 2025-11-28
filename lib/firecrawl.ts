import { LandingPageData } from '@/types';

const FIRECRAWL_API_BASE = 'https://api.firecrawl.dev/v2';
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 60; // 2 minutes max wait time

interface ExtractResponse {
  success: boolean;
  id?: string;
  status?: string;
  data?: {
    page_title?: string;
    meta_description?: string;
    summary?: string;
  };
  error?: string;
}

// Schema for extraction - using JSON Schema format
const extractionSchema = {
  type: 'object',
  properties: {
    page_title: {
      type: 'string',
      description: 'The page title',
    },
    meta_description: {
      type: 'string',
      description: 'The meta description',
    },
    summary: {
      type: 'string',
      description: 'A summary of the key value propositions and benefits',
    },
  },
  required: ['page_title', 'meta_description', 'summary'],
};

async function pollForResults(jobId: string, apiKey: string): Promise<ExtractResponse> {
  console.log(`[Firecrawl] Polling for job ${jobId}...`);
  
  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
    console.log(`[Firecrawl] Poll attempt ${attempt + 1}...`);
    
    const response = await fetch(`${FIRECRAWL_API_BASE}/extract/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const responseText = await response.text();
    console.log(`[Firecrawl] Poll response status: ${response.status}`);
    console.log(`[Firecrawl] Poll response body: ${responseText}`);

    if (!response.ok) {
      throw new Error(`Firecrawl polling error (${response.status}): ${responseText}`);
    }

    let data: ExtractResponse;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`Failed to parse polling response: ${responseText}`);
    }

    // Check if the job is complete - based on actual API response structure
    if (data.status === 'completed') {
      console.log('[Firecrawl] Job completed!');
      console.log('[Firecrawl] Data received:', JSON.stringify(data.data, null, 2));
      return data;
    }

    // Check for failure
    if (data.status === 'failed' || data.error) {
      throw new Error(`Firecrawl extraction failed: ${data.error || 'Unknown error'}`);
    }

    // Still processing, wait before polling again
    console.log(`[Firecrawl] Job status: ${data.status || 'processing'}, waiting ${POLL_INTERVAL}ms...`);
    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
  }

  throw new Error('Firecrawl extraction timed out after 2 minutes');
}

export async function extractLandingPage(
  url: string,
  apiKey: string,
  extractionPrompt: string
): Promise<LandingPageData> {
  console.log('[Firecrawl] === Starting extraction for single URL ===');
  console.log('[Firecrawl] URL:', url);
  console.log('[Firecrawl] Prompt:', extractionPrompt);
  console.log('[Firecrawl] API Key (first 10 chars):', apiKey.substring(0, 10) + '...');

  const requestBody = {
    urls: [url],
    prompt: extractionPrompt,
    schema: extractionSchema,
  };

  console.log('[Firecrawl] Request body:', JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${FIRECRAWL_API_BASE}/extract`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log('[Firecrawl] Initial response status:', response.status);
  console.log('[Firecrawl] Initial response body:', responseText);

  if (!response.ok) {
    throw new Error(`Firecrawl API error (${response.status}): ${responseText}`);
  }

  let data: ExtractResponse;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    throw new Error(`Failed to parse Firecrawl response: ${responseText}`);
  }

  // If we got a job ID (async extraction), poll for results
  if (data.id && data.success && !data.data) {
    console.log('[Firecrawl] Got job ID, starting polling:', data.id);
    data = await pollForResults(data.id, apiKey);
  }

  // Extract the data - based on actual API response: data is a flat object
  if (data.data) {
    const extracted = data.data;
    console.log('[Firecrawl] Extracted data:', JSON.stringify(extracted, null, 2));
    
    return {
      url,
      title: extracted.page_title || 'No title found',
      metaDescription: extracted.meta_description || 'No meta description found',
      summary: extracted.summary || 'No summary found',
    };
  }

  throw new Error(`No extraction data returned for ${url}. Response: ${JSON.stringify(data)}`);
}

export async function extractMultipleLandingPages(
  urls: string[],
  apiKey: string,
  extractionPrompt: string,
  onProgress?: (current: number, total: number) => void
): Promise<LandingPageData[]> {
  console.log('[Firecrawl] === Starting extraction for multiple URLs ===');
  console.log('[Firecrawl] URLs:', urls);
  console.log('[Firecrawl] Prompt:', extractionPrompt);

  // For multiple URLs, process them one at a time to ensure reliable results
  // (Firecrawl extract endpoint returns flat object for single URL)
  const results: LandingPageData[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`[Firecrawl] Processing URL ${i + 1}/${urls.length}: ${url}`);

    try {
      const data = await extractLandingPage(url, apiKey, extractionPrompt);
      results.push(data);
      console.log(`[Firecrawl] Successfully extracted: ${url}`);
    } catch (err: any) {
      console.error(`[Firecrawl] Error extracting ${url}:`, err.message);
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

  console.log('[Firecrawl] === Extraction complete ===');
  console.log('[Firecrawl] Results:', JSON.stringify(results, null, 2));

  return results;
}
