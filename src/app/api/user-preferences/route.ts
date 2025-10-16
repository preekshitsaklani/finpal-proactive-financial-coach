import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { userPreferences, users } from '@/db/schema';
import { eq, and, like, or, desc, asc } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth';

// Default preference values
const DEFAULT_PREFERENCES = {
  safetyThreshold: 5000,
  darkMode: 'auto' as const,
  pushNotifications: true,
  lowBalanceAlerts: true,
  weeklyReports: true,
  savingsTips: true,
};

// Valid darkMode values
const VALID_DARK_MODES = ['auto', 'light', 'dark'] as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special endpoint: Get default values
    if (action === 'defaults') {
      return NextResponse.json(DEFAULT_PREFERENCES, { status: 200 });
    }

    // Get single preference by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const preferences = await db
        .select()
        .from(userPreferences)
        .where(
          and(
            eq(userPreferences.id, parseInt(id)),
            eq(userPreferences.userId, user.id)
          )
        )
        .limit(1);

      if (preferences.length === 0) {
        return NextResponse.json(
          { error: 'Preferences not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(preferences[0], { status: 200 });
    }

    // Get preferences by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Security: Users can only access their own preferences
      if (parseInt(userId) !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      const preferences = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, parseInt(userId)))
        .limit(1);

      if (preferences.length === 0) {
        return NextResponse.json(
          { error: 'Preferences not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(preferences[0], { status: 200 });
    }

    // List preferences with pagination and filtering (user-scoped)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const darkModeFilter = searchParams.get('darkMode');
    const pushNotificationsFilter = searchParams.get('pushNotifications');
    const lowBalanceAlertsFilter = searchParams.get('lowBalanceAlerts');
    const weeklyReportsFilter = searchParams.get('weeklyReports');
    const savingsTipsFilter = searchParams.get('savingsTips');

    let query = db.select().from(userPreferences);

    // Build filter conditions
    const conditions = [eq(userPreferences.userId, user.id)];

    if (darkModeFilter && VALID_DARK_MODES.includes(darkModeFilter as any)) {
      conditions.push(eq(userPreferences.darkMode, darkModeFilter));
    }

    if (pushNotificationsFilter !== null) {
      const value = pushNotificationsFilter === 'true';
      conditions.push(eq(userPreferences.pushNotifications, value));
    }

    if (lowBalanceAlertsFilter !== null) {
      const value = lowBalanceAlertsFilter === 'true';
      conditions.push(eq(userPreferences.lowBalanceAlerts, value));
    }

    if (weeklyReportsFilter !== null) {
      const value = weeklyReportsFilter === 'true';
      conditions.push(eq(userPreferences.weeklyReports, value));
    }

    if (savingsTipsFilter !== null) {
      const value = savingsTipsFilter === 'true';
      conditions.push(eq(userPreferences.savingsTips, value));
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special endpoint: Reset preferences to defaults
    if (action === 'reset' && userIdParam) {
      if (isNaN(parseInt(userIdParam))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Security: Users can only reset their own preferences
      if (parseInt(userIdParam) !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      // Check if preferences exist
      const existingPrefs = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, parseInt(userIdParam)))
        .limit(1);

      if (existingPrefs.length === 0) {
        return NextResponse.json(
          { error: 'Preferences not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      const resetPrefs = await db
        .update(userPreferences)
        .set({
          ...DEFAULT_PREFERENCES,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(userPreferences.userId, parseInt(userIdParam)))
        .returning();

      return NextResponse.json(resetPrefs[0], { status: 200 });
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    // Check if preferences already exist for this user
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id))
      .limit(1);

    if (existingPrefs.length > 0) {
      return NextResponse.json(
        {
          error: 'Preferences already exist for this user. Use PUT to update.',
          code: 'PREFERENCES_EXIST',
        },
        { status: 400 }
      );
    }

    // Validate optional fields
    const {
      safetyThreshold,
      darkMode,
      pushNotifications,
      lowBalanceAlerts,
      weeklyReports,
      savingsTips,
    } = body;

    // Validate safetyThreshold if provided
    if (
      safetyThreshold !== undefined &&
      (typeof safetyThreshold !== 'number' || safetyThreshold < 0)
    ) {
      return NextResponse.json(
        {
          error: 'safetyThreshold must be a non-negative number',
          code: 'INVALID_SAFETY_THRESHOLD',
        },
        { status: 400 }
      );
    }

    // Validate darkMode if provided
    if (
      darkMode !== undefined &&
      !VALID_DARK_MODES.includes(darkMode as any)
    ) {
      return NextResponse.json(
        {
          error: 'darkMode must be one of: auto, light, dark',
          code: 'INVALID_DARK_MODE',
        },
        { status: 400 }
      );
    }

    // Validate boolean fields
    const booleanFields = [
      { name: 'pushNotifications', value: pushNotifications },
      { name: 'lowBalanceAlerts', value: lowBalanceAlerts },
      { name: 'weeklyReports', value: weeklyReports },
      { name: 'savingsTips', value: savingsTips },
    ];

    for (const field of booleanFields) {
      if (
        field.value !== undefined &&
        typeof field.value !== 'boolean'
      ) {
        return NextResponse.json(
          {
            error: `${field.name} must be a boolean`,
            code: 'INVALID_BOOLEAN_FIELD',
          },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    // Create preferences with provided values or defaults
    const newPreferences = await db
      .insert(userPreferences)
      .values({
        userId: user.id,
        safetyThreshold: safetyThreshold ?? DEFAULT_PREFERENCES.safetyThreshold,
        darkMode: darkMode ?? DEFAULT_PREFERENCES.darkMode,
        pushNotifications: pushNotifications ?? DEFAULT_PREFERENCES.pushNotifications,
        lowBalanceAlerts: lowBalanceAlerts ?? DEFAULT_PREFERENCES.lowBalanceAlerts,
        weeklyReports: weeklyReports ?? DEFAULT_PREFERENCES.weeklyReports,
        savingsTips: savingsTips ?? DEFAULT_PREFERENCES.savingsTips,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newPreferences[0], { status: 201 });
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userIdParam = searchParams.get('userId');

    if (!id && !userIdParam) {
      return NextResponse.json(
        {
          error: 'Either id or userId parameter is required',
          code: 'MISSING_PARAMETER',
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Security check: reject if userId provided in body
    if ('userId' in body || 'user_id' in body) {
      return NextResponse.json(
        {
          error: 'User ID cannot be provided in request body',
          code: 'USER_ID_NOT_ALLOWED',
        },
        { status: 400 }
      );
    }

    const {
      safetyThreshold,
      darkMode,
      pushNotifications,
      lowBalanceAlerts,
      weeklyReports,
      savingsTips,
    } = body;

    // Validate safetyThreshold if provided
    if (
      safetyThreshold !== undefined &&
      (typeof safetyThreshold !== 'number' || safetyThreshold < 0)
    ) {
      return NextResponse.json(
        {
          error: 'safetyThreshold must be a non-negative number',
          code: 'INVALID_SAFETY_THRESHOLD',
        },
        { status: 400 }
      );
    }

    // Validate darkMode if provided
    if (
      darkMode !== undefined &&
      !VALID_DARK_MODES.includes(darkMode as any)
    ) {
      return NextResponse.json(
        {
          error: 'darkMode must be one of: auto, light, dark',
          code: 'INVALID_DARK_MODE',
        },
        { status: 400 }
      );
    }

    // Validate boolean fields
    const booleanFields = [
      { name: 'pushNotifications', value: pushNotifications },
      { name: 'lowBalanceAlerts', value: lowBalanceAlerts },
      { name: 'weeklyReports', value: weeklyReports },
      { name: 'savingsTips', value: savingsTips },
    ];

    for (const field of booleanFields) {
      if (
        field.value !== undefined &&
        typeof field.value !== 'boolean'
      ) {
        return NextResponse.json(
          {
            error: `${field.name} must be a boolean`,
            code: 'INVALID_BOOLEAN_FIELD',
          },
          { status: 400 }
        );
      }
    }

    let whereCondition;
    let lookupUserId: number;

    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }
      whereCondition = and(
        eq(userPreferences.id, parseInt(id)),
        eq(userPreferences.userId, user.id)
      );
      lookupUserId = user.id;
    } else {
      if (isNaN(parseInt(userIdParam!))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Security: Users can only update their own preferences
      if (parseInt(userIdParam!) !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized access', code: 'UNAUTHORIZED' },
          { status: 403 }
        );
      }

      whereCondition = eq(userPreferences.userId, parseInt(userIdParam!));
      lookupUserId = parseInt(userIdParam!);
    }

    // Check if preferences exist
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(whereCondition)
      .limit(1);

    // If preferences don't exist for userId, create them with provided values + defaults
    if (existingPrefs.length === 0 && userIdParam) {
      const now = new Date().toISOString();

      const newPreferences = await db
        .insert(userPreferences)
        .values({
          userId: lookupUserId,
          safetyThreshold: safetyThreshold ?? DEFAULT_PREFERENCES.safetyThreshold,
          darkMode: darkMode ?? DEFAULT_PREFERENCES.darkMode,
          pushNotifications: pushNotifications ?? DEFAULT_PREFERENCES.pushNotifications,
          lowBalanceAlerts: lowBalanceAlerts ?? DEFAULT_PREFERENCES.lowBalanceAlerts,
          weeklyReports: weeklyReports ?? DEFAULT_PREFERENCES.weeklyReports,
          savingsTips: savingsTips ?? DEFAULT_PREFERENCES.savingsTips,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return NextResponse.json(newPreferences[0], { status: 200 });
    }

    if (existingPrefs.length === 0) {
      return NextResponse.json(
        { error: 'Preferences not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    };

    if (safetyThreshold !== undefined) updateData.safetyThreshold = safetyThreshold;
    if (darkMode !== undefined) updateData.darkMode = darkMode;
    if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
    if (lowBalanceAlerts !== undefined) updateData.lowBalanceAlerts = lowBalanceAlerts;
    if (weeklyReports !== undefined) updateData.weeklyReports = weeklyReports;
    if (savingsTips !== undefined) updateData.savingsTips = savingsTips;

    const updated = await db
      .update(userPreferences)
      .set(updateData)
      .where(whereCondition)
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
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    if (isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if preferences exist and belong to user
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(
        and(
          eq(userPreferences.id, parseInt(id)),
          eq(userPreferences.userId, user.id)
        )
      )
      .limit(1);

    if (existingPrefs.length === 0) {
      return NextResponse.json(
        { error: 'Preferences not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Reset to defaults instead of deleting (better UX)
    const reset = await db
      .update(userPreferences)
      .set({
        ...DEFAULT_PREFERENCES,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(userPreferences.id, parseInt(id)),
          eq(userPreferences.userId, user.id)
        )
      )
      .returning();

    return NextResponse.json(
      {
        message: 'Preferences reset to defaults successfully',
        preferences: reset[0],
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