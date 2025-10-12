
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, Home, RefreshCw } from 'lucide-react';

const PaymentFailed = () => {
  const navigate = useNavigate();

  const handleTryAgain = () => {
    navigate(`/dashboard/pricing`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Failed</CardTitle>
          <p className="text-muted-foreground mt-2">
            There was an issue processing your payment.
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-6">
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">What went wrong?</h3>
              <p className="text-sm text-muted-foreground">
                Your payment could not be processed. This could be due to:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                <li>Insufficient funds</li>
                <li>Card declined by your bank</li>
                <li>Incorrect payment information</li>
                <li>Temporary payment gateway issue</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-3">
                No money has been deducted from your account. You can try again with a different payment method.
              </p>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
          
          <Button onClick={handleTryAgain}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentFailed;