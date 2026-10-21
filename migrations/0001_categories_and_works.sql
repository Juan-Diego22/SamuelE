CREATE TABLE `categories` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `works` (
	`id` text PRIMARY KEY NOT NULL,
	`category_id` integer NOT NULL,
	`title` text,
	`description` text,
	`photo_version` integer NOT NULL,
	`photo_ext` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `works_created_at_idx` ON `works` (`created_at`);--> statement-breakpoint
CREATE INDEX `works_category_id_idx` ON `works` (`category_id`);--> statement-breakpoint
INSERT INTO `categories` (`id`, `name`, `position`) VALUES (1, 'Tortas', 1), (2, 'Postres', 2), (3, 'Rollos', 3), (4, 'Otros', 4);
