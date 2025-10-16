import { NextRequest, NextResponse } from "next/server";

// In production, this would use Google Gemini API or OpenAI API
// For MVP, we're using rule-based responses

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// Mock financial data for context
const userFinancialContext = {
  currentBalance: 12450,
  projectedBalance: 4200,
  weeklyIncome: 8500,
  weeklyExpenses: 9200,
  safetyThreshold: 5000,
  topSpendingCategory: "Food & Dining",
  topSpendingAmount: 3450,
};

// Rule-based AI responses for common queries
const generateResponse = (userMessage: string): string => {
  const message = userMessage.toLowerCase();

  // Balance inquiries
  if (message.includes("balance") || message.includes("money")) {
    return `Your current balance is ₹${userFinancialContext.currentBalance.toLocaleString()}. Based on your spending patterns, I project it will be around ₹${userFinancialContext.projectedBalance.toLocaleString()} in 7 days, which is below your safety threshold of ₹${userFinancialContext.safetyThreshold.toLocaleString()}.`;
  }

  // Spending inquiries
  if (message.includes("spending") || message.includes("spend")) {
    return `This week, you've spent ₹${userFinancialContext.weeklyExpenses.toLocaleString()}, with the highest amount going to ${userFinancialContext.topSpendingCategory} (₹${userFinancialContext.topSpendingAmount.toLocaleString()}). Your spending is ₹${(userFinancialContext.weeklyExpenses - userFinancialContext.weeklyIncome).toLocaleString()} more than your income this week.`;
  }

  // Savings advice
  if (message.includes("save") || message.includes("saving")) {
    return `Based on your current situation, I recommend:\n\n1. Reduce dining out by cooking at home 3-4 times a week. This could save you ₹1,500-₹2,000.\n2. Review your subscriptions - cancel any you're not actively using.\n3. Set aside ₹500 daily for the next 7 days to build a buffer above your safety threshold.\n\nThese small changes can make a big difference!`;
  }

  // Budget questions
  if (message.includes("budget") || message.includes("plan")) {
    return `Let's create a simple plan:\n\n• Income this week: ₹${userFinancialContext.weeklyIncome.toLocaleString()}\n• Fixed expenses (rent, subscriptions): ~₹3,000\n• Variable expenses budget: ~₹4,000\n• Emergency buffer: ₹1,500\n\nThis leaves you with a small cushion. Focus on reducing variable expenses, especially ${userFinancialContext.topSpendingCategory.toLowerCase()}, to improve your cash flow.`;
  }

  // Food/dining specific
  if (message.includes("food") || message.includes("dining") || message.includes("restaurant")) {
    return `You've spent ₹${userFinancialContext.topSpendingAmount.toLocaleString()} on food and dining this week. Here's how to reduce it:\n\n• Meal prep on Sundays for 4-5 days\n• Limit restaurant visits to 2 times per week\n• Use grocery apps for discounts\n• Pack lunch for work\n\nThese changes could save you ₹1,000-₹1,500 weekly!`;
  }

  // Income questions
  if (message.includes("income") || message.includes("earn")) {
    return `Your weekly income has been averaging ₹${userFinancialContext.weeklyIncome.toLocaleString()}. To improve your situation, consider:\n\n• Taking on 1-2 additional small projects\n• Increasing your rates for new clients\n• Exploring passive income streams\n• Building an emergency fund during high-income weeks\n\nEven a 10% income increase (₹850/week) would significantly improve your cash flow.`;
  }

  // Default helpful response
  return `I'm here to help you manage your finances! I can provide insights about:\n\n• Your current balance and projections\n• Spending patterns and where to cut back\n• Personalized saving strategies\n• Budget planning for irregular income\n• Tips to increase your income\n\nWhat specific area would you like to focus on?`;
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message is required" },
        { status: 400 }
      );
    }

    // Simulate AI processing delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate response based on user message
    const aiResponse = generateResponse(message);

    return NextResponse.json({
      success: true,
      data: {
        message: aiResponse,
        timestamp: new Date().toISOString(),
        suggestions: [
          "Tell me more about my spending",
          "How can I save money?",
          "What's my income vs expenses?",
        ],
      },
    });
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process message" },
      { status: 500 }
    );
  }
}