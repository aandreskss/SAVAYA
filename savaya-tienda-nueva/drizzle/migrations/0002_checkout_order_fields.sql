ALTER TABLE "orders" ADD COLUMN "payment_method_id" uuid REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "shipping_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "reserved_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payment_proofs" ALTER COLUMN "cloudinary_public_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proofs" ALTER COLUMN "cloudinary_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "payment_proofs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
CREATE INDEX "orders_reserved_until_idx" ON "orders" ("reserved_until");--> statement-breakpoint
CREATE INDEX "orders_payment_method_id_idx" ON "orders" ("payment_method_id");
