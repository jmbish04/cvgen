PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_test_defs` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`category` text,
	`severity` text,
	`is_active` integer DEFAULT true NOT NULL,
	`error_map` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_test_defs`("id", "name", "description", "category", "severity", "is_active", "error_map", "created_at") SELECT "id", "name", "description", "category", "severity", "is_active", "error_map", "created_at" FROM `test_defs`;--> statement-breakpoint
DROP TABLE `test_defs`;--> statement-breakpoint
ALTER TABLE `__new_test_defs` RENAME TO `test_defs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_test_results` (
	`id` text PRIMARY KEY NOT NULL,
	`session_uuid` text NOT NULL,
	`test_fk` text NOT NULL,
	`started_at` text NOT NULL,
	`finished_at` text,
	`duration_ms` integer,
	`status` text NOT NULL,
	`error_code` text,
	`raw` text,
	`ai_human_readable_error_description` text,
	`ai_prompt_to_fix_error` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`test_fk`) REFERENCES `test_defs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_test_results`("id", "session_uuid", "test_fk", "started_at", "finished_at", "duration_ms", "status", "error_code", "raw", "ai_human_readable_error_description", "ai_prompt_to_fix_error", "created_at") SELECT "id", "session_uuid", "test_fk", "started_at", "finished_at", "duration_ms", "status", "error_code", "raw", "ai_human_readable_error_description", "ai_prompt_to_fix_error", "created_at" FROM `test_results`;--> statement-breakpoint
DROP TABLE `test_results`;--> statement-breakpoint
ALTER TABLE `__new_test_results` RENAME TO `test_results`;--> statement-breakpoint
CREATE INDEX `idx_results_session` ON `test_results` (`session_uuid`);--> statement-breakpoint
CREATE INDEX `idx_results_testfk` ON `test_results` (`test_fk`);--> statement-breakpoint
CREATE INDEX `idx_results_finished` ON `test_results` (`finished_at`);