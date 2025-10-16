import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { multiDeviceAuth, users } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';

// Helper function to generate random 4-digit verification code
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Helper function to check if a request is expired
function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt) < new Date();
}

// Helper function to get expiration time (5 minutes from now)
function getExpirationTime(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  return now.toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const record = await db
        .select()
        .from(multiDeviceAuth)
        .where(eq(multiDeviceAuth.id, parseInt(id)))
        .limit(1);

      if (record.length === 0) {
        return NextResponse.json(
          { error: 'Multi-device auth record not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(record[0], { status: 200 });
    }

    // List with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let query = db.select().from(multiDeviceAuth);

    // Apply filters
    const conditions = [];
    if (userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'Invalid userId parameter', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(multiDeviceAuth.userId, userIdInt));
    }

    if (status) {
      const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status value. Must be: pending, approved, rejected, or expired', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }
      conditions.push(eq(multiDeviceAuth.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');

    // Handle verification action
    if (action === 'verify') {
      const body = await request.json();
      const { userId, verificationCode } = body;

      if (!userId || !verificationCode) {
        return NextResponse.json(
          { error: 'userId and verificationCode are required', code: 'MISSING_REQUIRED_FIELDS' },
          { status: 400 }
        );
      }

      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'Invalid userId', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Find matching pending auth request
      const authRequests = await db
        .select()
        .from(multiDeviceAuth)
        .where(
          and(
            eq(multiDeviceAuth.userId, userIdInt),
            eq(multiDeviceAuth.verificationCode, verificationCode),
            eq(multiDeviceAuth.status, 'pending')
          )
        )
        .limit(1);

      if (authRequests.length === 0) {
        return NextResponse.json(
          { error: 'Verification code not found or already used', code: 'INVALID_CODE' },
          { status: 404 }
        );
      }

      const authRequest = authRequests[0];

      // Check if expired
      if (isExpired(authRequest.expiresAt)) {
        // Update status to expired
        await db
          .update(multiDeviceAuth)
          .set({
            status: 'expired'
          })
          .where(eq(multiDeviceAuth.id, authRequest.id));

        return NextResponse.json(
          { error: 'Verification code has expired', code: 'CODE_EXPIRED' },
          { status: 400 }
        );
      }

      return NextResponse.json(authRequest, { status: 200 });
    }

    // Create new multi-device auth request
    const body = await request.json();
    const { userId, requestingDevice } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!requestingDevice) {
      return NextResponse.json(
        { error: 'requestingDevice is required', code: 'MISSING_REQUESTING_DEVICE' },
        { status: 400 }
      );
    }

    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      return NextResponse.json(
        { error: 'Invalid userId', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate requestingDevice structure
    if (typeof requestingDevice !== 'object' || !requestingDevice.deviceName || !requestingDevice.deviceType) {
      return NextResponse.json(
        { error: 'requestingDevice must be a JSON object with deviceName and deviceType', code: 'INVALID_REQUESTING_DEVICE' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userIdInt))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Invalidate any existing pending requests for this user
    await db
      .update(multiDeviceAuth)
      .set({ status: 'expired' })
      .where(
        and(
          eq(multiDeviceAuth.userId, userIdInt),
          eq(multiDeviceAuth.status, 'pending')
        )
      );

    // Generate verification code and timestamps
    const verificationCode = generateVerificationCode();
    const createdAt = new Date().toISOString();
    const expiresAt = getExpirationTime();

    // Create new auth request
    const newAuthRequest = await db
      .insert(multiDeviceAuth)
      .values({
        userId: userIdInt,
        verificationCode,
        requestingDevice: JSON.stringify(requestingDevice),
        authorizedDevice: null,
        status: 'pending',
        createdAt,
        expiresAt
      })
      .returning();

    return NextResponse.json(newAuthRequest[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Handle cleanup expired action
    if (action === 'cleanupExpired' && userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'Invalid userId', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();

      // Find all expired pending requests
      const expiredRequests = await db
        .select()
        .from(multiDeviceAuth)
        .where(
          and(
            eq(multiDeviceAuth.userId, userIdInt),
            eq(multiDeviceAuth.status, 'pending'),
            lt(multiDeviceAuth.expiresAt, now)
          )
        );

      // Update them to expired status
      if (expiredRequests.length > 0) {
        await db
          .update(multiDeviceAuth)
          .set({ status: 'expired' })
          .where(
            and(
              eq(multiDeviceAuth.userId, userIdInt),
              eq(multiDeviceAuth.status, 'pending'),
              lt(multiDeviceAuth.expiresAt, now)
            )
          );
      }

      return NextResponse.json(
        { 
          message: 'Expired requests cleaned up successfully',
          count: expiredRequests.length
        },
        { status: 200 }
      );
    }

    // Update auth request (approve/reject)
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const idInt = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(multiDeviceAuth)
      .where(eq(multiDeviceAuth.id, idInt))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Multi-device auth record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const record = existingRecord[0];

    // Check if expired and auto-set status
    if (record.status === 'pending' && isExpired(record.expiresAt)) {
      await db
        .update(multiDeviceAuth)
        .set({ status: 'expired' })
        .where(eq(multiDeviceAuth.id, idInt));

      return NextResponse.json(
        { error: 'Auth request has expired', code: 'REQUEST_EXPIRED' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, authorizedDevice } = body;

    // Validate status
    if (status) {
      const validStatuses = ['approved', 'rejected', 'expired'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status must be: approved, rejected, or expired', code: 'INVALID_STATUS' },
          { status: 400 }
        );
      }

      // If approving, authorizedDevice is required
      if (status === 'approved' && !authorizedDevice) {
        return NextResponse.json(
          { error: 'authorizedDevice is required when status is approved', code: 'MISSING_AUTHORIZED_DEVICE' },
          { status: 400 }
        );
      }

      // Validate authorizedDevice structure if provided
      if (authorizedDevice && (typeof authorizedDevice !== 'object' || !authorizedDevice.deviceName || !authorizedDevice.deviceType)) {
        return NextResponse.json(
          { error: 'authorizedDevice must be a JSON object with deviceName and deviceType', code: 'INVALID_AUTHORIZED_DEVICE' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (authorizedDevice) {
      updateData.authorizedDevice = JSON.stringify(authorizedDevice);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    const updated = await db
      .update(multiDeviceAuth)
      .set(updateData)
      .where(eq(multiDeviceAuth.id, idInt))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const idInt = parseInt(id);

    // Check if record exists
    const existingRecord = await db
      .select()
      .from(multiDeviceAuth)
      .where(eq(multiDeviceAuth.id, idInt))
      .limit(1);

    if (existingRecord.length === 0) {
      return NextResponse.json(
        { error: 'Multi-device auth record not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(multiDeviceAuth)
      .where(eq(multiDeviceAuth.id, idInt))
      .returning();

    return NextResponse.json(
      {
        message: 'Multi-device auth record deleted successfully',
        deleted: deleted[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}