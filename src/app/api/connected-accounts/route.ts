import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { connectedAccounts, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Utility function to encrypt plaid access token
function encryptToken(token: string): string {
  return Buffer.from(token).toString('base64');
}

// Utility function to exclude plaidAccessToken from response
function sanitizeAccount(account: any) {
  const { plaidAccessToken, ...sanitized } = account;
  return sanitized;
}

// Validate account type
function isValidAccountType(type: string): boolean {
  return ['checking', 'savings', 'credit', 'investment'].includes(type);
}

// GET Method - List accounts or get single account by id
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    // Special action: Get primary account for user
    if (action === 'primary' && userId) {
      const userIdInt = parseInt(userId);
      if (isNaN(userIdInt)) {
        return NextResponse.json(
          { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }

      const primaryAccount = await db
        .select()
        .from(connectedAccounts)
        .where(and(eq(connectedAccounts.userId, userIdInt), eq(connectedAccounts.isPrimary, true)))
        .limit(1);

      if (primaryAccount.length === 0) {
        return NextResponse.json(
          { error: 'No primary account found for this user', code: 'PRIMARY_ACCOUNT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(sanitizeAccount(primaryAccount[0]), { status: 200 });
    }

    // Single account by ID
    if (id) {
      const accountId = parseInt(id);
      if (isNaN(accountId)) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const account = await db
        .select()
        .from(connectedAccounts)
        .where(eq(connectedAccounts.id, accountId))
        .limit(1);

      if (account.length === 0) {
        return NextResponse.json(
          { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(sanitizeAccount(account[0]), { status: 200 });
    }

    // List accounts with pagination and filtering
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const isPrimary = searchParams.get('isPrimary');
    const accountType = searchParams.get('accountType');

    let query = db.select().from(connectedAccounts);

    // Build where conditions
    const conditions = [];

    if (userId) {
      const userIdInt = parseInt(userId);
      if (!isNaN(userIdInt)) {
        conditions.push(eq(connectedAccounts.userId, userIdInt));
      }
    }

    if (isPrimary !== null) {
      const isPrimaryBool = isPrimary === 'true';
      conditions.push(eq(connectedAccounts.isPrimary, isPrimaryBool));
    }

    if (accountType) {
      conditions.push(eq(connectedAccounts.accountType, accountType));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const accounts = await query.limit(limit).offset(offset);

    const sanitizedAccounts = accounts.map(sanitizeAccount);

    return NextResponse.json(sanitizedAccounts, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// POST Method - Create new connected account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      plaidAccessToken,
      plaidItemId,
      institutionName,
      accountName,
      accountType,
      accountNumberLast4,
      isPrimary,
    } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_USER_ID' },
        { status: 400 }
      );
    }

    if (!plaidAccessToken || plaidAccessToken.trim() === '') {
      return NextResponse.json(
        { error: 'Plaid access token is required', code: 'MISSING_ACCESS_TOKEN' },
        { status: 400 }
      );
    }

    if (!plaidItemId) {
      return NextResponse.json(
        { error: 'Plaid item ID is required', code: 'MISSING_ITEM_ID' },
        { status: 400 }
      );
    }

    if (!institutionName || institutionName.length < 2 || institutionName.length > 100) {
      return NextResponse.json(
        { error: 'Institution name must be between 2 and 100 characters', code: 'INVALID_INSTITUTION_NAME' },
        { status: 400 }
      );
    }

    if (!accountName || accountName.length < 2 || accountName.length > 100) {
      return NextResponse.json(
        { error: 'Account name must be between 2 and 100 characters', code: 'INVALID_ACCOUNT_NAME' },
        { status: 400 }
      );
    }

    if (!accountType || !isValidAccountType(accountType)) {
      return NextResponse.json(
        { error: 'Account type must be one of: checking, savings, credit, investment', code: 'INVALID_ACCOUNT_TYPE' },
        { status: 400 }
      );
    }

    if (accountNumberLast4 && !/^\d{4}$/.test(accountNumberLast4)) {
      return NextResponse.json(
        { error: 'Account number last 4 must be exactly 4 digits', code: 'INVALID_ACCOUNT_NUMBER' },
        { status: 400 }
      );
    }

    // Validate userId exists in users table
    const userExists = await db.select().from(users).where(eq(users.id, parseInt(userId))).limit(1);
    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User does not exist', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // If isPrimary is true, set all other accounts for this user to false
    const isPrimaryBool = isPrimary === true;
    if (isPrimaryBool) {
      await db
        .update(connectedAccounts)
        .set({ isPrimary: false, updatedAt: new Date().toISOString() })
        .where(eq(connectedAccounts.userId, parseInt(userId)));
    }

    // Encrypt the plaid access token
    const encryptedToken = encryptToken(plaidAccessToken);

    // Create the account
    const newAccount = await db
      .insert(connectedAccounts)
      .values({
        userId: parseInt(userId),
        plaidAccessToken: encryptedToken,
        plaidItemId: plaidItemId.trim(),
        institutionName: institutionName.trim(),
        accountName: accountName.trim(),
        accountType: accountType.trim(),
        accountNumberLast4: accountNumberLast4 || null,
        isPrimary: isPrimaryBool,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(sanitizeAccount(newAccount[0]), { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// PUT Method - Update account or set primary
export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Special action: Set as primary
    if (action === 'setPrimary') {
      const currentUserId = existingAccount[0].userId;

      // Set all other accounts to not primary
      await db
        .update(connectedAccounts)
        .set({ isPrimary: false, updatedAt: new Date().toISOString() })
        .where(eq(connectedAccounts.userId, currentUserId));

      // Set this account as primary
      const updatedAccount = await db
        .update(connectedAccounts)
        .set({
          isPrimary: true,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(connectedAccounts.id, accountId))
        .returning();

      return NextResponse.json(sanitizeAccount(updatedAccount[0]), { status: 200 });
    }

    // Regular update
    const body = await request.json();
    const { accountName, isPrimary, accountNumberLast4, plaidAccessToken, plaidItemId, institutionName, accountType, userId } = body;

    // Prevent updating restricted fields
    if (plaidAccessToken !== undefined || plaidItemId !== undefined || institutionName !== undefined || accountType !== undefined || userId !== undefined) {
      return NextResponse.json(
        { error: 'Cannot update plaidAccessToken, plaidItemId, institutionName, accountType, or userId', code: 'RESTRICTED_FIELDS' },
        { status: 400 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add updatable fields
    if (accountName !== undefined) {
      if (accountName.length < 2 || accountName.length > 100) {
        return NextResponse.json(
          { error: 'Account name must be between 2 and 100 characters', code: 'INVALID_ACCOUNT_NAME' },
          { status: 400 }
        );
      }
      updates.accountName = accountName.trim();
    }

    if (accountNumberLast4 !== undefined) {
      if (accountNumberLast4 && !/^\d{4}$/.test(accountNumberLast4)) {
        return NextResponse.json(
          { error: 'Account number last 4 must be exactly 4 digits', code: 'INVALID_ACCOUNT_NUMBER' },
          { status: 400 }
        );
      }
      updates.accountNumberLast4 = accountNumberLast4;
    }

    if (isPrimary !== undefined) {
      const isPrimaryBool = isPrimary === true;
      updates.isPrimary = isPrimaryBool;

      // If setting to primary, unset all other accounts for this user
      if (isPrimaryBool) {
        const currentUserId = existingAccount[0].userId;
        await db
          .update(connectedAccounts)
          .set({ isPrimary: false, updatedAt: new Date().toISOString() })
          .where(and(eq(connectedAccounts.userId, currentUserId), eq(connectedAccounts.id, accountId, true)));
      }
    }

    const updatedAccount = await db
      .update(connectedAccounts)
      .set(updates)
      .where(eq(connectedAccounts.id, accountId))
      .returning();

    return NextResponse.json(sanitizeAccount(updatedAccount[0]), { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// DELETE Method - Delete account
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Account ID is required', code: 'MISSING_ID' },
        { status: 400 }
      );
    }

    const accountId = parseInt(id);
    if (isNaN(accountId)) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await db
      .select()
      .from(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId))
      .limit(1);

    if (existingAccount.length === 0) {
      return NextResponse.json(
        { error: 'Account not found', code: 'ACCOUNT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const wasPrimary = existingAccount[0].isPrimary;
    const userId = existingAccount[0].userId;

    // Delete the account
    const deleted = await db
      .delete(connectedAccounts)
      .where(eq(connectedAccounts.id, accountId))
      .returning();

    // If deleted account was primary, set another account as primary
    if (wasPrimary) {
      const remainingAccounts = await db
        .select()
        .from(connectedAccounts)
        .where(eq(connectedAccounts.userId, userId))
        .limit(1);

      if (remainingAccounts.length > 0) {
        await db
          .update(connectedAccounts)
          .set({ isPrimary: true, updatedAt: new Date().toISOString() })
          .where(eq(connectedAccounts.id, remainingAccounts[0].id));
      }
    }

    return NextResponse.json(
      {
        message: 'Account deleted successfully',
        deletedAccount: sanitizeAccount(deleted[0]),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}