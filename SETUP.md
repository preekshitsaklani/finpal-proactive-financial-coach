# FinPal - Complete Setup Guide

This guide will walk you through setting up FinPal from scratch, including all required services and integrations.

## 📋 Prerequisites

- Node.js 18+ installed
- A Plaid account (free sandbox)
- An AI API key (Google Gemini or OpenAI)
- A Twilio account for SMS (optional for MVP)
- A Supabase account (for production database)

---

## 🔧 Step 1: Local Development Setup

### 1.1 Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/finpal.git
cd finpal

# Install dependencies
npm install
# or
bun install
```

### 1.2 Environment Configuration

Create `.env.local` file:

```bash
cp .env.example .env.local
```

---

## 🏦 Step 2: Plaid Integration Setup

### 2.1 Create Plaid Account

1. Visit [Plaid Dashboard](https://dashboard.plaid.com/signup)
2. Sign up for a free account
3. Verify your email

### 2.2 Get API Credentials

1. Navigate to **Team Settings → Keys**
2. Copy your `client_id` and `sandbox` secret
3. Add to `.env.local`:

```env
PLAID_CLIENT_ID=your_client_id_here
PLAID_SECRET=your_sandbox_secret_here
PLAID_ENV=sandbox
```

### 2.3 Enable Products

1. Go to **Team Settings → API**
2. Enable these products:
   - ✅ Transactions
   - ✅ Auth
   - ✅ Identity

### 2.4 Test Bank Credentials (Sandbox)

Use these test credentials in the Plaid Link flow:
- **Institution**: Any US bank
- **Username**: `user_good`
- **Password**: `pass_good`

---

## 🤖 Step 3: AI Integration Setup

### Option A: Google Gemini (Recommended)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key and add to `.env.local`:

```env
GEMINI_API_KEY=your_gemini_key_here
```

### Option B: OpenAI

1. Visit [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Add to `.env.local`:

```env
OPENAI_API_KEY=your_openai_key_here
```

**Note**: For MVP, the app uses rule-based responses. AI integration can be added in Phase 2.

---

## 💾 Step 4: Database Setup (Production)

### 4.1 Create Supabase Project

1. Visit [Supabase](https://supabase.com)
2. Create a new project
3. Wait for database provisioning (~2 minutes)

### 4.2 Get Database Credentials

1. Go to **Project Settings → API**
2. Copy these values:
   - Project URL
   - `anon` public key
   - `service_role` secret key

3. Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 4.3 Create Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  safety_threshold INTEGER DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plaid_item_id VARCHAR(255) NOT NULL,
  plaid_access_token TEXT NOT NULL, -- encrypted
  account_name VARCHAR(255),
  account_mask VARCHAR(4),
  account_type VARCHAR(50),
  current_balance DECIMAL(15, 2),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  plaid_transaction_id VARCHAR(255) UNIQUE,
  description TEXT,
  amount DECIMAL(15, 2) NOT NULL,
  category VARCHAR(100),
  merchant_name VARCHAR(255),
  transaction_date DATE NOT NULL,
  transaction_type VARCHAR(20), -- 'income' or 'expense'
  pending BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  priority VARCHAR(20), -- 'high', 'medium', 'low'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transactions_account ON transactions(account_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_chat_user ON chat_messages(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view own accounts" ON accounts
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (account_id IN (
    SELECT id FROM accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own messages" ON chat_messages
  FOR SELECT USING (user_id = auth.uid());
```

---

## 📱 Step 5: SMS Service Setup (Optional)

### Option A: Twilio

1. Sign up at [Twilio](https://www.twilio.com/try-twilio)
2. Get a phone number
3. Find your credentials in the console
4. Add to `.env.local`:

```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Option B: AWS SNS

1. Create an AWS account
2. Enable SNS service
3. Create an IAM user with SNS permissions
4. Add to `.env.local`:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
```

**Note**: For MVP development, you can skip SMS and use console logging for OTP.

---

## 🔐 Step 6: Security Configuration

### 6.1 Generate JWT Secret

```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `.env.local`:

```env
JWT_SECRET=your_generated_secret_here
```

### 6.2 Generate Encryption Key

```bash
# Generate 32-character key
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Add to `.env.local`:

```env
ENCRYPTION_KEY=your_generated_key_here
```

---

## 🚀 Step 7: Run the Application

### Development Mode

```bash
npm run dev
# or
bun dev
```

Visit: `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

---

## 🧪 Step 8: Testing the MVP

### Test Flow

1. **Landing Page**
   - Visit `http://localhost:3000`
   - Click "Get Started"

2. **Onboarding**
   - Enter phone: `+919876543210`
   - Check console for OTP (in development mode)
   - Enter the OTP
   - Click through security screens

3. **Bank Connection**
   - Plaid Link will open (using sandbox)
   - Search for any bank
   - Use credentials: `user_good` / `pass_good`
   - Select accounts to connect

4. **Dashboard**
   - View AI coach messages
   - Check cash flow projections
   - Browse transactions
   - Chat with AI coach
   - Explore settings

---

## 🔍 Troubleshooting

### Common Issues

**Issue**: Plaid Link not loading
- **Solution**: Check `PLAID_CLIENT_ID` and `PLAID_SECRET` are correct
- Ensure you're using `sandbox` environment

**Issue**: OTP not working
- **Solution**: Check console logs for OTP in development mode
- Verify SMS service credentials if using production

**Issue**: Transactions not showing
- **Solution**: In sandbox mode, use test credentials
- Mock data should load automatically

**Issue**: AI responses not working
- **Solution**: Check if AI API key is set correctly
- MVP uses rule-based responses (doesn't require AI)

**Issue**: Database errors
- **Solution**: Verify Supabase credentials
- Check if RLS policies are set correctly
- Ensure tables are created

### Debug Mode

Enable debug logging by adding to `.env.local`:

```env
DEBUG=true
LOG_LEVEL=verbose
```

---

## 📊 Monitoring & Analytics

### Supabase Dashboard

Monitor database activity:
- Go to **Database → Tables**
- View real-time data
- Check query performance

### Plaid Dashboard

Monitor API usage:
- Go to **Usage**
- View API call metrics
- Check error rates

### Application Logs

In development:
```bash
# Console logs show all API calls and responses
```

In production (Vercel):
- Go to project dashboard
- Click **Deployments → View Logs**

---

## 🚢 Deployment Guide

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel --prod
```

4. **Set Environment Variables**
- Go to Vercel dashboard
- Navigate to **Settings → Environment Variables**
- Add all variables from `.env.local`

### Deploy to Other Platforms

#### Railway
```bash
railway login
railway init
railway up
```

#### AWS Amplify
- Connect GitHub repository
- Set build settings:
  - Build command: `npm run build`
  - Publish directory: `.next`
- Add environment variables

#### Google Cloud Run
```bash
gcloud run deploy finpal \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🔒 Security Checklist

Before going to production:

- [ ] All API keys in environment variables (not in code)
- [ ] JWT secret is strong and random
- [ ] Database has Row Level Security enabled
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] Rate limiting implemented on API routes
- [ ] Input validation on all endpoints
- [ ] SQL injection protection (using Supabase parameterized queries)
- [ ] XSS protection (Next.js handles this by default)
- [ ] Sensitive data encrypted at rest (access tokens)

---

## 📈 Performance Optimization

### Enable Caching

Add Redis for session and OTP caching:

```env
REDIS_URL=your_redis_url
```

### Optimize Database

Create indexes:
```sql
CREATE INDEX idx_transactions_user ON transactions(user_id, created_at DESC);
CREATE INDEX idx_accounts_user ON accounts(user_id);
```

### Enable CDN

Vercel automatically enables Edge caching. For other platforms:
- Use CloudFlare CDN
- Enable Next.js Image Optimization
- Cache static assets

---

## 📞 Getting Help

- **Documentation Issues**: Open an issue on GitHub
- **Technical Questions**: Join our Discord
- **Security Concerns**: Email security@finpal.app
- **General Support**: support@finpal.app

---

## ✅ Setup Complete!

You should now have:
- ✅ Local development environment running
- ✅ Plaid sandbox connected
- ✅ Database configured
- ✅ All services integrated
- ✅ Application deployed (optional)

**Next Steps**:
1. Customize branding and copy
2. Add real bank connections (move from sandbox)
3. Implement production AI integration
4. Set up monitoring and alerts
5. Launch to users!

---

**Happy Building! 🚀**