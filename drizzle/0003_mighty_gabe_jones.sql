CREATE TABLE `audit_log` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`action` varchar(64) NOT NULL,
	`payload` json,
	`ip_address` varchar(45),
	`user_agent` text,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` bigint AUTO_INCREMENT NOT NULL,
	`user_id` int,
	`event_name` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	`synced_at` timestamp DEFAULT (now()),
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feature_flags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`enabled` boolean DEFAULT false,
	`rollout_pct` int DEFAULT 0,
	`description` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feature_flags_id` PRIMARY KEY(`id`),
	CONSTRAINT `feature_flags_key_unique` UNIQUE(`key`)
);
--> statement-breakpoint
CREATE INDEX `audit_log_user_occurred_idx` ON `audit_log` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`);--> statement-breakpoint
CREATE INDEX `events_user_occurred_idx` ON `events` (`user_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `events_name_idx` ON `events` (`event_name`);