# ⚡ QUICK FIX - OAuth Error

## 🚨 Error You're Seeing:
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

## ✅ The Fix (5 Steps):

### **Step 1: Get Your Supabase Project ID**
- Open Supabase Dashboard
- Go to Settings → General
- Copy your **Project ID**

### **Step 2: Enable Google in Supabase**
1. Open Supabase Dashboard
2. Click **Authentication** → **Providers**
3. Find **Google** and click it
4. Toggle **Enable** switch to ON
5. *(You'll need Google credentials - see below)*

### **Step 3: Get Google Credentials**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Search & enable **Google+ API**
3. Go to **Credentials** → **Create OAuth Client ID**
4. Choose **Web application**
5. Add this redirect URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=google
   ```
6. Click **Create**
7. Copy **Client ID** and **Client Secret**

### **Step 4: Paste Google Credentials in Supabase**
1. Go back to Supabase → Google Provider
2. Paste **Client ID**
3. Paste **Client Secret**
4. Click **Save**

### **Step 5: Repeat for GitHub**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create **New OAuth App**
3. Set Callback URL:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback?provider=github
   ```
4. Copy **Client ID** and generate **Client Secret**
5. Go to Supabase → GitHub Provider
6. Enable & paste credentials
7. Click **Save**

---

## 🧪 Test It

```bash
npm run dev
```

Go to `http://localhost:3000/auth/login`

Click **Gmail** or **GitHub** → Should redirect to their login page!

---

## 📌 Common Mistakes

❌ **Provider shows as OFF** → It won't work, toggle it ON  
❌ **Wrong redirect URL** → Copy it exactly from Supabase  
❌ **Old credentials** → Generate new ones  
❌ **Forgot credentials in Supabase** → Paste them in the provider settings

---

**Need detailed help?** See [FIX_OAUTH_ERROR.md](./FIX_OAUTH_ERROR.md)
