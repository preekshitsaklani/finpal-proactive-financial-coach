import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId, deviceInfo } = body;

    // Validate Person ID
    if (!personId || personId.length !== 12) {
      return NextResponse.json(
        { error: "Invalid Person ID" },
        { status: 400 }
      );
    }

    // Generate 4-digit verification code
    const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Store in database with expiry (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    
    // TODO: Store in multiDeviceAuth table
    // await db.insert(multiDeviceAuth).values({
    //   userId: user.id,
    //   verificationCode,
    //   requestingDevice: JSON.stringify(deviceInfo),
    //   status: 'pending',
    //   createdAt: new Date().toISOString(),
    //   expiresAt,
    // });

    // In production, send push notification to primary device
    console.log(`Multi-device verification code: ${verificationCode}`);

    return NextResponse.json({ 
      success: true,
      message: "Verification code sent to primary device",
      deviceName: "iPhone 12 Pro", // Mock device name
      // In development only
      code: process.env.NODE_ENV === "development" ? verificationCode : undefined,
    });
  } catch (error) {
    console.error("Request multi-device error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}