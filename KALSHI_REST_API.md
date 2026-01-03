# Kalshi REST API Integration

Based on the [Kalshi API documentation](https://docs.kalshi.com/getting_started/quick_start_websockets), here's how the REST API authentication works.

## Authentication Format

Kalshi uses RSA-PSS signature authentication for both REST and WebSocket APIs.

### Signature Generation

1. **Create message to sign:**
   ```
   timestamp (milliseconds) + HTTP_METHOD + PATH
   ```
   
   Example for GET /events:
   ```
   1234567890123GET/events
   ```

2. **Sign with RSA-PSS:**
   - Algorithm: RSA-SHA256
   - Padding: RSA-PSS
   - Salt length: Digest length (SHA-256 = 32 bytes)

3. **Headers:**
   ```
   KALSHI-ACCESS-KEY: your_key_id
   KALSHI-ACCESS-SIGNATURE: base64_encoded_signature
   KALSHI-ACCESS-TIMESTAMP: timestamp_in_milliseconds
   ```

## REST API Endpoint

The WebSocket docs show WebSocket endpoints, but for REST API, try:

- **Production:** `https://api.elections.kalshi.com/trade-api/v2`
- **Demo:** `https://demo-api.kalshi.co/trade-api/v2`

Common REST endpoints:
- `/events` - List events/markets
- `/portfolio/balance` - Get portfolio balance
- `/orders` - Order management

## Testing the Integration

1. **Check credentials are loaded:**
   - Look for `🔐 Kalshi API:` log message
   - Should show the full URL being called

2. **Check authentication:**
   - If you see `401` errors, authentication failed
   - Verify signature format matches Kalshi's requirements
   - Check that path doesn't include query string when signing

3. **Check response:**
   - Look for `📦 Kalshi API response structure:` log
   - This shows what the API actually returns
   - Adjust parsing based on actual response structure

## Troubleshooting

### 401 Authentication Failed
- Verify `KALSHI_KEY_ID` is correct
- Check `KALSHI_PRIVATE_KEY` is properly formatted (with newlines)
- Ensure signature uses RSA-PSS with digest-length salt
- Verify path doesn't include query parameters when signing

### Wrong Endpoint
- Try `https://api.elections.kalshi.com/trade-api/v2`
- Try `https://trading-api.kalshi.com/trade-api/v2`
- Check Kalshi's REST API documentation for correct endpoint

### Response Format Issues
- Check server logs for actual response structure
- Adjust `events` parsing in `lib/kalshi-api.ts` based on what you see

## Next Steps

Once the API is working:
1. Markets will be fetched from Kalshi
2. Arbitrage opportunities will be calculated
3. Opportunities will appear on `/arbitrage` page

