
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ExternalLink, CheckCircle, Home } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { serverURL, websiteURL } from '@/constants';
import axios from 'axios';

const PaymentPending = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { state } = useLocation();
    const { sub, link, planName, planCost } = state || {};
    const [processing, setProcessing] = useState(false);

    const handleVerifyPayment = async () => {
        const dataToSend = {
            sub: sub
        };
        try {
            toast({
                title: "Verifying payment",
                description: "Checking your payment status...",
            });
            setProcessing(true);
            const postURL = serverURL + '/api/razorapypending';
            await axios.post(postURL, dataToSend).then(res => {
                if (res.data.status === 'active') {
                    setProcessing(true);
                    const approveHref = websiteURL + '/payment-success/' + sub;
                    window.location.href = approveHref;
                } else if (res.data.status === 'expired' || res.data.status === 'cancelled') {
                    const approveHref = websiteURL + '/payment-failed';
                    window.location.href = approveHref;
                }
                else {
                    toast({
                        title: "Payment pending",
                        description: "Payment is still pending",
                    });
                    setProcessing(false);
                }
            });
        } catch (error) {
            console.error(error);
            setProcessing(false);
            toast({
                title: "Error",
                description: "Internal Server Error",
            });
        }
    };

    const handlePaymentLink = () => {
        toast({
            title: "Opening payment page",
            description: "Redirecting you to complete your payment...",
        });
        window.open(link, '_blank');
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
            <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader className="text-center border-b pb-6">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Clock className="h-8 w-8 text-amber-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Payment Pending</CardTitle>
                    <p className="text-muted-foreground mt-2">
                        We're waiting for your payment to be confirmed.
                    </p>
                </CardHeader>

                <CardContent className="pt-6">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-muted-foreground">Plan</p>
                                <p className="font-medium">{planName}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Amount</p>
                                <p className="font-medium">${planCost}</p>
                            </div>
                        </div>

                        <Separator />

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">What happens next?</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                                Complete your payment and click on "Verify Payment".
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Click on "Payment Link" to reopen payment window.
                            </p>
                        </div>
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
                    <Button variant="outline" onClick={handlePaymentLink}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Payment Link
                    </Button>

                    <Button onClick={handleVerifyPayment}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {processing ? 'Verifying' : 'Verify Payment'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default PaymentPending;