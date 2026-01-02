# Vercel Environment Variables Setup

To enable AI features on your Vercel deployment, you need to add environment variables in the Vercel dashboard.

## Steps to Add Environment Variables

1. **Go to your Vercel project dashboard**
   - Visit https://vercel.com/dashboard
   - Select your SCOPE project

2. **Navigate to Settings → Environment Variables**

3. **Add the following environment variables:**

   ```
   OPENAI_API_KEY = your-openai-api-key-here
   ```

   ```
   OPENAI_MODEL = gpt-4o-mini
   ```

4. **Select environments:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. **Redeploy your application**
   - After adding the variables, go to the Deployments tab
   - Click the three dots (⋯) on the latest deployment
   - Select "Redeploy"
   - Or push a new commit to trigger a redeploy

## Important Notes

- Environment variables in Vercel are encrypted and secure
- They are only available to server-side code (API routes)
- After adding variables, you MUST redeploy for them to take effect
- The `.env.local` file is only for local development

## Verifying It Works

After redeploying, test the AI features:
- Visit `/chat` and send a message
- Visit `/recommendations` and submit the form
- Click "get context" on any market

If you see AI-generated responses (not fallback messages), it's working!

