import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, personId, upiId, email, name, password } = body;

    if (!phone || !personId || !email) {
      return NextResponse.json(
        { error: "Phone, Person ID, and email are required" },
        { status: 400 }
      );
    }

    // Check if user already exists in custom users table
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user
      await db
        .update(users)
        .set({
          phone,
          personId,
          upiId: upiId || null,
          phoneVerified: true,
          upiVerified: !!upiId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.email, email));

      return NextResponse.json({
        success: true,
        message: "Profile updated successfully",
      });
    }

    // Create new user in custom users table
    // Note: This user already exists in better-auth 'user' table
    const passwordHash = password ? await bcrypt.hash(password, 10) : "";
    const now = new Date().toISOString();

    await db.insert(users).values({
      name: name || "User",
      email,
      phone,
      passwordHash,
      personId,
      upiId: upiId || null,
      emailVerified: true,
      phoneVerified: true,
      upiVerified: !!upiId,
      biometricEnabled: false,
      twoFactorEnabled: false,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Profile completed successfully",
    });

  } catch (error) {
    console.error("Complete profile error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}