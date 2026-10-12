CREATE TABLE "barber_links" (
    "code" TEXT NOT NULL,
    "barber_id" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),

    CONSTRAINT "barber_links_pkey" PRIMARY KEY ("code")
);

CREATE INDEX "barber_links_barber_id_idx" ON "barber_links"("barber_id");

ALTER TABLE "barber_links" ADD CONSTRAINT "barber_links_barber_id_fkey" FOREIGN KEY ("barber_id") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "barber_links" ENABLE ROW LEVEL SECURITY;
