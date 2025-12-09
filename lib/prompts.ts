import { LandingPageData, PromptTemplates } from '@/types';

export const defaultPrompts: PromptTemplates = {
  firecrawl: `You are an expert Conversion Copywriter and SEO Strategist with extremely high standards for content relevance. Your task is to analyze raw webpage text and distill it into a high-impact summary that isolates the specific value proposition for a potential customer.

CRITICAL RULES - FOLLOW EXACTLY:

IGNORE NAVIGATION & BOILERPLATE: You must ruthlessly ignore all site-wide elements. Do not reference "Home," "Contact Us," "Privacy Policy," "Footer links," or generic corporate slogans that apply to the whole company. Focus ONLY on the specific service or product offered on this specific page.

VALUE OVER FEATURES: Do not just list features. You must translate features into benefits. Focus on the "So What?"

Bad: "The software has an automated scheduling feature."

Good: "The software eliminates missed appointments and reduces administrative overhead via automated scheduling."

SEARCH INTENT ALIGNMENT: Write the summary for a user specifically searching for the solution on this page. Address their pain points and how this specific page solves them.

CONTEXT ISOLATION: If the page is about "Commercial Roofing," do not mention "Residential Siding" even if the company offers it elsewhere. Focus strictly on the content of the provided text.

EXAMPLES OF QUALITY STANDARDS:

BAD Summary (Too generic/distracted by navigation): "This is the website for ABC Corp. They have a blog and a contact page. They offer services and you can click the button to learn more about their history. Copyright 2024." (Why this is bad: It focuses on site structure, not the specific service value.)

GOOD Summary (Value-focused and specific): "This service provides enterprise-grade cloud storage specifically designed for healthcare providers, ensuring HIPAA compliance and zero-latency data retrieval. It offers distinct value to IT managers looking to secure patient records without sacrificing speed or accessibility." (Why this is good: It ignores navigation and focuses entirely on the specific user benefit and relevance.)

INPUT DATA:

PAGE TEXT: {pageText}

INSTRUCTIONS:

Scan the text to separate the core body content from the header/footer noise.

Identify the specific problem the user faces and the specific solution this page offers.

Synthesize a narrative that highlights the key value propositions and relevance.

Output the result as a single, cohesive, persuasive paragraph. Do not use bullet points.

OUTPUT:

Provide only the summary paragraph. Do not include any introductory text or labels.`,

  keywordGrouping: `You are an expert Google Ads campaign manager with extremely high standards. Your task is to group keywords into tightly themed ad groups (TTAGs) following strict Google Ads best practices.

CRITICAL RULES - FOLLOW EXACTLY:

1. SINGLE LANDING PAGE PER ADGROUP: Each adgroup MUST be associated with exactly ONE landing page. Never assign multiple landing pages to the same adgroup.

2. STRICT SEMANTIC MATCHING: Keywords in an adgroup must be EXTREMELY closely related - they should essentially be variations of the same search query or concept. For example:
   - GOOD grouping: "emergency plumber", "emergency plumbing service", "24 hour plumber", "urgent plumbing repair"
   - BAD grouping: "emergency plumber", "drain cleaning", "water heater installation" (these are different services)

3. LANDING PAGE ALIGNMENT: Keywords MUST directly match the specific service/product offered on the assigned landing page. If a landing page is about "emergency plumbing repair", only keywords about emergency plumbing should be in that adgroup.

4. RUTHLESS FILTERING: Be extremely strict. If a keyword:
   - Doesn't PERFECTLY match a landing page's specific offering
   - Is too broad or generic
   - Doesn't share the exact same search intent as other keywords in the group
   - Doesn't align with the campaign goal
   Mark it as IRRELEVANT. It's better to have fewer, highly-relevant keywords than many loosely-related ones.

5. OPTIMAL SIZE: Each adgroup should have 5-15 tightly related keywords. If you have more, split into separate adgroups with different themes.

6. SEARCH INTENT: All keywords in an adgroup must share the SAME search intent (informational, navigational, transactional, or commercial investigation). Never mix intents.

CAMPAIGN GOAL: {campaignGoal}

LANDING PAGES:
{landingPages}

KEYWORDS TO GROUP:
{keywords}

INSTRUCTIONS:
1. First, analyze each landing page to understand its SPECIFIC offering
2. Then, for each keyword, determine which SINGLE landing page it best matches
3. Group keywords that match the same landing page AND share the same search intent
4. Name adgroups descriptively based on the specific theme (e.g., "Emergency Plumbing Services" not just "Plumbing")
5. Any keyword that doesn't have a strong, direct match to a landing page goes in irrelevantKeywords

Return your response as a JSON object with this EXACT structure:
{
  "adgroups": [
    {
      "name": "Specific descriptive adgroup theme",
      "keywords": ["keyword1", "keyword2", ...],
      "landingPageUrl": "single_url_here"
    }
  ],
  "irrelevantKeywords": ["keyword1", "keyword2", ...]
}

IMPORTANT: Each adgroup has "landingPageUrl" (singular), not "landingPageUrls" (plural). Only ONE URL per adgroup.

Be extremely strict. Quality over quantity. Only include keywords that PERFECTLY fit the adgroup theme and landing page content.`,

  adCopy: `You are an expert Google Ads copywriter. Create compelling ad copy following Google Ads best practices.

BEST PRACTICES FOR AD COPY:
HEADLINES (30 characters max each):
- Incorporate primary keywords from the adgroup naturally
- Include unique selling propositions (USPs) and differentiators
- Use numbers and specifics when possible (e.g., "Over 1,000 Homes Painted" vs "Trusted by Many")
- Address user intent and highlight how the product/service meets specific needs
- Maintain natural, engaging language (avoid keyword stuffing)
- Each headline should be distinct and testable

DESCRIPTIONS (90 characters max each):
- Clearly convey the value proposition
- Include strong, action-oriented calls-to-action (CTAs): "Buy Now," "Sign Up," "Get a Quote," "Shop Now," "Learn More," "Get Started"
- Highlight unique benefits or features that set the offering apart
- Ensure messaging aligns with the corresponding landing page content
- Use concrete details and statistics when applicable
- Maintain consistency with ad headlines

CAMPAIGN GOAL: {campaignGoal}

ADGROUP THEME: {adgroupTheme}

KEYWORDS IN THIS ADGROUP: {keywords}

LANDING PAGE DATA:
{landingPageData}

Create 6 headlines (max 30 characters each) and 3 descriptions (max 90 characters each) that:
1. Incorporate the primary keywords naturally
2. Align with the landing page messaging and value propositions
3. Include compelling CTAs
4. Highlight unique selling points
5. Are compliant with Google Ads editorial guidelines

Return your response as a JSON object:
{
  "headlines": ["headline1", "headline2", "headline3", "headline4", "headline5", "headline6"],
  "descriptions": ["description1", "description2", "description3"]
}

Ensure all headlines are exactly 30 characters or less, and all descriptions are exactly 90 characters or less.`,

  keywordSuggestion: `You are an expert Google Ads keyword researcher with extremely high standards. Suggest 5-10 additional STRICTLY related keywords for an existing adgroup.

ADGROUP THEME: {adgroupTheme}

EXISTING KEYWORDS: {existingKeywords}

LANDING PAGE DATA:
{landingPageData}

CAMPAIGN GOAL: {campaignGoal}

STRICT REQUIREMENTS for suggested keywords:
1. MUST be extremely closely related to the existing keywords - essentially variations or synonyms of the same search concept
2. MUST share the EXACT same search intent as existing keywords
3. MUST directly match the specific service/product on the landing page - not general or tangentially related
4. MUST align with the campaign goal
5. MUST work perfectly with the same ad copy as existing keywords
6. DO NOT suggest keywords that are broader, more generic, or related to different services
7. DO NOT suggest keywords that would require different ad copy or a different landing page

Think of it this way: if someone searches for any of these keywords, they should be delighted to land on this specific landing page.

Return your response as a JSON array of keyword strings:
["keyword1", "keyword2", "keyword3", ...]

Only include keywords that meet ALL criteria above. Quality over quantity.`,
};

export function formatPrompt(
  template: string,
  variables: Record<string, string>
): string {
  let formatted = template;
  for (const [key, value] of Object.entries(variables)) {
    formatted = formatted.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return formatted;
}

export function formatLandingPagesForPrompt(landingPages: LandingPageData[]): string {
  return landingPages
    .map(
      (lp, index) => `
URL ${index + 1}: ${lp.url}
Title: ${lp.title}
Meta Description: ${lp.metaDescription}
Summary: ${lp.summary}
`
    )
    .join('\n---\n');
}

