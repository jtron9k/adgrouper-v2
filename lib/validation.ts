export function validateUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function validateUrls(urls: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  urls.forEach(url => {
    const trimmed = url.trim();
    if (trimmed && validateUrl(trimmed)) {
      valid.push(trimmed);
    } else if (trimmed) {
      invalid.push(trimmed);
    }
  });

  return { valid, invalid };
}

export function parseCsv(text: string): string[] {
  const lines = text.split('\n');
  return lines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Remove quotes if present
      if ((line.startsWith('"') && line.endsWith('"')) || 
          (line.startsWith("'") && line.endsWith("'"))) {
        return line.slice(1, -1);
      }
      return line;
    });
}

export function validateKeywords(keywords: string[]): string[] {
  return keywords
    .map(k => k.trim())
    .filter(k => k.length > 0)
    .slice(0, 200); // Max 200 keywords
}

export function validateLandingPages(urls: string[]): string[] {
  const { valid } = validateUrls(urls);
  return valid.slice(0, 10); // Max 10 URLs
}






