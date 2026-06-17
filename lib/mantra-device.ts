// Mantra MFS100/MFS110 Device Integration
// This utility communicates with the Mantra AVDM (Active Virtual Device Manager)

// Mantra AVDM service URL - try multiple possible endpoints
const MANTRA_AVDM_URLS = [
  'http://localhost:9000',
  'http://127.0.0.1:9000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];
const MANTRA_TIMEOUT = 10000; // 10 seconds
let ACTIVE_MANTRA_URL = MANTRA_AVDM_URLS[0]; // Will be updated when connection succeeds

export interface MantraDevice {
  name: string;
  serialNumber: string;
  isConnected: boolean;
  deviceType: 'MFS100' | 'MFS110';
}

export interface FingerprintCapture {
  templateData: string;
  qualityScore: number;
  isoData: string;
}

/**
 * Check if Mantra device is connected via AVDM
 * Tries direct client-side connection first (for local dev)
 * Falls back to proxy for cloud deployments
 */
export async function checkMantraDevice(): Promise<boolean> {
  try {
    console.log('[v0] Checking Mantra device...');
    
    // First, try direct client-side connection (works for local dev)
    const directResult = await tryDirectConnection();
    if (directResult !== null) {
      console.log('[v0] Direct connection result:', directResult);
      return directResult;
    }
    
    // If direct connection fails or times out, device is not available
    // In production/cloud environments, this is expected
    console.log('[v0] No direct connection to AVDM service');
    return false;
  } catch (error) {
    console.log('[v0] Device check error:', String(error).substring(0, 100));
    return false;
  }
}

/**
 * Try to connect directly to AVDM on localhost (only works in local dev)
 * Returns null if timeout, true if connected, false if rejected by CORS
 */
async function tryDirectConnection(): Promise<boolean | null> {
  const endpoints = [
    'http://localhost:9000/device/check',
    'http://127.0.0.1:9000/device/check',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log('[v0] Trying direct connection to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000), // Quick timeout for direct attempt
      });

      console.log('[v0] Direct connection got response from', endpoint, 'Status:', response.status);
      return response.ok;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log('[v0] Direct connection failed:', errorMsg.substring(0, 60));
      
      // If it's a CORS error or network error, device might still be there
      // but we just can't reach it from this environment
      if (errorMsg.includes('NetworkError') || errorMsg.includes('CORS') || errorMsg.includes('Failed')) {
        console.log('[v0] Network/CORS error - AVDM not accessible from this environment');
        return null; // Can't determine - try fallback
      }
    }
  }
  
  return null; // No response from any endpoint
}

/**
 * Get device information
 */
export async function getMantraDeviceInfo(): Promise<MantraDevice | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MANTRA_TIMEOUT);
    
    const response = await fetch(`${ACTIVE_MANTRA_URL}/device/info`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: data.deviceName || 'Mantra Device',
        serialNumber: data.serialNumber || '',
        isConnected: data.isConnected || true,
        deviceType: data.deviceType || 'MFS110'
      };
    }
    
    // Return null if API not available - device is not connected
    console.log('[v0] AVDM service not responding - cannot get device info');
    return null;
  } catch (error) {
    console.log('[v0] Failed to get device info - AVDM service not available:', String(error));
    // Return null - device is NOT available
    return null;
  }
}

/**
 * Capture fingerprint from connected device
 * This is called when user places their finger on the scanner
 */
export async function captureFingerprint(onProgress?: (progress: number) => void): Promise<FingerprintCapture | null> {
  try {
    // Call proxy API to capture fingerprint
    const response = await fetch('/api/mantra/fingerprint/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(60000),
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Fingerprint capture failed');
      }
      
      onProgress?.(100);
      
      return {
        templateData: data.templateData,
        qualityScore: data.qualityScore || 85,
        isoData: data.isoData || ''
      };
    } else if (response.status === 408) {
      throw new Error('Fingerprint capture timeout - please place your finger on the scanner');
    } else {
      throw new Error(`Device error: ${response.status}`);
    }
  } catch (error) {
    console.error('[v0] Fingerprint capture error:', String(error));
    throw error;
  }
}

/**
 * Match captured fingerprint against stored templates
 */
export async function matchFingerprint(
  capturedTemplate: string,
  storedTemplate: string,
  threshold: number = 60
): Promise<number> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MANTRA_TIMEOUT);
    
    const response = await fetch(`${ACTIVE_MANTRA_URL}/fingerprint/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        capturedTemplate,
        storedTemplate,
        threshold
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return data.matchScore || 0;
    }
    return 0;
  } catch (error) {
    console.error('[v0] Fingerprint matching error:', String(error));
    return 0;
  }
}

/**
 * Start live capture with real-time quality feedback
 * IMPORTANT: No fallback to mock - must use real device
 * Rejects if device is not available
 */
export async function startLiveCapture(
  onQualityUpdate?: (quality: number) => void,
  onProgress?: (progress: number) => void
): Promise<FingerprintCapture> {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('[v0] Starting fingerprint capture from real device...');
      
      // First check if device is actually connected
      const isDeviceConnected = await checkMantraDevice();
      
      if (!isDeviceConnected) {
        const error = 'Mantra AVDM service is not running. Please start the device service and ensure the scanner is connected.';
        console.error('[v0]', error);
        reject(new Error(error));
        return;
      }
      
      onProgress?.(10);
      
      try {
        console.log('[v0] Attempting to capture from Mantra AVDM...');
        const fingerprint = await captureFingerprint((progress) => {
          onProgress?.(Math.min(progress, 99));
        });
        
        if (fingerprint) {
          console.log('[v0] Fingerprint captured successfully, quality:', fingerprint.qualityScore);
          onProgress?.(100);
          resolve(fingerprint);
        } else {
          throw new Error('No fingerprint data returned from device');
        }
      } catch (deviceError) {
        // NO FALLBACK - reject if device fails
        console.error('[v0] Device fingerprint capture failed:', String(deviceError));
        reject(new Error('Failed to capture from device: ' + String(deviceError)));
      }
    } catch (error) {
      console.error('[v0] Fingerprint capture error:', String(error));
      reject(error);
    }
  });
}

/**
 * Check if device is ready and functional
 * Returns false if AVDM service is not running
 */
export async function isDeviceReady(): Promise<{
  ready: boolean;
  reason?: string;
  deviceInfo?: MantraDevice | null;
}> {
  try {
    const isConnected = await checkMantraDevice();
    
    if (!isConnected) {
      return {
        ready: false,
        reason: 'Mantra AVDM service is not running. Please start the device service.'
      };
    }
    
    const deviceInfo = await getMantraDeviceInfo();
    
    if (!deviceInfo) {
      return {
        ready: false,
        reason: 'Could not retrieve device information'
      };
    }
    
    return {
      ready: true,
      deviceInfo
    };
  } catch (error) {
    console.log('[v0] Device ready check failed:', String(error));
    return {
      ready: false,
      reason: 'Device check failed: ' + String(error)
    };
  }
}
