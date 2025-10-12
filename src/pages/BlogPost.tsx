import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Calendar, User, Clock, Share2, Bookmark, Tag } from 'lucide-react';
import SEO from '@/components/SEO';
import StyledText from '@/components/styledText';


const BlogPost = () => {
    const { id: blogId } = useParams();
    const { state } = useLocation();
    const { id,
        category,
        date,
        excerpt,
        imageUrl,
        title,
        tags,
        content } = state || {};
    const [isLoading, setIsLoading] = useState(true);
    const [blog, setBlog] = useState(true);

    useEffect(() => {

        if (blogId === id) {
            setBlog(true);
            setIsLoading(false);
        } else {
            setBlog(false);
            setIsLoading(false);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatDate = (date: string) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    return (
        <>
            <SEO
                title={isLoading || !blog ? "Loading Blog..." : title}
                description={isLoading || !blog ? "Loading blog content..." : excerpt}
                keywords={`education blog, online learning, AI education, ${isLoading || !blog ? '' : category}`}
            />
            <div className="min-h-screen bg-background">
                <div className="container max-w-4xl mx-auto px-4 py-12">
                    <div className="mb-8">
                        <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Blog
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="space-y-6">
                            <Skeleton className="h-12 w-3/4 mx-auto" />
                            <div className="flex justify-center space-x-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-32" />
                            </div>
                            <Skeleton className="h-72 w-full" />
                            <div className="space-y-4">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-4/5" />
                            </div>
                        </div>
                    ) : blog ? (
                        <article className="prose prose-lg dark:prose-invert max-w-none">
                            <div className="text-center mb-8">
                                <h1 className="text-4xl font-bold mb-6">{title}</h1>
                                <div className="flex flex-wrap justify-center items-center text-sm text-muted-foreground gap-4">
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1" />
                                        {formatDate(date)}
                                    </div>
                                    <div className="flex items-center">
                                        <Tag className="h-4 w-4 mr-1" />
                                        {category}
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8 rounded-lg overflow-hidden">
                                <img
                                    src={imageUrl}
                                    alt={title}
                                    className="w-full h-auto object-cover max-h-96"
                                />
                            </div>

                            <div className="blog-content">
                                <StyledText text={content} />
                            </div>

                            <div className="mt-12 pt-8 border-t">
                                <div className="flex justify-between items-center">
                                    <Button asChild>
                                        <Link to="/blog">
                                            <ArrowLeft className="mr-2 h-4 w-4" />
                                            Back to Blog
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ) : (
                        <Card className="p-8 text-center">
                            <h2 className="text-2xl font-bold mb-4">Blog Post Not Found</h2>
                            <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
                            <Button asChild>
                                <Link to="/blog">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Blog
                                </Link>
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </>
    );
};

export default BlogPost;
