# Google Custom Search API Setup

This project uses Google Custom Search API to gather real-time web information for market analysis and betting hypotheses.

## Setup Instructions

### 1. Get Google Custom Search API Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Custom Search API" for your project
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### 2. Create a Custom Search Engine

1. Go to [Google Custom Search](https://programmablesearchengine.google.com/)
2. Click "Add" to create a new search engine
3. In "Sites to search", you can either:
   - Enter specific sites (e.g., `news.google.com`, `reuters.com`, `bloomberg.com`)
   - Or leave it empty to search the entire web
4. Click "Create"
5. Click "Control Panel" → "Setup" → "Basics"
6. Copy your "Search engine ID" (also called "CX")

### 3. Configure Environment Variables

#### Local Development (.env.local)

Add these variables to your `.env.local` file:

```bash
GOOGLE_CUSTOM_SEARCH_API_KEY=AIzaSyC8bIdwIbKxzNGMbXx9P0F1EhHGzFVg_JI
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=d58ed98e2e5c443b9
```

#### Vercel Deployment

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (SCOPE)
3. Click on **"Settings"** in the top navigation
4. Click on **"Environment Variables"** in the left sidebar
5. Add the following variables:

   **Variable 1:**
   - **Key:** `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - **Value:** `AIzaSyC8bIdwIbKxzNGMbXx9P0F1EhHGzFVg_JI` (or your API key)
   - **Environment:** Select all (Production, Preview, Development)

   **Variable 2:**
   - **Key:** `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
   - **Value:** `your_search_engine_id_here` (you'll need to get this from Google Custom Search)
   - **Environment:** Select all (Production, Preview, Development)

6. Click **"Save"** for each variable
7. Go to the **"Deployments"** tab
8. Click the **"..."** menu on your latest deployment
9. Click **"Redeploy"** to apply the new environment variables

**Note:** You'll need to get your Search Engine ID (CX) from the [Google Custom Search Control Panel](https://programmablesearchengine.google.com/). Once you have it, add it as `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` in Vercel.

## How It Works

When you click "get context" on a market or ask the AI about a market:

1. The system generates a search query based on the market question and category
2. Google Custom Search API is called to fetch recent news, articles, and information
3. The AI receives these real-time search results
4. The AI analyzes the data to form a data-driven betting hypothesis
5. The AI compares the market price to what the research suggests
6. A recommendation is provided (BUY YES, BUY NO, AVOID, MONITOR)

## API Limits

- Google Custom Search API provides 100 free searches per day
- After that, it costs $5 per 1,000 queries
- Results are cached for 5 minutes to reduce API calls

## Troubleshooting

### "Google Custom Search API credentials not configured"
- Make sure both `GOOGLE_CUSTOM_SEARCH_API_KEY` and `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` are set
- Restart your development server after adding environment variables
- For Vercel, make sure you've added the variables and redeployed

### No search results returned
- Check your API key is valid and has Custom Search API enabled
- Verify your Search Engine ID is correct
- Check the Google Cloud Console for any API quota or billing issues

### Search results seem irrelevant
- Adjust the search query generation in `lib/web-research.ts`
- Consider creating a more specific custom search engine with targeted sites
- Add more category-specific terms to the search query

