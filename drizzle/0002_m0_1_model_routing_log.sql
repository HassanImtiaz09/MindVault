CREATE TABLE `model_routing_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`job_name` varchar(64) NOT NULL,
	`provider` varchar(32) NOT NULL,
	`model` varchar(128) NOT NULL,
	`prompt_tokens` int NOT NULL DEFAULT 0,
	`completion_tokens` int NOT NULL DEFAULT 0,
	`latency_ms` int NOT NULL,
	`cost_estimate_pence` decimal(10,4) NOT NULL DEFAULT '0',
	`error_message` text,
	`occurred_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `model_routing_log_id` PRIMARY KEY(`id`)
);
