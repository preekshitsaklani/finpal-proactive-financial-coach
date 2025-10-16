import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { otpVerifications } from '@/db/schema';
import { eq, and, lt, or, like } from 'drizzle-orm';

// Helper: Generate 6-digit OTP code
function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper: Validate phone format (10-15 digits)
function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
}

// Helper: Validate purpose
function isValidPurpose(purpose: string): boolean {
  const validPurposes = ['signup', 'login', 'change_phone', 'change_email', '2fa', 'password_reset'];
  return validPurposes.includes(purpose);
}

// Helper: Validate OTP code format
function isValidOtpCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}

// GET: List OTPs with pagination, filtering, and search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const record = await db.select()
        .from(otpVerifications)
        .where(eq(otpVerifications.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json({ 
          error: 'OTP verification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const purpose = searchParams.get('purpose');
    const verified = searchParams.get('verified');
    const phoneOrEmail = searchParams.get('phoneOrEmail');

    let query = db.select().from(otpVerifications);

    // Build where conditions
    const conditions = [];

    if (userId) {
      conditions.push(eq(otpVerifications.userId, parseInt(userId)));
    }

    if (purpose) {
      if (!isValidPurpose(purpose)) {
        return NextResponse.json({ 
          error: "Invalid purpose value",
          code: "INVALID_PURPOSE" 
        }, { status: 400 });
      }
      conditions.push(eq(otpVerifications.purpose, purpose));
    }

    if (verified !== null && verified !== undefined) {
      conditions.push(eq(otpVerifications.verified, verified === 'true'));
    }

    if (phoneOrEmail) {
      conditions.push(like(otpVerifications.phoneOrEmail, `%${phoneOrEmail}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// POST: Create new OTP or verify OTP
export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Special action: verify OTP
    if (action === 'verify') {
      const body = await request.json();
      const { phoneOrEmail, otpCode, purpose } = body;

      // Validate required fields
      if (!phoneOrEmail || !otpCode || !purpose) {
        return NextResponse.json({ 
          error: "phoneOrEmail, otpCode, and purpose are required",
          code: "MISSING_REQUIRED_FIELDS" 
        }, { status: 400 });
      }

      // Validate OTP code format
      if (!isValidOtpCode(otpCode)) {
        return NextResponse.json({ 
          error: "OTP code must be exactly 6 digits",
          code: "INVALID_OTP_FORMAT" 
        }, { status: 400 });
      }

      // Validate purpose
      if (!isValidPurpose(purpose)) {
        return NextResponse.json({ 
          error: "Invalid purpose value",
          code: "INVALID_PURPOSE" 
        }, { status: 400 });
      }

      // Find matching OTP
      const otpRecords = await db.select()
        .from(otpVerifications)
        .where(and(
          eq(otpVerifications.phoneOrEmail, phoneOrEmail),
          eq(otpVerifications.otpCode, otpCode),
          eq(otpVerifications.purpose, purpose),
          eq(otpVerifications.verified, false)
        ))
        .limit(1);

      if (otpRecords.length === 0) {
        return NextResponse.json({ 
          error: 'Invalid or already verified OTP',
          code: 'OTP_NOT_FOUND' 
        }, { status: 404 });
      }

      const otpRecord = otpRecords[0];

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(otpRecord.expiresAt);

      if (expiresAt < now) {
        // Mark as expired
        await db.update(otpVerifications)
          .set({ verified: false })
          .where(eq(otpVerifications.id, otpRecord.id));

        return NextResponse.json({ 
          error: 'OTP has expired',
          code: 'OTP_EXPIRED' 
        }, { status: 400 });
      }

      // Verify OTP
      const verified = await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.id, otpRecord.id))
        .returning();

      return NextResponse.json(verified[0], { status: 200 });
    }

    // Standard POST: Create new OTP
    const body = await request.json();
    const { phoneOrEmail, purpose, userId } = body;

    // Validate required fields
    if (!phoneOrEmail || !purpose) {
      return NextResponse.json({ 
        error: "phoneOrEmail and purpose are required",
        code: "MISSING_REQUIRED_FIELDS" 
      }, { status: 400 });
    }

    // Validate phoneOrEmail format
    if (!isValidEmail(phoneOrEmail) && !isValidPhone(phoneOrEmail)) {
      return NextResponse.json({ 
        error: "Invalid email or phone number format",
        code: "INVALID_PHONE_OR_EMAIL" 
      }, { status: 400 });
    }

    // Validate purpose
    if (!isValidPurpose(purpose)) {
      return NextResponse.json({ 
        error: "Invalid purpose. Must be one of: signup, login, change_phone, change_email, 2fa, password_reset",
        code: "INVALID_PURPOSE" 
      }, { status: 400 });
    }

    // Cleanup: Delete existing unverified OTPs for same phoneOrEmail and purpose
    await db.delete(otpVerifications)
      .where(and(
        eq(otpVerifications.phoneOrEmail, phoneOrEmail),
        eq(otpVerifications.purpose, purpose),
        eq(otpVerifications.verified, false)
      ));

    // Generate OTP code and timestamps
    const otpCode = generateOtpCode();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    // Prepare insert data
    const insertData: any = {
      phoneOrEmail: phoneOrEmail.trim().toLowerCase(),
      otpCode,
      purpose,
      verified: false,
      createdAt,
      expiresAt
    };

    // Add userId if provided (null for signup scenarios)
    if (userId !== undefined && userId !== null) {
      insertData.userId = userId;
    }

    // Insert new OTP
    const newOtp = await db.insert(otpVerifications)
      .values(insertData)
      .returning();

    // In development, include OTP code in response
    const isDevelopment = process.env.NODE_ENV === 'development';
    const response = isDevelopment ? newOtp[0] : {
      ...newOtp[0],
      otpCode: undefined // Hide OTP in production
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT: Verify OTP by ID or phoneOrEmail + otpCode
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const phoneOrEmail = searchParams.get('phoneOrEmail');
    const otpCode = searchParams.get('otpCode');

    // Verify by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      // Check if record exists
      const existing = await db.select()
        .from(otpVerifications)
        .where(eq(otpVerifications.id, parseInt(id)))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json({ 
          error: 'OTP verification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      const record = existing[0];

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(record.expiresAt);

      if (expiresAt < now) {
        return NextResponse.json({ 
          error: 'OTP has expired',
          code: 'OTP_EXPIRED' 
        }, { status: 400 });
      }

      // Update verified status
      const updated = await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.id, parseInt(id)))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    }

    // Verify by phoneOrEmail + otpCode
    if (phoneOrEmail && otpCode) {
      // Validate OTP code format
      if (!isValidOtpCode(otpCode)) {
        return NextResponse.json({ 
          error: "OTP code must be exactly 6 digits",
          code: "INVALID_OTP_FORMAT" 
        }, { status: 400 });
      }

      // Find matching OTP
      const existing = await db.select()
        .from(otpVerifications)
        .where(and(
          eq(otpVerifications.phoneOrEmail, phoneOrEmail),
          eq(otpVerifications.otpCode, otpCode)
        ))
        .limit(1);

      if (existing.length === 0) {
        return NextResponse.json({ 
          error: 'OTP verification not found',
          code: 'NOT_FOUND' 
        }, { status: 404 });
      }

      const record = existing[0];

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(record.expiresAt);

      if (expiresAt < now) {
        return NextResponse.json({ 
          error: 'OTP has expired',
          code: 'OTP_EXPIRED' 
        }, { status: 400 });
      }

      // Update verified status
      const updated = await db.update(otpVerifications)
        .set({ verified: true })
        .where(eq(otpVerifications.id, record.id))
        .returning();

      return NextResponse.json(updated[0], { status: 200 });
    }

    return NextResponse.json({ 
      error: "Either id or (phoneOrEmail and otpCode) parameters are required",
      code: "MISSING_PARAMETERS" 
    }, { status: 400 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE: Delete OTP by ID or cleanup expired/verified OTPs
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const id = searchParams.get('id');

    // Special action: cleanup expired/verified OTPs
    if (action === 'cleanup') {
      const userId = searchParams.get('userId');
      const now = new Date().toISOString();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // Build cleanup conditions
      const cleanupConditions = [
        // Expired OTPs
        lt(otpVerifications.expiresAt, now),
        // Verified OTPs older than 24 hours
        and(
          eq(otpVerifications.verified, true),
          lt(otpVerifications.createdAt, twentyFourHoursAgo)
        )
      ];

      let whereCondition = or(...cleanupConditions);

      // Add userId filter if provided
      if (userId) {
        whereCondition = and(
          eq(otpVerifications.userId, parseInt(userId)),
          whereCondition
        );
      }

      const deleted = await db.delete(otpVerifications)
        .where(whereCondition)
        .returning();

      return NextResponse.json({ 
        message: 'Cleanup completed successfully',
        deletedCount: deleted.length,
        deletedRecords: deleted
      }, { status: 200 });
    }

    // Standard DELETE: Delete by ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if record exists
    const existing = await db.select()
      .from(otpVerifications)
      .where(eq(otpVerifications.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ 
        error: 'OTP verification not found',
        code: 'NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete record
    const deleted = await db.delete(otpVerifications)
      .where(eq(otpVerifications.id, parseInt(id)))
      .returning();

    return NextResponse.json({ 
      message: 'OTP verification deleted successfully',
      deletedRecord: deleted[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}