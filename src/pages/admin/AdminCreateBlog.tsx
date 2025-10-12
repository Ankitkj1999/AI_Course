
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FilePlus, Image, Check } from 'lucide-react';
import SEO from '@/components/SEO';
import { MinimalTiptapEditor } from '../../minimal-tiptap'
import { Content } from '@tiptap/react'
import { serverURL } from '@/constants';
import axios from 'axios';

const AdminCreateBlog = () => {
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState<Content>('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Handle image upload
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Convert to Base64
      const base64 = await convertToBase64(file);
      setPreview(base64);
      setCoverImage(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const postURL = serverURL + '/api/createblog';
      const response = await axios.post(postURL, { title, excerpt, content, image: preview, category, tags });
      if (response.data.success) {
        toast({
          title: "Blog post created",
          description: "Your blog post has been published successfully.",
        });
        // Reset form
        setTitle('');
        setExcerpt('');
        setContent('');
        setCategory('');
        setTags('');
        setCoverImage(null);
        setIsSubmitting(false);
      } else {
        setIsSubmitting(false);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      }
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  };

  return (
    <>
      <SEO
        title="Create Blog Post"
        description="Create and publish new blog content"
        keywords="blog creation, content management, admin panel"
      />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Blog Post</h1>
          <p className="text-muted-foreground">Create and publish new blog content</p>
        </div>

        <Separator />

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Blog Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a compelling title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Write a short summary..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  required
                  rows={3}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  A brief description that appears in blog previews. Max 160 characters.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="ai">Artificial Intelligence</SelectItem>
                      <SelectItem value="programming">Programming</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="e.g. AI, learning, online courses"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Separate tags with commas
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="coverImage">Cover Image</Label>
                <div className="mt-1 flex items-center">
                  <label htmlFor="coverImage" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-md overflow-hidden bg-muted/50 hover:bg-muted transition-colors">
                      {coverImage ? (
                        <div className="flex items-center">
                          <Check className="h-5 w-5 text-green-500 mr-2" />
                          <span>{coverImage.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <Image className="h-12 w-12 mb-2" />
                          <span className='px-2'>Upload cover image</span>
                          <span className="text-xs mt-1">1200 x 630px</span>
                        </div>
                      )}
                    </div>
                    <input
                      id="coverImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="sr-only"
                    />
                  </label>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Blog Content</Label>
                <MinimalTiptapEditor
                  value={content}
                  onChange={setContent}
                  className="w-full"
                  editorContentClassName="p-5"
                  output="html"
                  placeholder="Start writing Blog Content."
                  autofocus={true}
                  editable={true}
                  editorClassName="focus:outline-none"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  You can use Markdown formatting
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Publishing..."
                ) : (
                  <>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Publish Post
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
};

export default AdminCreateBlog;
