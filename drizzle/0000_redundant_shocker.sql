CREATE TABLE `channels` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`handle` text,
	`accent` text NOT NULL,
	`mission` text NOT NULL,
	`audience` text NOT NULL,
	`voice` text NOT NULL,
	`formats` text NOT NULL,
	`never_do` text NOT NULL,
	`cta` text,
	`script_style` text NOT NULL,
	`cadence_per_week` integer NOT NULL,
	`target_depth` integer NOT NULL,
	`record_days` text NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `clips` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`source_url` text NOT NULL,
	`premise` text,
	`source` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`used_by_item_id` text,
	`added_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`channel_id` text NOT NULL,
	`title` text NOT NULL,
	`format_key` text,
	`status` text DEFAULT 'idea' NOT NULL,
	`premise` text,
	`hook` text,
	`script` text,
	`shot_notes` text,
	`caption` text,
	`hashtags` text,
	`record_on` text,
	`post_on` text,
	`post_time` text,
	`asset_url` text,
	`post_url` text,
	`clip_id` text,
	`notes` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`channel_id`) REFERENCES `channels`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `performance` (
	`id` text PRIMARY KEY NOT NULL,
	`item_id` text NOT NULL,
	`views` integer,
	`likes` integer,
	`comments` integer,
	`shares` integer,
	`saves` integer,
	`follows` integer,
	`recorded_at` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action
);
