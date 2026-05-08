import { useRoute } from "wouter";
import { useGetCompanyBySubdomain, getGetCompanyBySubdomainQueryKey } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";

export default function SubdomainPage() {
  const [match, params] = useRoute("/:subdomain");
  const subdomain = params?.subdomain;

  const { data: company, isLoading, error } = useGetCompanyBySubdomain(subdomain as string, {
    query: {
      enabled: !!subdomain,
      queryKey: getGetCompanyBySubdomainQueryKey(subdomain as string),
      retry: false, // Don't retry on 404
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show 404 if company not found or if the company doesn't have generated HTML yet
  if (error || !company || !company.htmlContent) {
    return <NotFound />;
  }

  // Render the generated HTML content directly
  // Note: dangerouslySetInnerHTML is used here because we trust the AI-generated output from our backend
  return (
    <div 
      className="min-h-screen w-full"
      dangerouslySetInnerHTML={{ __html: company.htmlContent }} 
      data-testid={`public-page-${company.subdomain}`}
    />
  );
}
