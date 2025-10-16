import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactionCategories, transactions } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    // Single record fetch by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const category = await db.select()
        .from(transactionCategories)
        .where(eq(transactionCategories.id, parseInt(id)))
        .limit(1);

      if (category.length === 0) {
        return NextResponse.json({
          error: 'Category not found',
          code: 'CATEGORY_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(category[0], { status: 200 });
    }

    // List with pagination, filtering, and search
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    const isIncomeParam = searchParams.get('isIncome');

    let query = db.select().from(transactionCategories);

    const conditions = [];

    // Filter by isIncome
    if (isIncomeParam !== null) {
      const isIncome = isIncomeParam === 'true';
      conditions.push(eq(transactionCategories.isIncome, isIncome));
    }

    // Search by name
    if (search) {
      conditions.push(like(transactionCategories.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const categories = await query.limit(limit).offset(offset);

    return NextResponse.json(categories, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, icon, color, isIncome = false } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json({
        error: 'Name is required',
        code: 'MISSING_NAME'
      }, { status: 400 });
    }

    if (!icon) {
      return NextResponse.json({
        error: 'Icon is required',
        code: 'MISSING_ICON'
      }, { status: 400 });
    }

    if (!color) {
      return NextResponse.json({
        error: 'Color is required',
        code: 'MISSING_COLOR'
      }, { status: 400 });
    }

    // Validate name length
    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json({
        error: 'Name must be between 2 and 50 characters',
        code: 'INVALID_NAME_LENGTH'
      }, { status: 400 });
    }

    // Validate color format
    const colorRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!colorRegex.test(color)) {
      return NextResponse.json({
        error: 'Color must be in hex format #RRGGBB',
        code: 'INVALID_COLOR_FORMAT'
      }, { status: 400 });
    }

    // Check for duplicate name
    const existingCategory = await db.select()
      .from(transactionCategories)
      .where(eq(transactionCategories.name, trimmedName))
      .limit(1);

    if (existingCategory.length > 0) {
      return NextResponse.json({
        error: 'Category name already exists',
        code: 'DUPLICATE_NAME'
      }, { status: 400 });
    }

    // Create new category
    const newCategory = await db.insert(transactionCategories)
      .values({
        name: trimmedName,
        icon: icon.trim(),
        color: color.toUpperCase(),
        isIncome: Boolean(isIncome)
      })
      .returning();

    return NextResponse.json(newCategory[0], { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await db.select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, parseInt(id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }, { status: 404 });
    }

    const body = await request.json();
    const { name, icon, color, isIncome } = body;

    const updates: any = {};

    // Validate and update name
    if (name !== undefined) {
      const trimmedName = name.trim();
      
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return NextResponse.json({
          error: 'Name must be between 2 and 50 characters',
          code: 'INVALID_NAME_LENGTH'
        }, { status: 400 });
      }

      // Check for duplicate name (excluding current category)
      const duplicateCategory = await db.select()
        .from(transactionCategories)
        .where(and(
          eq(transactionCategories.name, trimmedName),
          eq(transactionCategories.id, parseInt(id))
        ))
        .limit(1);

      if (duplicateCategory.length === 0) {
        const otherCategory = await db.select()
          .from(transactionCategories)
          .where(eq(transactionCategories.name, trimmedName))
          .limit(1);

        if (otherCategory.length > 0) {
          return NextResponse.json({
            error: 'Category name already exists',
            code: 'DUPLICATE_NAME'
          }, { status: 400 });
        }
      }

      updates.name = trimmedName;
    }

    // Validate and update icon
    if (icon !== undefined) {
      updates.icon = icon.trim();
    }

    // Validate and update color
    if (color !== undefined) {
      const colorRegex = /^#[0-9A-Fa-f]{6}$/;
      if (!colorRegex.test(color)) {
        return NextResponse.json({
          error: 'Color must be in hex format #RRGGBB',
          code: 'INVALID_COLOR_FORMAT'
        }, { status: 400 });
      }
      updates.color = color.toUpperCase();
    }

    // Update isIncome
    if (isIncome !== undefined) {
      updates.isIncome = Boolean(isIncome);
    }

    // If no updates provided, return current category
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existingCategory[0], { status: 200 });
    }

    // Perform update
    const updatedCategory = await db.update(transactionCategories)
      .set(updates)
      .where(eq(transactionCategories.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedCategory[0], { status: 200 });

  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if category exists
    const existingCategory = await db.select()
      .from(transactionCategories)
      .where(eq(transactionCategories.id, parseInt(id)))
      .limit(1);

    if (existingCategory.length === 0) {
      return NextResponse.json({
        error: 'Category not found',
        code: 'CATEGORY_NOT_FOUND'
      }, { status: 404 });
    }

    // Check if category is used in any transactions
    const associatedTransactions = await db.select()
      .from(transactions)
      .where(eq(transactions.categoryId, parseInt(id)))
      .limit(1);

    if (associatedTransactions.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete category that has associated transactions',
        code: 'CATEGORY_IN_USE'
      }, { status: 400 });
    }

    // Delete category
    const deletedCategory = await db.delete(transactionCategories)
      .where(eq(transactionCategories.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Category deleted successfully',
      category: deletedCategory[0]
    }, { status: 200 });

  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}