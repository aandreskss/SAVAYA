CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"referrer" text,
	"session_id" text,
	"country" text,
	"city" text,
	"device_type" text,
	"browser" text,
	"os" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");
--> statement-breakpoint
CREATE INDEX "page_views_created_at_idx" ON "page_views" USING btree ("created_at");
--> statement-breakpoint
CREATE INDEX "page_views_country_idx" ON "page_views" USING btree ("country");
--> statement-breakpoint
CREATE INDEX "page_views_session_id_idx" ON "page_views" USING btree ("session_id");
