import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Save } from 'lucide-react';
import { MinimalTiptapEditor } from '../../minimal-tiptap';
import { Content } from '@tiptap/react';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from 'sonner';

const AdminTerms = () => {
  const [value, setValue] = useState<Content>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    // Load existing terms from API
    const loadTerms = async () => {
      try {
        const response = await axios.get(serverURL + '/api/policies');
        if (response.data && response.data[0] && response.data[0].terms) {
          setValue(response.data[0].terms);
        }
        // Fallback to sessionStorage if API fails
        const storedTerms = sessionStorage.getItem('terms');
        if (storedTerms && !response.data[0]?.terms) {
          setValue(storedTerms);
        }
      } catch (error) {
        console.error('Error loading terms:', error);
        // Fallback to sessionStorage
        const storedTerms = sessionStorage.getItem('terms');
        if (storedTerms) {
          setValue(storedTerms);
        }
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadTerms();
  }, []);

  const saveTerms = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/saveadmin', { 
        data: value, 
        type: 'terms' 
      });
      
      if (response.data.success) {
        sessionStorage.setItem('terms', String(value));
        toast.success('Terms of Service updated successfully');
      } else {
        toast.error('Failed to update Terms of Service');
      }
    } catch (error) {
      console.error('Error saving terms:', error);
      toast.error('Failed to update Terms of Service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-muted-foreground mt-1">Manage your terms of service content</p>
        </div>
        <Button onClick={saveTerms} disabled={isLoading || isLoadingContent}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Terms of Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingContent ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-pulse">Loading content...</div>
              </div>
            ) : (
              <div className="flex flex-col space-y-1.5">
                <MinimalTiptapEditor
                  value={value}
                  onChange={setValue}
                  className="w-full"
                  editorContentClassName="p-5"
                  output="html"
                  placeholder="Start writing Terms of Service content..."
                  autofocus={true}
                  editable={true}
                  editorClassName="focus:outline-none"
                />
                <p className="text-xs text-muted-foreground">
                  Use the toolbar above for formatting headers, lists, and other text formatting.
                </p>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button 
                onClick={saveTerms} 
                disabled={isLoading || isLoadingContent}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTerms;