
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserPlus, Search, MoreVertical, Edit, Trash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { serverURL } from '@/constants';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

const AdminUsers = () => {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Filtered data using memoization for better performance
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return data.filter((user) => {
      const nameMatch = user.mName?.toLowerCase().includes(query);
      const emailMatch = user.email?.toLowerCase().includes(query);
      const typeDisplay = user.type !== 'free' ? 'paid' : 'free';
      const typeMatch = typeDisplay.includes(query);
      return nameMatch || emailMatch || typeMatch;
    });
  }, [data, searchQuery]);

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/getusers`;
      const response = await axios.get(postURL);
      setData(response.data);
      setIsLoading(false);
    }
    dashboardData();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">Manage your user accounts</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>All Users</CardTitle>
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
                <TableHead>Type</TableHead>
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
                </TableRow>
              </TableBody>
              :
              <TableBody>
                {filteredData.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.mName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.type !== 'free' ? 'default' : 'secondary'}>
                        {user.type !== 'free' ? 'Paid' : 'Free'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Search className="h-8 w-8 mb-2" />
                        <p>No users match your search criteria</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            }
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;
