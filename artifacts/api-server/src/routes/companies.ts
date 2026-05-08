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
import { requireAuth } from "../middleware/auth";

const router = Router();

const LANDING_PAGE_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>

<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

<meta name="facebook-domain-verification" content="{{facebook_verification}}">

<title>{{meta_title}}</title>

<meta name="description" content="{{meta_description}}">

<meta property="og:title" content="{{meta_title}}">
<meta property="og:description" content="{{meta_description}}">
<meta property="og:type" content="website">
<meta property="og:url" content="https://{{domain}}">

<meta name="robots" content="index, follow">

<style>
body {
  margin:0;
  font-family: Arial, sans-serif;
  background:#f4f6f8;
  color:#333;
}

header {
  background:#0f172a;
  color:#fff;
  padding:40px 20px;
  text-align:center;
}

.container {
  max-width:1000px;
  margin:30px auto;
  padding:20px;
}

.card {
  background:#fff;
  padding:25px;
  border-radius:10px;
  margin-bottom:20px;
  box-shadow:0 2px 8px rgba(0,0,0,0.05);
}

.button {
  display:inline-block;
  margin-top:15px;
  padding:12px 20px;
  background:#2563eb;
  color:#fff;
  border-radius:6px;
  text-decoration:none;
}

.footer {
  text-align:center;
  padding:30px;
  font-size:13px;
  color:#777;
}
</style>

</head>

<body>

<header>
  <h1>{{company}}</h1>
  <p>{{services}}</p>
</header>

<div class="container">

  <div class="card">
    <h2>Dados da Empresa</h2>

    <p><strong>CNPJ:</strong> {{cnpj}}</p>
    <p><strong>Situação:</strong> {{status}}</p>
    <p><strong>Fundação:</strong> {{foundation_date}}</p>
    <p><strong>Localização:</strong> {{city}} - {{state}}</p>
    <p><strong>Endereço:</strong> {{address}}</p>

  </div>

  <div class="card">
    <h2>Sobre</h2>

    <p>{{about}}</p>

  </div>

  <div class="card">

    <h2>Contato</h2>

    <p><strong>Telefone:</strong> {{phone}}</p>
    <p><strong>Email:</strong> {{email}}</p>

    <a href="https://wa.me/{{whatsapp}}" class="button">
      Falar no WhatsApp
    </a>

  </div>

  <div class="card">

    <h2>Localização</h2>

    <iframe
      src="https://maps.google.com/maps?q={{maps_query}}&output=embed"
      width="100%"
      height="250"
      style="border:0;">
    </iframe>

  </div>

  <div class="card">

    <h2>Atividades Econômicas</h2>

    <p>{{services}}</p>

  </div>

</div>

<div class="footer">
  © 2026 - {{company}} - Todos os direitos reservados
</div>

</body>
</html>`;

function generateHtml(company: typeof companiesTable.$inferSelect): string {
  const name = company.name ?? "";
  const metaTitle = company.metaTitle ?? name;
  const metaDescription = company.metaDescription ?? "";
  const phone = company.phone ?? "";
  const whatsapp = (company.whatsapp ?? "").replace(/\D/g, "");
  const email = company.email ?? "";
  const address = company.address ?? "";
  const city = company.city ?? "";
  const state = company.state ?? "";
  const cnpj = company.cnpj ?? "";
  const status = company.status ?? "";
  const foundationDate = company.foundationDate ?? "";
  const services = company.services ?? "";
  const about =
    company.about ||
    (services
      ? `${name} atua no setor de: ${services.split(";")[0].trim()}.`
      : company.metaDescription
      ? company.metaDescription
      : "");

  const mapsQuery = encodeURIComponent(
    company.mapsQuery ?? [address, city, state].filter(Boolean).join(", "),
  );
  const facebookVerification = company.facebookVerification ?? "";
  const domain = company.domain ?? `${company.subdomain}.domain.com`;

  return LANDING_PAGE_TEMPLATE
    .replace(/{{company}}/g, name)
    .replace(/{{meta_title}}/g, metaTitle)
    .replace(/{{meta_description}}/g, metaDescription)
    .replace(/{{facebook_verification}}/g, facebookVerification)
    .replace(/{{domain}}/g, domain)
    .replace(/{{cnpj}}/g, cnpj)
    .replace(/{{status}}/g, status)
    .replace(/{{foundation_date}}/g, foundationDate)
    .replace(/{{city}}/g, city)
    .replace(/{{state}}/g, state)
    .replace(/{{address}}/g, address)
    .replace(/{{phone}}/g, phone)
    .replace(/{{whatsapp}}/g, whatsapp)
    .replace(/{{email}}/g, email)
    .replace(/{{about}}/g, about)
    .replace(/{{services}}/g, services)
    .replace(/{{maps_query}}/g, mapsQuery);
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
    about: c.about ?? null,
    services: c.services ?? null,
    mapsQuery: c.mapsQuery ?? null,
    facebookVerification: c.facebookVerification ?? null,
    domain: c.domain ?? null,
    status: c.status ?? null,
    foundationDate: c.foundationDate ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

// GET /companies/subdomain/:subdomain — public, no auth required (serves landing pages)
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
    const mapped = mapCompany(company);
    mapped.htmlContent = generateHtml(company);
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// All routes below this point require a valid Supabase session token
router.use(requireAuth);

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
