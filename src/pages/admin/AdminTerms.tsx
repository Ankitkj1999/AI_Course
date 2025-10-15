import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AdminTerms = () => {
  const [terms, setTerms] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load terms from sessionStorage (set in AdminDashboard)
    const storedTerms = sessionStorage.getItem('terms');
    if (storedTerms) {
      setTerms(storedTerms);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would typically make an API call to save the terms
      // For now, we'll just update sessionStorage
      sessionStorage.setItem('terms', terms);
      toast.success('Terms of Service updated successfully');
    } catch (error) {
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
          <p className="text-muted-foreground mt-1">Manage your platform's terms and conditions</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Terms of Service Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your Terms of Service content here..."
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            className="min-h-[400px] resize-none"
          />
          
          <div className="flex justify-end">
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTerms;