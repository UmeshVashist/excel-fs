'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FingerprintPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to fingerprint login page
    router.push('/fingerprint/login');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Redirecting to fingerprint login...</p>
      </div>
    </div>
  );
}
