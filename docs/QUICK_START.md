# Fingerprint Authentication - Quick Start (5 Minutes)

## 🚀 Start Using Fingerprint Login Right Now

### Step 1: Enroll Your Fingerprint (1 minute)

1. Open your browser and go to:
   ```
   http://your-app.com/app/fingerprint/manage
   ```

2. In the "Add New Fingerprint" section:
   - Select a finger from the dropdown (e.g., "Right Thumb")
   - Click "Scan Fingerprint"
   - (If you don't have the real device, it will use a mock fingerprint)
   - Done! Fingerprint is now saved.

3. Repeat for 2-3 more fingers (recommended)

### Step 2: Login with Your Fingerprint (1 minute)

1. Go to:
   ```
   http://your-app.com/app/fingerprint/auth
   ```

2. Click "Start Fingerprint Scan"

3. Place your finger on the scanner (or wait for mock scan to complete)

4. ✅ You're logged in! Redirects to dashboard automatically.

---

## 🎯 Testing Without Real Device

**Good news:** Everything works even without a Mantra MFS110 scanner!

1. Go to `/app/fingerprint/manage` → Enroll fingerprints (will be mock)
2. Go to `/app/fingerprint/auth` → Login (will match mock fingerprints)
3. All database saves happen normally
4. When you connect a real device later, it will work automatically

---

## 🔧 Setup With Real Device (5 minutes)

### 1. Start Mantra AVDM Service

**Option A: Automatic (Windows)**
```bash
cd /scripts
node start-mantra-avdm.js
```

**Option B: Manual (Windows)**
- Press `Win + R`
- Type `services.msc`
- Find "Mantra AVDM Service"
- Right-click → Start
- Set Startup Type → Automatic

**Verify it's running:**
- Open browser: `http://localhost:9000/device/check`
- Should see JSON response

### 2. Connect Scanner
- Plug Mantra MFS110 into USB
- Wait for driver detection
- AVDM service should detect it automatically

### 3. Test Real Device
- Enroll fingerprints (now using real scanner)
- Login with fingerprints (real matching)
- Should work seamlessly!

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `/app/fingerprint/manage/page.tsx` | Enroll fingerprints |
| `/app/fingerprint/auth/page.tsx` | Login with fingerprint |
| `/api/fingerprint/enroll` | Save fingerprint |
| `/api/fingerprint/authenticate` | Match fingerprint |
| `/scripts/start-mantra-avdm.js` | Start AVDM service |

---

## ❓ Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Scanner not connected" | AVDM service not running. Start it with script or services.msc |
| "No match found" | Enroll more fingers (3-5 recommended) for better matching |
| "API error" | Check browser console (F12) for detailed error messages |
| Device not detected | Connect USB, restart browser, restart AVDM service |

---

## 📚 More Details

- **Setup Guide:** `/docs/FINGERPRINT_COMPLETE_GUIDE.md`
- **Implementation:** `/docs/IMPLEMENTATION_SUMMARY.md`
- **Device Setup:** `/docs/MANTRA_SETUP.md`

---

## ✨ That's It!

Your fingerprint authentication system is ready to use. No additional setup needed!

**Next Steps:**
1. ✅ Visit `/app/fingerprint/manage` to enroll
2. ✅ Visit `/app/fingerprint/auth` to login
3. ✅ (Optional) Start real device for actual fingerprint scanning

Enjoy! 🎉
