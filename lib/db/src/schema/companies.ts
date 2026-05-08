import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companiesTable = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  cnpj: text("cnpj"),
  name: text("name").notNull(),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  subdomain: text("subdomain").notNull().unique(),
  htmlContent: text("html_content"),
  about: text("about"),
  services: text("services"),
  mapsQuery: text("maps_query"),
  facebookVerification: text("facebook_verification"),
  domain: text("domain"),
  status: text("status"),
  foundationDate: text("foundation_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectCompanySchema = createSelectSchema(companiesTable);

export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
