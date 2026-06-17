'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface EnrolledFinger {
  id: string;
  finger_position: string;
  quality_score: number;
  captured_at: string;
  device_type: string;
}

interface FingerprintStatus {
  profile: {
    fingerprintEnabled: boolean;
    enrolledAt: string | null;
    lastAuthAt: string | null;
  };
  enrolledFingerprints: EnrolledFinger[];
  fingersEnrolled: number;
  allFingersEnrolled: boolean;
}

const FINGER_LABELS: Record<string, string> = {
  'thumb_right': 'Right Thumb',
  'index_right': 'Right Index',
  'middle_right': 'Right Middle',
  'ring_right': 'Right Ring',
  'pinky_right': 'Right Pinky',
  'thumb_left': 'Left Thumb',
  'index_left': 'Left Index',
  'middle_left': 'Left Middle',
  'ring_left': 'Left Ring',
  'pinky_left': 'Left Pinky'
};

export function FingerprintSettings() {
  const router = useRouter();
  const [status, setStatus] = useState<FingerprintStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/fingerprint/status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setError('Failed to load fingerprint status');
      }
    } catch (err) {
      setError('Error fetching fingerprint data');
    } finally {
      setLoading(false);
    }
  };

  const deleteFingerprint = async (fingerId: string) => {
    if (!confirm('Are you sure? This action cannot be undone.')) {
      return;
    }

    setDeleting(fingerId);
    try {
      const response = await fetch('/api/fingerprint/status', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fingerId })
      });

      if (response.ok) {
        await fetchStatus();
      } else {
        setError('Failed to delete fingerprint');
      }
    } catch (err) {
      setError('Error deleting fingerprint');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-950/20 border-slate-700 p-6 backdrop-blur-sm">
        <p className="text-gray-400">Loading fingerprint settings...</p>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card className="bg-slate-950/20 border-slate-700 p-6 backdrop-blur-sm">
        <p className="text-gray-400">Unable to load fingerprint settings</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Fingerprint Authentication</h3>
        
        <Card className="bg-slate-950/20 border-slate-700 p-6 mb-6 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-white font-medium mb-1">Status</p>
              <p className="text-sm text-gray-400">
                {status.profile.fingerprintEnabled
                  ? 'Fingerprint authentication is enabled'
                  : 'Fingerprint authentication is not set up'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${status.profile.fingerprintEnabled ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>

          {status.profile.enrolledAt && (
            <p className="text-xs text-gray-500">
              Enrolled on {new Date(status.profile.enrolledAt).toLocaleDateString()}
            </p>
          )}

          {status.profile.lastAuthAt && (
            <p className="text-xs text-gray-500">
              Last used on {new Date(status.profile.lastAuthAt).toLocaleDateString()}
            </p>
          )}
        </Card>

        {error && (
          <Card className="bg-red-900/20 border-red-500 p-4 mb-6 backdrop-blur-sm">
            <p className="text-red-400 text-sm">{error}</p>
          </Card>
        )}

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white font-medium">Enrolled Fingers ({status.fingersEnrolled}/5)</p>
            {!status.allFingersEnrolled && (
              <Button
                onClick={() => router.push('/fingerprint/enroll')}
                size="sm"
                className="gap-2 bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
              >
                <Plus className="w-4 h-4" />
                Add More
              </Button>
            )}
          </div>

          {status.enrolledFingerprints.length > 0 ? (
            <div className="space-y-2">
              {status.enrolledFingerprints.map(finger => (
                <Card
                  key={finger.id}
                  className="bg-slate-950/20 border-slate-700 p-4 flex items-center justify-between backdrop-blur-sm"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{FINGER_LABELS[finger.finger_position]}</p>
                    <p className="text-xs text-gray-500">
                      Quality: {finger.quality_score}% • {finger.device_type}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(finger.captured_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteFingerprint(finger.id)}
                    disabled={deleting === finger.id}
                    className="p-2 text-red-400 hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-950/20 border-slate-700 p-6 text-center backdrop-blur-sm">
              <p className="text-gray-400 mb-4">No fingerprints enrolled yet</p>
              <Button
                onClick={() => router.push('/fingerprint/enroll')}
                className="bg-slate-950/20 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-500 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-blue-600/50"
              >
                Start Enrollment
              </Button>
            </Card>
          )}
        </div>

        {status.allFingersEnrolled && (
          <Card className="bg-green-900/20 border-green-500 p-4 backdrop-blur-sm">
            <p className="text-green-400 text-sm">
              All 5 fingers enrolled. You can now use fingerprint authentication to log in.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
