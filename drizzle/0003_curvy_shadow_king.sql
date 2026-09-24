DROP TABLE `plan_entries`;
--> statement-breakpoint
DROP TABLE `courses`;
--> statement-breakpoint
CREATE TABLE `courses` (
	`code` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`units` integer NOT NULL,
	`semester` text NOT NULL,
	`requirement_group` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `plan_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`term` integer NOT NULL,
	`position` integer NOT NULL,
	`course_code` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `plan_entries_slot_unique` ON `plan_entries` (`term`,`position`);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` integer PRIMARY KEY DEFAULT 1 NOT NULL,
	`current_term` integer NOT NULL
);
