CREATE TABLE "assessments" (
	"id" serial PRIMARY KEY NOT NULL,
	"scores" integer[] NOT NULL,
	"total_score" integer NOT NULL,
	"risk_level" varchar(50) NOT NULL,
	"explanation" text NOT NULL,
	"recommendations" text[] NOT NULL,
	"ai_insights" text,
	"confidence" integer,
	"user_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"score_type" varchar(20) NOT NULL,
	"order" integer NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"reference" varchar NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'USD' NOT NULL,
	"status" varchar NOT NULL,
	"paystack_id" integer,
	"channel" varchar,
	"gateway_response" varchar,
	"paid_at" timestamp,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report_type" varchar NOT NULL,
	"title" varchar NOT NULL,
	"description" text NOT NULL,
	"category" varchar,
	"priority" varchar DEFAULT 'medium',
	"status" varchar DEFAULT 'open',
	"user_id" varchar NOT NULL,
	"user_email" varchar,
	"related_item_id" varchar,
	"device_info" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"plan" varchar NOT NULL,
	"status" varchar NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar DEFAULT 'USD' NOT NULL,
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT true NOT NULL,
	"payment_reference" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"password_hash" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"assessment_count" integer DEFAULT 0 NOT NULL,
	"last_assessment_reset" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_reference_payments_reference_fk" FOREIGN KEY ("payment_reference") REFERENCES "public"."payments"("reference") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");