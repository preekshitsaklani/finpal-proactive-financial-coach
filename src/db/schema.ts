import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

// Users table with comprehensive authentication fields
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  personId: text('person_id').notNull().unique(), // 12 char alphanumeric login ID
  upiId: text('upi_id'),
  profilePictureUrl: text('profile_picture_url'),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  phoneVerified: integer('phone_verified', { mode: 'boolean' }).default(false),
  upiVerified: integer('upi_verified', { mode: 'boolean' }).default(false),
  googleId: text('google_id'),
  appleId: text('apple_id'),
  biometricEnabled: integer('biometric_enabled', { mode: 'boolean' }).default(false),
  biometricHash: text('biometric_hash'), // encrypted
  twoFactorEnabled: integer('two_factor_enabled', { mode: 'boolean' }).default(false),
  twoFactorMethods: text('two_factor_methods', { mode: 'json' }), // json array
  authenticatorSecret: text('authenticator_secret'), // encrypted
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Sessions table for device management
export const sessions = sqliteTable('sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  deviceName: text('device_name'),
  deviceType: text('device_type'),
  deviceFingerprint: text('device_fingerprint'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  lastActivity: text('last_activity').notNull(),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

// Multi-device authentication table
export const multiDeviceAuth = sqliteTable('multi_device_auth', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  verificationCode: text('verification_code').notNull(), // 4 digit
  requestingDevice: text('requesting_device', { mode: 'json' }),
  authorizedDevice: text('authorized_device', { mode: 'json' }),
  status: text('status').notNull().default('pending'), // pending/approved/rejected/expired
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

// OTP verifications table
export const otpVerifications = sqliteTable('otp_verifications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id'), // nullable for new signups
  phoneOrEmail: text('phone_or_email').notNull(),
  otpCode: text('otp_code').notNull(), // 6 digit
  purpose: text('purpose').notNull(), // signup/login/change_phone/change_email/2fa/password_reset
  verified: integer('verified', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  expiresAt: text('expires_at').notNull(),
});

// Transaction categories table
export const transactionCategories = sqliteTable('transaction_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  icon: text('icon').notNull(),
  color: text('color').notNull(),
  isIncome: integer('is_income', { mode: 'boolean' }).default(false),
});

// Transactions table
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  categoryId: integer('category_id').notNull().references(() => transactionCategories.id),
  amount: integer('amount').notNull(), // stored in paise/cents
  description: text('description').notNull(),
  merchantName: text('merchant_name'),
  transactionDate: text('transaction_date').notNull(),
  transactionType: text('transaction_type').notNull(), // debit/credit
  plaidTransactionId: text('plaid_transaction_id'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Insights table
export const insights = sqliteTable('insights', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  insightType: text('insight_type').notNull(), // low_balance_warning/spending_pattern/saving_tip
  title: text('title').notNull(),
  message: text('message').notNull(),
  data: text('data', { mode: 'json' }), // supporting data
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
});

// Insight feedback table
export const insightFeedback = sqliteTable('insight_feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  insightId: integer('insight_id').notNull().references(() => insights.id),
  rating: integer('rating').notNull(), // 1-5 or 1/-1 for thumbs
  helpful: integer('helpful', { mode: 'boolean' }),
  comment: text('comment'),
  createdAt: text('created_at').notNull(),
});

// Connected accounts table
export const connectedAccounts = sqliteTable('connected_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id),
  plaidAccessToken: text('plaid_access_token').notNull(), // encrypted
  plaidItemId: text('plaid_item_id').notNull(),
  institutionName: text('institution_name').notNull(),
  accountName: text('account_name').notNull(),
  accountType: text('account_type').notNull(),
  accountNumberLast4: text('account_number_last_4'),
  isPrimary: integer('is_primary', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// User preferences table
export const userPreferences = sqliteTable('user_preferences', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().unique().references(() => users.id),
  safetyThreshold: integer('safety_threshold').default(5000),
  darkMode: text('dark_mode').default('auto'), // auto/light/dark
  pushNotifications: integer('push_notifications', { mode: 'boolean' }).default(true),
  lowBalanceAlerts: integer('low_balance_alerts', { mode: 'boolean' }).default(true),
  weeklyReports: integer('weekly_reports', { mode: 'boolean' }).default(true),
  savingsTips: integer('savings_tips', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});


// Auth tables for better-auth
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});