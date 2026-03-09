CREATE TABLE "auth_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"device_name" varchar(100),
	"last_used_at" timestamp DEFAULT now() NOT NULL,
	"revoked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_code" varchar(64) NOT NULL,
	"user_code" varchar(8) NOT NULL,
	"user_id" uuid,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"token" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"is_public" integer DEFAULT 0 NOT NULL,
	"summary" text,
	"portrait" jsonb,
	"framework_sentences" jsonb,
	"activity_map" jsonb,
	"behavioral_fingerprint" jsonb,
	"search_profile" jsonb,
	"search_vector" text,
	"sessions_analyzed" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"sessions_analyzed" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"client_version" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" varchar(40) NOT NULL,
	"email" varchar(255),
	"display_name" varchar(100),
	"avatar_color" varchar(7) DEFAULT '#00D084',
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connections" ADD CONSTRAINT "connections_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_codes" ADD CONSTRAINT "device_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sync_history" ADD CONSTRAINT "sync_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_hash_idx" ON "auth_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "connections_requester_idx" ON "connections" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "connections_recipient_idx" ON "connections" USING btree ("recipient_id");--> statement-breakpoint
CREATE UNIQUE INDEX "profiles_user_idx" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "profiles_public_idx" ON "profiles" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "sync_history_user_idx" ON "sync_history" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_idx" ON "users" USING btree ("username");