CREATE TABLE `videos` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`item_id` text,
	`filename` text NOT NULL,
	`source_url` text NOT NULL,
	`size_bytes` integer,
	`status` text DEFAULT 'uploaded' NOT NULL,
	`transcript_text` text,
	`words` text,
	`plan` text,
	`render_id` text,
	`render_url` text,
	`error` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `channels` ADD `logo` text;