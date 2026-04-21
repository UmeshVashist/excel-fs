'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EnrollmentSuccessPage() {
  const router = useRouter();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
    }
  }, [userId, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <Card className="bg-slate-950/20 border-slate-700 p-8 max-w-md w-full text-center backdrop-blur-sm">
        <div className="mb-6">
          <div className="text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-white mb-2">Enrollment Complete!</h1>
          <p className="text-gray-400">
            Your fingerprints have been successfully registered. You can now use fingerprint authentication to log in.
          </p>
        </div>

        <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
          <p className="text-green-400 text-sm">
            Fingerprint authentication is now active on your account.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/fingerprint')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Try Fingerprint Login
          </Button>
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>

        <p className="text-gray-500 text-xs mt-6">
          You can manage your fingerprints in Settings → Fingerprint Authentication
        </p>
      </Card>
    </div>
  );
}
