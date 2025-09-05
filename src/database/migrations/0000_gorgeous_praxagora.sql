DO $$ BEGIN
 CREATE TYPE "public"."acquisition_source" AS ENUM('nursery', 'private_seller', 'gift', 'grown_from_seed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."auth_provider" AS ENUM('local', 'google');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'pro');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password" text,
	"auth_provider" "auth_provider" DEFAULT 'local' NOT NULL,
	"google_id" text,
	"is_email_verified" boolean DEFAULT false NOT NULL,
	"email_verification_token" text,
	"email_verification_expires" timestamp with time zone,
	"password_reset_token" text,
	"password_reset_expires" timestamp with time zone,
	"password_changed_at" timestamp with time zone,
	"refresh_token" text,
	"login_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"has_logged_in" boolean DEFAULT false NOT NULL,
	"has_completed_onboarding" boolean DEFAULT false NOT NULL,
	"onboarding_step" integer DEFAULT 0,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"username" text,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL,
	"subscription_expires_at" timestamp with time zone,
	"tree_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folders_user_id_parent_id_name_unique" UNIQUE("user_id","parent_id","name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "species" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"latin_name" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "species_name_created_by_unique" UNIQUE("name","created_by")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "trees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"folder_id" uuid,
	"nickname" text,
	"species_id" uuid NOT NULL,
	"acquired_date" date NOT NULL,
	"acquisition_source" "acquisition_source",
	"source_name" text,
	"purchase_price" numeric(10, 2),
	"is_public" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "care_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"care_tracking_enabled" boolean DEFAULT false NOT NULL,
	"watering_schedule_enabled" boolean DEFAULT false NOT NULL,
	"repotting_reminders_enabled" boolean DEFAULT false NOT NULL,
	"seasonal_treatments_enabled" boolean DEFAULT false NOT NULL,
	"custom_tasks_enabled" boolean DEFAULT false NOT NULL,
	"public_profile_enabled" boolean DEFAULT false NOT NULL,
	"profile_username" text,
	"onboarding_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "care_preferences_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "care_preferences_profile_username_unique" UNIQUE("profile_username")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tree_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"photo_url" text NOT NULL,
	"thumbnail_url" text,
	"caption" text,
	"taken_at" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "species" ADD CONSTRAINT "species_created_by_profiles_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trees" ADD CONSTRAINT "trees_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trees" ADD CONSTRAINT "trees_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "trees" ADD CONSTRAINT "trees_species_id_species_id_fk" FOREIGN KEY ("species_id") REFERENCES "public"."species"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "care_preferences" ADD CONSTRAINT "care_preferences_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "photos" ADD CONSTRAINT "photos_tree_id_trees_id_fk" FOREIGN KEY ("tree_id") REFERENCES "public"."trees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "photos" ADD CONSTRAINT "photos_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_google_id" ON "users" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_user_id" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_profiles_username" ON "profiles" USING btree ("username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folders_user_id" ON "folders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_folders_parent_id" ON "folders" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_species_name" ON "species" USING btree ("name");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_species_created_by" ON "species" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trees_user_id" ON "trees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trees_folder_id" ON "trees" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trees_species_id" ON "trees" USING btree ("species_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_trees_public" ON "trees" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_care_preferences_user_id" ON "care_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_care_preferences_username" ON "care_preferences" USING btree ("profile_username");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_photos_tree_id" ON "photos" USING btree ("tree_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_photos_user_id" ON "photos" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_photos_taken_at" ON "photos" USING btree ("tree_id","taken_at");