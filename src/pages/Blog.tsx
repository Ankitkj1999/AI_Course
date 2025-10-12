/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Search, Calendar, User, Tag, ArrowRight, Clock } from 'lucide-react';
import SEO from '@/components/SEO';
import { appName, serverURL } from '@/constants';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';

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

const Blog = () => {

  const [data, setData] = useState<BlogPost[]>([]);
  const [featured, setFeatured] = useState<BlogPost | null>(null);
  const [popular, setPopular] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

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

      // Find featured blog
      const featuredBlog = processedData.find((post) => post.featured);
      if (featuredBlog) {
        setFeatured(featuredBlog);
      } else {
        setFeatured(processedData[0]); // Set latest blog as featured if none are featured
      }

      // Find all popular blogs
      const popularBlogs = processedData.filter((post) => post.popular);
      if (popularBlogs.length > 0) {
        setPopular(popularBlogs);
      } else {
        setPopular([processedData[0]]); // Set latest blog as popular if none are popular
      }

    }
    dashboardData();
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

  function readMore(id: string, category: string, date: string, excerpt: string, imageUrl: string, title: string, tags: string, content: string) {
    navigate("/blog/" + id, {
      state: {
        id,
        category,
        date,
        excerpt,
        imageUrl,
        title,
        tags,
        content
      }
    });
  }

  return (
    <>
      <SEO
        title="Blog"
        description="Insights, tips, and updates from the team on education, technology, and the future of learning."
        keywords="education blog, online learning, AI education, course creation, learning tips"
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="mb-8">
            <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </div>

          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-6">Our Blog</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Insights, tips, and updates from the {appName} team on education,
              technology, and the future of learning.
            </p>
          </div>

          {/* Featured Post */}
          <div className="mb-16">
            {isLoading ?
              <Card className="overflow-hidden bg-card">
                <div className="md:grid md:grid-cols-2">
                  <div className="bg-muted aspect-video md:aspect-auto">
                    <Skeleton className="h-full w-full" />
                  </div>
                  <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-3 mb-6">
                    <div className="flex items-center">
                      <div className="p-6 md:p-8 flex flex-col">
                        <div className="mb-2">
                          <Skeleton className="h-6 w-20" />
                        </div>
                        <Skeleton className="h-8 w-4/5 mb-3" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-5/6 mb-2" />
                        <Skeleton className="h-4 w-4/6 mb-6" />
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-32 self-start" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              :
              <Card className="overflow-hidden bg-card">
                <div className="md:grid md:grid-cols-2">
                  <div className="bg-muted aspect-video md:aspect-auto flex items-center justify-center">
                    <img
                      src={featured.imageUrl}
                      alt="Featured post"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="p-6 md:p-8 flex flex-col">
                    <div className="mb-2">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        Featured
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold mb-3">{featured.title}</h2>
                    <p className="text-muted-foreground mb-4 flex-grow">
                      {featured.excerpt}
                    </p>
                    <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-3 mb-6">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(featured.date)}
                      </div>
                    </div>
                    <Button onClick={() => readMore(featured._id, featured.category, featured.date, featured.excerpt, featured.imageUrl, featured.title, featured.tags, featured.content)} className="self-start">
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            }
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Blog Posts */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
              <div className="grid gap-8 md:grid-cols-2">
                {isLoading ?
                  (
                    // Loading skeletons for blog posts
                    Array(6).fill(0).map((_, index) => (
                      <Card key={`skeleton-${index}`} className="flex flex-col h-full">
                        <div className="relative aspect-video bg-muted">
                          <Skeleton className="h-full w-full" />
                        </div>
                        <CardContent className="flex-grow pt-6">
                          <Skeleton className="h-6 w-5/6 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-5/6 mb-4" />
                          <div className="flex flex-wrap items-center gap-3">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Skeleton className="h-4 w-24" />
                        </CardFooter>
                      </Card>
                    ))
                  )
                  :
                  (
                    data.map((post) => (
                      <Card key={post._id} className="flex flex-col h-full">
                        <div className="relative aspect-video bg-muted">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                          <div className="absolute top-2 left-2">
                            <span className="inline-flex items-center rounded-full bg-card/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium">
                              {post.category}
                            </span>
                          </div>
                        </div>
                        <CardContent className="flex-grow pt-6">
                          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                          <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                          <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-3">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(post.date)}
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button onClick={() => readMore(post._id, post.category, post.date, post.excerpt, post.imageUrl, post.title, post.tags, post.content)} variant="ghost" className="p-0 h-auto">
                            Read More
                            <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))
                  )
                }
              </div>
            </div>
            {/* Sidebar */}
            <div className="space-y-8">
              {/* Popular Posts */}
              {isLoading ? (
                <div>
                  <Skeleton className="h-8 w-40 mb-4" />
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, index) => (
                      <div key={`pop-skeleton-${index}`} className="flex gap-3">
                        <Skeleton className="flex-shrink-0 w-16 h-16 rounded-md" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-xl font-bold mb-4">Popular Posts</h3>
                  <div className="space-y-4">
                    {popular.map((post) => (
                      <div key={`popular-${post._id}`} className="flex gap-3">
                        <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-md overflow-hidden">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 onClick={() => readMore(post._id, post.category, post.date, post.excerpt, post.imageUrl, post.title, post.tags, post.content)} className="font-medium text-sm line-clamp-2 cursor-pointer">
                            {post.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{formatDate(post.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default Blog;
