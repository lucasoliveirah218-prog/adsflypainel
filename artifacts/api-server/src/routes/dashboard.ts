import { Router, Request, Response } from "express";
import { db, companiesTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { GetRecentCompaniesQueryParams } from "@workspace/api-zod";

const router = Router();

function mapCompany(c: typeof companiesTable.$inferSelect) {
  return {
    id: c.id,
    cnpj: c.cnpj ?? null,
    name: c.name,
    phone: c.phone ?? null,
    whatsapp: c.whatsapp ?? null,
    email: c.email ?? null,
    address: c.address ?? null,
    city: c.city ?? null,
    state: c.state ?? null,
    metaTitle: c.metaTitle ?? null,
    metaDescription: c.metaDescription ?? null,
    subdomain: c.subdomain,
    htmlContent: c.htmlContent ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// GET /dashboard/stats
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const companies = await db.select().from(companiesTable);
    const totalCompanies = companies.length;
    const companiesWithPages = companies.filter((c) => c.htmlContent).length;
    const companiesWithoutPages = totalCompanies - companiesWithPages;
    const statesRepresented = new Set(companies.map((c) => c.state).filter(Boolean)).size;
    res.json({ totalCompanies, companiesWithPages, companiesWithoutPages, statesRepresented });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /dashboard/recent
router.get("/recent", async (req: Request, res: Response) => {
  const parsed = GetRecentCompaniesQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 5) : 5;

  try {
    const companies = await db
      .select()
      .from(companiesTable)
      .orderBy(sql`${companiesTable.createdAt} desc`)
      .limit(limit);
    res.json(companies.map(mapCompany));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /dashboard/by-state
router.get("/by-state", async (_req: Request, res: Response) => {
  try {
    const companies = await db.select().from(companiesTable);
    const counts: Record<string, number> = {};
    for (const c of companies) {
      const st = c.state ?? "Unknown";
      counts[st] = (counts[st] || 0) + 1;
    }
    const result = Object.entries(counts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
