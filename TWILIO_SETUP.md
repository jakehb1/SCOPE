# Twilio SMS Alerts Setup

This guide explains how to set up Twilio for SMS alerts when new markets are created.

## Overview

The SMS alerts feature sends text messages to users when new Polymarket markets are created that match their preferences (categories, keywords, volume thresholds, etc.).

## Setup Instructions

### 1. Get Twilio Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign up or log in
3. Get your **Account SID** and **Auth Token** from the dashboard
4. Get a **Phone Number**:
   - Go to "Phone Numbers" → "Manage" → "Buy a number"
   - Choose a number (US numbers are cheapest for testing)
   - This is the number that will send SMS alerts

### 2. Configure Environment Variables

#### Local Development (.env.local)

Add these variables to your `.env.local` file:

```bash
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
CRON_SECRET=your_random_secret_here  # Optional: for securing the cron endpoint
```

#### Vercel Deployment

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **SCOPE** project
3. Click **"Settings"** → **"Environment Variables"**
4. Add:
   - `TWILIO_ACCOUNT_SID` = your Account SID
   - `TWILIO_AUTH_TOKEN` = your Auth Token
   - `TWILIO_PHONE_NUMBER` = your Twilio phone number (with + prefix)
   - `CRON_SECRET` = a random secret string (optional, for securing cron endpoint)
5. Select all environments (Production, Preview, Development)
6. **Redeploy** your application

## Setting Up Automatic Market Checks

### Option 1: Vercel Cron Jobs (Recommended)

1. Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/alerts/check",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This checks for new markets every 5 minutes.

2. If you set `CRON_SECRET`, update the cron job to include it:

```json
{
  "crons": [
    {
      "path": "/api/alerts/check?secret=your_cron_secret",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Option 2: External Cron Service

Use a service like [cron-job.org](https://cron-job.org/) or [EasyCron](https://www.easycron.com/) to call:

```
https://your-domain.vercel.app/api/alerts/check
```

If you set `CRON_SECRET`, include it in the Authorization header:
```
Authorization: Bearer your_cron_secret
```

## How It Works

1. **User subscribes** via the `/alerts` page with their phone number and preferences
2. **Background job** calls `/api/alerts/check` periodically (every 5 minutes)
3. **System fetches** current markets from Polymarket
4. **System compares** to previously seen markets to find new ones
5. **System filters** new markets based on user preferences
6. **System sends SMS** via Twilio to matching subscribers
7. **System tracks** which markets have been seen to avoid duplicate alerts

## Cost Considerations

### Twilio Pricing
- **US/Canada**: ~$0.0075 per SMS
- **International**: Varies by country
- Free trial includes $15.50 credit

### Example Costs
- 100 alerts/day = ~$0.75/day = ~$22.50/month
- 1000 alerts/day = ~$7.50/day = ~$225/month

### Optimization Tips
- Use category/keyword filters to reduce unnecessary alerts
- Set minimum volume/liquidity thresholds
- Cache seen markets to avoid duplicate checks

## Troubleshooting

### "Twilio credentials not configured"
- Make sure all three environment variables are set
- Restart your development server after adding variables
- For Vercel, make sure you redeployed after adding variables

### SMS not sending
- Check Twilio console for error logs
- Verify your phone number format (should include country code)
- Check your Twilio account balance
- Verify the phone number is verified (for trial accounts)

### No alerts received
- Check that the cron job is running (`/api/alerts/check`)
- Verify your subscription preferences match new markets
- Check Vercel logs for errors
- Make sure markets are being tracked (check `/data/seen-markets.json`)

### Too many alerts
- Add more specific category/keyword filters
- Increase minimum volume/liquidity thresholds
- Disable alerts temporarily via the UI

## Security Notes

- Never commit `.env.local` or environment variables to git
- Use `CRON_SECRET` to protect the cron endpoint from unauthorized access
- Twilio credentials are sensitive - keep them secure
- Phone numbers are stored locally in `/data/alert-subscriptions.json`

## Testing

1. Subscribe with your phone number on `/alerts`
2. Manually trigger a check: `GET /api/alerts/check`
3. Create a test market (or wait for a real new market)
4. You should receive an SMS within the next cron cycle

## Next Steps

- Add email alerts as an alternative to SMS
- Add webhook support for custom integrations
- Add rate limiting to prevent spam
- Add user authentication for multiple subscriptions per user

