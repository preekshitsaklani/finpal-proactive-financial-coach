import { NextRequest, NextResponse } from "next/server";

// Fetch transactions from Plaid
// In production, this would use the actual Plaid API

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, startDate, endDate } = body;

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Access token is required" },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Fetch transactions from Plaid using access_token
    // 2. Categorize transactions using our categorization engine
    // 3. Store in database
    // 4. Return formatted transactions
    
    // Example production code:
    /*
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate || getDateDaysAgo(30),
      end_date: endDate || getDateToday(),
    });
    
    const categorized = categorizeTransactions(response.data.transactions);
    await db.transactions.insertMany(categorized);
    
    return NextResponse.json({
      success: true,
      transactions: categorized,
      accounts: response.data.accounts,
    });
    */

    // Mock transactions for development
    const mockTransactions = [
      {
        id: "txn_1",
        description: "Freelance Project Payment - Client A",
        amount: 15000,
        category: "Income",
        date: "2025-01-15",
        type: "income",
        merchantName: "Client A",
        pending: false,
      },
      {
        id: "txn_2",
        description: "Swiggy Order",
        amount: -450,
        category: "Food & Dining",
        date: "2025-01-14",
        type: "expense",
        merchantName: "Swiggy",
        pending: false,
      },
      {
        id: "txn_3",
        description: "Uber Ride",
        amount: -280,
        category: "Transport",
        date: "2025-01-14",
        type: "expense",
        merchantName: "Uber",
        pending: false,
      },
      {
        id: "txn_4",
        description: "Netflix Subscription",
        amount: -649,
        category: "Entertainment",
        date: "2025-01-13",
        type: "expense",
        merchantName: "Netflix",
        pending: false,
      },
    ];

    return NextResponse.json({
      success: true,
      data: {
        transactions: mockTransactions,
        totalCount: mockTransactions.length,
        lastFetched: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}