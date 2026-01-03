# Kalshi API Setup for Arbitrage Scanner

The arbitrage scanner compares prices between Polymarket and Kalshi to find profitable opportunities. To enable it, you need to integrate with Kalshi's API.

## Current Status

The arbitrage scanner is **fully implemented** but currently shows no opportunities because:
- Kalshi API integration is a placeholder
- The `fetchKalshiMarkets()` function returns empty data
- You need to add Kalshi API credentials and endpoints

## Option 1: Kalshi Official API (If Available)

### Steps to Enable:

1. **Get Kalshi API Access**
   - Check if Kalshi offers a public API: https://kalshi.com
   - Contact Kalshi support for API access
   - You may need to be a registered user or have a trading account

2. **Add API Credentials**
   
   Add to `.env.local`:
   ```bash
   KALSHI_API_KEY=your_api_key_here
   KALSHI_API_SECRET=your_api_secret_here
   # Or if they use different auth:
   KALSHI_USERNAME=your_username
   KALSHI_PASSWORD=your_password
   ```

3. **Update `lib/kalshi-api.ts`**
   
   Replace the placeholder `fetchKalshiMarkets()` function with actual API calls:
   
   ```typescript
   export async function fetchKalshiMarkets(limit: number = 500): Promise<KalshiResponse> {
     const apiKey = process.env.KALSHI_API_KEY;
     
     if (!apiKey) {
       console.warn('Kalshi API key not configured');
       return { markets: [] };
     }
     
     try {
       // Example API call (adjust endpoint based on Kalshi's actual API)
       const response = await fetch('https://api.kalshi.com/trade-api/v2/events', {
         method: 'GET',
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json',
         },
       });
       
       if (!response.ok) {
         throw new Error(`Kalshi API error: ${response.status}`);
       }
       
       const data = await response.json();
       
       // Transform Kalshi response to our format
       const markets: KalshiMarket[] = data.events?.map((event: any) => ({
         event_ticker: event.event_ticker,
         title: event.title,
         subtitle: event.subtitle,
         category: event.category,
         yes_bid: event.yes_bid,
         yes_ask: event.yes_ask,
         last_price: event.last_price,
         volume: event.volume,
         open_interest: event.open_interest,
         url: `https://kalshi.com/markets/${event.event_ticker}`,
       })) || [];
       
       return { markets };
     } catch (error) {
       console.error('Error fetching Kalshi markets:', error);
       return { markets: [] };
     }
   }
   ```

## Option 2: Web Scraping (Not Recommended)

If Kalshi doesn't offer a public API, you could scrape their website, but this is:
- ❌ Against their terms of service
- ❌ Unreliable (breaks when they change HTML)
- ❌ Slow and resource-intensive
- ❌ May get you blocked

**We strongly recommend using an official API if available.**

## Option 3: Manual Testing / Demo Mode

For testing purposes, you can add mock data:

```typescript
export async function fetchKalshiMarkets(limit: number = 500): Promise<KalshiResponse> {
  // Mock data for testing
  if (process.env.NODE_ENV === 'development') {
    return {
      markets: [
        {
          event_ticker: 'TEST-1',
          title: 'Will Bitcoin reach $100k by end of 2024?',
          category: 'crypto',
          yes_bid: 0.45,
          yes_ask: 0.50,
          last_price: 0.48,
          url: 'https://kalshi.com/markets/TEST-1',
        },
        // Add more mock markets...
      ],
    };
  }
  
  return { markets: [] };
}
```

## Option 4: Alternative Data Sources

If Kalshi API isn't available, consider:
- **Manifold Markets API** - Another prediction market platform
- **Augur** - Decentralized prediction markets
- **Other platforms** - Check what APIs are available

## Testing the Integration

Once you've added Kalshi API integration:

1. **Test the API endpoint:**
   ```bash
   curl http://localhost:3000/api/arbitrage
   ```

2. **Check the logs:**
   - Look for "Error fetching Kalshi markets" in console
   - Verify API responses are being parsed correctly

3. **Verify opportunities:**
   - Visit `/arbitrage` page
   - You should see opportunities if there are price differences
   - Check that spreads are calculated correctly

## Current Implementation Details

The arbitrage scanner:
- ✅ Fetches markets from Polymarket (working)
- ✅ Matches markets between platforms using fuzzy matching
- ✅ Calculates spreads after fees (Polymarket 2%, Kalshi 10%)
- ✅ Filters by category
- ✅ Displays opportunities in a table
- ❌ Fetches markets from Kalshi (needs API integration)

## Fee Assumptions

Current fee assumptions (adjustable in `lib/arbitrage-matcher.ts`):
- **Polymarket:** 2% fee
- **Kalshi:** 10% fee (estimated)

These can be updated if you have more accurate fee information.

## Next Steps

1. **Contact Kalshi** to inquire about API access
2. **Check Kalshi documentation** for any public endpoints
3. **Update `lib/kalshi-api.ts`** with actual API calls
4. **Add environment variables** for API credentials
5. **Test the integration** with real data
6. **Adjust matching algorithm** if needed for better accuracy

## Troubleshooting

### "No arbitrage opportunities found"
- This is normal if Kalshi API isn't integrated yet
- Once integrated, opportunities will appear when price differences exist
- Real arbitrage opportunities are rare and disappear quickly

### API errors
- Check that API credentials are correct
- Verify API endpoint URLs
- Check rate limits
- Review API response format matches expected structure

### Matching issues
- The fuzzy matching algorithm may need tuning
- Adjust `threshold` in `isSameEvent()` function
- Consider adding more sophisticated matching (date matching, team names, etc.)

## Resources

- Kalshi Website: https://kalshi.com
- Check for API documentation on their site
- Contact support: support@kalshi.com (if available)

