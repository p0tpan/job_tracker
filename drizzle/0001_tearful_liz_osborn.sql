CREATE TABLE `seen_jobs` (
	`url` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE `applications` ADD `source` text;--> statement-breakpoint
ALTER TABLE `applications` ADD `match_score` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `applications_url_unique` ON `applications` (`url`);