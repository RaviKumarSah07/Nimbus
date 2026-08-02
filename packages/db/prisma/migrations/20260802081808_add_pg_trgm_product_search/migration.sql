-- Enables fuzzy/typo-tolerant product search. pg_trgm is a "trusted"
-- extension since Postgres 13, so this does not require superuser - the
-- app's own database-owner role can create it, verified locally and safe
-- on Render's managed Postgres too.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Speeds up trigram similarity() lookups once the catalog grows past the
-- point where a sequential scan is instant regardless.
CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);