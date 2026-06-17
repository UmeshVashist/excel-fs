import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint for fingerprint capture
 * Bridges HTTPS website → HTTP localhost AVDM service
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Proxy: Starting fingerprint capture...');

    const body = await request.json();

    // Try multiple AVDM endpoints
    const endpoints = [
      'http://localhost:9000/fingerprint/capture',
      'http://127.0.0.1:9000/fingerprint/capture',
      'http://localhost:8080/fingerprint/capture',
      'http://127.0.0.1:8080/fingerprint/capture',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log('[v0] Proxy: Trying capture endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(60000), // 60 second timeout for capture
        });

        if (response.ok || response.status === 200) {
          const data = await response.json();
          console.log('[v0] Proxy: Fingerprint captured successfully');
          return NextResponse.json({
            success: true,
            data: data,
            endpoint: endpoint,
          });
        }
      } catch (err) {
        console.log('[v0] Proxy: Endpoint failed:', endpoint, String(err).substring(0, 50));
        continue;
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to capture fingerprint',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('[v0] Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 500 }
    );
  }
}
