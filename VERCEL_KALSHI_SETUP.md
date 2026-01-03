# Vercel Setup: Kalshi API Credentials

To enable the arbitrage scanner in production, you need to add your Kalshi API credentials to Vercel.

## Steps to Add Kalshi Credentials to Vercel

### 1. Go to Vercel Dashboard

1. Visit [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **SCOPE** project
3. Click **"Settings"** in the top navigation
4. Click **"Environment Variables"** in the left sidebar

### 2. Add Kalshi Key ID

1. Click **"Add New"** button
2. **Key:** `KALSHI_KEY_ID`
3. **Value:** `95a84a41-341b-487c-b143-9305ec2b7218`
4. **Environment:** Check all boxes (Production, Preview, Development)
5. Click **"Save"**

### 3. Add Kalshi Private Key

1. Click **"Add New"** button again
2. **Key:** `KALSHI_PRIVATE_KEY`
3. **Value:** Paste your entire private key (including BEGIN/END lines):
   ```
   -----BEGIN RSA PRIVATE KEY-----
   MIIEowIBAAKCAQEAtzre8pN5+XRsWeUQIeyenbsjiItDAMg3x1F8GP/7EXQRvgRI
   VCVTjizHfFsYPjF7Wj1JSqYDxdbASvebXHy51JrGjBR2tPrDIy38AxP1nzKl7s8+
   j4yvWx1MJCEunn9wxxnO6ZOwO2ZPrhb4DaJgGXrd/WhwAAHwtA4C1+TRUmVFsSjE
   SAOMcDCIpyroEu+PV3IDHdMgMpNoUKdJYXLczDHxpiZ+iDEPzmhqXRbgS/nVT0gt
   OsFypdaCkGbf+MTLJ2X9lr4q7LdTcRrVRn84tUKJwES2tdVtVxicq1zeh/tpmXfl
   ph/RIjILA8U6AdUW4TyUQXtRlG+S06c5W5FlhQIDAQABAoIBAAKwJtClTTxmtx6f
   TQJ9EUHaEjDZbnJY5ARU9/gs21o4dueBA4Nu6lrDN0hmB9yehPRb9dDFE82gKMnG
   GgmGyU9oxmtQe6zQkYODz7k1+EjrWjwc75L1bQQYyQDHwbWZTH//RMxfHrTChCkB
   zpdp8tL5q/J2UWB1DTrU36g0g9a1MRw2MEUl5ciiHGbaXS+0ST8BnmNadkhoQwhg
   nuJ/rIT6NxZKhWEv7bi0d9K76hxZYwtkK3JWxD9e4etTsG0rmzwQak3jb+I1vaA0
   K4PIoEBoL/jQb8CSk0hdbuF8QjDyxbPRhYQoJTka2B2/WE2lVzRh+6ZqEEXBSxkJ
   2HNDOUECgYEA8+uqeWruyCghSyFdm43AaisItxfTXgZcVOWUoqC4lLh3j6Aeu2le
   PIE4piL5juGt6UuHak9j3kHDP9zPHRHa+0kui0RkvC5l5XlB9TsByqQZSY73rZ0v
   Qu/BsDosANjMgm0kISp1QKExvm6JlNxXpH5SQuN4TuyvhfIRppm1kg0CgYEAwE3K
   xqfkGEc8TMezleIgBGGTNS+OyJ2RXOC1w2yDBNd215xyfu3WoW5UcNV3lgErPqHN
   EfzGgeTJQHruM6NqpRsNdPlzsXkwxs6mJdE69ktojiKi+bQ8Mn8BfshTx2M85RA0
   K8Vi1uO/d9fxAgCp2HSQEJP6oG+YoTlOLJvjW1kCgYEAq3K9m6R2/EeAx19HfZwQ
   YE+pS5C6p/9OjPnmFL1loFtc5p5Em7R/YYXuvJAe27hzVmUZZLcy2jldNRlOlv9C
   7ZfN2GQVblQqmTY3D1kPdFEN2S9dljHC04jUmrr4zQuWDCMM3ycJzYi//zuRBwot
   rFiCF7Ptj4Q8B6lTkMe/4U0CgYBKDWrZpwtiAgSJeJmCTUqRBVYftAmi3XJ9tpao
   A6BMfABqtPcuQ75T+d2QedOMMzUI8Fu84n86w/Rv3SbfQb2uiMVc1zajEA0lcaxv
   gavX7l/75ACocayAsYHM5a3FaUSo3N2KQX93SsqPhttrLwA4t2JG0AVCRNcctqmQ
   6hLaOQKBgAxnY5NWdBo28IEIgDIGWJ9P82Nzo49/IaYQ8UB4OaRTzSd3Q6ROFWTJ
   vDBj/3kPximstpKqrWZYCYq4qdzguGqAHP4ImWzYXrnMVCXoOImq9tSlfpSn9Zzz
   klM6R6tGizVp19KvMrwwl1IYoXI5bmWJdDssRgOnNIFaHs/8vSYC
   -----END RSA PRIVATE KEY-----
   ```
4. **Environment:** Check all boxes (Production, Preview, Development)
5. Click **"Save"**

**Important:** 
- Paste the entire key including `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
- Keep all the line breaks (Vercel will preserve them)
- Don't add quotes around the value

### 4. Optional: Custom API URL

If you need to use a different Kalshi API endpoint:

1. Click **"Add New"**
2. **Key:** `KALSHI_API_URL`
3. **Value:** `https://api.elections.kalshi.com/trade-api/v2` (or your custom URL)
4. **Environment:** Check all boxes
5. Click **"Save"**

### 5. Redeploy Your Application

**CRITICAL:** After adding environment variables, you MUST redeploy:

1. Go to the **"Deployments"** tab
2. Find your latest deployment
3. Click the **"..."** (three dots) menu on the right
4. Click **"Redeploy"**
5. Confirm the redeploy

**Important:** Environment variables are only loaded when the app is built/deployed. A redeploy is required!

## Verify It's Working

After redeployment:

1. Visit your Vercel site
2. Go to `/arbitrage` page
3. Check Vercel function logs (Settings → Logs) for:
   - `🔐 Kalshi API:` - Shows API calls
   - `✅ Fetched X markets from Kalshi` - Success!
   - Any error messages

## Current Environment Variables in Vercel

You should now have these in Vercel:

**Required:**
- ✅ `OPENAI_API_KEY` (for AI features)
- ✅ `OPENAI_MODEL` (optional, defaults to gpt-4o-mini)
- ✅ `GOOGLE_CUSTOM_SEARCH_API_KEY` (for web research)
- ✅ `GOOGLE_CUSTOM_SEARCH_ENGINE_ID` (for web research)
- ✅ `KALSHI_KEY_ID` (for arbitrage scanner) ← **NEW**
- ✅ `KALSHI_PRIVATE_KEY` (for arbitrage scanner) ← **NEW**

**Optional:**
- `KALSHI_API_URL` (if using custom endpoint)
- `TWILIO_ACCOUNT_SID` (for SMS alerts)
- `TWILIO_AUTH_TOKEN` (for SMS alerts)
- `TWILIO_PHONE_NUMBER` (for SMS alerts)
- `CRON_SECRET` (for securing cron endpoints)

## Troubleshooting

### Arbitrage still shows no opportunities
- Check Vercel logs for Kalshi API errors
- Verify credentials are correct
- Check that you redeployed after adding variables
- Look for authentication errors (401) in logs

### Private key format issues
- Make sure the entire key is pasted (including BEGIN/END lines)
- Don't add quotes in Vercel
- Line breaks should be preserved automatically

### API endpoint errors
- Try different base URLs if you see 404 errors
- Check Kalshi's REST API documentation for correct endpoint

