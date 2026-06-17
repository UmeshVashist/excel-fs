# Local Development Setup for Fingerprint Scanner

## Important: Fingerprint Scanner Only Works Locally

The Mantra MFS110 fingerprint scanner can **only be accessed from local development environments**, not from cloud deployments like Vercel. This is because:

- The scanner runs on your local machine via the Mantra AVDM service
- Cloud servers cannot reach your local network/localhost
- The browser blocks direct localhost access from HTTPS cloud URLs (CORS policy)

## Requirements

### 1. Local Development Environment
You must run this project locally on the same machine where the Mantra AVDM service is running.

```bash
# Clone the project
git clone <your-repo>
cd <project-folder>

# Install dependencies
npm install

# Run the development server
npm run dev
```

### 2. Mantra AVDM Service
Ensure the Mantra AVDM service is running on your Windows machine:

1. Install Mantra AVDM (comes with your MFS110 scanner)
2. Open Windows Services (Services.msc)
3. Find "Mantra AVDM" service
4. Set it to "Automatic" startup
5. Click "Start"
6. Verify it's running - you should see the MANTRA L1 AVDM window showing "Framework is ready to use"

### 3. Connect the Scanner
- Connect your Mantra MFS110 scanner via USB
- Windows should automatically detect it
- The AVDM service will recognize the connected device

## How It Works

### Local Development Flow
```
Your Browser (http://localhost:3000)
         ↓
   Web Application
         ↓
   JavaScript/React
         ↓
  Direct HTTP Connection (No CORS)
         ↓
Mantra AVDM Service (localhost:9000)
         ↓
    MFS110 Scanner (USB)
```

### Cloud Deployment (Doesn't Work)
```
Vercel HTTPS Server
         ↓ (Can't reach localhost)
    ✗ BLOCKED ✗
         ↓
User's Local Machine
```

## Troubleshooting

### "Device Not Connected" Message
1. **Check AVDM Service Status**
   - Open Windows Task Manager → Services tab
   - Look for "Mantra AVDM" service
   - If not running, right-click and select "Start"

2. **Check Service is Accessible**
   - Open your browser
   - Visit: `http://localhost:9000/device/check`
   - You should see a JSON response or an AVDM error page

3. **Verify Local Development**
   - Make sure you're visiting `http://localhost:3000` (not HTTPS)
   - Cloud deployments won't work

4. **Click Refresh Button**
   - On the Fingerprint Management page
   - Gives the system time to detect the service

### "Failed to Capture Fingerprint"
1. Ensure the scanner is connected via USB
2. The AVDM window should be visible on screen
3. Try clicking "Scan Fingerprint" and physically placing your finger on the scanner

## Testing Without Scanner

For testing the enrollment and login flow **without** the physical scanner:

1. The system has built-in mock fingerprint support
2. However, since we removed the fallback, you'll see "Device Not Connected"
3. To test without hardware, you'd need to:
   - Manually insert test fingerprint data into the database
   - Or temporarily re-enable mock fingerprints in `/lib/mantra-device.ts`

## Production Deployment

If deploying to production with fingerprint scanning:

### Option 1: Run AVDM on Cloud Server
- Host Mantra AVDM service on a cloud server/VM
- Ensure it's accessible via HTTPS with a proper certificate
- Update endpoints in the code to point to cloud service

### Option 2: Hybrid Approach
- Keep web app on Vercel (cloud)
- Run AVDM service on local/on-premises server
- Connect via VPN or secure tunnel

### Option 3: Native Mobile App
- Develop native mobile app with direct scanner access
- Use device APIs for biometric authentication
- Skip the web browser entirely

## Architecture Notes

The current implementation:
- Uses direct client-side connection for local dev
- Falls back gracefully when scanner unavailable
- Database still works without scanner (stores fingerprints)
- Authentication still works (email/password as fallback)

This is the correct approach for a web application with local hardware integration.

---

**Summary:** Run this project locally on the same machine where your Mantra AVDM service and scanner are connected. Cloud deployments cannot access your local hardware.
