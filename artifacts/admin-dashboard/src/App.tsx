import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

import NotFound from "@/pages/not-found";
import Layout from "@/components/layout";
import Login from "@/pages/login";
import Dashboard from "@/pages/admin/dashboard";
import CompaniesList from "@/pages/admin/companies/index";
import CompanyForm from "@/pages/admin/companies/form";
import SubdomainPage from "@/pages/public/subdomain";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "institucionalmente.com";

function getSubdomainFromHostname(hostname: string, baseDomain: string): string | null {
  const host = hostname.split(":")[0];
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host === baseDomain ||
    host === `www.${baseDomain}` ||
    host === `admin.${baseDomain}`
  ) {
    return null;
  }
  if (host.endsWith(`.${baseDomain}`)) {
    const sub = host.slice(0, host.length - baseDomain.length - 1);
    return sub || null;
  }
  return null;
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (!session) {
        setLocation("/login");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setLocation("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return <Layout><Component /></Layout>;
}

function Router() {
  const detectedSubdomain = getSubdomainFromHostname(window.location.hostname, BASE_DOMAIN);

  if (detectedSubdomain) {
    return <SubdomainPage subdomain={detectedSubdomain} />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/admin" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/admin/companies" component={() => <ProtectedRoute component={CompaniesList} />} />
      <Route path="/admin/companies/new" component={() => <ProtectedRoute component={CompanyForm} />} />
      <Route path="/admin/companies/:id/edit" component={() => <ProtectedRoute component={CompanyForm} />} />
      <Route path="/:subdomain">{() => <SubdomainPage />}</Route>
      <Route path="/">
        <Redirect to="/admin" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
