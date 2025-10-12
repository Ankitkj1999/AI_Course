
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { MinimalTiptapEditor } from '../../minimal-tiptap'
import { Content } from '@tiptap/react'
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from '@/hooks/use-toast';

const AdminTerms = () => {
  const [value, setValue] = useState<Content>(sessionStorage.getItem('terms'));
  const [isLoading, setIsLoading] = useState(false);

  async function saveTerms() {
    setIsLoading(true);
    const postURL = serverURL + '/api/saveadmin';
    const response = await axios.post(postURL, { data: value, type: 'terms' });
    if (response.data.success) {
      sessionStorage.setItem('terms', '' + value);
      setIsLoading(false);
      toast({
        title: "Saved",
        description: "Terms of Service saved successfully",
      });
    } else {
      setIsLoading(false);
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
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Manage your terms of service content</p>
        </div>
        <Button onClick={saveTerms}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : ' Save Changes'}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Edit Terms of Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <MinimalTiptapEditor
                value={value}
                onChange={setValue}
                className="w-full"
                editorContentClassName="p-5"
                output="html"
                placeholder="Start writing Refund Terms of Service."
                autofocus={true}
                editable={true}
                editorClassName="focus:outline-none"
              />
              <p className="text-xs text-muted-foreground">
                Use Markdown formatting for headers, lists, and other text formatting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTerms;
