import { Router, Request, Response } from "express";
import { db, companiesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  CreateCompanyBody,
  UpdateCompanyBody,
  ListCompaniesQueryParams,
  GetCompanyParams,
  UpdateCompanyParams,
  DeleteCompanyParams,
  GenerateCompanyPageParams,
  GetCompanyBySubdomainParams,
} from "@workspace/api-zod";

const router = Router();

function generateHtml(company: typeof companiesTable.$inferSelect): string {
  const name = company.name ?? "";
  const metaTitle = company.metaTitle ?? name;
  const metaDescription = company.metaDescription ?? "";
  const phone = company.phone ?? "";
  const whatsapp = company.whatsapp ?? "";
  const email = company.email ?? "";
  const address = company.address ?? "";
  const city = company.city ?? "";
  const state = company.state ?? "";

  const contactItems: string[] = [];
  if (phone) contactItems.push(`<li>Telefone: <a href="tel:${phone}">${phone}</a></li>`);
  if (whatsapp) contactItems.push(`<li>WhatsApp: <a href="https://wa.me/${whatsapp.replace(/\D/g, "")}" target="_blank">${whatsapp}</a></li>`);
  if (email) contactItems.push(`<li>Email: <a href="mailto:${email}">${email}</a></li>`);
  const fullAddress = [address, city, state].filter(Boolean).join(", ");
  if (fullAddress) contactItems.push(`<li>Endereco: ${fullAddress}</li>`);

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background: #f8fafc; color: #1e293b; }
    header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 4rem 2rem; text-align: center; }
    header h1 { font-size: 2.5rem; font-weight: 800; margin-bottom: 1rem; }
    header p { font-size: 1.125rem; opacity: 0.9; max-width: 600px; margin: 0 auto; }
    main { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; }
    .card { background: white; border-radius: 1rem; padding: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem; }
    .card h2 { font-size: 1.25rem; font-weight: 700; margin-bottom: 1.5rem; color: #1e40af; }
    ul { list-style: none; display: flex; flex-direction: column; gap: 0.75rem; }
    li { font-size: 1rem; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer { text-align: center; padding: 2rem; color: #64748b; font-size: 0.875rem; border-top: 1px solid #e2e8f0; margin-top: 2rem; }
  </style>
</head>
<body>
  <header>
    <h1>${name}</h1>
    ${metaDescription ? `<p>${metaDescription}</p>` : ""}
  </header>
  <main>
    ${contactItems.length > 0 ? `
    <div class="card">
      <h2>Contato</h2>
      <ul>${contactItems.map((i) => `\n      ${i}`).join("")}
      </ul>
    </div>` : ""}
  </main>
  <footer>
    <p>&copy; ${new Date().getFullYear()} ${name}. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;
}

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

// GET /companies
router.get("/", async (req: Request, res: Response) => {
  const parsed = ListCompaniesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }

  try {
    let companies;
    if (parsed.data.search) {
      companies = await db
        .select()
        .from(companiesTable)
        .where(
          or(
            ilike(companiesTable.name, `%${parsed.data.search}%`),
            ilike(companiesTable.cnpj ?? companiesTable.name, `%${parsed.data.search}%`),
          ),
        )
        .orderBy(companiesTable.createdAt);
    } else if (parsed.data.state) {
      companies = await db
        .select()
        .from(companiesTable)
        .where(eq(companiesTable.state, parsed.data.state))
        .orderBy(companiesTable.createdAt);
    } else if (parsed.data.city) {
      companies = await db
        .select()
        .from(companiesTable)
        .where(eq(companiesTable.city, parsed.data.city))
        .orderBy(companiesTable.createdAt);
    } else {
      companies = await db.select().from(companiesTable).orderBy(companiesTable.createdAt);
    }
    res.json(companies.map(mapCompany));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /companies
router.post("/", async (req: Request, res: Response) => {
  const parsed = CreateCompanyBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const [company] = await db
      .insert(companiesTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(mapCompany(company));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /companies/subdomain/:subdomain — must come before /:id
router.get("/subdomain/:subdomain", async (req: Request, res: Response) => {
  const parsed = GetCompanyBySubdomainParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  try {
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.subdomain, parsed.data.subdomain));
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(mapCompany(company));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// GET /companies/:id
router.get("/:id", async (req: Request, res: Response) => {
  const parsed = GetCompanyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  try {
    const [company] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, parsed.data.id));
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(mapCompany(company));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// PUT /companies/:id
router.put("/:id", async (req: Request, res: Response) => {
  const paramsParsed = UpdateCompanyParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const bodyParsed = UpdateCompanyBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  try {
    const [company] = await db
      .update(companiesTable)
      .set({ ...bodyParsed.data, updatedAt: new Date() })
      .where(eq(companiesTable.id, paramsParsed.data.id))
      .returning();
    if (!company) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    res.json(mapCompany(company));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// DELETE /companies/:id
router.delete("/:id", async (req: Request, res: Response) => {
  const parsed = DeleteCompanyParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  try {
    await db.delete(companiesTable).where(eq(companiesTable.id, parsed.data.id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /companies/:id/generate-page
router.post("/:id/generate-page", async (req: Request, res: Response) => {
  const parsed = GenerateCompanyPageParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  try {
    const [existing] = await db
      .select()
      .from(companiesTable)
      .where(eq(companiesTable.id, parsed.data.id));
    if (!existing) {
      res.status(404).json({ error: "Company not found" });
      return;
    }

    const html = generateHtml(existing);

    const [company] = await db
      .update(companiesTable)
      .set({ htmlContent: html, updatedAt: new Date() })
      .where(eq(companiesTable.id, parsed.data.id))
      .returning();

    res.json(mapCompany(company));
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

export default router;
