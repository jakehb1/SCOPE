# How to Check Logs

## Option 1: Vercel Dashboard (Recommended for Production)

### Step-by-Step:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard
   - Sign in if needed

2. **Select Your Project**
   - Click on **"SCOPE"** project

3. **View Logs**
   - **Method A: From Deployments**
     - Click **"Deployments"** tab
     - Click on your latest deployment
     - Click **"View Function Logs"** or **"Logs"** button
   
   - **Method B: From Settings**
     - Click **"Settings"** tab
     - Click **"Logs"** in the left sidebar
     - Select your deployment/environment

4. **Filter Logs**
   - Use the search/filter to find specific logs
   - Look for:
     - `🔄 Starting arbitrage scan...`
     - `📊 Arbitrage check:`
     - `🔐 Kalshi API:`
     - `📦 Kalshi API response structure:`
     - `✅ Found X potential arbitrage opportunities`
     - Any error messages (especially `401`, `404`, `500`)

### What to Look For:

**Good Signs:**
- `✅ Fetched X markets from Kalshi` (where X > 0)
- `📊 Arbitrage check: 1000 Polymarket markets, 50 Kalshi markets`
- `✅ Found X potential arbitrage opportunities`

**Problem Signs:**
- `⚠️ Kalshi credentials not set` - Missing environment variables
- `❌ Kalshi API error (401):` - Authentication failed
- `❌ Kalshi API error (404):` - Wrong endpoint
- `📊 Arbitrage check: 1000 Polymarket markets, 0 Kalshi markets` - No Kalshi data

---

## Option 2: Vercel CLI (Command Line)

### Install Vercel CLI (if not installed):

```bash
npm install -g vercel
```

### Login to Vercel:

```bash
vercel login
```

### View Logs:

```bash
# View recent logs
vercel logs

# Follow logs in real-time (like tail -f)
vercel logs --follow

# View logs for specific deployment
vercel logs [deployment-url]

# Filter logs (e.g., only errors)
vercel logs | grep "error"
```

---

## Option 3: Local Development Server

If you're running the app locally with `npm run dev`:

1. **Open your terminal** where you ran `npm run dev`
2. **All console.log() statements** will appear there
3. **Look for the same log messages** mentioned above

### To Run Locally:

```bash
# Make sure you have .env.local with:
# KALSHI_KEY_ID=...
# KALSHI_PRIVATE_KEY=...

npm run dev
```

Then visit `http://localhost:3000/arbitrage` and watch the terminal for logs.

---

## Option 4: Browser Console (Client-Side Only)

**Note:** This only shows client-side logs, not server-side API logs.

1. **Open your browser**
2. **Open Developer Tools**
   - Chrome/Edge: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
   - Firefox: `F12` or `Cmd+Option+K` (Mac) / `Ctrl+Shift+K` (Windows)
   - Safari: `Cmd+Option+I` (enable Developer menu first)

3. **Go to Console tab**
4. **Look for client-side errors** (but API logs won't appear here)

---

## Quick Debugging Checklist

When checking logs for arbitrage issues:

- [ ] **Are Kalshi credentials loaded?**
  - Look for: `🔐 Kalshi auth headers generated`
  - If missing: Check Vercel environment variables

- [ ] **Is Kalshi API responding?**
  - Look for: `✅ Fetched X markets from Kalshi`
  - If 0: Check for 401/404 errors

- [ ] **Are markets being fetched?**
  - Look for: `📊 Arbitrage check: X Polymarket markets, Y Kalshi markets`
  - If Y = 0: Authentication or endpoint issue

- [ ] **Are markets matching?**
  - Look for: `✅ Found X potential arbitrage opportunities`
  - If 0: Matching threshold might be too strict, or markets don't overlap

- [ ] **What does the Kalshi response look like?**
  - Look for: `📦 Kalshi API response structure:`
  - This shows what the API actually returns

---

## Common Issues and Solutions

### Issue: "Kalshi credentials not set"
**Solution:** Add `KALSHI_KEY_ID` and `KALSHI_PRIVATE_KEY` to Vercel environment variables and redeploy.

### Issue: "401 Authentication failed"
**Solution:** 
- Verify credentials are correct
- Check private key format (needs BEGIN/END lines)
- Ensure you redeployed after adding variables

### Issue: "404 Not Found"
**Solution:** 
- Try different API endpoint (elections vs trading-api)
- Check Kalshi API documentation for correct endpoint

### Issue: "0 Kalshi markets fetched"
**Solution:**
- Check authentication (401 errors)
- Check endpoint URL (404 errors)
- Check response structure in logs
- Verify API is returning data

### Issue: "0 arbitrage opportunities" but markets are fetched
**Solution:**
- Markets might not overlap (different events on each platform)
- Matching threshold might be too strict
- Spread threshold might be too high
- Check sample markets in logs to see if they're similar

---

## Need More Help?

If you see specific errors in the logs, share:
1. The exact error message
2. The log line that shows the problem
3. Whether it's a 401, 404, or other error code

This will help diagnose the issue faster!

