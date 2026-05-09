import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useCreateCompany, 
  useUpdateCompany, 
  useGetCompany, 
  useGenerateCompanyPage,
  getGetCompanyQueryKey,
  getListCompaniesQueryKey
} from "@workspace/api-client-react";
import type { CompanyCreateInput, CompanyUpdateInput } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Search, ArrowLeft, Wand2, ExternalLink, Copy } from "lucide-react";
import { Link } from "wouter";

const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "institucionalmente.com";
const companyUrl = (subdomain: string) => `https://${subdomain}.${BASE_DOMAIN}`;

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2, "State must be exactly 2 letters").optional().or(z.literal("")),
  subdomain: z.string().min(2, "Subdomain must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  about: z.string().optional(),
  services: z.string().optional(),
  mapsQuery: z.string().optional(),
  facebookVerification: z.string().optional(),
  domain: z.string().optional(),
  status: z.string().optional(),
  foundationDate: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function CompanyForm({ id: idProp }: { id?: string }) {
  const routeParams = useParams<{ id?: string }>();
  const id = idProp ?? routeParams?.id;
  const isEditing = !!id;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cnpj: "",
      phone: "",
      whatsapp: "",
      email: "",
      address: "",
      city: "",
      state: "",
      subdomain: "",
      metaTitle: "",
      metaDescription: "",
      about: "",
      services: "",
      mapsQuery: "",
      facebookVerification: "",
      domain: "",
      status: "",
      foundationDate: "",
    },
  });

  const { data: company, isLoading: isLoadingCompany } = useGetCompany(id as string, {
    query: {
      enabled: isEditing,
      queryKey: getGetCompanyQueryKey(id as string),
    },
  });

  useEffect(() => {
    if (company) {
      form.reset({
        name: company.name || "",
        cnpj: company.cnpj || "",
        phone: company.phone || "",
        whatsapp: company.whatsapp || "",
        email: company.email || "",
        address: company.address || "",
        city: company.city || "",
        state: company.state || "",
        subdomain: company.subdomain || "",
        metaTitle: company.metaTitle || "",
        metaDescription: company.metaDescription || "",
        about: company.about || "",
        services: company.services || "",
        mapsQuery: company.mapsQuery || "",
        facebookVerification: company.facebookVerification || "",
        domain: company.domain || "",
        status: company.status || "",
        foundationDate: company.foundationDate || "",
      });
    }
  }, [company, form]);

  const createMutation = useCreateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        const url = companyUrl(form.getValues("subdomain"));
        toast.success("Company created!", { description: url });
        setLocation("/admin/companies");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to create company");
      },
    },
  });

  const updateMutation = useUpdateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetCompanyQueryKey(id as string) });
        const url = companyUrl(form.getValues("subdomain"));
        toast.success("Company updated!", { description: url });
        setLocation("/admin/companies");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to update company");
      },
    },
  });

  const generatePageMutation = useGenerateCompanyPage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCompanyQueryKey(id as string) });
        toast.success("Landing page generated successfully!");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.error || "Failed to generate landing page");
      },
    }
  });

  const onSubmit = (values: FormValues) => {
    const str = (v: string | undefined): string | null =>
      v === "" || v === undefined ? null : v;

    if (isEditing) {
      const payload: CompanyUpdateInput = {
        name: values.name,
        subdomain: values.subdomain,
        cnpj: str(values.cnpj),
        phone: str(values.phone),
        whatsapp: str(values.whatsapp),
        email: str(values.email),
        address: str(values.address),
        city: str(values.city),
        state: str(values.state),
        metaTitle: str(values.metaTitle),
        metaDescription: str(values.metaDescription),
        about: str(values.about),
        services: str(values.services),
        mapsQuery: str(values.mapsQuery),
        facebookVerification: str(values.facebookVerification),
        domain: str(values.domain),
        status: str(values.status),
        foundationDate: str(values.foundationDate),
      };
      updateMutation.mutate({ id: id as string, data: payload });
    } else {
      const payload: CompanyCreateInput = {
        name: values.name,
        subdomain: values.subdomain,
        cnpj: str(values.cnpj),
        phone: str(values.phone),
        whatsapp: str(values.whatsapp),
        email: str(values.email),
        address: str(values.address),
        city: str(values.city),
        state: str(values.state),
        metaTitle: str(values.metaTitle),
        metaDescription: str(values.metaDescription),
        about: str(values.about),
        services: str(values.services),
        mapsQuery: str(values.mapsQuery),
        facebookVerification: str(values.facebookVerification),
        domain: str(values.domain),
        status: str(values.status),
        foundationDate: str(values.foundationDate),
      };
      createMutation.mutate({ data: payload });
    }
  };

  const handleCnpjAutofill = async () => {
    const cnpj = form.getValues("cnpj")?.replace(/\D/g, "");
    if (!cnpj || cnpj.length !== 14) {
      toast.error("Please enter a valid 14-digit CNPJ");
      return;
    }

    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
      if (!response.ok) throw new Error("CNPJ not found");
      const data = await response.json();

      form.setValue("name", data.razao_social || "", { shouldValidate: true });
      form.setValue("phone", data.ddd_telefone_1 || "", { shouldValidate: true });
      form.setValue("email", data.email || "", { shouldValidate: true });
      form.setValue("address", [data.logradouro, data.numero].filter(Boolean).join(", "), { shouldValidate: true });
      form.setValue("city", data.municipio || "", { shouldValidate: true });
      form.setValue("state", data.uf || "", { shouldValidate: true });
      form.setValue("status", data.descricao_situacao_cadastral || "", { shouldValidate: true });
      form.setValue("foundationDate", data.data_inicio_atividade || "", { shouldValidate: true });

      const primaryCnae = data.cnae_fiscal_descricao || "";
      const secondaryCnaes: string[] = (data.cnaes_secundarios ?? [])
        .map((c: { descricao: string }) => c.descricao)
        .filter(Boolean);
      const allServices = [primaryCnae, ...secondaryCnaes].filter(Boolean).join("; ");
      form.setValue("services", allServices, { shouldValidate: true });

      if (!form.getValues("about")) {
        const cityState = [data.municipio, data.uf].filter(Boolean).join("/");
        const activityDesc = data.cnae_fiscal_descricao || "";
        const natureza = data.descricao_natureza_juridica || "";
        const parts: string[] = [];
        if (data.razao_social && activityDesc) {
          parts.push(`${data.razao_social} é uma empresa${natureza ? ` do tipo ${natureza.toLowerCase()}` : ""} localizada em ${cityState || "Brasil"}, atuando no setor de ${activityDesc.toLowerCase()}.`);
        }
        if (secondaryCnaes.length > 0) {
          parts.push(`Também desenvolve atividades em: ${secondaryCnaes.slice(0, 3).map((s: string) => s.toLowerCase()).join(", ")}.`);
        }
        if (parts.length > 0) {
          form.setValue("about", parts.join(" "), { shouldValidate: true });
        }
      }

      if (!form.getValues("mapsQuery") && (data.logradouro || data.municipio)) {
        const mq = [data.logradouro, data.numero, data.municipio, data.uf]
          .filter(Boolean)
          .join(", ");
        form.setValue("mapsQuery", mq, { shouldValidate: true });
      }

      if (!form.getValues("subdomain") && data.razao_social) {
        const generated = data.razao_social
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "")
          .substring(0, 20);
        form.setValue("subdomain", generated, { shouldValidate: true });
      }

      toast.success("Company data fetched successfully");
    } catch {
      toast.error("Failed to fetch CNPJ data");
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoadingCompany) {
    return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-500 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/admin/companies">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Company" : "New Company"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? "Update company details and manage their landing page." : "Enter company details to create a new record."}
          </p>
        </div>
        
        {isEditing && (
          <div className="ml-auto flex gap-2">
            {company?.subdomain && (
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  const url = companyUrl(company.subdomain);
                  navigator.clipboard.writeText(url);
                  toast.success("URL copied!", { description: url });
                }}
                data-testid="button-copy-url"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
            )}
            {company?.htmlContent && (
              <a href={companyUrl(company.subdomain)} target="_blank" rel="noreferrer">
                <Button variant="outline" data-testid="button-view-page">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Page
                </Button>
              </a>
            )}
            <Button 
              variant="secondary" 
              onClick={() => generatePageMutation.mutate({ id })}
              disabled={generatePageMutation.isPending}
              data-testid="button-generate-page"
            >
              {generatePageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
              {company?.htmlContent ? "Regenerate Page" : "Generate Page"}
            </Button>
          </div>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Basic Information */}
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Core details about the company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="cnpj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CNPJ</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="00.000.000/0000-00" {...field} data-testid="input-cnpj" />
                        </FormControl>
                        <Button type="button" variant="outline" onClick={handleCnpjAutofill} data-testid="button-autofill">
                          <Search className="w-4 h-4 mr-2" />
                          Auto-fill
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdomain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdomain <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <Input placeholder="acme" className="rounded-r-none focus-visible:z-10" {...field} data-testid="input-subdomain" />
                          <div className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-muted-foreground text-sm whitespace-nowrap">
                            .{BASE_DOMAIN}
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>Unique identifier for the landing page URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <FormControl>
                        <Input placeholder="ATIVA" {...field} data-testid="input-status" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foundationDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Foundation Date</FormLabel>
                      <FormControl>
                        <Input placeholder="2010-03-15" {...field} data-testid="input-foundation-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Contact & Location */}
            <Card className="shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Contact & Location</CardTitle>
                <CardDescription>How to reach the company.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 0000-0000" {...field} data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input placeholder="(00) 90000-0000" {...field} data-testid="input-whatsapp" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street name, 123" {...field} data-testid="input-address" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="São Paulo" {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="SP" maxLength={2} className="uppercase" {...field} data-testid="input-state" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="mapsQuery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maps Query</FormLabel>
                      <FormControl>
                        <Input placeholder="Av. Paulista, 1000, São Paulo, SP" {...field} data-testid="input-maps-query" />
                      </FormControl>
                      <FormDescription>Address string used to embed Google Maps on the landing page.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Content */}
            <Card className="md:col-span-2 shadow-sm border-muted">
              <CardHeader>
                <CardTitle>Landing Page Content</CardTitle>
                <CardDescription>Text displayed on the public landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="about"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the company..."
                          className="resize-none min-h-[80px]"
                          {...field}
                          data-testid="input-about"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="services"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Services / Economic Activities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Desenvolvimento de software; Consultoria em TI..."
                          className="resize-none min-h-[80px]"
                          {...field}
                          data-testid="input-services"
                        />
                      </FormControl>
                      <FormDescription>Auto-filled from BrasilAPI when using CNPJ lookup.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* SEO & Meta */}
            <Card className="md:col-span-2 shadow-sm border-muted">
              <CardHeader>
                <CardTitle>SEO & Meta</CardTitle>
                <CardDescription>Search engine optimization and social sharing tags.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Best SaaS Product | Acme Inc." {...field} data-testid="input-meta-title" />
                        </FormControl>
                        <FormDescription>Leave blank to auto-generate from company name.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <FormControl>
                          <Input placeholder="acme.com.br" {...field} data-testid="input-domain" />
                        </FormControl>
                        <FormDescription>Used in OG and canonical tags.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Acme Inc. is the leading provider of..." 
                          className="resize-none" 
                          {...field} 
                          data-testid="input-meta-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="facebookVerification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook Domain Verification</FormLabel>
                      <FormControl>
                        <Input placeholder="abcdef1234567890" {...field} data-testid="input-facebook-verification" />
                      </FormControl>
                      <FormDescription>Value for the <code>facebook-domain-verification</code> meta tag.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-4">
            <Link href="/admin/companies">
              <Button variant="outline" type="button">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isPending} data-testid="button-save">
              {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Company"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
