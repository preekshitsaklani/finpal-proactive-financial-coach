import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, otp, tempPassword, purpose } = body;

    // In production, verify OTP against database
    // const verification = await db.query.otpVerifications.findFirst({
    //   where: and(
    //     eq(otpVerifications.phoneOrEmail, email || phone),
    //     eq(otpVerifications.otpCode, otp),
    //     eq(otpVerifications.purpose, purpose),
    //     eq(otpVerifications.verified, false)
    //   )
    // });

    // For demo, accept any 6-digit OTP
    if (otp.length !== 6) {
      return NextResponse.json(
        { error: "Invalid OTP code" },
        { status: 400 }
      );
    }

    // Verify temp password if provided
    if (tempPassword && tempPassword.length < 6) {
      return NextResponse.json(
        { error: "Invalid temporary password" },
        { status: 400 }
      );
    }

    // Mark as verified in database
    // await db.update(otpVerifications)
    //   .set({ verified: true })
    //   .where(eq(otpVerifications.id, verification.id));

    return NextResponse.json({ 
      success: true,
      message: "Verification successful",
      tempPassword: purpose === "signup" ? tempPassword : undefined,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}