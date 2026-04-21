# CORS Issue Fix - Proxy API Solution

## The Problem

When the website is served over HTTPS (from Vercel), browsers block direct HTTP requests to localhost due to security policies (CORS - Cross-Origin Resource Sharing).

**Error in Console:**
```
Access to fetch at 'http://localhost:9000/device/check' from origin 'https://excel-fs.vercel.app' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## The Solution: Proxy API

We created proxy endpoints on the same HTTPS domain that forward requests to the local AVDM service.

### How It Works

1. **Browser Request** → HTTPS website calls proxy API
   ```
   fetch('/api/mantra/device/check')
   ```

2. **Proxy API** → Server-side calls local AVDM service (no CORS issue)
   ```
   fetch('http://localhost:9000/device/check')
   ```

3. **Response** → Proxy returns data to browser

### Files Created

- `/app/api/mantra/device/check/route.ts` - Device status proxy
- `/app/api/mantra/fingerprint/capture/route.ts` - Fingerprint capture proxy

### Files Updated

- `/lib/mantra-device.ts` - Now uses proxy endpoints instead of direct localhost calls

## How to Use

1. **Start Mantra AVDM Service**
   - Run the Mantra AVDM Windows service
   - Verify "Framework is ready to use" message appears

2. **Visit Login Page**
   - Go to `/auth/login`
   - Click "Fingerprint" tab
   - Click "Start Fingerprint Login" button

3. **Device Automatically Connects**
   - The proxy API finds your local AVDM service
   - Website shows device as connected
   - Place finger on scanner to login

## Why This Works

- Browser can communicate with HTTPS proxy API
- Proxy API on the server can access localhost
- No CORS policy violations
- Transparent to user - just works!

## Proxy Endpoints

The proxy automatically tries these endpoints in order:
- http://localhost:9000
- http://127.0.0.1:9000
- http://localhost:8080
- http://127.0.0.1:8080

Uses the first one that responds successfully.

## Troubleshooting

**Device Still Not Connecting?**
1. Verify Mantra AVDM window shows "Framework is ready to use"
2. Make sure MFS110 scanner is connected to AVDM
3. Try restarting the AVDM service
4. Refresh the website
5. Check browser console for detailed proxy error messages

**Button Not Showing?**
1. Refresh the page (Ctrl+F5 or Cmd+Shift+R)
2. Clear browser cache
3. Make sure you're on the "Fingerprint" tab of login page

**Proxy Timeout?**
- Increase timeout in proxy route files (default: 10 seconds for device check, 60 seconds for capture)
- Check that AVDM service is responsive
