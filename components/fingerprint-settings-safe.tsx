'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card } from '@/components/ui/card';

// Dynamically import FingerprintSettings with no SSR to avoid Clerk context issues
const FingerprintSettingsComponent = dynamic(
  () => import('./fingerprint-settings').then(mod => ({ default: mod.FingerprintSettings })),
  {
    ssr: false,
    loading: () => (
      <Card className="bg-slate-950/20 border-slate-700 p-6 backdrop-blur-sm">
        <p className="text-gray-400">Loading fingerprint settings...</p>
      </Card>
    ),
  }
);

export function FingerprintSettings() {
  return (
    <Suspense fallback={
      <Card className="bg-slate-950/20 border-slate-700 p-6 backdrop-blur-sm">
        <p className="text-gray-400">Loading fingerprint settings...</p>
      </Card>
    }>
      <FingerprintSettingsComponent />
    </Suspense>
  );
}
