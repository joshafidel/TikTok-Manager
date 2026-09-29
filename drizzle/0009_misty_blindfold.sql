ALTER TABLE `channels` ADD `mode` text DEFAULT 'scripts' NOT NULL;--> statement-breakpoint
ALTER TABLE `items` ADD `handle` text;--> statement-breakpoint
ALTER TABLE `items` ADD `source_url` text;