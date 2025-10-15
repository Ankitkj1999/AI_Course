import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AdminBilling = () => {
  const [billing, setBilling] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load billing policy from sessionStorage (set in AdminDashboard)
    const storedBilling = sessionStorage.getItem('billing');
    if (storedBilling) {
      setBilling(storedBilling);
    }
  }, []);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Here you would typically make an API call to save the billing policy
      // For now, we'll just update sessionStorage
      sessionStorage.setItem('billing', billing);
      toast.success('Billing Policy updated successfully');
    } catch (error) {
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
          <p className="text-muted-foreground mt-1">Manage your platform's billing and subscription policy</p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Policy Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Enter your Billing Policy content here..."
            value={billing}
            onChange={(e) => setBilling(e.target.value)}
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

export default AdminBilling;