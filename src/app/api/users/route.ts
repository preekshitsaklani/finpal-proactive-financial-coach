import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

// Helper function to generate unique 12-char alphanumeric personId
function generatePersonId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to check personId uniqueness and generate new one if needed
async function generateUniquePersonId(maxAttempts = 3): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const personId = generatePersonId();
    const existing = await db.select().from(users).where(eq(users.personId, personId)).limit(1);
    if (existing.length === 0) {
      return personId;
    }
  }
  throw new Error('Failed to generate unique personId after maximum attempts');
}

// Simple encryption for sensitive data (production should use proper encryption)
function encryptData(data: string): string {
  return Buffer.from(data).toString('base64');
}

// Helper function to exclude sensitive fields from user objects
function sanitizeUserResponse(user: any) {
  const { passwordHash, biometricHash, authenticatorSecret, ...sanitized } = user;
  return sanitized;
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (basic format)
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
  return phoneRegex.test(phone);
}

// Password strength validation
function isStrongPassword(password: string): boolean {
  return password.length >= 8;
}

// GET method - list users or get single user by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const user = await db.select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json({ 
          error: 'User not found',
          code: 'USER_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(sanitizeUserResponse(user[0]), { status: 200 });
    }

    // List users with pagination, search, and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const emailVerified = searchParams.get('emailVerified');
    const phoneVerified = searchParams.get('phoneVerified');

    let query = db.select().from(users);

    // Build conditions array
    const conditions = [];

    // Search across name, email, phone, personId
    if (search) {
      conditions.push(
        or(
          like(users.name, `%${search}%`),
          like(users.email, `%${search}%`),
          like(users.phone, `%${search}%`),
          like(users.personId, `%${search}%`)
        )
      );
    }

    // Filter by emailVerified
    if (emailVerified !== null && emailVerified !== undefined) {
      conditions.push(eq(users.emailVerified, emailVerified === 'true'));
    }

    // Filter by phoneVerified
    if (phoneVerified !== null && phoneVerified !== undefined) {
      conditions.push(eq(users.phoneVerified, phoneVerified === 'true'));
    }

    // Apply conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    // Sanitize all user objects
    const sanitizedResults = results.map(sanitizeUserResponse);

    return NextResponse.json(sanitizedResults, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST method - create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, password, upiId, profilePictureUrl, googleId, appleId } = body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ 
        error: "Required fields missing: name, email, phone, password",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate name length
    if (name.trim().length < 2 || name.trim().length > 100) {
      return NextResponse.json({ 
        error: "Name must be between 2 and 100 characters",
        code: "INVALID_NAME_LENGTH" 
      }, { status: 400 });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json({ 
        error: "Invalid email format",
        code: "INVALID_EMAIL" 
      }, { status: 400 });
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
      return NextResponse.json({ 
        error: "Invalid phone format",
        code: "INVALID_PHONE" 
      }, { status: 400 });
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      return NextResponse.json({ 
        error: "Password must be at least 8 characters long",
        code: "WEAK_PASSWORD" 
      }, { status: 400 });
    }

    // Check email uniqueness
    const existingEmail = await db.select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1);

    if (existingEmail.length > 0) {
      return NextResponse.json({ 
        error: "Email already exists",
        code: "EMAIL_EXISTS" 
      }, { status: 400 });
    }

    // Check phone uniqueness
    const existingPhone = await db.select()
      .from(users)
      .where(eq(users.phone, phone.trim()))
      .limit(1);

    if (existingPhone.length > 0) {
      return NextResponse.json({ 
        error: "Phone number already exists",
        code: "PHONE_EXISTS" 
      }, { status: 400 });
    }

    // Generate unique personId
    let personId: string;
    try {
      personId = await generateUniquePersonId();
    } catch (error) {
      return NextResponse.json({ 
        error: "Failed to generate unique person ID",
        code: "PERSON_ID_GENERATION_FAILED" 
      }, { status: 500 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Prepare user data
    const now = new Date().toISOString();
    const userData: any = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      passwordHash,
      personId,
      createdAt: now,
      updatedAt: now,
      emailVerified: false,
      phoneVerified: false,
      upiVerified: false,
      biometricEnabled: false,
      twoFactorEnabled: false,
    };

    // Add optional fields if provided
    if (upiId) userData.upiId = upiId.trim();
    if (profilePictureUrl) userData.profilePictureUrl = profilePictureUrl.trim();
    if (googleId) userData.googleId = googleId.trim();
    if (appleId) userData.appleId = appleId.trim();

    // Insert user
    const newUser = await db.insert(users)
      .values(userData)
      .returning();

    return NextResponse.json(sanitizeUserResponse(newUser[0]), { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT method - update user by id
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    const body = await request.json();
    const { 
      name, 
      phone, 
      password,
      upiId, 
      profilePictureUrl, 
      emailVerified, 
      phoneVerified, 
      upiVerified, 
      biometricEnabled, 
      biometricHash, 
      twoFactorEnabled, 
      twoFactorMethods, 
      authenticatorSecret,
      googleId,
      appleId
    } = body;

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Prepare update object
    const updates: any = {
      updatedAt: new Date().toISOString()
    };

    // Validate and add fields to update
    if (name !== undefined) {
      if (name.trim().length < 2 || name.trim().length > 100) {
        return NextResponse.json({ 
          error: "Name must be between 2 and 100 characters",
          code: "INVALID_NAME_LENGTH" 
        }, { status: 400 });
      }
      updates.name = name.trim();
    }

    if (phone !== undefined) {
      if (!isValidPhone(phone)) {
        return NextResponse.json({ 
          error: "Invalid phone format",
          code: "INVALID_PHONE" 
        }, { status: 400 });
      }

      // Check phone uniqueness (exclude current user)
      const existingPhone = await db.select()
        .from(users)
        .where(and(
          eq(users.phone, phone.trim()),
          eq(users.id, parseInt(id))
        ))
        .limit(1);

      if (existingPhone.length === 0) {
        const phoneCheck = await db.select()
          .from(users)
          .where(eq(users.phone, phone.trim()))
          .limit(1);

        if (phoneCheck.length > 0) {
          return NextResponse.json({ 
            error: "Phone number already exists",
            code: "PHONE_EXISTS" 
          }, { status: 400 });
        }
      }

      updates.phone = phone.trim();
    }

    if (password !== undefined) {
      if (!isStrongPassword(password)) {
        return NextResponse.json({ 
          error: "Password must be at least 8 characters long",
          code: "WEAK_PASSWORD" 
        }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    if (upiId !== undefined) updates.upiId = upiId ? upiId.trim() : null;
    if (profilePictureUrl !== undefined) updates.profilePictureUrl = profilePictureUrl ? profilePictureUrl.trim() : null;
    if (emailVerified !== undefined) updates.emailVerified = Boolean(emailVerified);
    if (phoneVerified !== undefined) updates.phoneVerified = Boolean(phoneVerified);
    if (upiVerified !== undefined) updates.upiVerified = Boolean(upiVerified);
    if (biometricEnabled !== undefined) updates.biometricEnabled = Boolean(biometricEnabled);
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = Boolean(twoFactorEnabled);
    if (googleId !== undefined) updates.googleId = googleId ? googleId.trim() : null;
    if (appleId !== undefined) updates.appleId = appleId ? appleId.trim() : null;

    // Encrypt sensitive fields if provided
    if (biometricHash !== undefined) {
      updates.biometricHash = biometricHash ? encryptData(biometricHash) : null;
    }

    if (authenticatorSecret !== undefined) {
      updates.authenticatorSecret = authenticatorSecret ? encryptData(authenticatorSecret) : null;
    }

    if (twoFactorMethods !== undefined) {
      updates.twoFactorMethods = twoFactorMethods ? JSON.stringify(twoFactorMethods) : null;
    }

    // Update user
    const updated = await db.update(users)
      .set(updates)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json(sanitizeUserResponse(updated[0]), { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE method - delete user by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete user
    const deleted = await db.delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: sanitizeUserResponse(deleted[0])
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}