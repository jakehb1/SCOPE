/**
 * API Route to subscribe/unsubscribe to SMS alerts
 */

import { NextResponse } from 'next/server';
import { upsertAlertSubscription, deleteAlertSubscription, getAlertSubscription } from '@/lib/alert-service';
import { AlertPreferences } from '@/types/alerts';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, preferences, action } = body;

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      const deleted = await deleteAlertSubscription(phoneNumber);
      if (!deleted) {
        return NextResponse.json(
          { error: 'Subscription not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, message: 'Subscription deleted' });
    }

    if (!preferences) {
      return NextResponse.json(
        { error: 'Preferences are required' },
        { status: 400 }
      );
    }

    const subscription = await upsertAlertSubscription(phoneNumber, preferences as AlertPreferences);

    return NextResponse.json({
      success: true,
      subscription,
      message: action === 'update' ? 'Subscription updated' : 'Subscription created',
    });
  } catch (error) {
    console.error('Error managing alert subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to manage subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const phoneNumber = searchParams.get('phoneNumber');

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const subscription = await getAlertSubscription(phoneNumber);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subscription });
  } catch (error) {
    console.error('Error fetching alert subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

