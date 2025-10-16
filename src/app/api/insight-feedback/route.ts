import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { insightFeedback, users, insights } from '@/db/schema';
import { eq, and, gte, lte, like, sql, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    const insightId = searchParams.get('insightId');
    const userId = searchParams.get('userId');

    // Special endpoint: Feedback summary for insight
    if (action === 'summary' && insightId) {
      const insightIdNum = parseInt(insightId);
      if (isNaN(insightIdNum)) {
        return NextResponse.json(
          { error: 'Valid insight ID is required', code: 'INVALID_INSIGHT_ID' },
          { status: 400 }
        );
      }

      // Verify insight exists
      const insightExists = await db.select()
        .from(insights)
        .where(eq(insights.id, insightIdNum))
        .limit(1);

      if (insightExists.length === 0) {
        return NextResponse.json(
          { error: 'Insight not found', code: 'INSIGHT_NOT_FOUND' },
          { status: 404 }
        );
      }

      // Get all feedback for this insight
      const allFeedback = await db.select()
        .from(insightFeedback)
        .where(eq(insightFeedback.insightId, insightIdNum));

      const totalFeedback = allFeedback.length;
      const helpfulCount = allFeedback.filter(f => f.helpful === true).length;
      const unhelpfulCount = allFeedback.filter(f => f.helpful === false).length;

      // Calculate average rating (handling both thumbs and star ratings)
      let averageRating = 0;
      if (totalFeedback > 0) {
        const totalRating = allFeedback.reduce((sum, f) => sum + f.rating, 0);
        averageRating = parseFloat((totalRating / totalFeedback).toFixed(2));
      }

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0
      };

      allFeedback.forEach(f => {
        // Handle thumbs rating (-1, 1) by mapping to 1 or 5
        if (f.rating === -1) {
          ratingDistribution[1]++;
        } else if (f.rating === 1 && !allFeedback.some(fb => fb.rating > 1)) {
          // If rating is 1 and no ratings > 1, treat as thumbs up (map to 5)
          ratingDistribution[5]++;
        } else if (f.rating >= 1 && f.rating <= 5) {
          ratingDistribution[f.rating]++;
        }
      });

      return NextResponse.json({
        totalFeedback,
        averageRating,
        helpfulCount,
        unhelpfulCount,
        ratingDistribution
      }, { status: 200 });
    }

    // Special endpoint: User's feedback history
    if (action === 'myFeedback' && userId) {
      const userIdNum = parseInt(userId);
      if (isNaN(userIdNum)) {
        return NextResponse.json(
          { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      // Verify user exists
      const userExists = await db.select()
        .from(users)
        .where(eq(users.id, userIdNum))
        .limit(1);

      if (userExists.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
      const offset = parseInt(searchParams.get('offset') || '0');

      const userFeedback = await db.select()
        .from(insightFeedback)
        .where(eq(insightFeedback.userId, userIdNum))
        .limit(limit)
        .offset(offset)
        .orderBy(sql`${insightFeedback.createdAt} DESC`);

      return NextResponse.json(userFeedback, { status: 200 });
    }

    // Single feedback by ID
    if (id) {
      const feedbackId = parseInt(id);
      if (isNaN(feedbackId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const feedback = await db.select()
        .from(insightFeedback)
        .where(eq(insightFeedback.id, feedbackId))
        .limit(1);

      if (feedback.length === 0) {
        return NextResponse.json(
          { error: 'Feedback not found', code: 'FEEDBACK_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(feedback[0], { status: 200 });
    }

    // List feedback with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const helpful = searchParams.get('helpful');
    const minRating = searchParams.get('minRating');
    const maxRating = searchParams.get('maxRating');
    const userIdFilter = searchParams.get('userId');
    const insightIdFilter = searchParams.get('insightId');

    const conditions = [];

    // Apply filters
    if (userIdFilter) {
      const userIdNum = parseInt(userIdFilter);
      if (!isNaN(userIdNum)) {
        conditions.push(eq(insightFeedback.userId, userIdNum));
      }
    }

    if (insightIdFilter) {
      const insightIdNum = parseInt(insightIdFilter);
      if (!isNaN(insightIdNum)) {
        conditions.push(eq(insightFeedback.insightId, insightIdNum));
      }
    }

    if (helpful !== null && helpful !== undefined) {
      const helpfulBool = helpful === 'true';
      conditions.push(eq(insightFeedback.helpful, helpfulBool));
    }

    if (minRating) {
      const minRatingNum = parseInt(minRating);
      if (!isNaN(minRatingNum)) {
        conditions.push(gte(insightFeedback.rating, minRatingNum));
      }
    }

    if (maxRating) {
      const maxRatingNum = parseInt(maxRating);
      if (!isNaN(maxRatingNum)) {
        conditions.push(lte(insightFeedback.rating, maxRatingNum));
      }
    }

    if (search) {
      conditions.push(like(insightFeedback.comment, `%${search}%`));
    }

    let query = db.select().from(insightFeedback);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .limit(limit)
      .offset(offset)
      .orderBy(sql`${insightFeedback.createdAt} DESC`);

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
    const { userId, insightId, rating, helpful, comment } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!insightId) {
      return NextResponse.json(
        { error: 'Insight ID is required', code: 'MISSING_INSIGHT_ID' },
        { status: 400 }
      );
    }

    if (rating === undefined || rating === null) {
      return NextResponse.json(
        { error: 'Rating is required', code: 'MISSING_RATING' },
        { status: 400 }
      );
    }

    // Validate rating value (either thumbs: -1/1 or stars: 1-5)
    const validThumbsRatings = [-1, 1];
    const validStarRatings = [1, 2, 3, 4, 5];
    
    if (!validThumbsRatings.includes(rating) && !validStarRatings.includes(rating)) {
      return NextResponse.json(
        { 
          error: 'Rating must be either -1/1 for thumbs or 1-5 for stars', 
          code: 'INVALID_RATING' 
        },
        { status: 400 }
      );
    }

    // Validate comment length if provided
    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment must not exceed 500 characters', code: 'COMMENT_TOO_LONG' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db.select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify insight exists
    const insightExists = await db.select()
      .from(insights)
      .where(eq(insights.id, parseInt(insightId)))
      .limit(1);

    if (insightExists.length === 0) {
      return NextResponse.json(
        { error: 'Insight not found', code: 'INSIGHT_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Check for duplicate feedback (one feedback per user per insight)
    const existingFeedback = await db.select()
      .from(insightFeedback)
      .where(
        and(
          eq(insightFeedback.userId, parseInt(userId)),
          eq(insightFeedback.insightId, parseInt(insightId))
        )
      )
      .limit(1);

    if (existingFeedback.length > 0) {
      return NextResponse.json(
        { 
          error: 'You have already submitted feedback for this insight', 
          code: 'DUPLICATE_FEEDBACK' 
        },
        { status: 400 }
      );
    }

    // Create feedback
    const newFeedback = await db.insert(insightFeedback)
      .values({
        userId: parseInt(userId),
        insightId: parseInt(insightId),
        rating: rating,
        helpful: helpful !== undefined ? helpful : null,
        comment: comment ? comment.trim() : null,
        createdAt: new Date().toISOString()
      })
      .returning();

    return NextResponse.json(newFeedback[0], { status: 201 });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const feedbackId = parseInt(id);

    // Check if feedback exists
    const existingFeedback = await db.select()
      .from(insightFeedback)
      .where(eq(insightFeedback.id, feedbackId))
      .limit(1);

    if (existingFeedback.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'FEEDBACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { rating, helpful, comment } = body;

    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const validThumbsRatings = [-1, 1];
      const validStarRatings = [1, 2, 3, 4, 5];
      
      if (!validThumbsRatings.includes(rating) && !validStarRatings.includes(rating)) {
        return NextResponse.json(
          { 
            error: 'Rating must be either -1/1 for thumbs or 1-5 for stars', 
            code: 'INVALID_RATING' 
          },
          { status: 400 }
        );
      }
    }

    // Validate comment length if provided
    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment must not exceed 500 characters', code: 'COMMENT_TOO_LONG' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    
    if (rating !== undefined && rating !== null) {
      updateData.rating = rating;
    }
    
    if (helpful !== undefined) {
      updateData.helpful = helpful;
    }
    
    if (comment !== undefined) {
      updateData.comment = comment ? comment.trim() : null;
    }

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'NO_UPDATE_FIELDS' },
        { status: 400 }
      );
    }

    // Update feedback
    const updatedFeedback = await db.update(insightFeedback)
      .set(updateData)
      .where(eq(insightFeedback.id, feedbackId))
      .returning();

    return NextResponse.json(updatedFeedback[0], { status: 200 });

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const feedbackId = parseInt(id);

    // Check if feedback exists
    const existingFeedback = await db.select()
      .from(insightFeedback)
      .where(eq(insightFeedback.id, feedbackId))
      .limit(1);

    if (existingFeedback.length === 0) {
      return NextResponse.json(
        { error: 'Feedback not found', code: 'FEEDBACK_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete feedback
    const deletedFeedback = await db.delete(insightFeedback)
      .where(eq(insightFeedback.id, feedbackId))
      .returning();

    return NextResponse.json({
      message: 'Feedback deleted successfully',
      feedback: deletedFeedback[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error },
      { status: 500 }
    );
  }
}