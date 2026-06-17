'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { Fingerprint, ArrowLeft, AlertCircle } from 'lucide-react';
import { startLiveCapture } from '@/lib/mantra-device';

export default function FingerprintAuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeviceReady, setIsDeviceReady] = useState(false);

  useEffect(() => {
    checkDevice();
  }, []);

  const checkDevice = async () => {
    try {
      const previouslyDetected = localStorage.getItem('mantraDeviceConnected') === 'true';
      setIsDeviceReady(previouslyDetected);
    } catch (err) {
      console.error('[v0] Device check failed:', err);
      setIsDeviceReady(false);
    }
  };

  const handleFingerprintAuth = async () => {
    try {
      setIsScanning(true);
      setError(null);
      setMessage(null);
      setScanProgress(0);

      console.log('[v0] Starting fingerprint authentication...');

      // Capture fingerprint
      const fingerprint = await startLiveCapture(
        (quality) => {
          console.log('[v0] Fingerprint quality:', quality);
        },
        (progress) => {
          setScanProgress(progress);
        }
      );

      console.log('[v0] Fingerprint captured, quality:', fingerprint.qualityScore);
      setScanProgress(90);

      // Send to authentication API
      const response = await fetch('/api/fingerprint/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateData: fingerprint.templateData,
          qualityScore: fingerprint.qualityScore,
        }),
      });

      console.log('[v0] Auth API response status:', response.status);
      const data = await response.json();
      console.log('[v0] Auth API response:', data);

      if (response.ok && data.userId) {
        setScanProgress(100);
        setMessage('Authentication successful! Redirecting...');
        
        // Store session and redirect
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('userEmail', data.email || '');
        
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      } else {
        setError(data.error || 'Fingerprint authentication failed. No matching fingerprint found.');
        setScanProgress(0);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'Fingerprint capture failed');
      console.error('[v0] Authentication error:', errMsg);
      setScanProgress(0);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          onClick={() => router.push('/auth/login')}
          className="mb-6 text-slate-400 hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Login
        </Button>

        <Card className="bg-slate-950/20 border-slate-800 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-violet-600/20 rounded-lg">
                <Fingerprint className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <CardTitle>Fingerprint Login</CardTitle>
                <CardDescription>
                  Authenticate with your fingerprint
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-3 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-3">
                <p className="text-sm text-green-300">{message}</p>
              </div>
            )}

            {!isScanning ? (
              <div className="space-y-4">
                <div className="bg-slate-950/20 border border-slate-700 rounded-lg p-4 text-center space-y-3 backdrop-blur-sm">
                  <Fingerprint className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-slate-300 font-medium">Place your finger on the scanner</p>
                    <p className="text-sm text-slate-400 mt-1">
                      Any enrolled fingerprint will work
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleFingerprintAuth}
                  disabled={!isDeviceReady}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium"
                >
                  Start Fingerprint Scan
                </Button>

                {!isDeviceReady && (
                  <div className="bg-amber-900/20 border border-amber-700 rounded-lg p-3">
                    <p className="text-xs text-amber-300">
                      Device not detected. Please enroll a fingerprint first in Fingerprint Management.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-slate-950/20 border border-slate-700 rounded-lg p-8 text-center space-y-4 backdrop-blur-sm">
                  <div className="flex justify-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className="text-slate-700"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeDasharray={`${(scanProgress / 100) * 283} 283`}
                          className="text-violet-500 transition-all duration-300"
                        />
                      </svg>
                      <Fingerprint className="w-12 h-12 text-violet-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-300 font-medium">Scanning...</p>
                    <p className="text-sm text-slate-400 mt-1">{scanProgress}%</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    Please hold your finger steady on the scanner
                  </p>
                </div>
              </div>
            )}

            <hr className="border-slate-800" />

            <Button
              variant="outline"
              onClick={() => router.push('/auth/login')}
              className="w-full border-slate-700 hover:bg-slate-800"
            >
              Use Password Instead
            </Button>
          </CardContent>
        </Card>

        <p className="text-xs text-slate-500 text-center mt-4">
          Your fingerprint data is encrypted and only stored locally on your device.
        </p>
      </div>
    </div>
  );
}
