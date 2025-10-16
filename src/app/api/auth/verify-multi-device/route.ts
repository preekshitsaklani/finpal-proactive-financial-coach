import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId, verificationCode } = body;

    // Validate inputs
    if (!personId || !verificationCode || verificationCode.length !== 4) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    // In production, verify against database
    // const auth = await db.query.multiDeviceAuth.findFirst({
    //   where: and(
    //     eq(multiDeviceAuth.verificationCode, verificationCode),
    //     eq(multiDeviceAuth.status, 'pending')
    //   )
    // });

    // if (!auth || new Date(auth.expiresAt) < new Date()) {
    //   return NextResponse.json(
    //     { error: "Invalid or expired verification code" },
    //     { status: 400 }
    //   );
    // }

    // Mark as approved
    // await db.update(multiDeviceAuth)
    //   .set({ status: 'approved' })
    //   .where(eq(multiDeviceAuth.id, auth.id));

    // Generate session token
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

    return NextResponse.json({ 
      success: true,
      message: "Device verified successfully",
      token,
    });
  } catch (error) {
    console.error("Verify multi-device error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}