CREATE TYPE "public"."wholesale_lead_status" AS ENUM('new', 'contacted', 'qualified', 'disqualified');--> statement-breakpoint
CREATE TABLE "wholesale_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"city" text NOT NULL,
	"whatsapp" text NOT NULL,
	"email" text,
	"estimated_monthly_volume" text,
	"message" text,
	"status" "wholesale_lead_status" DEFAULT 'new' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "wholesale_leads_status_idx" ON "wholesale_leads" ("status");--> statement-breakpoint
CREATE INDEX "wholesale_leads_created_at_idx" ON "wholesale_leads" ("created_at");
