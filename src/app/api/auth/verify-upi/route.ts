import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { upiId, email } = body;

    // Validate UPI ID format (basic validation)
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upiId)) {
      return NextResponse.json(
        { error: "Invalid UPI ID format" },
        { status: 400 }
      );
    }

    // In production, verify with bank API
    // For demo, accept any valid format
    
    // TODO: Update user record with verified UPI ID
    // await db.update(users)
    //   .set({ upiId, upiVerified: true })
    //   .where(eq(users.email, email));

    return NextResponse.json({ 
      success: true,
      message: "UPI ID verified successfully",
    });
  } catch (error) {
    console.error("Verify UPI error:", error);
    return NextResponse.json(
      { error: "UPI verification failed" },
      { status: 500 }
    );
  }
}