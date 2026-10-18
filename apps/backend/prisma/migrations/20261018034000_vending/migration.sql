CREATE TABLE "VendingPass" (
  "userId" TEXT PRIMARY KEY,
  "code" VARCHAR(5) NOT NULL,
  "schedule" JSONB NOT NULL DEFAULT '[]',
  "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
  "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VendingPass_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VendingPass_code_key" ON "VendingPass"("code");
CREATE TABLE "VendingOrder" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'review',
  "plan" JSONB NOT NULL,
  "progress" INTEGER NOT NULL DEFAULT 0,
  "deviceMode" TEXT,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "VendingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "VendingOrder_userId_createdAt_idx" ON "VendingOrder"("userId", "createdAt");
-- Give every existing account a permanent, unique code. New accounts get one at registration.
DO $$ DECLARE account RECORD; candidate TEXT;
BEGIN
  FOR account IN SELECT "id" FROM "User" LOOP
    LOOP
      candidate := upper(substr(md5(random()::text || account."id"), 1, 5));
      BEGIN
        INSERT INTO "VendingPass" ("userId", "code") VALUES (account."id", candidate);
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        CONTINUE;
      END;
    END LOOP;
  END LOOP;
END $$;
