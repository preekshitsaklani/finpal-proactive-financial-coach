CREATE TABLE `connected_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`plaid_access_token` text NOT NULL,
	`plaid_item_id` text NOT NULL,
	`institution_name` text NOT NULL,
	`account_name` text NOT NULL,
	`account_type` text NOT NULL,
	`account_number_last_4` text,
	`is_primary` integer DEFAULT false,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insight_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`insight_id` integer NOT NULL,
	`rating` integer NOT NULL,
	`helpful` integer,
	`comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`insight_id`) REFERENCES `insights`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`insight_type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`data` text,
	`is_read` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `multi_device_auth` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`verification_code` text NOT NULL,
	`requesting_device` text,
	`authorized_device` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `otp_verifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`phone_or_email` text NOT NULL,
	`otp_code` text NOT NULL,
	`purpose` text NOT NULL,
	`verified` integer DEFAULT false,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`device_name` text,
	`device_type` text,
	`device_fingerprint` text,
	`ip_address` text,
	`user_agent` text,
	`is_active` integer DEFAULT true,
	`last_activity` text NOT NULL,
	`created_at` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transaction_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`icon` text NOT NULL,
	`color` text NOT NULL,
	`is_income` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `transaction_categories_name_unique` ON `transaction_categories` (`name`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	`amount` integer NOT NULL,
	`description` text NOT NULL,
	`merchant_name` text,
	`transaction_date` text NOT NULL,
	`transaction_type` text NOT NULL,
	`plaid_transaction_id` text,
	`is_recurring` integer DEFAULT false,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `transaction_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_preferences` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`safety_threshold` integer DEFAULT 5000,
	`dark_mode` text DEFAULT 'auto',
	`push_notifications` integer DEFAULT true,
	`low_balance_alerts` integer DEFAULT true,
	`weekly_reports` integer DEFAULT true,
	`savings_tips` integer DEFAULT true,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_preferences_user_id_unique` ON `user_preferences` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`password_hash` text NOT NULL,
	`person_id` text NOT NULL,
	`upi_id` text,
	`profile_picture_url` text,
	`email_verified` integer DEFAULT false,
	`phone_verified` integer DEFAULT false,
	`upi_verified` integer DEFAULT false,
	`google_id` text,
	`apple_id` text,
	`biometric_enabled` integer DEFAULT false,
	`biometric_hash` text,
	`two_factor_enabled` integer DEFAULT false,
	`two_factor_methods` text,
	`authenticator_secret` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_person_id_unique` ON `users` (`person_id`);