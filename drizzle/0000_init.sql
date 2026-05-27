CREATE TABLE "brand_state" (
	"id" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"status" text NOT NULL,
	"progress" real NOT NULL,
	"result" jsonb,
	"error" text,
	"started_at" bigint NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"market" text NOT NULL,
	"brand_message" text NOT NULL,
	"brand_guide" jsonb NOT NULL,
	"product" jsonb NOT NULL,
	"references" jsonb,
	"asset_types" jsonb NOT NULL,
	"style_shot_settings" jsonb,
	"short_video_settings" jsonb,
	"job_ids" jsonb NOT NULL,
	"start_errors" jsonb NOT NULL,
	"created_at" bigint NOT NULL
);
