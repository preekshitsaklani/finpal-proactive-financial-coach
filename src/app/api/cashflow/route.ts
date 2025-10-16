import { NextRequest, NextResponse } from "next/server";
import { calculateCashFlowProjection } from "@/lib/cashflow";
import { categorizeTransactions } from "@/lib/categorization";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "7");

    // Mock transaction data for calculation
    const recentTransactions = [
      { amount: 15000, date: "2025-01-15", type: "income" },
      { amount: -450, date: "2025-01-14", type: "expense" },
      { amount: -280, date: "2025-01-14", type: "expense" },
      { amount: -649, date: "2025-01-13", type: "expense" },
      { amount: -1200, date: "2025-01-13", type: "expense" },
      { amount: 8500, date: "2025-01-10", type: "income" },
      { amount: -2300, date: "2025-01-09", type: "expense" },
      { amount: -350, date: "2025-01-08", type: "expense" },
      { amount: -1500, date: "2025-01-07", type: "expense" },
      { amount: 12000, date: "2025-01-05", type: "income" },
      { amount: -800, date: "2025-01-04", type: "expense" },
      { amount: -450, date: "2025-01-03", type: "expense" },
    ];

    // Calculate cash flow projection
    const projection = calculateCashFlowProjection(recentTransactions, days);

    // Calculate spending by category
    const categoryBreakdown = {
      "Food & Dining": 3450,
      Transport: 2100,
      Entertainment: 1800,
      Groceries: 2400,
      Shopping: 2300,
      Others: 1050,
    };

    // Calculate trends
    const weeklyStats = {
      currentWeek: {
        income: 23500,
        expenses: 9200,
        netFlow: 14300,
      },
      lastWeek: {
        income: 8500,
        expenses: 11200,
        netFlow: -2700,
      },
      trend: "improving",
    };

    return NextResponse.json({
      success: true,
      data: {
        currentBalance: 12450,
        projection,
        categoryBreakdown,
        weeklyStats,
        alerts: [
          {
            type: "warning",
            message:
              "Your projected balance in 7 days (₹4,200) is below your safety threshold of ₹5,000",
            priority: "high",
            actionable: true,
          },
          {
            type: "info",
            message:
              "You've spent 32% of your weekly budget on Food & Dining",
            priority: "medium",
            actionable: true,
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error calculating cash flow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate cash flow" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transactions, safetyThreshold } = body;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { success: false, error: "Transactions array is required" },
        { status: 400 }
      );
    }

    // Categorize transactions
    const categorizedTransactions = categorizeTransactions(transactions);

    // Calculate projection
    const projection = calculateCashFlowProjection(categorizedTransactions, 7);

    // Determine if alert is needed
    const threshold = safetyThreshold || 5000;
    const needsAlert = projection.projectedBalance < threshold;

    return NextResponse.json({
      success: true,
      data: {
        projection,
        categorizedTransactions,
        needsAlert,
        alertMessage: needsAlert
          ? `Your projected balance (₹${projection.projectedBalance.toLocaleString()}) will fall below your safety threshold (₹${threshold.toLocaleString()}) in ${projection.daysUntilLow} days.`
          : null,
      },
    });
  } catch (error) {
    console.error("Error processing cash flow:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process cash flow" },
      { status: 500 }
    );
  }
}