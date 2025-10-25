import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Save } from 'lucide-react';
import { MinimalTiptapEditor } from '../../minimal-tiptap';
import { Content } from '@tiptap/react';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from 'sonner';

const AdminPrivacy = () => {
  const [value, setValue] = useState<Content>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    // Load existing privacy policy from API
    const loadPrivacy = async () => {
      try {
        const response = await axios.get(serverURL + '/api/policies');
        if (response.data && response.data[0] && response.data[0].privacy) {
          setValue(response.data[0].privacy);
        }
        // Fallback to sessionStorage if API fails
        const storedPrivacy = sessionStorage.getItem('privacy');
        if (storedPrivacy && !response.data[0]?.privacy) {
          setValue(storedPrivacy);
        }
      } catch (error) {
        console.error('Error loading privacy policy:', error);
        // Fallback to sessionStorage
        const storedPrivacy = sessionStorage.getItem('privacy');
        if (storedPrivacy) {
          setValue(storedPrivacy);
        }
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadPrivacy();
  }, []);

  const savePrivacy = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/saveadmin', { 
        data: value, 
        type: 'privacy' 
      });
      
      if (response.data.success) {
        sessionStorage.setItem('privacy', String(value));
        toast.success('Privacy Policy updated successfully');
      } else {
        toast.error('Failed to update Privacy Policy');
      }
    } catch (error) {
      console.error('Error saving privacy policy:', error);
      toast.error('Failed to update Privacy Policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1">Manage your privacy policy content</p>
        </div>
        <Button onClick={savePrivacy} disabled={isLoading || isLoadingContent}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Edit Privacy Policy
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
                  placeholder="Start writing Privacy Policy content..."
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
                onClick={savePrivacy} 
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

export default AdminPrivacy;