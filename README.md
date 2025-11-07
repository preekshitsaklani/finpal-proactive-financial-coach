# FinPal - Your Autonomous Financial Coach 🧠💰

<div align="center">

![FinPal Logo](https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&h=200&fit=crop)

**Financial peace of mind for the modern workforce**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Demo](https://finpal-demo.vercel.app) • [Documentation](#documentation) • [Report Bug](https://github.com/yourusername/finpal/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem We're Solving](#the-problem-were-solving)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**FinPal** is an AI-powered financial companion designed specifically for gig workers, freelancers, and informal sector employees who face income volatility. Unlike traditional budgeting apps built for predictable monthly salaries, FinPal understands and adapts to irregular income patterns, providing proactive financial coaching that helps users navigate uncertainty with confidence.

### Why FinPal?

Traditional financial tools fail the modern workforce because:
- They assume stable, monthly income
- They're reactive, not proactive
- They require manual tracking and analysis
- They don't provide actionable, personalized advice

FinPal changes this by being:
- **Autonomous**: Automatically tracks and analyzes your finances
- **Proactive**: Warns you before problems happen
- **Intelligent**: Learns your unique financial patterns
- **Empathetic**: Delivers advice like a trusted friend

---

## 🚨 The Problem We're Solving

### Target Users

**Ananya** - Freelance Designer, 28
- Juggles multiple projects with varying payment schedules
- Income fluctuates between ₹15,000 - ₹50,000/month
- Struggles to know when it's "safe" to make large purchases
- Tech-savvy but time-poor

**Rohan** - Delivery Partner, 23
- Earns daily/weekly based on completed deliveries
- Income affected by weather, demand, and app incentives
- Difficulty managing day-to-day cash flow
- Wants to save for vehicle maintenance and personal goals

### Core Pain Point

The real problem isn't just tracking expenses—it's **financial anxiety**. The constant uncertainty leads to stress and poor, reactive decision-making. Users lack the time, tools, and specialized knowledge to plan effectively.

---

## ✨ Key Features

### Phase 1 (MVP - Current Implementation)

#### 1. 🔐 Secure Onboarding
- Phone number verification with OTP
- Bank-level security education
- Transparent privacy practices
- Seamless Plaid integration for bank connection

#### 2. 🤖 AI Financial Coach
- **Proactive Cash Flow Alerts**: 7-day balance predictions
- **Smart Categorization**: Automatic transaction categorization
- **Conversational Interface**: Chat-based financial advice
- **Personalized Insights**: Context-aware recommendations

#### 3. 📊 Financial Intelligence
- Real-time transaction tracking
- Category-based spending analysis
- Income pattern detection
- Recurring expense identification

#### 4. 💬 Chat-Based Coaching
- Natural language conversations
- Actionable advice (not complex charts)
- Empathetic tone and messaging
- Context-aware responses

#### 5. ⚙️ Settings & Account Management
- Safety threshold configuration
- Notification preferences
- Connected accounts management
- Privacy and security controls

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/UI
- **Animations**: Framer Motion
- **State Management**: React Hooks

### Backend
- **API**: Next.js API Routes
- **Authentication**: JWT + OTP (Phone-based)
- **Data Aggregation**: Plaid API

### AI & Intelligence
- **NLP**: Google Gemini / OpenAI GPT
- **Categorization**: Rule-based (MVP) → ML (Phase 2)
- **Forecasting**: Linear Regression → ARIMA (Phase 2)

### Database (Production Ready)
- **Primary**: Supabase (PostgreSQL)
- **Caching**: Redis (for sessions/OTP)
- **Encryption**: AES-256 for sensitive data

### Infrastructure
- **Hosting**: Vercel (Frontend), Google Cloud Run (Backend)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry
- **Analytics**: Mixpanel

---

## 🚀 Getting Started

### Prerequisites

```bash
Node.js 18+ and npm/yarn/bun installed
```

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/finpal.git
cd finpal
```

2. **Install dependencies**
```bash
npm install
# or
bun install
```

3. ** a) Set up environment variables**
```bash
cp .env.example .env.local
```
   ** b) Edit .env file**
```bash
Replace the placeholder values (e.g. <your_api_key_here> etc.) with your actual credentials.
```

Edit `.env.local` and add your API keys:
```env
# Plaid
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox

# AI (choose one)
GEMINI_API_KEY=your_gemini_key
# OR
OPENAI_API_KEY=your_openai_key

# Database
DATABASE_URL=your_database_url

# SMS (for OTP)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

4. **Run the development server**
```bash
npm run dev
# or
bun dev
```

5. **Open your browser**
```
http://localhost:3000
```

### First Time Setup

1. Visit the landing page
2. Click "Get Started"
3. Enter your phone number for OTP verification
4. Connect your bank account via Plaid (use sandbox credentials)
5. Start chatting with your AI financial coach!

---

## 📁 Project Structure

```
finpal/
├── src/
│   ├── app/                      # Next.js app directory
│   │   ├── api/                  # API routes
│   │   │   ├── auth/            # Authentication endpoints
│   │   │   │   ├── signup/      # Send OTP
│   │   │   │   └── verify/      # Verify OTP
│   │   │   ├── plaid/           # Plaid integration
│   │   │   │   ├── link-token/  # Generate Plaid Link token
│   │   │   │   ├── exchange-token/  # Exchange public token
│   │   │   │   └── transactions/    # Fetch transactions
│   │   │   ├── chat/            # AI chat endpoint
│   │   │   ├── cashflow/        # Cash flow predictions
│   │   │   └── transactions/    # Transaction CRUD
│   │   ├── dashboard/           # Dashboard page
│   │   ├── onboarding/          # Onboarding flow
│   │   ├── settings/            # Settings page
│   │   ├── layout.tsx           # Root layout
│   │   ├── page.tsx             # Landing page
│   │   └── globals.css          # Global styles
│   ├── components/              # React components
│   │   ├── ui/                  # Shadcn UI components
│   │   ├── Dashboard.tsx        # Main dashboard
│   │   ├── LandingPage.tsx      # Landing page
│   │   ├── OnboardingFlow.tsx   # Onboarding flow
│   │   └── Settings.tsx         # Settings page
│   └── lib/                     # Utility functions
│       ├── categorization.ts    # Transaction categorization
│       ├── cashflow.ts          # Cash flow prediction
│       └── utils.ts             # Helper functions
├── public/                      # Static assets
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/signup`
Send OTP to phone number
```json
{
  "phone": "+919876543210"
}
```

#### POST `/api/auth/verify`
Verify OTP and authenticate
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### Plaid Integration

#### POST `/api/plaid/link-token`
Generate Plaid Link token
```json
{
  "userId": "user_123"
}
```

#### POST `/api/plaid/exchange-token`
Exchange public token for access token
```json
{
  "publicToken": "public-sandbox-xxx",
  "userId": "user_123"
}
```

### Transactions

#### GET `/api/transactions`
Fetch transactions with filters
```
?startDate=2025-01-01&endDate=2025-01-31&category=Food
```

#### POST `/api/transactions`
Create manual transaction
```json
{
  "description": "Coffee",
  "amount": -450,
  "category": "Food & Dining",
  "date": "2025-01-15"
}
```

### Cash Flow

#### GET `/api/cashflow?days=7`
Get cash flow projection for N days

#### POST `/api/cashflow`
Calculate custom projection
```json
{
  "transactions": [...],
  "safetyThreshold": 5000
}
```

### AI Chat

#### POST `/api/chat`
Chat with AI coach
```json
{
  "message": "How can I save money this week?",
  "conversationHistory": [...]
}
```

---

## 🏗 Architecture

### Core System Flow

```
User → Landing Page → Onboarding (OTP) → Bank Connection (Plaid)
                                              ↓
Dashboard ← AI Coach ← Cash Flow Engine ← Transactions
    ↓
Settings & Preferences
```

### Data Flow

1. **Data Aggregation**
   - User connects bank via Plaid
   - Transactions synced every 6 hours
   - Stored securely (encrypted at rest)

2. **Intelligence Processing**
   - Transactions auto-categorized
   - Cash flow projections calculated daily
   - Patterns analyzed for insights

3. **Proactive Alerts**
   - Triggers generated based on thresholds
   - LLM generates human-like messages
   - Push notifications sent to user

4. **Conversational Interface**
   - User asks questions in chat
   - Context assembled from financial data
   - LLM provides personalized advice

### Security Architecture

- **Authentication**: Phone-based OTP + JWT tokens
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Plaid Integration**: Read-only access, no password storage
- **Access Control**: User-scoped data access
- **Compliance**: GDPR-ready, data retention policies

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
npm run build
vercel deploy --prod
```

### Environment Variables in Production

Ensure all environment variables are set in your hosting platform:
- Plaid credentials
- Database connection string
- AI API keys
- SMS service credentials
- JWT secret

### Database Setup

1. Create Supabase project
2. Run migrations (schema coming in Phase 2)
3. Set up row-level security policies
4. Enable real-time subscriptions

---

## 🗺 Roadmap

### Phase 2 (Fast Follow - Next 3 Months)
- [ ] Manual transaction input for cash spending
- [ ] Savings goals with progress tracking
- [ ] ML-based transaction categorization
- [ ] iOS app launch
- [ ] Bill payment reminders
- [ ] Subscription management

### Phase 3 (Future Vision)
- [ ] Investment advice and recommendations
- [ ] Debt reduction strategies
- [ ] Insurance product integration
- [ ] Tax planning tools
- [ ] Community features (anonymized tips)
- [ ] Multi-currency support

---

## 🎨 Design Philosophy

### UI/UX Principles
- **Clean**: Minimal, uncluttered interface
- **Trustworthy**: Transparent about security and privacy
- **Empathetic**: Calm, reassuring tone and colors
- **Accessible**: WCAG 2.1 AA compliant

### Color Palette
- Primary: Financial trust blue
- Success: Positive green
- Warning: Cautious orange
- Danger: Alert red
- Neutral: Balanced grays

---

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API routes
- E2E tests for critical user flows

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Plaid](https://plaid.com/) for financial data aggregation
- [Shadcn/UI](https://ui.shadcn.com/) for beautiful components
- [Vercel](https://vercel.com/) for hosting and deployment
- The freelance and gig worker community for inspiration

---

## 📞 Support

- **Documentation**: [docs.finpal.app](https://docs.finpal.app)
- **Email**: support@finpal.app
- **Twitter**: [@finpal_app](https://twitter.com/finpal_app)
- **Discord**: [Join our community](https://discord.gg/finpal)

---

<div align="center">

**Built with ❤️ for the modern workforce**

Made by [Your Team] | © 2025 FinPal

</div>
