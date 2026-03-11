ALTER TABLE "profiles" ALTER COLUMN "total_tokens" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "sync_history" ALTER COLUMN "total_tokens" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "builder_bio_data" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "data_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "style_theme" varchar(20) DEFAULT 'default';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "publish_token_hash" varchar(64);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "device_id_hash" varchar(64);--> statement-breakpoint
CREATE INDEX "users_device_id_hash_idx" ON "users" USING btree ("device_id_hash");