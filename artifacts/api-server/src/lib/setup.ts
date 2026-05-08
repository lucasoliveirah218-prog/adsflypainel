import { supabase } from "./supabase";
import { logger } from "./logger";

export async function ensureSchema(): Promise<void> {
  try {
    const { error } = await supabase.from("companies").select("id").limit(1);
    if (!error) {
      logger.info("Supabase companies table already exists");
      return;
    }

    if (error.code !== "PGRST205") {
      logger.warn({ err: error }, "Unexpected error checking companies table");
      return;
    }

    logger.info("companies table not found — will create via SQL");

    // Use the Supabase REST API to run a raw SQL migration via pg-meta
    const supabaseUrl = process.env.SUPABASE_URL!.replace(/\/$/, "");
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const createSQL = `
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
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
    `;

    // Try Supabase's internal pg-meta SQL endpoint (available in self-hosted / studio)
    const res = await fetch(`${supabaseUrl}/pg-meta/v1/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({ query: createSQL }),
    });

    if (res.ok) {
      logger.info("companies table created successfully via pg-meta");
    } else {
      const body = await res.text();
      logger.warn({ status: res.status, body }, "pg-meta endpoint failed — table must be created manually in Supabase SQL Editor");
    }
  } catch (err) {
    logger.error({ err }, "Error during schema setup");
  }
}
