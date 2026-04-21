import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy endpoint to check Mantra AVDM device status
 * Bridges HTTPS website → HTTP localhost AVDM service
 * Solves CORS blocking by making the request server-side
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[v0] Proxy: Checking Mantra device status...');

    // Try multiple AVDM endpoints and ports
    const endpoints = [
      'http://localhost:9000/device/check',
      'http://127.0.0.1:9000/device/check',
      'http://localhost:9000',  // Try base URL
      'http://127.0.0.1:9000',  // Try base URL with localhost
      'http://localhost:8080/device/check',
      'http://127.0.0.1:8080/device/check',
    ];

    let lastError = null;
    let anyResponded = false;

    for (const endpoint of endpoints) {
      try {
        console.log('[v0] Proxy: Attempting:', endpoint);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Connection': 'close',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        anyResponded = true;

        console.log('[v0] Proxy: Got response from', endpoint, 'Status:', response.status);
        
        if (response.ok || response.status === 200) {
          let data;
          try {
            const text = await response.text();
            console.log('[v0] Proxy: Response body:', text.substring(0, 200));
            data = text ? JSON.parse(text) : {};
          } catch {
            data = { raw: 'text response' };
          }

          console.log('[v0] Proxy: AVDM service responded successfully');
          return NextResponse.json({
            success: true,
            isConnected: true,
            endpoint: endpoint,
            raw: data,
          });
        }
      } catch (err) {
        lastError = err;
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.log('[v0] Proxy: Error at', endpoint, '-', errorMsg.substring(0, 100));
        continue;
      }
    }

    // Log what we found
    console.log('[v0] Proxy: Tried all endpoints. Any responded:', anyResponded, 'Last error:', lastError instanceof Error ? lastError.message : lastError);
    
    // Return success if ANY endpoint responded, since that means AVDM is running
    return NextResponse.json(
      {
        success: anyResponded,
        isConnected: anyResponded,
        message: anyResponded 
          ? 'AVDM service is responding' 
          : 'Unable to connect to Mantra AVDM service',
      },
      { status: anyResponded ? 200 : 503 }
    );
  } catch (error) {
    console.error('[v0] Proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        isConnected: false,
        error: 'Proxy request failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
