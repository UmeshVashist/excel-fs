'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { Fingerprint, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { checkMantraDevice, startLiveCapture } from '@/lib/mantra-device';

const FINGER_POSITIONS = [
  { id: 'thumb_right', label: 'Right Thumb' },
  { id: 'index_right', label: 'Right Index' },
  { id: 'middle_right', label: 'Right Middle' },
  { id: 'ring_right', label: 'Right Ring' },
  { id: 'pinky_right', label: 'Right Pinky' },
  { id: 'thumb_left', label: 'Left Thumb' },
  { id: 'index_left', label: 'Left Index' },
  { id: 'middle_left', label: 'Left Middle' },
  { id: 'ring_left', label: 'Left Ring' },
  { id: 'pinky_left', label: 'Left Pinky' },
];

interface EnrolledFinger {
  id: string;
  finger_position: string;
  quality_score: number;
  captured_at: string;
  device_type: string;
}

export default function FingerprintManagePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [email, setEmail] = useState('');
  const [enrolledFingers, setEnrolledFingers] = useState<EnrolledFinger[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [selectedFinger, setSelectedFinger] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        // Check device with a small delay to ensure service is ready
        console.log('[v0] Initializing page, checking device...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkDevice();
        
        // Try to get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          setUserId(user.id);
          setEmail(user.email || '');
          await fetchEnrolledFingers(user.id);
        }
        setLoading(false);
      } catch (err) {
        console.error('[v0] Init error:', err);
        setLoading(false);
      }
    };

    initPage();
  }, [supabase]);

  const fetchEnrolledFingers = async (userId: string) => {
    try {
      const response = await fetch(`/api/fingerprint/status?userId=${userId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        console.warn('[v0] Status API returned:', response.status);
        return;
      }
      
      const data = await response.json();
      if (data.enrolledFingerprints) {
        setEnrolledFingers(data.enrolledFingerprints);
      }
    } catch (err) {
      console.error('[v0] Failed to fetch enrolled fingers:', err);
    }
  };

  const checkDevice = async () => {
    try {
      console.log('[v0] Checking Mantra device...');
      
      // Check if real Mantra AVDM service is running
      const isMantraConnected = await checkMantraDevice();
      console.log('[v0] Mantra device check result:', isMantraConnected);
      
      if (isMantraConnected) {
        setIsDeviceConnected(true);
        setError(null);
        console.log('[v0] Device connected - ready for fingerprint enrollment');
      } else {
        setIsDeviceConnected(false);
        setError('Mantra AVDM service is not running. Please start the device and try again.');
        console.log('[v0] Device NOT connected - cannot enroll');
      }
    } catch (err) {
      console.error('[v0] Device check failed:', err);
      setIsDeviceConnected(false);
      setError('Failed to check device status: ' + String(err));
    }
  };

  const handleEnrollFinger = async () => {
    if (!selectedFinger) {
      setError('Please select a finger to enroll');
      return;
    }

    if (!isDeviceConnected) {
      setError('Fingerprint scanner not connected');
      return;
    }

    setIsScanning(true);
    setError(null);
    setMessage('Place your finger on the scanner...');
    setScanProgress(0);

    const interval = setInterval(() => {
      setScanProgress((prev) => Math.min(prev + Math.random() * 30, 90));
    }, 300);

    // Try to capture real fingerprint from Mantra device
    try {
      clearInterval(interval);
      
      const fingerprint = await startLiveCapture(
        (quality) => {
          console.log('[v0] Fingerprint quality:', quality);
        },
        (progress) => {
          setScanProgress(progress);
        }
      );
      
      console.log('[v0] Fingerprint captured with quality:', fingerprint.qualityScore);
      setScanProgress(100);

      if (!userId) {
        throw new Error('User ID not available - please log in');
      }

      if (!selectedFinger) {
        throw new Error('Please select a finger position');
      }

      console.log('[v0] Sending fingerprint to enroll API...');
      const response = await fetch('/api/fingerprint/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          fingerPosition: selectedFinger,
          templateData: fingerprint.templateData,
          qualityScore: fingerprint.qualityScore,
          deviceType: 'MFS110',
        }),
      });

      console.log('[v0] Enroll API response status:', response.status);
      const data = await response.json();
      console.log('[v0] Enroll API response:', data);

      if (response.ok) {
        setMessage(`Fingerprint enrolled successfully! (${data.fingersEnrolled}/5 fingers)`);
        setSelectedFinger('');
        setError(null);
        await fetchEnrolledFingers(userId);
      } else {
        setError(data.error || 'Failed to enroll fingerprint');
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg || 'Fingerprint capture failed');
      console.error('[v0] Enrollment error:', errMsg, err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleDeleteFinger = async (fingerId: string) => {
    if (!confirm('Are you sure you want to remove this fingerprint?')) return;

    setDeleting(fingerId);
    try {
      const response = await fetch('/api/fingerprint/status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, fingerId }),
      });

      if (response.ok) {
        setEnrolledFingers(enrolledFingers.filter((f) => f.id !== fingerId));
        setMessage('Fingerprint removed successfully');
      } else {
        setError('Failed to remove fingerprint');
      }
    } catch (err) {
      setError('Failed to remove fingerprint');
      console.error('[v0] Delete error:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading fingerprint management...</p>
        </div>
      </div>
    );
  }

  const availableFingers = FINGER_POSITIONS.filter(
    (pos) => !enrolledFingers.some((f) => f.finger_position === pos.id)
  );

  const getFingerLabel = (fingerId: string) => {
    return FINGER_POSITIONS.find((p) => p.id === fingerId)?.label || fingerId;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-slate-400 hover:text-slate-300 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Fingerprint Management</h1>
            <p className="text-slate-400">Manage your registered fingerprints for biometric authentication</p>
          </div>
        </div>

        {/* Enrolled Fingers */}
        <Card className="border-slate-700 bg-slate-950/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Enrolled Fingerprints</CardTitle>
            <CardDescription className="text-slate-400">
              {enrolledFingers.length} of 10 fingers enrolled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {enrolledFingers.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No fingerprints enrolled yet. Add your first fingerprint below.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrolledFingers.map((finger) => (
                  <div
                    key={finger.id}
                    className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-violet-500" />
                      <div>
                        <p className="text-white font-medium text-sm">{getFingerLabel(finger.finger_position)}</p>
                        <p className="text-xs text-slate-400">Quality: {finger.quality_score}%</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFinger(finger.id)}
                      disabled={deleting === finger.id}
                      className="text-red-400 hover:text-red-300 transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enroll New Fingerprint */}
        {availableFingers.length > 0 && (
          <Card className="border-violet-700/50 bg-slate-950/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add New Fingerprint
              </CardTitle>
              <CardDescription className="text-slate-400">Enroll a new finger for authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {message && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
                  <p className="text-blue-400 text-sm">{message}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-300">Select Finger</Label>
                <select
                  value={selectedFinger}
                  onChange={(e) => setSelectedFinger(e.target.value)}
                  disabled={isScanning}
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 text-white rounded-lg focus:outline-none focus:border-violet-500"
                >
                  <option value="">Choose a finger...</option>
                  {availableFingers.map((finger) => (
                    <option key={finger.id} value={finger.id}>
                      {finger.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className={`flex items-center justify-between p-3 rounded-lg ${
                  isDeviceConnected 
                    ? 'bg-green-900/30 border border-green-700' 
                    : 'bg-red-900/30 border border-red-700'
                }`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isDeviceConnected ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <span className={`text-sm font-medium ${
                      isDeviceConnected ? 'text-green-300' : 'text-red-300'
                    }`}>
                      {isDeviceConnected ? '✓ Scanner Connected - Ready to Enroll' : '✗ Scanner Not Connected - Cannot Enroll'}
                    </span>
                  </div>
                  <button
                    onClick={() => checkDevice()}
                    className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition"
                  >
                    Refresh
                  </button>
                </div>
                
                {!isDeviceConnected && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 text-sm text-blue-200 space-y-3">
                    <p className="font-semibold text-amber-300">
                      ⚠️ Fingerprint Scanner Not Detected
                    </p>
                    <div className="space-y-2 text-xs">
                      <p><strong>To use the fingerprint scanner:</strong></p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Make sure Mantra AVDM service is running on your machine</li>
                        <li>Connect your Mantra MFS110 scanner to your computer</li>
                        <li>Ensure the service is accessible on localhost:9000</li>
                        <li>Run this app locally (not on Vercel cloud)</li>
                        <li>Click "Refresh" button and try again</li>
                      </ol>
                      <p className="text-xs text-blue-300 pt-2 border-t border-blue-700 mt-2 pt-2">
                        <strong>Note:</strong> Fingerprint scanning works only in local development mode. If you're accessing this from Vercel cloud deployment, the scanner won't be accessible. Deploy locally or use the Mantra AVDM service on the same network.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {isScanning && (
                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 text-center space-y-4">
                  <div className="text-5xl animate-bounce">👆</div>
                  <p className="text-blue-300 font-medium">Scanning...</p>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${scanProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-slate-400">{Math.round(scanProgress)}%</p>
                </div>
              )}

              <Button
                onClick={() => {
                  checkDevice();
                  handleEnrollFinger();
                }}
                disabled={isScanning || !selectedFinger || !isDeviceConnected}
                className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium disabled:opacity-50"
              >
                {!isDeviceConnected ? 'Device Not Connected' : isScanning ? 'Scanning...' : 'Scan Fingerprint'}
              </Button>
            </CardContent>
          </Card>
        )}

        {availableFingers.length === 0 && enrolledFingers.length > 0 && (
          <Card className="border-slate-700 bg-slate-950/20 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-slate-300 text-center">All 10 fingers have been enrolled!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
