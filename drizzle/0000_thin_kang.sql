CREATE TABLE `banned_words` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`word` text NOT NULL,
	`added_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `banned_words_word_unique` ON `banned_words` (`word`);--> statement-breakpoint
CREATE TABLE `captcha_sessions` (
	`user_id` integer PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`attempts` integer DEFAULT 0,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_created_at` ON `captcha_sessions` (`created_at`);