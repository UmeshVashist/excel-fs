# Mantra MFS110 Fingerprint Scanner Setup Guide

## Current Status
The Mantra MFS110 device is physically connected to your system, but the software integration needs proper configuration.

## Issue
When clicking "Scan Fingerprint", the application tries to communicate with Mantra AVDM (Active Virtual Device Manager) on `localhost:9000`, but gets a connection refused error. This prevents real fingerprint capture from working.

## Solution

### Option 1: Use Mantra AVDM Service (Recommended for Production)
The Mantra AVDM is a Windows service that communicates with the physical device.

**Steps:**
1. Open Windows Services (services.msc)
2. Look for "Mantra AVDM" or "Mantra Device Service"
3. Ensure it's set to "Automatic" startup
4. Start the service if it's stopped
5. Verify it's running on localhost:9000 by checking:
   - Open browser and go to http://localhost:9000/device/check
   - Should return JSON with device information

**API Endpoints (once AVDM is running):**
- `GET http://localhost:9000/device/check` - Check if device is connected
- `GET http://localhost:9000/device/info` - Get device information
- `POST http://localhost:9000/fingerprint/capture` - Capture fingerprint
- `POST http://localhost:9000/fingerprint/match` - Match fingerprints

### Option 2: Verify AVDM Configuration
1. Ensure the Mantra AVDM is listening on port 9000
2. Check AVDM logs for connection issues
3. Verify USB device is properly connected
4. Restart the AVDM service after device reconnection

### Option 3: Current Fallback Behavior
When AVDM service is unavailable, the application gracefully falls back to:
- Generating mock fingerprint templates
- Simulating realistic quality scores (50-90)
- Storing fingerprints in database successfully
- This allows testing without the physical device

## How the Integration Works

When user clicks "Scan Fingerprint":
1. ✅ Check if AVDM is running (localhost:9000)
2. ✅ If available: Communicate with real Mantra device for actual scanning
3. ✅ If unavailable: Fall back to mock fingerprint generation
4. ✅ Store captured fingerprint in database
5. ✅ Update enrolled fingerprints list

## Testing the Integration

### With Real Device (AVDM Running):
- Device LED will blink when scanning
- User must place finger on scanner
- Real quality score based on fingerprint
- Device provides real biometric template

### With Mock Fallback (AVDM Not Running):
- Progress bar simulates scanning
- Quality scores generated automatically
- Perfect for development/testing
- Still persists to database

## Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| `net::ERR_CONNECTION_REFUSED` | AVDM service not running | Start AVDM service in Windows Services |
| `localhost:9000/device/check` fails | AVDM not listening on port 9000 | Check AVDM configuration/port settings |
| Device not detected | USB disconnected or driver issue | Reconnect USB, reinstall drivers, restart AVDM |
| "Failed to enroll fingerprint" | Database issue | Check Supabase connection and tables |

## Next Steps
1. Start the Mantra AVDM service
2. Verify device connection: http://localhost:9000/device/check
3. Reload the fingerprint management page
4. Try "Scan Fingerprint" again - device should now respond
