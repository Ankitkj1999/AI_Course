
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Search, Edit, Trash2, Eye, Plus, Calendar, StarOffIcon, TrendingUpIcon, TrendingDownIcon, MoreVertical } from 'lucide-react';
import SEO from '@/components/SEO';
import { serverURL } from '@/constants';
import axios from 'axios';
import { StarIcon } from '@radix-ui/react-icons';
import { toast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface BlogPost {
    _id: string;
    title: string;
    excerpt: string;
    category: string;
    date: string;
    image: {
        data: {
            data: Uint8Array;
            type: string;
        };
        contentType: string;
    };
    imageUrl: string;
    content: string
    tags: string,
    featured: boolean,
    popular: boolean,
}


const AdminBlogs = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState<BlogPost[]>([]);

    useEffect(() => {
        async function dashboardData() {
            const postURL = serverURL + `/api/getblogs`;
            const response = await axios.get(postURL);
            // Process images immediately
            const processedData = response.data.map((post: BlogPost) => ({
                ...post,
                imageUrl: getImage(post.image)
            }));

            setData(processedData);
            setIsLoading(false);
        }
        dashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Update the getImage function
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function getImage(image: { data: any; contentType: any; }) {
        // Handle Buffer data structure from MongoDB
        const byteArray = image.data.data || image.data;
        const base64String = byteArrayToBase64(byteArray);
        return `data:${image.contentType};base64,${base64String}`;
    }

    // Update byte array conversion
    const byteArrayToBase64 = (byteArray: Uint8Array | number[]) => {
        let binary = '';
        const bytes = new Uint8Array(byteArray);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    const formatDate = (date: string) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return data.filter((user) => {
            const nameMatch = user.title?.toLowerCase().includes(query);
            const emailMatch = user.excerpt?.toLowerCase().includes(query);
            const typeDisplay = user.category?.toLowerCase().includes(query);
            return nameMatch || emailMatch || typeDisplay;
        });
    }, [data, searchQuery]);

    async function deleteBlog(id: string) {
        setIsLoading(true);
        const postURL = serverURL + '/api/deleteblogs';
        const response = await axios.post(postURL, { id: id });
        if (response.data.success) {
            setIsLoading(false);
            toast({
                title: "Deleted",
                description: "Blog deleted successfully",
            });
            location.reload();
        } else {
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    async function updateBlog(id: string, type: string, value: string) {
        setIsLoading(true);
        const postURL = serverURL + '/api/updateblogs';
        const response = await axios.post(postURL, { id: id, type: type, value: value });
        if (response.data.success) {
            setIsLoading(false);
            toast({
                title: "Updated",
                description: "Blog updated successfully",
            });
            location.reload();
        } else {
            setIsLoading(false);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    }

    return (
        <>
            <SEO
                title="Manage Blogs"
                description="Admin panel for managing blog posts on CourseGenie"
                keywords="admin, blog management, content management, CourseGenie"
            />

            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">Manage Blogs</h1>
                        <p className="text-muted-foreground">Create, edit, and manage blog posts</p>
                    </div>

                    <Button asChild>
                        <Link to="/admin/create-blog">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Blog
                        </Link>
                    </Button>
                </div>

                <Separator />

                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search blogs..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <Card>
                    {isLoading ? (
                        <div className="p-4">
                            <div className="space-y-4">
                                {Array(5).fill(0).map((_, index) => (
                                    <div key={index} className="flex items-center gap-4">
                                        <Skeleton className="h-12 flex-1" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead className="hidden md:table-cell">Tags</TableHead>
                                    <TableHead className="hidden md:table-cell">Category</TableHead>
                                    <TableHead className="hidden md:table-cell">Date</TableHead>
                                    <TableHead className="hidden md:table-cell">Excerpt</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((blog) => (
                                    <TableRow key={blog._id}>
                                        <TableCell className="font-medium capitalize">{blog.title}</TableCell>
                                        <TableCell className="hidden md:table-cell capitalize">{blog.tags}</TableCell>
                                        <TableCell className="hidden md:table-cell capitalize">{blog.category}</TableCell>
                                        <TableCell className="hidden md:table-cell capitalize">
                                            <div className="flex items-center">
                                                <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                {formatDate(blog.date)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell capitalize">
                                            {blog.excerpt}
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
                                                    {!blog.popular ?
                                                        <DropdownMenuItem onClick={() => updateBlog(blog._id, 'popular', 'true')}>
                                                            <StarIcon className="mr-2 h-4 w-4" />
                                                            <span >Make Popular</span>
                                                        </DropdownMenuItem>
                                                        :
                                                        <DropdownMenuItem onClick={() => updateBlog(blog._id, 'popular', 'false')}>
                                                            <StarOffIcon className="mr-2 h-4 w-4" />
                                                            <span >Remove Popular</span>
                                                        </DropdownMenuItem>}
                                                    {!blog.featured ?
                                                        <DropdownMenuItem onClick={() => updateBlog(blog._id, 'featured', 'true')}>
                                                            <TrendingUpIcon className="mr-2 h-4 w-4" />
                                                            <span>Make Featured</span>
                                                        </DropdownMenuItem>
                                                        :
                                                        <DropdownMenuItem onClick={() => updateBlog(blog._id, 'featured', 'false')}>
                                                            <TrendingDownIcon className="mr-2 h-4 w-4" />
                                                            <span >Remove Featured</span>
                                                        </DropdownMenuItem>}
                                                    <DropdownMenuItem onClick={() => deleteBlog(blog._id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        <span >Delete</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}

                                {filteredData.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <Search className="h-8 w-8 mb-2" />
                                                <p>No blogs match your search criteria</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </Card>
            </div>
        </>
    );
};

export default AdminBlogs;