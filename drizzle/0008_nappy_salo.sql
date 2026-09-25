CREATE TABLE `incompatibilities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`with_code` text NOT NULL,
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`with_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `incompatibilities_pair_unique` ON `incompatibilities` (`course_code`,`with_code`);