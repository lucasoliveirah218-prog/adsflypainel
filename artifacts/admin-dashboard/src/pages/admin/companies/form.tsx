import { useEffect } from "react";
import { useLocation } from "wouter";
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
import { Loader2, Search, ArrowLeft, Wand2, ExternalLink } from "lucide-react";
import { Link } from "wouter";

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
});

type FormValues = z.infer<typeof formSchema>;

export default function CompanyForm({ id }: { id?: string }) {
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
      });
    }
  }, [company, form]);

  const createMutation = useCreateCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        toast.success("Company created successfully");
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
        toast.success("Company updated successfully");
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
    // Clean up empty strings to undefined to match API types if needed
    const payload = Object.fromEntries(
      Object.entries(values).map(([k, v]) => [k, v === "" ? undefined : v])
    ) as any;

    if (isEditing) {
      updateMutation.mutate({ id: id as string, data: payload });
    } else {
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
      form.setValue("address", `${data.logradouro}, ${data.numero}`, { shouldValidate: true });
      form.setValue("city", data.municipio || "", { shouldValidate: true });
      form.setValue("state", data.uf || "", { shouldValidate: true });
      
      // Auto-generate subdomain from name if empty
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
    } catch (error) {
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
            {company?.htmlContent && (
              <a href={`/${company.subdomain}`} target="_blank" rel="noreferrer">
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
                            .domain.com
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>Unique identifier for the landing page URL.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm border-muted">
              <CardHeader>
                <CardTitle>SEO Meta Data</CardTitle>
                <CardDescription>Information used for search engine optimization on the generated landing page.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
