# Fingerprint Authentication System

Full end-to-end fingerprint biometric authentication using Mantra MFS100/MFS110 devices.

## Overview

This system provides complete fingerprint-based authentication for your application, allowing users to:
- Enroll up to 5 fingers (all 10 fingers supported with extension)
- Use fingerprint for login authentication
- Manage enrolled fingerprints in settings
- Track authentication history and device information

## Database Schema

### Tables Created

1. **fingerprint_data**
   - Stores encrypted fingerprint templates (not raw images)
   - Tracks quality scores, enrollment dates, and device types
   - Supports soft deletion and activation/deactivation

2. **fingerprint_auth_logs**
   - Audit trail for all authentication attempts
   - Records success/failure, match scores, and error messages
   - Useful for security monitoring and troubleshooting

3. **profiles** (additions)
   - `fingerprint_enabled`: Boolean flag for feature status
   - `fingerprint_enrolled_at`: Enrollment timestamp
   - `last_fingerprint_auth`: Last successful authentication time

## API Routes

### `/api/fingerprint/check-device` (POST)
Checks for connected Mantra fingerprint scanners.

**Response:**
```json
{
  "success": true,
  "devices": [],
  "isDeviceConnected": false,
  "supportedDevices": ["MFS100", "MFS110"]
}
```

### `/api/fingerprint/enroll` (POST)
Enrolls a single fingerprint for a user.

**Request:**
```json
{
  "fingerPosition": "thumb_right",
  "templateData": "base64-encoded-template",
  "qualityScore": 85,
  "deviceType": "MFS100"
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "fingersEnrolled": 2,
  "allFingersEnrolled": false,
  "message": "2/5 fingers enrolled..."
}
```

**Requirements:**
- Quality score must be ≥ 60
- All 5 fingers must be enrolled for full authentication
- Supported device types: MFS100, MFS110

### `/api/fingerprint/authenticate` (POST)
Authenticates a user using a captured fingerprint.

**Request:**
```json
{
  "email": "user@example.com",
  "templateData": "base64-encoded-template",
  "deviceType": "MFS100"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user-id",
  "email": "user@example.com",
  "matchScore": 85,
  "matchedFinger": "thumb_right",
  "message": "Fingerprint authenticated successfully"
}
```

### `/api/fingerprint/status` (GET)
Retrieves fingerprint enrollment status and history.

**Response:**
```json
{
  "success": true,
  "profile": {
    "fingerprintEnabled": true,
    "enrolledAt": "2024-04-10T...",
    "lastAuthAt": "2024-04-10T..."
  },
  "enrolledFingerprints": [...],
  "fingersEnrolled": 5,
  "allFingersEnrolled": true,
  "recentAuthLogs": [...]
}
```

### `/api/fingerprint/status` (DELETE)
Removes a single enrolled fingerprint.

**Request:**
```json
{
  "fingerId": "finger-uuid"
}
```

## Frontend Pages

### `/fingerprint` - Login Page
Fingerprint-based login interface. Users enter their email and place their finger on the scanner to authenticate.

**Features:**
- Device connection status indicator
- Real-time scanning progress visualization
- Fallback to traditional login
- Quality feedback during capture

### `/fingerprint/enroll` - Enrollment Page
Guided enrollment process for 5 fingers.

**Features:**
- Interactive finger selector (10 finger positions available)
- Real-time quality scoring
- Visual progress tracking
- Ability to re-capture failed attempts
- Automatic completion detection

### `/fingerprint/success` - Confirmation Page
Success page after completing enrollment.

## Settings Integration

Fingerprint management is integrated in the main Settings page under "Fingerprint Authentication":

- View enrollment status
- See list of enrolled fingers with quality scores
- Remove individual fingerprints
- Start new enrollment process
- View last authentication time

## Device Support

### Supported Devices
- **Mantra MFS100** - Optical fingerprint scanner
- **Mantra MFS110** - Optical fingerprint scanner with improved performance

### Device Connection
The system checks for USB-connected Mantra devices. In production, you'll need:

```bash
npm install usb node-hid
# or use Mantra's official SDK
```

Device detection uses Vendor ID: `0x1784`
- MFS100: Product ID `0x0007`
- MFS110: Product ID `0x0008`

## Quality Requirements

- **Minimum Quality Score**: 60/100
- **Recommended Quality**: 70+ for reliable matching
- Quality measured on scale of 0-100 during capture

## Biometric Matching

The authentication system uses fingerprint template matching. Current implementation includes:

1. **Template Comparison**: Compares captured fingerprint against stored templates
2. **Match Threshold**: Score ≥ 40/100 considered successful match
3. **Finger Position Matching**: Identifies which finger was matched
4. **Audit Logging**: All attempts logged for security

**Production Improvements:**
- Implement NIST-compliant algorithms (MINEX standard)
- Use SourceAFIS or OpenAFIS for better accuracy
- Consider commercial biometric libraries

## Security Features

1. **Row Level Security (RLS)**
   - Users can only access their own fingerprint data
   - Fingerprint templates protected from unauthorized access

2. **Audit Logging**
   - All authentication attempts recorded
   - Success/failure tracking
   - Match score logging

3. **Template Encryption**
   - Templates stored as encrypted data (not raw images)
   - Never stores actual fingerprint images

4. **Rate Limiting** (Recommended)
   - Implement rate limiting on authentication attempts
   - Prevent brute force attacks

## Migration Steps

1. Run database migration:
```bash
# Execute the SQL migration
psql -d your_database -f scripts/004-create-fingerprint-tables.sql
```

2. Deploy API routes

3. Deploy frontend pages

4. Users can enroll via Settings → Fingerprint Authentication

## Environment Variables

No additional environment variables required. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `CLERK_SECRET_KEY` (for authentication)

## User Flow

### First Time Setup
1. User navigates to Settings
2. Clicks "Start Enrollment" in Fingerprint Authentication
3. Selects and captures 5 fingers (thumb + 4 others recommended)
4. System validates quality and stores templates
5. Enrollment complete - fingerprint login now available

### Login with Fingerprint
1. User visits `/fingerprint` login page
2. Enters email address
3. Places finger on scanner
4. System matches against stored templates
5. Creates session and redirects to dashboard

### Management
1. User can view enrolled fingers in Settings
2. Can remove individual fingers
3. Can add more fingers (up to 10)
4. Can view authentication history

## Testing

Mock fingerprint data is generated for testing. For production:

1. Connect actual Mantra device
2. Update device detection code
3. Use real fingerprint capture from device
4. Test with actual fingerprints

## Troubleshooting

### Device Not Detected
- Check USB connection
- Verify device drivers installed
- Check Vendor/Product IDs match

### Low Quality Scores
- Clean fingerprint scanner glass
- Ensure proper finger contact
- Try different finger
- Enroll different hand

### Authentication Fails
- Check enrolled fingers exist
- Verify fingerprint_enabled is true
- Check match threshold settings
- Review auth logs for details

## Future Enhancements

1. **Multi-factor Authentication**
   - Combine fingerprint + password
   - Fingerprint + OTP

2. **Liveness Detection**
   - Prevent spoofing attacks
   - Real-time liveness verification

3. **Advanced Matching**
   - NIST-compliant algorithms
   - Machine learning improvement
   - Multi-finger matching

4. **Mobile Support**
   - Mobile biometric APIs
   - Cross-device enrollment

5. **Compliance**
   - GDPR compliance
   - Biometric data retention policies
   - Audit trail retention

## Support

For issues or questions:
- Check the logs in fingerprint_auth_logs table
- Review API error messages
- Test with mock device first
- Check device driver installation
