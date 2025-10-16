import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, purpose } = body;

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In production, send OTP via email/SMS service (Twilio, AWS SNS, etc.)
    console.log(`OTP for ${email || phone}: ${otp}`);
    
    // Store OTP in database with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // For demo purposes, also generate a temp password if it's signup
    let tempPassword = "";
    if (purpose === "signup") {
      tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
      console.log(`Temp Password: ${tempPassword}`);
    }

    // TODO: Store in database
    // await db.insert(otpVerifications).values({
    //   phoneOrEmail: email || phone,
    //   otpCode: otp,
    //   purpose,
    //   verified: false,
    //   createdAt: new Date().toISOString(),
    //   expiresAt,
    // });

    return NextResponse.json({ 
      success: true,
      message: "OTP sent successfully",
      // In development only - remove in production
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
      tempPassword: purpose === "signup" ? tempPassword : undefined,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}