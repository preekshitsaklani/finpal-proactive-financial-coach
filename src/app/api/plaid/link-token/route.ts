import { NextRequest, NextResponse } from "next/server";

// Plaid Link Token Generation
// In production, this would use the actual Plaid API
// For MVP/demo, we're simulating the response

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "User ID is required" },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Initialize Plaid client with credentials
    // 2. Call plaidClient.linkTokenCreate() with proper config
    // 3. Return the link_token
    
    // Example production code:
    /*
    const plaidClient = new PlaidApi(configuration);
    const request = {
      user: { client_user_id: userId },
      client_name: 'FinPal',
      products: ['transactions'],
      country_codes: ['IN'],
      language: 'en',
    };
    const response = await plaidClient.linkTokenCreate(request);
    return NextResponse.json({
      success: true,
      link_token: response.data.link_token,
    });
    */

    // Mock response for development
    const mockLinkToken = `link-sandbox-${Buffer.from(userId).toString("base64")}-${Date.now()}`;

    return NextResponse.json({
      success: true,
      link_token: mockLinkToken,
      expiration: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });
  } catch (error) {
    console.error("Error creating link token:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create link token" },
      { status: 500 }
    );
  }
}