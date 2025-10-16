import { NextRequest, NextResponse } from "next/server";

// Mock data - in production, this would come from Plaid API and database
const mockTransactions = [
  {
    id: "txn_1",
    description: "Freelance Project Payment - Client A",
    amount: 15000,
    category: "Income",
    date: "2025-01-15",
    type: "income",
    merchantName: "Client A",
  },
  {
    id: "txn_2",
    description: "Swiggy Order",
    amount: -450,
    category: "Food & Dining",
    date: "2025-01-14",
    type: "expense",
    merchantName: "Swiggy",
  },
  {
    id: "txn_3",
    description: "Uber Ride",
    amount: -280,
    category: "Transport",
    date: "2025-01-14",
    type: "expense",
    merchantName: "Uber",
  },
  {
    id: "txn_4",
    description: "Netflix Subscription",
    amount: -649,
    category: "Entertainment",
    date: "2025-01-13",
    type: "expense",
    merchantName: "Netflix",
  },
  {
    id: "txn_5",
    description: "Grocery Shopping - DMart",
    amount: -1200,
    category: "Groceries",
    date: "2025-01-13",
    type: "expense",
    merchantName: "DMart",
  },
  {
    id: "txn_6",
    description: "Freelance Project Payment - Client B",
    amount: 8500,
    category: "Income",
    date: "2025-01-10",
    type: "income",
    merchantName: "Client B",
  },
  {
    id: "txn_7",
    description: "Amazon Shopping",
    amount: -2300,
    category: "Shopping",
    date: "2025-01-09",
    type: "expense",
    merchantName: "Amazon",
  },
  {
    id: "txn_8",
    description: "Coffee - Starbucks",
    amount: -350,
    category: "Food & Dining",
    date: "2025-01-08",
    type: "expense",
    merchantName: "Starbucks",
  },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    let filteredTransactions = [...mockTransactions];

    // Filter by date range if provided
    if (startDate) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) >= new Date(startDate)
      );
    }
    if (endDate) {
      filteredTransactions = filteredTransactions.filter(
        (t) => new Date(t.date) <= new Date(endDate)
      );
    }

    // Filter by category if provided
    if (category && category !== "all") {
      filteredTransactions = filteredTransactions.filter(
        (t) => t.category === category
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredTransactions,
      count: filteredTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, category, date } = body;

    // Validate required fields
    if (!description || !amount || !date) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create new transaction
    const newTransaction = {
      id: `txn_${Date.now()}`,
      description,
      amount: parseFloat(amount),
      category: category || "General",
      date,
      type: amount >= 0 ? "income" : "expense",
      merchantName: description,
    };

    // In production, this would be saved to the database
    mockTransactions.unshift(newTransaction);

    return NextResponse.json({
      success: true,
      data: newTransaction,
      message: "Transaction created successfully",
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}