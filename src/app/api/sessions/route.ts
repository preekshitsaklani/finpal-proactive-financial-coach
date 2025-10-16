import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, users } from '@/db/schema';
import { eq, like, or, and, lt } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single session by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, parseInt(id)))
        .limit(1);

      if (session.length === 0) {
        return NextResponse.json(
          { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(session[0], { status: 200 });
    }

    // List sessions with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const isActive = searchParams.get('isActive');

    let query = db.select().from(sessions);

    const conditions = [];

    // Filter by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(sessions.userId, parseInt(userId)));
    }

    // Filter by isActive
    if (isActive !== null && isActive !== undefined) {
      const isActiveValue = isActive === 'true';
      conditions.push(eq(sessions.isActive, isActiveValue));
    }

    // Search across deviceName, deviceType, ipAddress
    if (search) {
      const searchCondition = or(
        like(sessions.deviceName, `%${search}%`),
        like(sessions.deviceType, `%${search}%`),
        like(sessions.ipAddress, `%${search}%`)
      );
      conditions.push(searchCondition);
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
    const body = await request.json();
    const { userId, deviceName, deviceType, deviceFingerprint, ipAddress, userAgent } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!deviceName) {
      return NextResponse.json(
        { error: 'deviceName is required', code: 'MISSING_DEVICE_NAME' },
        { status: 400 }
      );
    }

    if (!deviceType) {
      return NextResponse.json(
        { error: 'deviceType is required', code: 'MISSING_DEVICE_TYPE' },
        { status: 400 }
      );
    }

    if (!deviceFingerprint) {
      return NextResponse.json(
        { error: 'deviceFingerprint is required', code: 'MISSING_DEVICE_FINGERPRINT' },
        { status: 400 }
      );
    }

    // Validate userId exists in users table
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Validate deviceFingerprint is unique for user
    const existingSession = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.userId, parseInt(userId)),
          eq(sessions.deviceFingerprint, deviceFingerprint.trim())
        )
      )
      .limit(1);

    if (existingSession.length > 0) {
      return NextResponse.json(
        { error: 'Device fingerprint already exists for this user', code: 'DUPLICATE_DEVICE_FINGERPRINT' },
        { status: 400 }
      );
    }

    // Auto-generate timestamps and expiresAt (7 days from now)
    const now = new Date();
    const createdAt = now.toISOString();
    const lastActivity = now.toISOString();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newSession = await db
      .insert(sessions)
      .values({
        userId: parseInt(userId),
        deviceName: deviceName.trim(),
        deviceType: deviceType.trim(),
        deviceFingerprint: deviceFingerprint.trim(),
        ipAddress: ipAddress?.trim() || null,
        userAgent: userAgent?.trim() || null,
        isActive: true,
        lastActivity,
        createdAt,
        expiresAt,
      })
      .returning();

    return NextResponse.json(newSession[0], { status: 201 });
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

    // Special action: logoutAll for a userId
    if (userId && action === 'logoutAll') {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const updated = await db
        .update(sessions)
        .set({ isActive: false })
        .where(eq(sessions.userId, parseInt(userId)))
        .returning();

      return NextResponse.json(
        {
          message: 'All sessions logged out successfully',
          count: updated.length,
        },
        { status: 200 }
      );
    }

    // Regular update by ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .limit(1);

    if (existingSession.length === 0) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { deviceName, isActive, lastActivity } = body;

    const updates: any = {};

    // Updatable fields
    if (deviceName !== undefined) {
      updates.deviceName = deviceName.trim();
    }

    if (isActive !== undefined) {
      if (typeof isActive !== 'boolean') {
        return NextResponse.json(
          { error: 'isActive must be a boolean', code: 'INVALID_IS_ACTIVE' },
          { status: 400 }
        );
      }
      updates.isActive = isActive;
    }

    // Auto-update lastActivity to current timestamp if not provided
    if (lastActivity !== undefined) {
      updates.lastActivity = lastActivity;
    } else {
      updates.lastActivity = new Date().toISOString();
    }

    const updatedSession = await db
      .update(sessions)
      .set(updates)
      .where(eq(sessions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedSession[0], { status: 200 });
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
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special action: expireSessions for a userId
    if (userId && action === 'expireSessions') {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();

      const deleted = await db
        .delete(sessions)
        .where(
          and(
            eq(sessions.userId, parseInt(userId)),
            lt(sessions.expiresAt, now)
          )
        )
        .returning();

      return NextResponse.json(
        {
          message: 'Expired sessions deleted successfully',
          count: deleted.length,
        },
        { status: 200 }
      );
    }

    // Regular delete (soft delete) by ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if session exists
    const existingSession = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, parseInt(id)))
      .limit(1);

    if (existingSession.length === 0) {
      return NextResponse.json(
        { error: 'Session not found', code: 'SESSION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Soft delete: set isActive=false
    const deleted = await db
      .update(sessions)
      .set({ isActive: false })
      .where(eq(sessions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Session deactivated successfully',
        session: deleted[0],
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