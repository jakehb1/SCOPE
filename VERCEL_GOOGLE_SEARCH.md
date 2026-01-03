# Vercel Setup: Google Custom Search API

Quick guide to add Google Custom Search API credentials to your Vercel deployment.

## Step-by-Step Instructions

### 1. Get Your Search Engine ID (CX)

If you haven't created a Custom Search Engine yet:

1. Go to [Google Custom Search](https://programmablesearchengine.google.com/)
2. Click **"Add"** to create a new search engine
3. In **"Sites to search"**, you can:
   - Leave it empty to search the entire web (recommended)
   - Or add specific sites like `news.google.com`, `reuters.com`, `bloomberg.com`
4. Click **"Create"**
5. Click **"Control Panel"** → **"Setup"** → **"Basics"**
6. Copy your **"Search engine ID"** (also called "CX") - it looks like `017576662512468239146:omuauf_lfve`

### 2. Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **SCOPE** project
3. Click **"Settings"** in the top navigation
4. Click **"Environment Variables"** in the left sidebar
5. Click **"Add New"** button

   **Add Variable 1:**
   - **Key:** `GOOGLE_CUSTOM_SEARCH_API_KEY`
   - **Value:** `AIzaSyC8bIdwIbKxzNGMbXx9P0F1EhHGzFVg_JI`
   - **Environment:** Check all boxes (Production, Preview, Development)
   - Click **"Save"**

   **Add Variable 2:**
   - **Key:** `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`
   - **Value:** `d58ed98e2e5c443b9`
   - **Environment:** Check all boxes (Production, Preview, Development)
   - Click **"Save"**

### 3. Redeploy Your Application

1. Go to the **"Deployments"** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu on the right
4. Click **"Redeploy"**
5. Confirm the redeploy

**Important:** You must redeploy after adding environment variables for them to take effect!

### 4. Verify It's Working

After redeployment:

1. Visit your Vercel site
2. Click "get context" on any market
3. The AI should now use real web search results
4. Check the browser console or Vercel logs if there are any errors

## Troubleshooting

### "Google Custom Search API credentials not configured"
- Make sure both variables are added in Vercel
- Make sure you redeployed after adding them
- Check that the variable names are exactly: `GOOGLE_CUSTOM_SEARCH_API_KEY` and `GOOGLE_CUSTOM_SEARCH_ENGINE_ID`

### No search results
- Verify your API key is correct
- Check that your Search Engine ID (CX) is correct
- Make sure Custom Search API is enabled in Google Cloud Console
- Check your Google Cloud billing/quota limits

### API errors in logs
- Check Google Cloud Console for API quota issues
- Verify the API key has the Custom Search API enabled
- Make sure billing is set up if you've exceeded free tier (100 searches/day)

## Current Configuration

- **API Key:** Already added to `.env.local` locally
- **Search Engine ID:** You need to add this once you create your Custom Search Engine

Once you have the Search Engine ID, add it to:
1. `.env.local` (for local development)
2. Vercel Environment Variables (for production)

