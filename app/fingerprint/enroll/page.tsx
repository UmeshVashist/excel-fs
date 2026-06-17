'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const FINGER_POSITIONS = [
  { id: 'thumb_right', label: 'Right Thumb', icon: '👍' },
  { id: 'index_right', label: 'Right Index', icon: '👆' },
  { id: 'middle_right', label: 'Right Middle', icon: '☞' },
  { id: 'ring_right', label: 'Right Ring', icon: '👉' },
  { id: 'pinky_right', label: 'Right Pinky', icon: '👉' },
  { id: 'thumb_left', label: 'Left Thumb', icon: '👍' },
  { id: 'index_left', label: 'Left Index', icon: '👆' },
  { id: 'middle_left', label: 'Left Middle', icon: '☞' },
  { id: 'ring_left', label: 'Left Ring', icon: '👉' },
  { id: 'pinky_left', label: 'Left Pinky', icon: '👉' }
];

export default function FingerprintEnrollPage() {
  const router = useRouter();
  const { userId } = useAuth();
  const [enrolledFingers, setEnrolledFingers] = useState<Set<string>>(new Set());
  const [currentFinger, setCurrentFinger] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId) {
      router.push('/sign-in');
      return;
    }
    checkDevice();
  }, [userId, router]);

  const checkDevice = async () => {
    try {
      const response = await fetch('/api/fingerprint/check-device', {
        method: 'POST'
      });
      const data = await response.json();
      setIsDeviceConnected(data.isDeviceConnected);
      setLoading(false);
    } catch (err) {
      setError('Failed to check device');
      setLoading(false);
    }
  };

  const startCapture = async (fingerId: string) => {
    if (!isDeviceConnected) {
      setError('Fingerprint scanner not connected. Please connect a Mantra MFS100/MFS110 device.');
      return;
    }

    setCurrentFinger(fingerId);
    setIsCapturing(true);
    setError(null);
    setMessage('Place your finger on the scanner...');
    setQualityScore(0);

    // Simulate fingerprint capture
    // In production, integrate with actual Mantra device SDK
    setTimeout(async () => {
      // Generate mock fingerprint data
      const mockTemplate = generateMockFingerprint();
      const mockQuality = Math.random() * 100;
      setQualityScore(Math.round(mockQuality));

      if (mockQuality >= 60) {
        await enrollFingerprint(fingerId, mockTemplate, Math.round(mockQuality));
      } else {
        setError('Fingerprint quality too low. Please try again.');
        setIsCapturing(false);
      }
    }, 3000);
  };

  const enrollFingerprint = async (fingerId: string, template: string, quality: number) => {
    try {
      const response = await fetch('/api/fingerprint/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fingerPosition: fingerId,
          templateData: template,
          qualityScore: quality,
          deviceType: 'MFS100'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEnrolledFingers(prev => new Set([...prev, fingerId]));
        setMessage(data.message);
        setIsCapturing(false);
        setCurrentFinger(null);

        if (data.allFingersEnrolled) {
          setTimeout(() => router.push('/fingerprint/success'), 2000);
        }
      } else {
        setError(data.error || 'Enrollment failed');
        setIsCapturing(false);
      }
    } catch (err) {
      setError('Enrollment failed. Please try again.');
      setIsCapturing(false);
    }
  };

  const generateMockFingerprint = () => {
    return Array.from({ length: 512 }, () =>
      Math.random().toString(36).charAt(2)
    ).join('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Checking fingerprint scanner...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Enroll Fingerprints</h1>
          <p className="text-gray-400">
            Register up to 5 fingers for biometric authentication. We recommend enrolling your thumb and index finger from both hands.
          </p>
        </div>

        {error && (
          <Card className="bg-red-900/20 border-red-500 p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-400">{error}</p>
          </Card>
        )}

        {message && !isCapturing && (
          <Card className="bg-green-900/20 border-green-500 p-4 mb-6 backdrop-blur-sm">
            <p className="text-green-400">{message}</p>
          </Card>
        )}

        <Card className="bg-slate-950/20 border-slate-700 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${isDeviceConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-white">
              Device: {isDeviceConnected ? 'Connected (Mantra MFS100/MFS110)' : 'Not Connected'}
            </span>
          </div>
          <p className="text-gray-400 text-sm">
            Fingers enrolled: {enrolledFingers.size} / 5
          </p>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {FINGER_POSITIONS.map(finger => (
            <button
              key={finger.id}
              onClick={() => startCapture(finger.id)}
              disabled={isCapturing || !isDeviceConnected || enrolledFingers.has(finger.id)}
              className={`p-4 rounded-lg border-2 transition-all ${
                enrolledFingers.has(finger.id)
                  ? 'bg-green-900/30 border-green-500 cursor-default'
                  : currentFinger === finger.id && isCapturing
                  ? 'bg-blue-900/30 border-blue-500 animate-pulse'
                  : 'bg-slate-900 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="text-2xl mb-2">{finger.icon}</div>
              <p className="text-white text-sm font-medium">{finger.label}</p>
              {enrolledFingers.has(finger.id) && (
                <p className="text-green-400 text-xs mt-1">✓ Done</p>
              )}
              {currentFinger === finger.id && isCapturing && (
                <div className="mt-2">
                  <div className="text-xs text-blue-400 mb-1">Quality: {qualityScore}%</div>
                  <div className="w-full bg-slate-700 rounded-full h-1">
                    <div
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${qualityScore}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 flex gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (enrolledFingers.size >= 5) {
                router.push('/fingerprint/success');
              } else {
                setMessage(`Please enroll at least 5 fingers. You have ${enrolledFingers.size} enrolled.`);
              }
            }}
            disabled={enrolledFingers.size < 5}
            className="flex-1"
          >
            Complete Enrollment ({enrolledFingers.size}/5)
          </Button>
        </div>
      </div>
    </div>
  );
}
