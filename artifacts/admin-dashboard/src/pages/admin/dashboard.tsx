import { useGetDashboardStats, useGetRecentCompanies, useGetCompaniesByState, getGetDashboardStatsQueryKey, getGetRecentCompaniesQueryKey, getGetCompaniesByStateQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Globe, FileX, MapPin } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });
  const { data: recentCompanies, isLoading: recentLoading } = useGetRecentCompanies({ limit: 5 }, { query: { queryKey: getGetRecentCompaniesQueryKey({ limit: 5 }) } });
  const { data: stateData, isLoading: stateLoading } = useGetCompaniesByState({ query: { queryKey: getGetCompaniesByStateQueryKey() } });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-2">Monitor your SaaS metrics and recent company activities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Companies" value={stats?.totalCompanies} icon={Building2} loading={statsLoading} />
        <StatCard title="Companies with Pages" value={stats?.companiesWithPages} icon={Globe} loading={statsLoading} />
        <StatCard title="Companies without Pages" value={stats?.companiesWithoutPages} icon={FileX} loading={statsLoading} />
        <StatCard title="States Represented" value={stats?.statesRepresented} icon={MapPin} loading={statsLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4 shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Companies by State</CardTitle>
          </CardHeader>
          <CardContent className="pl-2 h-[300px]">
            {stateLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="state" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip
                    cursor={{ fill: "hsl(var(--muted))" }}
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 shadow-sm border-muted">
          <CardHeader>
            <CardTitle>Recent Companies</CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {recentCompanies?.map((company) => (
                  <div key={company.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.subdomain}.domain.com</p>
                    </div>
                    <Link href={`/admin/companies/${company.id}/edit`}>
                      <span className="text-xs font-medium text-primary hover:underline cursor-pointer" data-testid={`link-edit-recent-${company.id}`}>
                        View
                      </span>
                    </Link>
                  </div>
                ))}
                {!recentCompanies?.length && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent companies found.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, loading }: { title: string; value?: number; icon: any; loading: boolean }) {
  return (
    <Card className="shadow-sm border-muted">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, '-')}`}>
            {value || 0}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
