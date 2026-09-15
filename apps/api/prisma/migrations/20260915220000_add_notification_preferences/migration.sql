CREATE TABLE "user_tenant_notification_preferences" (
  "user_id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "notifications" BOOLEAN NOT NULL DEFAULT true,
  "matchday" BOOLEAN NOT NULL DEFAULT true,
  "marketing" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_tenant_notification_preferences_pkey" PRIMARY KEY ("user_id", "tenant_id"),
  CONSTRAINT "user_tenant_notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_tenant_notification_preferences_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "user_tenant_notification_preferences_tenant_id_idx" ON "user_tenant_notification_preferences"("tenant_id");
