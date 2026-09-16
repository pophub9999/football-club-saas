CREATE TABLE "user_notification_devices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "token_hash" VARCHAR(128) NOT NULL,
  "platform" VARCHAR(16) NOT NULL,
  "app_version" VARCHAR(40),
  "last_seen_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_notification_devices_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_notification_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "user_notification_devices_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "user_notification_devices_token_hash_key" ON "user_notification_devices"("token_hash");
CREATE INDEX "user_notification_devices_tenant_user_idx" ON "user_notification_devices"("tenant_id", "user_id");
CREATE INDEX "user_notification_devices_tenant_platform_idx" ON "user_notification_devices"("tenant_id", "platform");
