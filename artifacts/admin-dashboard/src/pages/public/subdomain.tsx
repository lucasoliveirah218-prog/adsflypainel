import { useParams } from "wouter";
import { useGetCompanyBySubdomain, getGetCompanyBySubdomainQueryKey } from "@workspace/api-client-react";
import { Loader2, Globe } from "lucide-react";

export default function SubdomainPage({ subdomain: subdomainProp }: { subdomain?: string }) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = subdomainProp || params?.subdomain;

  const { data: company, isLoading, error } = useGetCompanyBySubdomain(subdomain as string, {
    query: {
      enabled: !!subdomain,
      queryKey: getGetCompanyBySubdomainQueryKey(subdomain as string),
      retry: false,
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-700 gap-4">
        <Globe className="w-12 h-12 text-slate-300" />
        <h1 className="text-2xl font-bold">Page not found</h1>
        <p className="text-slate-500">No company exists at <span className="font-mono text-sm bg-slate-100 px-2 py-0.5 rounded">{subdomain}</span>.</p>
      </div>
    );
  }

  if (!company.htmlContent) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 text-slate-700 gap-4">
        <Globe className="w-12 h-12 text-blue-300" />
        <h1 className="text-2xl font-bold">{company.name}</h1>
        <p className="text-slate-500">This page is coming soon. Check back later!</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full"
      dangerouslySetInnerHTML={{ __html: company.htmlContent }}
      data-testid={`public-page-${company.subdomain}`}
    />
  );
}
