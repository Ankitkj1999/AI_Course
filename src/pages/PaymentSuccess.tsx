// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Download, ArrowRight, Receipt } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { appLogo, companyName, MonthCost, serverURL, websiteURL, YearCost } from '@/constants';
import axios from 'axios';
import generatePDF from 'react-to-pdf';

const PaymentSuccess = () => {

  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [receiptId, setReceiptId] = useState('');
  const [planName, setPlanName] = useState('');
  const [method, setMethod] = useState('');
  const [cost, setCost] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const options = {
    page: {
      orientation: 'landscape',
    },
    overrides: {
      pdf: {
        compress: false
      },
      canvas: {
        useCORS: true
      }
    },
  };


  const getTargetElement = () => document.getElementById('content-id');

  const handleDownload = () => {
    generatePDF(getTargetElement, options);
    toast({
      title: "Receipt Downloaded",
      description: "Your receipt has been downloaded successfully.",
    });
  };

  useEffect(() => {
    getDetails();
  });

  async function getDetails() {

    setReceiptId(planId);
    setPlanName(sessionStorage.getItem('plan'));
    setCost(sessionStorage.getItem('plan') === 'Monthly Plan' ? '' + MonthCost : '' + YearCost);
    setName(sessionStorage.getItem('mName'));
    setEmail(sessionStorage.getItem('email'));
    setMethod(sessionStorage.getItem('method'));

    if (sessionStorage.getItem('method') === 'stripe') {
      const dataToSend = {
        subscriberId: sessionStorage.getItem('stripe'),
        uid: sessionStorage.getItem('uid'),
        plan: sessionStorage.getItem('plan')
      };
      const postURL = serverURL + '/api/stripedetails';
      await axios.post(postURL, dataToSend).then(res => {
        sessionStorage.setItem('type', sessionStorage.getItem('plan'));
        sendEmail();
      });
    } else if (sessionStorage.getItem('method') === 'paystack') {
      const dataToSend = {
        email: sessionStorage.getItem('email'),
        uid: sessionStorage.getItem('uid'),
        plan: sessionStorage.getItem('plan')
      };
      const postURL = serverURL + '/api/paystackfetch';
      await axios.post(postURL, dataToSend).then(res => {
        sessionStorage.setItem('type', sessionStorage.getItem('plan'));
        sendEmail();
      });
    } else if (sessionStorage.getItem('method') === 'flutterwave') {
      const dataToSend = {
        email: sessionStorage.getItem('email'),
        uid: sessionStorage.getItem('uid'),
        plan: sessionStorage.getItem('plan')
      };
      const postURL = serverURL + '/api/flutterdetails';
      await axios.post(postURL, dataToSend).then(res => {
        sessionStorage.setItem('type', sessionStorage.getItem('plan'));
        sendEmail();
      });
    } else {
      const subscriptionId = planId;
      const dataToSend = {
        subscriberId: subscriptionId,
        uid: sessionStorage.getItem('uid'),
        plan: sessionStorage.getItem('plan')
      };
      try {
        if (sessionStorage.getItem('method') === 'paypal') {
          const postURL = serverURL + '/api/paypaldetails';
          await axios.post(postURL, dataToSend).then(res => {
            sessionStorage.setItem('type', sessionStorage.getItem('plan'));
            sendEmail();
          });
        } else if (sessionStorage.getItem('method') === 'razorpay') {
          const postURL = serverURL + '/api/razorapydetails';
          await axios.post(postURL, dataToSend).then(res => {
            sessionStorage.setItem('type', sessionStorage.getItem('plan'));
            sendEmail();
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      }
    }

  }

  const getCurrentDate = () => {
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0'); // Pad single digit days with a leading 0
    const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-indexed, so we add 1
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  };

  async function sendEmail() {
    const signInLink = websiteURL + '/login';
    const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
    <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
    <html lang="en">
    
      <head></head>
     <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">Payment Successful<div> ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿ ‌​‍‎‏﻿</div>
     </div>
    
      <body style="padding:20px; margin-left:auto;margin-right:auto;margin-top:auto;margin-bottom:auto;background-color:#f6f9fc;font-family:ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Roboto, &quot;Helvetica Neue&quot;, Arial, &quot;Noto Sans&quot;, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;, &quot;Noto Color Emoji&quot;">
        <table align="center" role="presentation" cellSpacing="0" cellPadding="0" border="0" height="80%" width="100%" style="max-width:37.5em;max-height:80%; margin-left:auto;margin-right:auto;margin-top:80px;margin-bottom:80px;width:465px;border-radius:0.25rem;border-width:1px;background-color:#fff;padding:20px">
          <tr style="width:100%">
            <td>
              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-top:32px">
                <tbody>
                  <tr>
                    <td><img alt="Vercel" src="${appLogo}" width="40" height="37" style="display:block;outline:none;border:none;text-decoration:none;margin-left:auto;margin-right:auto;margin-top:0px;margin-bottom:0px" /></td>
                  </tr>
                </tbody>
              </table>
              <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Payment Successful</h1>
              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Your payment was successful, and your account ${email} has been upgraded to the ${planName}.</p>
              <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                <tbody>
                  <tr>
                    <td><a href="${signInLink}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color: #007BFF;text-align:center;font-size:12px;font-weight:600;color:rgb(255,255,255);text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"</span><span>SignIn</span></a></td>
                  </tr>
                </tbody>
              </table>
              <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,<p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${companyName}</strong> Team</p></p>
              </td>
          </tr>
        </table>
      </body>
    
    </html>`;


    try {
      const email = sessionStorage.getItem('email');
      const plan = sessionStorage.getItem('plan');
      const user = sessionStorage.getItem('uid');
      const subscription = planId;
      const subscriberId = sessionStorage.getItem('email');
      const method = sessionStorage.getItem('method');
      const postURL = serverURL + '/api/sendreceipt';
      await axios.post(postURL, { html, email, plan, subscriberId, user, method, subscription });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div id="content-id" className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center border-b pb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Payment Successful!</CardTitle>
          <p className="text-muted-foreground mt-2">
            Your payment has been successfully processed.
          </p>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Receipt</p>
                <p className="font-medium">{receiptId}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{getCurrentDate()}</p>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Plan Details</h3>
              <div className="flex justify-between items-center mb-1">
                <p>{planName}</p>
                <p className="font-bold">${cost}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Payment Method: {method}
              </p>
            </div>

            <Separator />

            <div>
              <h3 className="font-medium mb-2">Billing Details</h3>
              <p className="mb-1">{name}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t">
          <Button variant="outline" onClick={handleDownload}>
            <Receipt className="mr-2 h-4 w-4" />
            Download Receipt
          </Button>

          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
