import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { personId } = body;

    // Validate Person ID format (12 alphanumeric characters)
    if (!personId || personId.length !== 12) {
      return NextResponse.json(
        { error: "Invalid Person ID format" },
        { status: 400 }
      );
    }

    // In production, verify against database
    // const user = await db.query.users.findFirst({
    //   where: eq(users.personId, personId)
    // });

    // if (!user) {
    //   return NextResponse.json(
    //     { error: "Person ID not found" },
    //     { status: 404 }
    //   );
    // }

    // For demo, accept any 12-character ID
    return NextResponse.json({ 
      success: true,
      message: "Person ID verified",
      requiresBiometric: true,
    });
  } catch (error) {
    console.error("Person ID login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}