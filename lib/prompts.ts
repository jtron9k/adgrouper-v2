import { LandingPageData, PromptTemplates } from '@/types';

export const defaultPrompts: PromptTemplates = {
  firecrawl: `Extract the following information from the landing page:
1. Page title
2. Meta description
3. A summary of what is valuable to a user who is being sent to this page based on the keyword and ad copy. This summary should focus on the key value propositions, benefits, and what makes this page relevant to someone searching for related keywords.`,

  keywordGrouping: `You are an expert Google Ads campaign manager. Your task is to group keywords into tightly themed ad groups (TTAGs) following Google Ads best practices.

BEST PRACTICES FOR KEYWORD GROUPING:
1. Group keywords into small, semantically related clusters that share the same user intent
2. Keywords should be closely related enough that a single ad can effectively target all keywords in the group
3. Optimal structure: 7-10 ad groups per campaign, each containing 15-20 closely related keywords
4. Group by search intent (informational, navigational, transactional, commercial investigation)
5. Be ruthlessly efficient: If a keyword doesn't fit any adgroup/landing page combination, mark it as irrelevant
6. Keywords must match the campaign goal and align with at least one landing page's content and value proposition

CAMPAIGN GOAL: {campaignGoal}

LANDING PAGES:
{landingPages}

KEYWORDS TO GROUP:
{keywords}

For each adgroup you create:
- Name the adgroup by its general theme (based on the closely associated keywords)
- List all keywords that belong to that adgroup
- Specify which landing page URL(s) are most relevant for this adgroup
- Ensure keywords are tightly related and share the same search intent

Return your response as a JSON object with this structure:
{
  "adgroups": [
    {
      "name": "Adgroup theme name",
      "keywords": ["keyword1", "keyword2", ...],
      "landingPageUrls": ["url1", "url2"]
    }
  ],
  "irrelevantKeywords": ["keyword1", "keyword2", ...]
}

Be strict about relevance. Only include keywords that truly fit the adgroup theme and match the landing page content.`,

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

Create 2 headlines (max 30 characters each) and 3 descriptions (max 90 characters each) that:
1. Incorporate the primary keywords naturally
2. Align with the landing page messaging and value propositions
3. Include compelling CTAs
4. Highlight unique selling points
5. Are compliant with Google Ads editorial guidelines

Return your response as a JSON object:
{
  "headlines": ["headline1", "headline2"],
  "descriptions": ["description1", "description2", "description3"]
}

Ensure all headlines are exactly 30 characters or less, and all descriptions are exactly 90 characters or less.`,

  keywordSuggestion: `You are an expert Google Ads keyword researcher. Suggest 5-10 additional tightly related keywords for an existing adgroup.

ADGROUP THEME: {adgroupTheme}

EXISTING KEYWORDS: {existingKeywords}

LANDING PAGE DATA:
{landingPageData}

CAMPAIGN GOAL: {campaignGoal}

Suggest 5-10 new keywords that:
1. Are tightly related to the existing keywords in the adgroup
2. Share the same search intent
3. Align with the landing page content and value propositions
4. Match the campaign goal
5. Would work well with the same ad copy as the existing keywords

Return your response as a JSON array of keyword strings:
["keyword1", "keyword2", "keyword3", ...]`,
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

