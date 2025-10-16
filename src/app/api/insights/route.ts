import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { insights, users } from '@/db/schema';
import { eq, and, lt, desc, asc, like, or } from 'drizzle-orm';

// Allowed insight types
const ALLOWED_INSIGHT_TYPES = ['low_balance_warning', 'spending_pattern', 'saving_tip'] as const;

// Helper function to validate insight type
function isValidInsightType(type: string): boolean {
  return ALLOWED_INSIGHT_TYPES.includes(type as any);
}

// Helper function to validate user exists
async function userExists(userId: number): Promise<boolean> {
  try {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

// GET method - List insights or get single insight
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special action: Get unread count for user
    if (action === 'unreadCount' && userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ 
          error: "Valid user ID is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }

      const unreadInsights = await db.select()
        .from(insights)
        .where(and(
          eq(insights.userId, userIdNum),
          eq(insights.isRead, false)
        ));

      return NextResponse.json({ unreadCount: unreadInsights.length }, { status: 200 });
    }

    // Single insight by ID
    if (id) {
      const insightId = parseInt(id);
      if (isNaN(insightId)) {
        return NextResponse.json({ 
          error: "Valid ID is required",
          code: "INVALID_ID" 
        }, { status: 400 });
      }

      const result = await db.select()
        .from(insights)
        .where(eq(insights.id, insightId))
        .limit(1);

      if (result.length === 0) {
        return NextResponse.json({ 
          error: 'Insight not found',
          code: 'INSIGHT_NOT_FOUND' 
        }, { status: 404 });
      }

      return NextResponse.json(result[0], { status: 200 });
    }

    // List insights with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const insightType = searchParams.get('insightType');
    const isRead = searchParams.get('isRead');
    const sort = searchParams.get('sort') || 'createdAt';
    const order = searchParams.get('order') || 'desc';

    let query = db.select().from(insights);

    // Build WHERE conditions
    const conditions = [];

    if (userId) {
      const userIdNum = parseInt(userId);
      if (!isNaN(userIdNum)) {
        conditions.push(eq(insights.userId, userIdNum));
      }
    }

    if (insightType) {
      if (isValidInsightType(insightType)) {
        conditions.push(eq(insights.insightType, insightType));
      }
    }

    if (isRead !== null && isRead !== undefined) {
      const isReadBool = isRead === 'true';
      conditions.push(eq(insights.isRead, isReadBool));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (sort === 'createdAt') {
      query = order === 'asc' 
        ? query.orderBy(asc(insights.createdAt))
        : query.orderBy(desc(insights.createdAt));
    } else if (sort === 'id') {
      query = order === 'asc'
        ? query.orderBy(asc(insights.id))
        : query.orderBy(desc(insights.id));
    } else {
      // Default sort by createdAt desc
      query = query.orderBy(desc(insights.createdAt));
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

// POST method - Create new insight
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, insightType, title, message, data } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json({ 
        error: "User ID is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!insightType) {
      return NextResponse.json({ 
        error: "Insight type is required",
        code: "MISSING_INSIGHT_TYPE" 
      }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ 
        error: "Title is required",
        code: "MISSING_TITLE" 
      }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ 
        error: "Message is required",
        code: "MISSING_MESSAGE" 
      }, { status: 400 });
    }

    // Validate userId is a number
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum)) {
      return NextResponse.json({ 
        error: "Valid user ID is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    // Validate user exists
    const userExistsResult = await userExists(userIdNum);
    if (!userExistsResult) {
      return NextResponse.json({ 
        error: "User does not exist",
        code: "USER_NOT_FOUND" 
      }, { status: 400 });
    }

    // Validate insight type
    if (!isValidInsightType(insightType)) {
      return NextResponse.json({ 
        error: `Insight type must be one of: ${ALLOWED_INSIGHT_TYPES.join(', ')}`,
        code: "INVALID_INSIGHT_TYPE" 
      }, { status: 400 });
    }

    // Validate title length (5-200 characters)
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
      return NextResponse.json({ 
        error: "Title must be between 5 and 200 characters",
        code: "INVALID_TITLE_LENGTH" 
      }, { status: 400 });
    }

    // Validate message length (10-1000 characters)
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10 || trimmedMessage.length > 1000) {
      return NextResponse.json({ 
        error: "Message must be between 10 and 1000 characters",
        code: "INVALID_MESSAGE_LENGTH" 
      }, { status: 400 });
    }

    // Validate data is valid JSON if provided
    let jsonData = null;
    if (data !== undefined && data !== null) {
      try {
        // If data is already an object, stringify and parse to validate
        jsonData = typeof data === 'string' ? JSON.parse(data) : data;
        if (typeof jsonData !== 'object' || Array.isArray(jsonData)) {
          return NextResponse.json({ 
            error: "Data must be a valid JSON object",
            code: "INVALID_DATA_FORMAT" 
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({ 
          error: "Data must be a valid JSON object",
          code: "INVALID_JSON" 
        }, { status: 400 });
      }
    }

    // Create new insight
    const newInsight = await db.insert(insights).values({
      userId: userIdNum,
      insightType: insightType,
      title: trimmedTitle,
      message: trimmedMessage,
      data: jsonData,
      isRead: false,
      createdAt: new Date().toISOString()
    }).returning();

    return NextResponse.json(newInsight[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// PUT method - Update insight or bulk operations
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special action: Mark all as read for user
    if (action === 'markAllRead' && userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ 
          error: "Valid user ID is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }

      // Get count of unread insights before updating
      const unreadInsights = await db.select()
        .from(insights)
        .where(and(
          eq(insights.userId, userIdNum),
          eq(insights.isRead, false)
        ));

      const count = unreadInsights.length;

      // Mark all as read
      if (count > 0) {
        await db.update(insights)
          .set({ isRead: true })
          .where(and(
            eq(insights.userId, userIdNum),
            eq(insights.isRead, false)
          ));
      }

      return NextResponse.json({ 
        message: 'All insights marked as read',
        count: count 
      }, { status: 200 });
    }

    // Update single insight by ID
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required for update",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    const insightId = parseInt(id);
    if (isNaN(insightId)) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if insight exists
    const existingInsight = await db.select()
      .from(insights)
      .where(eq(insights.id, insightId))
      .limit(1);

    if (existingInsight.length === 0) {
      return NextResponse.json({ 
        error: 'Insight not found',
        code: 'INSIGHT_NOT_FOUND' 
      }, { status: 404 });
    }

    const body = await request.json();
    const { title, message, data, isRead } = body;

    // Build update object with only provided fields
    const updates: any = {};

    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
        return NextResponse.json({ 
          error: "Title must be between 5 and 200 characters",
          code: "INVALID_TITLE_LENGTH" 
        }, { status: 400 });
      }
      updates.title = trimmedTitle;
    }

    if (message !== undefined) {
      const trimmedMessage = message.trim();
      if (trimmedMessage.length < 10 || trimmedMessage.length > 1000) {
        return NextResponse.json({ 
          error: "Message must be between 10 and 1000 characters",
          code: "INVALID_MESSAGE_LENGTH" 
        }, { status: 400 });
      }
      updates.message = trimmedMessage;
    }

    if (data !== undefined) {
      if (data === null) {
        updates.data = null;
      } else {
        try {
          const jsonData = typeof data === 'string' ? JSON.parse(data) : data;
          if (typeof jsonData !== 'object' || Array.isArray(jsonData)) {
            return NextResponse.json({ 
              error: "Data must be a valid JSON object",
              code: "INVALID_DATA_FORMAT" 
            }, { status: 400 });
          }
          updates.data = jsonData;
        } catch (error) {
          return NextResponse.json({ 
            error: "Data must be a valid JSON object",
            code: "INVALID_JSON" 
          }, { status: 400 });
        }
      }
    }

    if (isRead !== undefined) {
      updates.isRead = Boolean(isRead);
    }

    // If no fields to update
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingInsight[0], { status: 200 });
    }

    // Update insight
    const updated = await db.update(insights)
      .set(updates)
      .where(eq(insights.id, insightId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}

// DELETE method - Delete insight or bulk delete old insights
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special action: Delete old insights (older than 30 days)
    if (action === 'deleteOld' && userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json({ 
          error: "Valid user ID is required",
          code: "INVALID_USER_ID" 
        }, { status: 400 });
      }

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

      // Get count of old insights before deleting
      const oldInsights = await db.select()
        .from(insights)
        .where(and(
          eq(insights.userId, userIdNum),
          lt(insights.createdAt, thirtyDaysAgoISO)
        ));

      const count = oldInsights.length;

      // Delete old insights
      if (count > 0) {
        await db.delete(insights)
          .where(and(
            eq(insights.userId, userIdNum),
            lt(insights.createdAt, thirtyDaysAgoISO)
          ));
      }

      return NextResponse.json({ 
        message: 'Old insights deleted',
        count: count 
      }, { status: 200 });
    }

    // Delete single insight by ID
    if (!id) {
      return NextResponse.json({ 
        error: "ID is required for deletion",
        code: "MISSING_ID" 
      }, { status: 400 });
    }

    const insightId = parseInt(id);
    if (isNaN(insightId)) {
      return NextResponse.json({ 
        error: "Valid ID is required",
        code: "INVALID_ID" 
      }, { status: 400 });
    }

    // Check if insight exists
    const existingInsight = await db.select()
      .from(insights)
      .where(eq(insights.id, insightId))
      .limit(1);

    if (existingInsight.length === 0) {
      return NextResponse.json({ 
        error: 'Insight not found',
        code: 'INSIGHT_NOT_FOUND' 
      }, { status: 404 });
    }

    // Delete insight
    const deleted = await db.delete(insights)
      .where(eq(insights.id, insightId))
      .returning();

    return NextResponse.json({ 
      message: 'Insight deleted successfully',
      insight: deleted[0] 
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}