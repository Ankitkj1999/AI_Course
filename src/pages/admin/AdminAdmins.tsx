import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Shield, Users, Trash2, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationInfo } from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPagination } from "@/hooks/useAdminPagination";
import axios from "axios";
import { serverURL } from "@/constants";
import { useToast } from "@/hooks/use-toast";

interface User {
  _id: string;
  mName: string;
  email: string;
  type: string;
}

interface Admin {
  _id: string;
  mName: string;
  email: string;
  type: string;
}

const AdminAdmins = () => {
  const {
    data: users,
    admins,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    refetch,
  } = useAdminPagination<User | Admin>({
    endpoint: "getadmins",
    initialLimit: 10,
  });
  const { toast } = useToast();

  // Clear search when switching to admins tab
  const handleTabChange = (value: string) => {
    if (value === "admins" && searchQuery) {
      setSearchQuery("");
    }
  };

  const handleMakeAdmin = async (email: string) => {
    try {
      await axios.post(`${serverURL}/api/addadmin`, { email });
      toast({
        title: "Success",
        description: "User has been promoted to admin.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user to admin.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    try {
      await axios.post(`${serverURL}/api/removeadmin`, { email });
      toast({
        title: "Success",
        description: "Admin has been demoted to a regular user.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to demote admin.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage administrator accounts and permissions
            </p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="py-8">
            <div className="text-center text-red-500">
              Error loading admin data: {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage administrator accounts and permissions
          </p>
        </div>
      </div>

      <Tabs
        defaultValue="admins"
        className="w-full"
        onValueChange={handleTabChange}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Administrators ({admins.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Regular Users {pagination && `(${pagination.totalItems})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admins" className="mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Current Administrators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableBody>
                    {[...Array(3)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                ) : (
                  <TableBody>
                    {admins.map((admin: Admin) => (
                      <TableRow key={admin._id}>
                        <TableCell className="font-medium">
                          {admin.mName}
                        </TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              admin.type === "main" ? "default" : "secondary"
                            }
                          >
                            {admin.type === "main" ? "Main Admin" : "Admin"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {admin.type !== "main" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdmin(admin.email)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove Admin
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {admins.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Shield className="h-8 w-8 mb-2" />
                            <p>No administrators found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Regular Users
                </CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search users..."
                    className="w-full pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Account Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableBody>
                    {[...Array(5)].map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-5 w-24" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-32" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-16" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="h-8 w-24" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                ) : (
                  <TableBody>
                    {users.map((user: User) => (
                      <TableRow key={user._id}>
                        <TableCell className="font-medium">
                          {user.mName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.type !== "free" ? "default" : "secondary"
                            }
                          >
                            {user.type !== "free" ? "Paid" : "Free"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMakeAdmin(user.email)}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Make Admin
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {users.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Users className="h-8 w-8 mb-2" />
                            <p>No users found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                )}
              </Table>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                  <PaginationInfo
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.totalItems}
                    itemsPerPage={pagination.itemsPerPage}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAdmins;
