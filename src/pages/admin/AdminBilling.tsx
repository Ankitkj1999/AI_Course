import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Save } from 'lucide-react';
import { MinimalTiptapEditor } from '../../minimal-tiptap';
import { Content } from '@tiptap/react';
import { serverURL } from '@/constants';
import axios from 'axios';
import { toast } from 'sonner';

const AdminBilling = () => {
  const [value, setValue] = useState<Content>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  useEffect(() => {
    // Load existing billing policy from API
    const loadBilling = async () => {
      try {
        const response = await axios.get(serverURL + '/api/policies');
        if (response.data && response.data[0] && response.data[0].billing) {
          setValue(response.data[0].billing);
        }
        // Fallback to sessionStorage if API fails
        const storedBilling = sessionStorage.getItem('billing');
        if (storedBilling && !response.data[0]?.billing) {
          setValue(storedBilling);
        }
      } catch (error) {
        console.error('Error loading billing policy:', error);
        // Fallback to sessionStorage
        const storedBilling = sessionStorage.getItem('billing');
        if (storedBilling) {
          setValue(storedBilling);
        }
      } finally {
        setIsLoadingContent(false);
      }
    };

    loadBilling();
  }, []);

  const saveBilling = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(serverURL + '/api/saveadmin', { 
        data: value, 
        type: 'billing' 
      });
      
      if (response.data.success) {
        sessionStorage.setItem('billing', String(value));
        toast.success('Billing Policy updated successfully');
      } else {
        toast.error('Failed to update Billing Policy');
      }
    } catch (error) {
      console.error('Error saving billing policy:', error);
      toast.error('Failed to update Billing Policy');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing Policy</h1>
          <p className="text-muted-foreground mt-1">Manage your billing and subscription policy content</p>
        </div>
        <Button onClick={saveBilling} disabled={isLoading || isLoadingContent}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Edit Billing Policy
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
                  placeholder="Start writing Billing Policy content..."
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
                onClick={saveBilling} 
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

export default AdminBilling;