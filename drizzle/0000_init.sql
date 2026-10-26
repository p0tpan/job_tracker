CREATE TABLE `applications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`url` text,
	`location` text,
	`salary` text,
	`status` text DEFAULT 'wishlist' NOT NULL,
	`applied_on` text,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
