'use client';

import { Suspense } from 'react';
import MarketChat from '@/components/chat/MarketChat';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="section-container py-8">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    }>
      <MarketChat />
    </Suspense>
  );
}

