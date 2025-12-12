# Search Ads Campaign Builder

An AI-powered web application that helps users create high-performing Google Ads campaigns by automatically crawling landing pages, grouping keywords into tightly themed ad groups, generating ad copy, and exporting results to Excel.

## Features

- **Landing Page Analysis**: Automatically crawls and extracts key information from landing pages using Firecrawl.dev
- **Intelligent Keyword Grouping**: Groups keywords into tightly themed ad groups (TTAGs) following Google Ads best practices
- **AI-Powered Ad Copy Generation**: Creates compelling headlines and descriptions that comply with Google Ads character limits
- **Keyword Suggestions**: Generates additional related keywords for existing ad groups
- **Editable Ad Copy**: Edit generated ad copy with real-time character count validation
- **Excel Export**: Export complete campaign structure to a single-tab XLSX file
- **Multiple AI Providers**: Support for OpenAI, Google Gemini, and Anthropic Claude

## Technology Stack

- **Framework**: Next.js 14+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Excel Export**: xlsx library
- **AI Providers**: 
  - OpenAI (GPT models)
  - Google Gemini
  - Anthropic Claude
- **Landing Page Extraction**: Firecrawl.dev API

## Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (for authentication and data storage)
- API keys for:
  - One or more of: OpenAI, Google Gemini, or Anthropic Claude
  - Firecrawl.dev

**Important:** API keys must be configured in your Supabase database. See the [API Key Configuration](#api-key-configuration) section below.

### Local Setup

1. Clone the repository:
```bash
git clone https://github.com/jtron9k/adgrouper-v2.git
cd adgrouper-v2
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Configure API keys in Supabase (see [API Key Configuration](#api-key-configuration) section below)

5. Run the development server:
```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

### API Key Configuration

API keys are stored securely in your Supabase database and are never exposed to the client. You must configure them before using the application.

1. **Create the `api_keys` table** in your Supabase database:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the SQL script from `supabase_migration_api_keys.sql` (or create the table manually)

2. **Add your API keys** to the `api_keys` table:
   - Go to Table Editor → `api_keys`
   - Insert rows with the following `key_type` values:
     - `firecrawl` - Your Firecrawl.dev API key
     - `openai` - Your OpenAI API key (optional, if using OpenAI)
     - `gemini` - Your Google Gemini API key (optional, if using Gemini)
     - `claude` - Your Anthropic Claude API key (optional, if using Claude)

   Example SQL:
   ```sql
   INSERT INTO api_keys (key_type, api_key) VALUES
     ('firecrawl', 'your-firecrawl-key-here'),
     ('openai', 'your-openai-key-here'),
     ('gemini', 'your-gemini-key-here'),
     ('claude', 'your-claude-key-here')
   ON CONFLICT (key_type) DO UPDATE SET api_key = EXCLUDED.api_key;
   ```

3. **Verify Row Level Security (RLS)** is enabled:
   - The table should have RLS enabled
   - Only authenticated users can read the keys (configured automatically by the migration script)

**Note:** You only need to add keys for the providers you plan to use. At minimum, you need the `firecrawl` key.

### Railway Deployment

See [RAILWAY.md](./RAILWAY.md) for detailed Railway deployment instructions.

**Quick Setup:**
1. Connect your GitHub repository to Railway
2. Add these environment variables in Railway:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy!

**Important:** The app will fail with a 500 error if Supabase environment variables are not set.

## Usage Guide

### Step 1: Select AI Provider and Model

1. Choose your AI provider (OpenAI, Gemini, or Claude)
2. For OpenAI and Gemini: Click "Load Models" to fetch available models (models load automatically when you switch providers)
3. For Claude: Models are pre-loaded automatically
4. Select your preferred model from the dropdown
5. Click "Continue"

**Note:** API keys are configured in Supabase and are not entered by users. Make sure you've added the appropriate API keys to your Supabase `api_keys` table before using the application.

### Step 2: Build Your Campaign

1. **Campaign Name**: Enter a descriptive name (e.g., "Summer Shoe Sale 2025")
2. **Campaign Goal**: Describe your campaign objective (e.g., "Drive sales of our summer shoe lineup for women age 25-44")
3. **Landing Page URLs**: 
   - Enter up to 10 URLs (one per line)
   - URLs must start with `http://` or `https://`
   - Or upload a single-column CSV file
4. **Keywords**: 
   - Enter up to 200 keywords (one per line)
   - Or upload a single-column CSV file (assumes no header row)
5. **Edit Prompts** (Optional): Expand and customize the prompts used for:
   - Firecrawl extraction
   - Keyword grouping
   - Ad copy generation
   - Keyword suggestions
6. Click "Submit" to process

The tool will:
1. Crawl all landing pages and extract key information
2. Group keywords into tightly themed ad groups
3. Generate ad copy for each ad group
4. Display results on the results page

### Step 3: Review and Export Results

1. **Review Ad Groups**: Each ad group card displays:
   - Ad group name (theme-based)
   - Associated keywords (with remove buttons)
   - Landing page analysis (expandable)
   - Generated ad copy (editable)

2. **Edit Ad Copy**: 
   - Modify headlines and descriptions directly
   - Character limits are enforced (30 chars for headlines, 90 for descriptions)
   - Real-time character count display

3. **Regenerate Ads**: Click "Regenerate Ads" to generate new ad copy for any ad group

4. **Generate More Keywords**: Click "+ Generate More Keywords" to add 5-10 related keywords to an ad group

5. **Remove Keywords**: Click the × button on any keyword to remove it before export

6. **Export to Excel**: Click "Export to Excel" to download a formatted XLSX file with:
   - Campaign name
   - Ad group names
   - Keywords
   - Headlines (2 per ad group)
   - Descriptions (3 per ad group)
   - Landing page URLs

7. **Start Over**: Click "Start Over" to begin a new campaign

## API Endpoints

### `/api/models`
- **Method**: POST
- **Body**: `{ provider: string }`
- **Returns**: List of available models for the provider
- **Note**: API key is fetched server-side from Supabase

### `/api/firecrawl`
- **Method**: POST
- **Body**: `{ urls: string[], extractionPrompt: string, provider?: AIProvider }`
- **Returns**: Extracted landing page data
- **Note**: Firecrawl API key is fetched server-side from Supabase

### `/api/group-keywords`
- **Method**: POST
- **Body**: `{ keywords: string[], landingPageData: LandingPageData[], campaignGoal: string, groupingPrompt: string, provider: { name: string, model: string } }`
- **Returns**: Grouped ad groups and irrelevant keywords
- **Note**: Provider API key is fetched server-side from Supabase based on `provider.name`

### `/api/suggest-keywords`
- **Method**: POST
- **Body**: `{ adgroupTheme: string, existingKeywords: string[], landingPageData: LandingPageData[], campaignGoal: string, suggestionPrompt: string, provider: { name: string, model: string } }`
- **Returns**: Array of suggested keywords
- **Note**: Provider API key is fetched server-side from Supabase

### `/api/generate-ads`
- **Method**: POST
- **Body**: `{ adgroupData: Adgroup, landingPageData: LandingPageData[], campaignGoal: string, adCopyPrompt: string, provider: { name: string, model: string } }`
- **Returns**: Headlines and descriptions
- **Note**: Provider API key is fetched server-side from Supabase

### `/api/export`
- **Method**: POST
- **Body**: `Campaign` object
- **Returns**: Excel file download

## Best Practices

This tool implements Google Ads best practices based on industry-leading resources:

### Keyword Grouping
- **Tightly Themed Ad Groups (TTAGs)**: Keywords are grouped into small, semantically related clusters sharing the same user intent
- **Optimal Structure**: 7-10 ad groups per campaign, each containing 15-20 closely related keywords
- **Ruthless Efficiency**: Keywords that don't fit any ad group/landing page combination are marked as irrelevant

### Ad Copy
- **Headlines**: Max 30 characters, incorporate keywords naturally, include USPs
- **Descriptions**: Max 90 characters, clear value proposition, strong CTAs
- **Alignment**: Ad copy matches landing page messaging and value propositions

### References
- [The Ultimate Guide to Your Google Ads Account Structure - PPC Hero](https://ppchero.com/the-ultimate-guide-to-your-google-ads-account-structure/)
- [The 2025 Guide to the Perfect Google Ads Account Structure - WordStream](https://www.wordstream.com/blog/google-ads-account-structure)
- [How to Write Google Ads Like a Pro - WordStream](https://www.wordstream.com/blog/google-ads-copy)

## Project Structure

```
/app
  /page.tsx                    # Page 1: Model selection
  /build/page.tsx              # Page 2: Campaign builder
  /results/page.tsx            # Page 3: Results display
  /api                         # API routes
/lib                           # Utility functions
/components                    # React components
/types.ts                      # TypeScript type definitions
```

## Troubleshooting

### API Key Issues
- **Keys not found**: Ensure you've added API keys to the `api_keys` table in Supabase
- **Invalid keys**: Verify your API keys are correct in Supabase and have sufficient credits/quota
- **For OpenAI**: Check that your API key has access to the selected model
- **For Claude**: Verify your API key is active on Anthropic's platform
- **RLS errors**: Ensure Row Level Security is properly configured on the `api_keys` table

### Firecrawl Errors
- Verify your Firecrawl API key is correct in Supabase
- Check that URLs are publicly accessible (not behind authentication)
- Some URLs may take longer to process - be patient

### Keyword Grouping Issues
- If keywords aren't grouping as expected, try editing the keyword grouping prompt
- Ensure your campaign goal is clear and specific
- Make sure landing pages are relevant to your keywords

### Ad Copy Generation
- If ad copy doesn't meet character limits, the tool will truncate automatically
- Edit ad copy manually if needed to better match your brand voice
- Use "Regenerate Ads" to get alternative versions

## Contributing

This is a private project. For issues or suggestions, please contact the repository owner.

## License

[Add your license here]

## Support

For questions or issues, please open an issue on the GitHub repository.




