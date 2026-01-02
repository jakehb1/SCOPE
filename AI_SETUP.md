# AI Market Context Setup Guide

This guide explains how to set up AI-powered market context generation for the scope application.

## Overview

The AI context feature provides intelligent summaries, key dates, and important factors for each prediction market using OpenAI's API. This helps traders quickly understand what each market is about and what factors might influence the outcome.

## Setup Instructions

### 1. Get an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the API key (you won't be able to see it again)

### 2. Configure Environment Variables

Create a `.env.local` file in the root of your project (or add to your existing `.env` file):

```bash
# Required: Your OpenAI API key
OPENAI_API_KEY=sk-your-actual-api-key-here

# Optional: Choose which model to use
# Options:
#   - gpt-4o-mini (recommended): Fast, cost-effective, good quality
#   - gpt-4o: Best quality, more expensive
#   - gpt-3.5-turbo: Legacy, cheaper but lower quality
OPENAI_MODEL=gpt-4o-mini
```

### 3. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## How It Works

1. **User clicks "get context"** on a market card
2. **API checks cache** - If context was generated recently, it returns cached version
3. **Fetches market details** - Gets full market information from Polymarket
4. **Calls OpenAI API** - Sends market question, category, dates, and current price to AI
5. **AI generates context** - Returns structured summary, key dates, and factors
6. **Caches result** - Stores in memory cache for 24 hours
7. **Displays in modal** - Shows the context to the user

## Cost Considerations

- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **gpt-4o**: ~$2.50 per 1M input tokens, ~$10 per 1M output tokens
- Each context generation uses ~500-1000 tokens
- With caching, each market is only generated once per 24 hours

**Estimated costs:**
- 1000 markets/day with gpt-4o-mini: ~$0.10-0.20/day
- 1000 markets/day with gpt-4o: ~$1.50-3.00/day

## Customization

### Change the AI Model

Edit `.env.local`:
```bash
OPENAI_MODEL=gpt-4o  # Use GPT-4o for better quality
```

### Modify the Prompt

Edit `lib/ai-service.ts` - the `buildPrompt()` function to customize what information the AI receives and how it's formatted.

### Adjust Caching

Edit `lib/market-context-cache.ts` - change `DEFAULT_TTL` to cache for longer or shorter periods.

### Use a Different AI Provider

To use Anthropic Claude or another provider:

1. Modify `lib/ai-service.ts`
2. Update the API endpoint and request format
3. Adjust the prompt structure as needed

## Troubleshooting

### "AI context generation requires an API key"

- Make sure `OPENAI_API_KEY` is set in `.env.local`
- Restart your development server after adding the key
- Check that the key starts with `sk-`

### Context is not generating

- Check browser console for errors
- Verify your OpenAI API key is valid
- Check your OpenAI account has credits/billing set up
- Look at server logs for API errors

### Context is too generic

- Try using `gpt-4o` instead of `gpt-4o-mini` for better quality
- Modify the prompt in `lib/ai-service.ts` to be more specific
- Add more market details to the prompt

## Production Considerations

For production, consider:

1. **Database caching** - Replace in-memory cache with Redis or Postgres
2. **Rate limiting** - Add rate limits to prevent abuse
3. **Error handling** - Add retry logic and better error messages
4. **Monitoring** - Track API usage and costs
5. **Fallback** - Keep fallback context when AI is unavailable

## Security

- **Never commit** `.env.local` or `.env` files to git
- Keep your OpenAI API key secret
- Use environment variables, never hardcode keys
- Consider using a secrets management service in production

