import { pool } from "@workspace/db";
import { logger } from "./logger";

export async function ensureSchema(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cnpj text,
        name text NOT NULL,
        phone text,
        whatsapp text,
        email text,
        address text,
        city text,
        state text,
        meta_title text,
        meta_description text,
        subdomain text NOT NULL UNIQUE,
        html_content text,
        about text,
        services text,
        maps_query text,
        facebook_verification text,
        domain text,
        status text,
        foundation_date text,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );

      ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS about text,
        ADD COLUMN IF NOT EXISTS services text,
        ADD COLUMN IF NOT EXISTS maps_query text,
        ADD COLUMN IF NOT EXISTS facebook_verification text,
        ADD COLUMN IF NOT EXISTS domain text,
        ADD COLUMN IF NOT EXISTS status text,
        ADD COLUMN IF NOT EXISTS foundation_date text;
    `);
    logger.info("Schema ready (table created or already exists, columns migrated)");
  } catch (err) {
    logger.error({ err }, "Error during schema setup");
  }
}
