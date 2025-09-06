ALTER TYPE "acquisition_source" ADD VALUE 'purchased';--> statement-breakpoint
ALTER TYPE "acquisition_source" ADD VALUE 'propagation';--> statement-breakpoint
ALTER TYPE "acquisition_source" ADD VALUE 'collected';--> statement-breakpoint
ALTER TYPE "acquisition_source" ADD VALUE 'other';--> statement-breakpoint
ALTER TYPE "subscription_tier" ADD VALUE 'premium';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_first_photo_url" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_photo_taken_at" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_nickname" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_species" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_acquired_date" date;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_acquisition_source" "acquisition_source";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_source_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_tree_purchase_price" numeric(10, 2);