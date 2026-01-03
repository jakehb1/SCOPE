/**
 * Kalshi API Authentication
 * 
 * Kalshi uses RSA signature-based authentication with PSS padding
 * Requests must be signed with the private key
 * 
 * Documentation: https://docs.kalshi.com/getting_started/api_keys
 */

import crypto from 'crypto';

interface KalshiAuthHeaders {
  'KALSHI-ACCESS-KEY': string;
  'KALSHI-ACCESS-SIGNATURE': string;
  'KALSHI-ACCESS-TIMESTAMP': string;
}

/**
 * Generate authentication headers for Kalshi API
 * 
 * Signature format: timestamp (milliseconds) + HTTP method + endpoint path
 * Uses RSA-PSS with SHA-256
 */
export function generateKalshiAuth(
  method: string,
  path: string,
  body: string = '',
  keyId: string,
  privateKey: string
): KalshiAuthHeaders {
  // Kalshi uses milliseconds for timestamp
  const timestamp = Date.now().toString();
  
  // Create the message to sign: timestamp + method + path
  // Note: body is typically not included for GET requests
  const message = `${timestamp}${method}${path}`;
  
  try {
    // Sign using RSA-PSS with SHA-256 (Kalshi's format)
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(message, 'utf8');
    sign.end();
    
    // Use PSS padding (Kalshi's requirement)
    const signature = sign.sign({
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
      saltLength: crypto.constants.RSA_PSS_SALTLEN_MAX_SIGN,
    }, 'base64');
    
    return {
      'KALSHI-ACCESS-KEY': keyId,
      'KALSHI-ACCESS-SIGNATURE': signature,
      'KALSHI-ACCESS-TIMESTAMP': timestamp,
    };
  } catch (error) {
    console.error('Error generating Kalshi auth signature:', error);
    throw new Error('Failed to generate authentication signature');
  }
}

/**
 * Parse private key from PEM format
 * Handles keys stored in .env files (may have \n escaped)
 */
export function parsePrivateKey(keyString: string): string {
  // Remove quotes if present
  let key = keyString.trim();
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  
  // Replace escaped newlines with actual newlines
  key = key.replace(/\\n/g, '\n');
  
  // Ensure proper PEM formatting
  if (!key.includes('\n')) {
    // If no newlines, try to add them at the right places
    key = key.replace(/-----BEGIN RSA PRIVATE KEY-----/, '-----BEGIN RSA PRIVATE KEY-----\n');
    key = key.replace(/-----END RSA PRIVATE KEY-----/, '\n-----END RSA PRIVATE KEY-----');
  }
  
  return key.trim();
}

