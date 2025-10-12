
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, MoreVertical, Edit, Trash, Shield } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const AdminAdmins = () => {

  const [admins, setAdmin] = useState([]);
  const [users, setUser] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filtered data using memoization for better performance
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return users.filter((user) => {
      const nameMatch = user.mName?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      return nameMatch || emailMatch;
    });
  }, [users, searchQuery]);

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/getadmins`;
      const response = await axios.get(postURL);
      setAdmin(response.data.admins)
      setUser(response.data.users)
      setIsLoading(false)
    }
    dashboardData();
  }, []);

  async function removeAdmin(email: string) {
    const postURL = serverURL + '/api/removeadmin';
    const response = await axios.post(postURL, { email });
    if (response.data.success) {
      toast({
        title: "Admin Removed",
        description: email + " has been removed as an admin",
      });
      location.reload();
    } else {
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  }

  async function addAdmin(email: string) {
    const postURL = serverURL + '/api/addadmin';
    const response = await axios.post(postURL, { email });
    if (response.data.success) {
      toast({
        title: "Admin Added",
        description: email + " have been added as admin",
      });
      location.reload();
    } else {
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admins</h1>
          <p className="text-muted-foreground mt-1">Promoting a user to admin status will also upgrade them to a paid user</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Administrators</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search admins..."
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
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ?
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                </TableRow>
              </TableBody>
              :

              <TableBody>
                {admins.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">{admin.mName}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.type !== 'no' ? 'default' : 'secondary'}>
                        {admin.type !== 'no' ? 'Super' : 'Admin'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.type !== 'free' ? 'default' : 'secondary'}>
                        {admin.type !== 'free' ? 'Paid' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => removeAdmin(admin.email)} disabled={admin.type !== 'no'}>
                            <CrossCircledIcon className="mr-2 h-4 w-4" />
                            Remove Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredData.map((admin) => (
                  <TableRow key={admin._id}>
                    <TableCell className="font-medium">{admin.mName}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        User
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.type !== 'free' ? 'default' : 'secondary'}>
                        {admin.type !== 'free' ? 'Paid' : 'Free'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => addAdmin(admin.email)}>
                            <CheckCircledIcon className="mr-2 h-4 w-4" />
                            Make Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            }
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAdmins;
