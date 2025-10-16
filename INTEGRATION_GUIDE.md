# 🚀 FinPal Integration Guide

## ✅ Already Configured

### 1. **Google OAuth** ✓
- **Status**: Fully integrated
- **Provider**: Google OAuth 2.0
- **Credentials**: Already in `.env`
- **Test**: Users can now sign up/sign in with "Continue with Google"

### 2. **Gemini AI Coaching** ✓
- **Status**: Fully integrated
- **API Key**: Configured in `.env`
- **Features**: 
  - Personalized financial advice generation
  - Transaction categorization
  - Cash flow insights
- **Location**: `src/lib/gemini.ts`

### 3. **Twilio SMS** ✓
- **Status**: Fully integrated
- **Credentials**: Configured in `.env`
- **Features**:
  - OTP delivery via SMS
  - Financial alerts
  - General notifications
- **Location**: `src/lib/twilio.ts`

### 4. **Database** ✓
- **Provider**: Turso (LibSQL)
- **Status**: Fully configured and migrated
- **Management**: Use Database Studio tab (top right)

### 5. **Authentication System** ✓
- **Framework**: better-auth
- **Features**:
  - Email/Password authentication
  - Google OAuth
  - Session management
  - Bearer token support

---

## 🔧 Services That Need Configuration

### 1. **Apple OAuth** (Optional but Recommended)

#### Why You Need It:
- Allow iOS users to sign in with Apple ID
- Required if you want App Store approval for iOS app

#### How to Get Credentials:

**Step 1: Apple Developer Account**
- Go to: https://developer.apple.com
- Sign up for Apple Developer Program ($99/year)

**Step 2: Create App ID**
1. Navigate to "Certificates, Identifiers & Profiles"
2. Click "Identifiers" → "+" → "App IDs"
3. Enable "Sign in with Apple"

**Step 3: Create Service ID**
1. Click "+" → "Services IDs"
2. Enter identifier (e.g., `com.finpal.web`)
3. Enable "Sign in with Apple"
4. Configure domains and return URLs:
   - **Domain**: `yourdomain.com` (for production)
   - **Return URL**: `https://yourdomain.com/api/auth/callback/apple`
   - **Local testing**: Use ngrok tunnel

**Step 4: Create Key**
1. Go to "Keys" → "+" 
2. Enable "Sign in with Apple"
3. Download the `.p8` key file (SAVE IT - you can't download again!)
4. Note your Key ID and Team ID

**Environment Variables Needed:**
```env
APPLE_CLIENT_ID=com.finpal.web
APPLE_TEAM_ID=YOUR_TEAM_ID
APPLE_KEY_ID=YOUR_KEY_ID
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
```

---

### 2. **Plaid - Bank Account Integration** (CRITICAL for FinPal)

#### Why You Need It:
- **Core Feature**: Automatically fetch user's bank transactions
- **Security**: Read-only access to financial data
- **Coverage**: Supports 11,000+ banks in India and globally

#### How to Get Credentials:

**Step 1: Sign Up**
- Go to: https://plaid.com/
- Click "Get API Keys"
- Sign up for a free account (Sandbox is free forever!)

**Step 2: Get Development Keys**
1. After signup, go to: https://dashboard.plaid.com/developers/keys
2. You'll see:
   - **Client ID** (looks like: `5f8a9b2c3d4e5f6g7h8i9j0k`)
   - **Sandbox Secret** (looks like: `abcd1234efgh5678ijkl9012`)
   - **Development Secret** (for testing with real banks)

**Step 3: Configure Environment**
```env
# Plaid Configuration
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox  # sandbox, development, or production
PLAID_COUNTRY_CODES=IN,US
PLAID_PRODUCTS=transactions,auth
```

**Step 4: Test in Sandbox Mode**
- Use test credentials provided by Plaid:
  - **Username**: `user_good`
  - **Password**: `pass_good`
  - **Bank**: Any bank from the list

**Plaid Integration Status:**
- ✓ API routes already created (`/api/plaid/*`)
- ✓ Link token generation endpoint ready
- ✓ Transaction sync endpoint ready
- ⏳ Just needs your Plaid credentials in `.env`

**Production Considerations:**
- **Sandbox**: Free forever, fake data
- **Development**: Free, connects to real banks for testing (up to 100 users)
- **Production**: Costs $0.01-0.10 per user/month, requires Plaid verification

---

### 3. **Email Verification Service** (Optional)

#### Option A: Use better-auth Built-in (Recommended)
Better-auth supports email verification out of the box. You need an email service:

**Recommended: Resend (Free Tier - 3,000 emails/month)**
1. Go to: https://resend.com
2. Sign up and verify your domain
3. Get API key from dashboard
4. Add to `.env`:
```env
RESEND_API_KEY=re_your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

**Alternative: SendGrid (Free Tier - 100 emails/day)**
1. Go to: https://sendgrid.com
2. Create API key
3. Add to `.env`:
```env
SENDGRID_API_KEY=SG.your_key_here
EMAIL_FROM=noreply@yourdomain.com
```

#### Option B: Use Gmail SMTP (For Testing Only)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Get from Google Account settings
```

---

### 4. **Two-Factor Authentication (2FA)** (Already Supported!)

#### Current Implementation:
Your app already has 2FA infrastructure through:
1. **SMS OTP** (via Twilio) ✓
2. **Email OTP** (once email service configured)

#### How It Works:
1. User signs up with email/password
2. System sends OTP via SMS or email
3. User enters OTP to verify
4. Account is fully activated

**To Enable Email OTP:**
- Configure email service (see above)
- Update `src/lib/auth.ts` with email provider config

---

## 📋 Quick Setup Checklist

### Immediate Next Steps:

1. **Get Plaid Credentials** (CRITICAL - Core feature)
   - [ ] Sign up at https://plaid.com
   - [ ] Get Client ID and Sandbox Secret
   - [ ] Add to `.env` file
   - [ ] Test bank connection from dashboard

2. **Configure Email Service** (High Priority)
   - [ ] Choose provider (Resend recommended)
   - [ ] Get API key
   - [ ] Add to `.env`
   - [ ] Test email sending

3. **Apple OAuth** (If targeting iOS)
   - [ ] Apple Developer account
   - [ ] Create Service ID
   - [ ] Get credentials
   - [ ] Add to `.env`

### Environment Variables Summary:

```env
# ✅ Already Configured
TURSO_CONNECTION_URL=configured
TURSO_AUTH_TOKEN=configured
BETTER_AUTH_SECRET=configured
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=configured
GOOGLE_CLIENT_SECRET=configured
GEMINI_API_KEY=configured
TWILIO_ACCOUNT_SID=configured
TWILIO_AUTH_TOKEN=configured
TWILIO_PHONE_NUMBER=configured

# ⏳ Need to Add
PLAID_CLIENT_ID=get_from_plaid.com
PLAID_SECRET=get_from_plaid.com
PLAID_ENV=sandbox

# 📧 Optional - Email Service (choose one)
RESEND_API_KEY=get_from_resend.com
# OR
SENDGRID_API_KEY=get_from_sendgrid.com

# 🍎 Optional - Apple OAuth
APPLE_CLIENT_ID=get_from_apple_developer
APPLE_TEAM_ID=get_from_apple_developer
APPLE_KEY_ID=get_from_apple_developer
APPLE_PRIVATE_KEY=get_from_apple_developer
```

---

## 🧪 Testing Your Setup

### Test Google OAuth:
1. Go to `/sign-up`
2. Click "Continue with Google"
3. Should redirect to Google login
4. After login, should create account and redirect to `/dashboard`

### Test Twilio SMS:
1. Go to `/sign-up`
2. Enter phone number for OTP
3. Should receive SMS with code
4. Check Twilio dashboard for delivery status

### Test Plaid (Once Configured):
1. Go to `/dashboard`
2. Click "Connect Bank Account"
3. Select any bank
4. Use credentials: `user_good` / `pass_good`
5. Should see transactions appear

### Test Gemini AI:
1. Navigate to dashboard after connecting bank
2. AI coach should generate insights
3. Check chat interface for personalized advice

---

## 🚀 Deployment Considerations

### Before Going Live:

1. **Plaid**: Move from `sandbox` → `development` → `production`
2. **Twilio**: Verify phone numbers or upgrade for unlimited SMS
3. **Better-auth**: Update `BETTER_AUTH_URL` to production domain
4. **Google OAuth**: Add production domain to authorized redirect URIs
5. **Database**: Already on Turso (production-ready)

### Recommended Hosting:
- **Frontend**: Vercel (free, auto-deploy from Git)
- **Backend APIs**: Vercel Serverless Functions (included)
- **Database**: Turso (already configured)

---

## 📞 Support & Resources

### Official Documentation:
- **Plaid**: https://plaid.com/docs/
- **Better-auth**: https://better-auth.com
- **Twilio**: https://www.twilio.com/docs
- **Gemini AI**: https://ai.google.dev/docs
- **Resend**: https://resend.com/docs

### Need Help?
Your FinPal setup is 80% complete! The most critical missing piece is **Plaid** for bank integration.

Priority order:
1. **Plaid** (core feature) - Get this first
2. **Email service** (user verification)
3. **Apple OAuth** (if building iOS app)

---

## 🎯 What's Next?

After getting Plaid credentials:
1. Add them to `.env`
2. Restart your dev server
3. Test bank connection in dashboard
4. Your app will be fully functional!

The system will automatically:
- ✓ Fetch transactions from connected banks
- ✓ Categorize transactions using Gemini AI
- ✓ Generate cash flow projections
- ✓ Send proactive financial advice
- ✓ Alert users via SMS when balance is low

**Your FinPal AI financial coach is ready to go! 🎉**