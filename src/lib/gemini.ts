import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not configured');
}

const genAI = new GoogleGenerativeAI(apiKey);

export interface FinancialContext {
  userName: string;
  currentBalance: number;
  projectedBalance: number;
  daysUntilLow: number;
  recentSpending?: {
    category: string;
    amount: number;
  }[];
  income?: {
    amount: number;
    frequency: string;
  };
}

export interface CoachingInsight {
  message: string;
  category: 'warning' | 'advice' | 'celebration' | 'info';
  actionable: boolean;
}

/**
 * Generate personalized financial coaching message using Gemini AI
 */
export async function generateFinancialAdvice(context: FinancialContext): Promise<CoachingInsight> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are "FinPal", a friendly and empathetic financial coach for gig workers and freelancers with variable income. Your role is to provide actionable, encouraging financial advice.

User Context:
- Name: ${context.userName}
- Current Balance: ₹${context.currentBalance}
- Projected Balance (7 days): ₹${context.projectedBalance}
- Days Until Low Balance: ${context.daysUntilLow}
${context.recentSpending ? `- Recent Spending: ${context.recentSpending.map(s => `${s.category}: ₹${s.amount}`).join(', ')}` : ''}
${context.income ? `- Income Pattern: ₹${context.income.amount} per ${context.income.frequency}` : ''}

Task: Generate a short, personalized financial coaching message (2-3 sentences max). Be warm, encouraging, and actionable. Focus on:
1. Acknowledging their situation with empathy
2. Providing ONE specific, actionable tip
3. Being positive and supportive (never judgmental)

Examples:
- "Hey ${context.userName}! I noticed your balance might get tight in ${context.daysUntilLow} days. Consider cooking at home this week instead of dining out—you could save around ₹500-800! 🍳"
- "Great news ${context.userName}! Your spending has been steady this week. You're on track to maintain a healthy buffer. Keep it up! 💪"

Generate the message now:`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const message = response.text();

    // Determine category based on context
    let category: CoachingInsight['category'] = 'info';
    if (context.projectedBalance < 1000) {
      category = 'warning';
    } else if (context.projectedBalance > context.currentBalance * 1.2) {
      category = 'celebration';
    } else {
      category = 'advice';
    }

    return {
      message: message.trim(),
      category,
      actionable: true,
    };
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw new Error('Failed to generate financial advice');
  }
}

/**
 * Generate transaction categorization using AI
 */
export async function categorizeTransaction(description: string, amount: number): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Categorize this transaction into ONE of these categories: Food, Transport, Shopping, Bills, Entertainment, Healthcare, Education, Other.

Transaction: "${description}"
Amount: ₹${amount}

Respond with ONLY the category name, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const category = response.text().trim();

    // Validate category
    const validCategories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Other'];
    return validCategories.includes(category) ? category : 'Other';
  } catch (error) {
    console.error('Gemini categorization error:', error);
    return 'Other';
  }
}

/**
 * Generate cash flow projection insights
 */
export async function generateCashFlowInsight(
  transactions: Array<{ amount: number; date: string; category: string }>,
  currentBalance: number
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const totalIncome = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const netFlow = totalIncome - totalExpenses;

    const prompt = `You are FinPal, a financial coach. Analyze this cash flow data and provide a brief insight (1-2 sentences):

- Current Balance: ₹${currentBalance}
- Total Income (30 days): ₹${totalIncome}
- Total Expenses (30 days): ₹${totalExpenses}
- Net Flow: ₹${netFlow}
- Transaction Count: ${transactions.length}

Provide a helpful, encouraging insight about their spending pattern or income stability.`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Gemini insight error:', error);
    return 'Keep tracking your expenses to build better financial habits!';
  }
}