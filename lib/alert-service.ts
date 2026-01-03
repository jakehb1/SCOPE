/**
 * Alert Service
 * 
 * Manages alert subscriptions and sends notifications
 */

import { AlertSubscription, AlertPreferences } from '@/types/alerts';
import { Market } from '@/types';
import { sendSMS, formatMarketAlert } from './twilio-service';
import { promises as fs } from 'fs';
import path from 'path';

const ALERTS_FILE = path.join(process.cwd(), 'data', 'alert-subscriptions.json');

let alertsCache: AlertSubscription[] | null = null;

/**
 * Load alert subscriptions from file
 */
async function loadAlerts(): Promise<AlertSubscription[]> {
  if (alertsCache) {
    return alertsCache;
  }

  try {
    const dataDir = path.dirname(ALERTS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    const data = await fs.readFile(ALERTS_FILE, 'utf-8');
    alertsCache = JSON.parse(data);
  } catch (error) {
    // File doesn't exist yet
    alertsCache = [];
  }

  return alertsCache!;
}

/**
 * Save alert subscriptions to file
 */
async function saveAlerts(alerts: AlertSubscription[]): Promise<void> {
  try {
    const dataDir = path.dirname(ALERTS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    await fs.writeFile(
      ALERTS_FILE,
      JSON.stringify(alerts, null, 2),
      'utf-8'
    );
    alertsCache = alerts;
  } catch (error) {
    console.error('Error saving alerts:', error);
    throw error;
  }
}

/**
 * Create or update an alert subscription
 */
export async function upsertAlertSubscription(
  phoneNumber: string,
  preferences: AlertPreferences
): Promise<AlertSubscription> {
  const alerts = await loadAlerts();
  
  // Find existing subscription
  const existingIndex = alerts.findIndex(
    a => a.phoneNumber === phoneNumber
  );

  const subscription: AlertSubscription = {
    id: existingIndex >= 0 ? alerts[existingIndex].id : `alert_${Date.now()}`,
    phoneNumber,
    preferences: {
      ...preferences,
      phoneNumber, // Ensure phone number is in preferences
    },
    createdAt: existingIndex >= 0 ? alerts[existingIndex].createdAt : new Date().toISOString(),
    lastNotified: existingIndex >= 0 ? alerts[existingIndex].lastNotified : undefined,
  };

  if (existingIndex >= 0) {
    alerts[existingIndex] = subscription;
  } else {
    alerts.push(subscription);
  }

  await saveAlerts(alerts);
  return subscription;
}

/**
 * Get alert subscription by phone number
 */
export async function getAlertSubscription(phoneNumber: string): Promise<AlertSubscription | null> {
  const alerts = await loadAlerts();
  return alerts.find(a => a.phoneNumber === phoneNumber) || null;
}

/**
 * Delete alert subscription
 */
export async function deleteAlertSubscription(phoneNumber: string): Promise<boolean> {
  const alerts = await loadAlerts();
  const filtered = alerts.filter(a => a.phoneNumber !== phoneNumber);
  
  if (filtered.length === alerts.length) {
    return false; // Not found
  }

  await saveAlerts(filtered);
  return true;
}

/**
 * Check if a market matches alert preferences
 */
function marketMatchesPreferences(market: Market, preferences: AlertPreferences): boolean {
  // Check if alerts are enabled
  if (!preferences.enabled) {
    return false;
  }

  // Check category filter
  if (preferences.categories.length > 0 && !preferences.categories.includes('all')) {
    if (!market.category || !preferences.categories.includes(market.category)) {
      return false;
    }
  }

  // Check keyword filter
  if (preferences.keywords.length > 0) {
    const marketText = `${market.question} ${market.slug}`.toLowerCase();
    const hasKeyword = preferences.keywords.some(keyword =>
      marketText.includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      return false;
    }
  }

  // Check volume threshold
  if (preferences.minVolume !== undefined && market.volume < preferences.minVolume) {
    return false;
  }

  // Check liquidity threshold
  if (preferences.minLiquidity !== undefined && market.liquidity < preferences.minLiquidity) {
    return false;
  }

  return true;
}

/**
 * Send alerts for new markets
 */
export async function sendAlertsForMarkets(markets: Market[]): Promise<number> {
  const alerts = await loadAlerts();
  let sentCount = 0;

  for (const alert of alerts) {
    if (!alert.preferences.enabled) {
      continue;
    }

    for (const market of markets) {
      if (marketMatchesPreferences(market, alert.preferences)) {
        const message = formatMarketAlert(market);
        const success = await sendSMS({
          to: alert.phoneNumber,
          message,
        });

        if (success) {
          sentCount++;
          // Update last notified time
          alert.lastNotified = new Date().toISOString();
          await saveAlerts(alerts);
        }
      }
    }
  }

  return sentCount;
}

