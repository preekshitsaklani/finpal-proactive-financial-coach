import { NextRequest, NextResponse } from "next/server";

// Mock OTP storage - should match the one in signup route
const mockOtpStorage: Record<string, { otp: string; expiresAt: number }> = {};

// Mock user database
const mockUsers: Record<
  string,
  { phone: string; name?: string; createdAt: string; id: string }
> = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    if (!phone || !otp) {
      return NextResponse.json(
        { success: false, error: "Phone number and OTP are required" },
        { status: 400 }
      );
    }

    // Check if OTP exists and is valid
    const storedOtp = mockOtpStorage[phone];

    if (!storedOtp) {
      return NextResponse.json(
        { success: false, error: "OTP not found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (Date.now() > storedOtp.expiresAt) {
      delete mockOtpStorage[phone];
      return NextResponse.json(
        { success: false, error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return NextResponse.json(
        { success: false, error: "Invalid OTP. Please try again." },
        { status: 400 }
      );
    }

    // OTP is valid - clean up
    delete mockOtpStorage[phone];

    // Check if user exists, if not create new user
    let user = mockUsers[phone];
    if (!user) {
      user = {
        id: `user_${Date.now()}`,
        phone,
        createdAt: new Date().toISOString(),
      };
      mockUsers[phone] = user;
    }

    // In production, generate a proper JWT token
    const mockToken = Buffer.from(JSON.stringify({ userId: user.id, phone })).toString("base64");

    return NextResponse.json({
      success: true,
      message: "Phone verified successfully",
      data: {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
        },
        token: mockToken,
        isNewUser: !user.name, // If no name, it's a new user
      },
    });
  } catch (error) {
    console.error("Error in verify:", error);
    return NextResponse.json(
      { success: false, error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}