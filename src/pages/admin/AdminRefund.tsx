import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Save } from 'lucide-react';
import { MinimalTiptapEditor } from '../../minimal-tiptap';
import { Content } from '@tiptap/react';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from 'sonner';

const AdminRefund = () => {
  const [value, setValue] = useState<Content>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    // Load existing refund policy from API
    const loadRefund = async () => {
      try {
        const response = await axios.get(serverURL + '/api/policies');
        if (response.data && response.data[0] && response.data[0].refund) {
          setValue(response.data[0].refund);
        }
        // Fallback to localStorage if API fails
        const storedRefund = localStorage.getItem('refund');
        if (storedRefund && !response.data[0]?.refund) {
          setValue(storedRefund);
        }
      } catch (error) {
        console.error('Error loading refund policy:', error);
        // Fallback to localStorage
        const storedRefund = localStorage.getItem('refund');
        if (storedRefund) {
          setValue(storedRefund);
        }
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadRefund();
  }, []);

  const saveRefund = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/saveadmin', { 
        data: value, 
        type: 'refund' 
      });
      
      if (response.data.success) {
        localStorage.setItem('refund', String(value));
        toast.success('Refund Policy updated successfully');
      } else {
        toast.error('Failed to update Refund Policy');
      }
    } catch (error) {
      console.error('Error saving refund policy:', error);
      toast.error('Failed to update Refund Policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
          <p className="text-muted-foreground mt-1">Manage your refund policy content</p>
        </div>
        <Button onClick={saveRefund} disabled={isLoading || isLoadingContent}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Edit Refund Policy
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
                  placeholder="Start writing Refund Policy content..."
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
                onClick={saveRefund} 
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

export default AdminRefund;