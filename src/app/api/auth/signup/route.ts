import { NextRequest, NextResponse } from "next/server";

// Mock user database - in production, use Supabase or other database
const mockUsers: Record<
  string,
  { phone: string; name?: string; createdAt: string; id: string }
> = {};

// Mock OTP storage - in production, use Redis or similar
const mockOtpStorage: Record<string, { otp: string; expiresAt: number }> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with 5-minute expiration
    mockOtpStorage[phone] = {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    // In production, send OTP via SMS service (Twilio, SNS, etc.)
    console.log(`OTP for ${phone}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      // In development only - remove in production
      dev_otp: process.env.NODE_ENV === "development" ? otp : undefined,
    });
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}