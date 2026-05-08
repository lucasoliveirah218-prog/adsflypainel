import { useState } from "react";
import { Link } from "wouter";
import { useListCompanies, useDeleteCompany, getListCompaniesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Edit2, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function CompaniesList() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  
  const { data: companies, isLoading } = useListCompanies(
    { search },
    { query: { queryKey: getListCompaniesQueryKey({ search }) } }
  );

  const deleteCompany = useDeleteCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCompaniesQueryKey() });
        toast.success("Company deleted successfully");
      },
      onError: (err) => {
        toast.error("Failed to delete company");
      },
    },
  });

  const handleDelete = (id: string) => {
    deleteCompany.mutate({ id });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
          <p className="text-muted-foreground">Manage your SaaS companies and their landing pages.</p>
        </div>
        <Link href="/admin/companies/new">
          <Button data-testid="button-new-company">
            <Plus className="w-4 h-4 mr-2" />
            New Company
          </Button>
        </Link>
      </div>

      <div className="flex items-center max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search companies..."
            className="pl-8 bg-card"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search"
          />
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Subdomain</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-[60px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[100px] ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : companies?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  No companies found.
                </TableCell>
              </TableRow>
            ) : (
              companies?.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell className="text-muted-foreground">{company.cnpj || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {company.city && company.state ? `${company.city}, ${company.state}` : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{company.subdomain}</span>
                      <a href={`/${company.subdomain}`} target="_blank" rel="noreferrer" className="text-primary hover:text-primary/80" data-testid={`link-subdomain-${company.id}`}>
                        <Globe className="w-3 h-3" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell>
                    {company.htmlContent ? (
                      <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">Has Page</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal text-muted-foreground">No Page</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/companies/${company.id}/edit`}>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-${company.id}`}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" data-testid={`button-delete-${company.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the company "{company.name}" and remove their data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(company.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete">
                              {deleteCompany.isPending ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
