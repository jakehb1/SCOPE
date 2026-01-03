/**
 * Alert-related type definitions
 */

export interface AlertPreferences {
  phoneNumber: string;
  enabled: boolean;
  categories: string[]; // Market categories to alert on
  keywords: string[]; // Keywords to filter markets
  minVolume?: number; // Minimum volume threshold
  minLiquidity?: number; // Minimum liquidity threshold
}

export interface AlertSubscription {
  id: string;
  phoneNumber: string;
  preferences: AlertPreferences;
  createdAt: string;
  lastNotified?: string;
}

