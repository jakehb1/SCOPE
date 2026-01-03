/**
 * Twilio SMS Service
 * 
 * Handles sending SMS alerts via Twilio
 */

interface SendSMSOptions {
  to: string;
  message: string;
}

/**
 * Send SMS via Twilio
 */
export async function sendSMS({ to, message }: SendSMSOptions): Promise<boolean> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('⚠️ Twilio credentials not configured');
    return false;
  }

  try {
    // Format phone number (ensure it starts with +)
    const formattedTo = to.startsWith('+') ? to : `+${to}`;

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedTo,
          Body: message,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Twilio API error:', response.status, error);
      return false;
    }

    const data = await response.json();
    console.log('✅ SMS sent successfully:', data.sid);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Format market alert message
 */
export function formatMarketAlert(market: {
  question: string;
  category?: string;
  volume: number;
  yesPrice?: number;
  url: string;
}): string {
  const category = market.category ? `[${market.category.toUpperCase()}] ` : '';
  const price = market.yesPrice ? `YES: ${market.yesPrice.toFixed(1)}% | ` : '';
  const volume = `Vol: $${formatCurrency(market.volume)}`;
  
  return `🔔 New Market Alert\n\n${category}${market.question}\n\n${price}${volume}\n\nView: ${market.url}`;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
}

