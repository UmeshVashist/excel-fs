# Complete Fingerprint Authentication Setup Guide

## Overview
This guide explains how to set up and use the complete fingerprint authentication system with the Mantra MFS110 scanner.

## What's Been Set Up

### ✅ Fingerprint Enrollment (`/app/fingerprint/manage`)
- Enroll up to 10 fingerprints (multiple fingers)
- Quality scoring for each fingerprint
- Delete enrolled fingerprints
- Device detection and status monitoring

### ✅ Fingerprint Login (`/app/fingerprint/auth`)
- Authenticate using any enrolled fingerprint
- Real-time scanning progress feedback
- Fallback to password login
- Automatic session creation on successful match

### ✅ Database Schema
- `fingerprint_data` table - Stores enrolled fingerprints
- `fingerprint_auth_logs` table - Logs authentication attempts
- RLS policies - Users can only access their own fingerprint data

## How to Use

### Step 1: Start the Mantra AVDM Service

**Option A: Automatic (Windows Only)**
```bash
cd /scripts
node start-mantra-avdm.js
```

**Option B: Manual**
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "Mantra AVDM Service" (or similar name)
4. Right-click → Start
5. Set Startup Type → Automatic

**Verify Service is Running:**
- Open browser and go to: `http://localhost:9000/device/check`
- Should see JSON response with device information

### Step 2: Enroll Fingerprints

1. Go to `/app/fingerprint/manage`
2. Select a finger from the dropdown (e.g., "Right Thumb")
3. Click "Scan Fingerprint"
4. Place your finger on the scanner
5. Wait for scan to complete
6. Repeat for multiple fingers (recommended: 3-5 fingers for better matching)

**During Testing (Without Real Device):**
- If Mantra AVDM is not running, the app uses mock fingerprints
- Mock fingerprints are still saved to the database
- Perfect for testing the entire flow

### Step 3: Login with Fingerprint

1. Go to `/app/fingerprint/auth`
2. Click "Start Fingerprint Scan"
3. Place your finger on the scanner
4. System will compare against enrolled fingerprints
5. On match: Automatic login and redirect to dashboard
6. On no match: Try again or use password login

## API Endpoints

### Device Detection
```
POST /api/fingerprint/check-device
Response: { isDeviceConnected: boolean, supportedDevices: string[] }
```

### Enrollment
```
POST /api/fingerprint/enroll
Body: {
  userId: string,
  fingerPosition: string,
  templateData: string,
  qualityScore: number,
  deviceType: string
}
Response: { success: boolean, fingersEnrolled: number }
```

### Authentication
```
POST /api/fingerprint/authenticate
Body: {
  templateData: string,
  qualityScore: number
}
Response: { 
  success: boolean,
  userId: string,
  email: string,
  matchedFinger: string,
  similarity: number
}
```

### Status
```
GET /api/fingerprint/status?userId={userId}
Response: {
  fingerprint_enabled: boolean,
  enrolledFingerprints: Array<{
    id: string,
    finger_position: string,
    quality_score: number,
    created_at: string
  }>
}
```

## Fingerprint Matching

**Matching Algorithm:**
- Compares captured template with all enrolled fingerprints
- Calculates character-by-character similarity
- Threshold: 60% similarity required for match
- Returns best match with similarity score

**In Production:**
- Use proper biometric matching libraries (NIST-compliant)
- Consider using Mantra AVDM's built-in matching API
- Increase threshold to 80%+ for better security

## Database Tables

### fingerprint_data
```sql
- id (uuid, primary key)
- user_id (uuid, FK to profiles.id)
- finger_position (text: "thumb", "index", "middle", "ring", "pinky")
- template_data (text) - Binary fingerprint template
- quality_score (integer) - Capture quality 0-100
- created_at (timestamp)
- updated_at (timestamp)
```

### fingerprint_auth_logs
```sql
- id (uuid, primary key)
- user_id (uuid, FK to profiles.id)
- success (boolean)
- match_score (integer)
- device_type (text)
- error_message (text)
- created_at (timestamp)
```

## Troubleshooting

### "Scanner not connected" Message
**Cause:** Mantra AVDM service is not running
**Solution:** 
1. Start the service using the startup script or services.msc
2. Verify: http://localhost:9000/device/check should return JSON

### "Failed to enroll fingerprint"
**Cause:** Database connection issue
**Solution:**
1. Verify Supabase is connected in project settings
2. Check that fingerprint_data table exists
3. Clear browser cache and try again

### No Match Found During Login
**Cause:** Enrolled fingerprints don't match captured fingerprint
**Solutions:**
1. Make sure you're using the same finger you enrolled
2. Enroll more fingers (3-5 recommended) for better matching
3. Check fingerprint quality (should be 70+)
4. Try the actual device scanner (not mock mode)

### Device Not Detected
**Cause:** Mantra MFS110 scanner is not connected via USB
**Solution:**
1. Connect the scanner via USB to your computer
2. Install Mantra AVDM drivers if needed
3. Start the AVDM service
4. Restart the browser

## Development & Testing

### Mock Mode (No Real Device)
- Works when Mantra AVDM service is not running
- Generates mock fingerprints with realistic quality scores
- Perfect for UI testing and database schema validation
- All features work identically to real mode

### Real Device Mode
- Requires Mantra MFS110 scanner connected via USB
- Requires Mantra AVDM service running on localhost:9000
- Real fingerprint capture with actual quality metrics
- More reliable matching with real biometric data

### Testing Without Real Device

**Scenario 1: Test Enrollment**
1. Keep AVDM service stopped (mock mode)
2. Go to `/app/fingerprint/manage`
3. Enroll fingerprints (will be mock)
4. Check database - fingerprints should be saved

**Scenario 2: Test Login**
1. Enroll 3+ fingerprints in mock mode
2. Go to `/app/fingerprint/auth`
3. Scan (will use same mock fingerprint)
4. Should successfully authenticate

**Scenario 3: Test with Real Device**
1. Connect Mantra MFS110 via USB
2. Start Mantra AVDM service
3. Follow normal enrollment and login flow
4. Real fingerprints will be captured and matched

## File Structure

```
/app
  /fingerprint
    /manage/page.tsx          - Enrollment page
    /auth/page.tsx            - Login page
  /api/fingerprint
    /check-device/route.ts    - Device detection
    /enroll/route.ts          - Enrollment API
    /authenticate/route.ts    - Login authentication
    /status/route.ts          - Status API

/lib
  /mantra-device.ts           - Device integration utilities

/scripts
  /start-mantra-avdm.js       - Service startup script
  /01-create-fingerprint-tables.sql - Database schema

/docs
  /FINGERPRINT_COMPLETE_GUIDE.md - This file
  /MANTRA_SETUP.md               - Device setup details
```

## Security Notes

- Fingerprint templates are stored in database (not images)
- Only authenticated users can access their own fingerprints
- RLS policies enforce user data isolation
- HTTPS recommended for production
- Fingerprints are compared server-side (safer than client-side)
- Authentication logs are maintained for audit purposes

## Next Steps

1. ✅ Fingerprint enrollment system is ready
2. ✅ Fingerprint login system is ready
3. Next: Connect real Mantra MFS110 device and start AVDM service
4. Test complete flow with real fingerprints
5. Deploy to production with HTTPS and proper security settings

## Support

For issues with:
- **Mantra Device:** Check /docs/MANTRA_SETUP.md
- **Database:** Verify Supabase connection and table creation
- **API Endpoints:** Check browser console for detailed error messages
- **Matching:** Adjust MATCH_THRESHOLD in /app/api/fingerprint/authenticate/route.ts
