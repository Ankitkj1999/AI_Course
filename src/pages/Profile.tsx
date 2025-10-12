// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { PenLine, Save, ShieldCheck, CreditCard, Loader } from "lucide-react";
import { MonthCost, MonthType, serverURL, YearCost } from '@/constants';
import axios from 'axios';
import { DownloadIcon, TrashIcon } from '@radix-ui/react-icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: sessionStorage.getItem('mName'),
    email: sessionStorage.getItem('email'),
    password: "",
  });
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  const [processingDelete, setProcessingDelete] = useState(false);
  const [processingCancel, setProcessingCancel] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [method, setMethod] = useState('');
  const [cost, setCost] = useState('');
  const [plan, setPlan] = useState('');
  const [jsonData, setJsonData] = useState({});

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    })
  }, []);


  function redirectPricing() {
    navigate("/dashboard/pricing");
  }

  async function deleteProfile() {
    if (sessionStorage.getItem('adminEmail') === sessionStorage.getItem('email')) {
      toast({
        title: "Access Denied",
        description: "Admin profile cannot be deleted."
      });
    } else {
      startDeletion();
    }
  }

  function redirectLogin() {
    sessionStorage.clear();
    navigate("/login");
  }

  async function startDeletion() {
    setProcessingDelete(true);
    const uid = sessionStorage.getItem('uid');
    const postURL = serverURL + '/api/deleteuser';
    try {
      const response = await axios.post(postURL, { userId: uid });
      if (response.data.success) {
        toast({
          title: "Profile Deleted",
          description: "Your profile has been deleted successfully"
        });
        setProcessingDelete(false);
        redirectLogin();
      } else {
        setProcessingDelete(false);
        toast({
          title: "Error",
          description: response.data.message,
        });
      }
    } catch (error) {
      setProcessingDelete(false);
      console.error(error);
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
    }
  }

  const handleInstallClick = () => {
    if (!installPrompt) return
    installPrompt.prompt()
    installPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted install')
      }
      setInstallPrompt(null)
    })
  }

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Couldn't update profile",
        description: "Please fill in all required fields."
      });
      return;
    }
    setProcessing(true);
    const uid = sessionStorage.getItem('uid');
    const postURL = serverURL + '/api/profile';
    try {
      const response = await axios.post(postURL, { email: formData.email, mName: formData.name, password: formData.password, uid });
      if (response.data.success) {
        toast({
          title: "Profile updated",
          description: "Your profile information has been updated successfully."
        });
        sessionStorage.setItem('email', formData.email);
        sessionStorage.setItem('mName', formData.name);
        setProcessing(false);
        setIsEditing(false);
      } else {
        toast({
          title: "Error",
          description: response.data.message,
        });
        setProcessing(false);
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Internal Server Error",
      });
      setProcessing(false);
      setIsEditing(false);
    }
  };


  async function getDetails() {
    if (sessionStorage.getItem('type') !== 'free') {
      const dataToSend = {
        uid: sessionStorage.getItem('uid'),
        email: sessionStorage.getItem('email'),
      };
      try {
        const postURL = serverURL + '/api/subscriptiondetail';
        await axios.post(postURL, dataToSend).then(res => {
          setMethod(res.data.method);
          setJsonData(res.data.session);
          setPlan(sessionStorage.getItem('type'));
          setCost(sessionStorage.getItem('plan') === 'Monthly Plan' ? '' + MonthCost : '' + YearCost);
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Internal Server Error",
        });
      }
    }
  }

  async function cancelSubscription() {
    setProcessingCancel(true);
    const dataToSend = {
      id: jsonData.id,
      email: sessionStorage.getItem('email')
    };
    try {
      if (method === 'stripe') {
        const postURL = serverURL + '/api/stripecancel';
        await axios.post(postURL, dataToSend).then(res => {
          setProcessingCancel(false);
          toast({
            title: "Subscription Cancelled",
            description: "Your subscription has been cancelled.",
          });
          sessionStorage.setItem('type', 'free');
          window.location.href = websiteURL + '/dashboard/profile';
        });
      } else if (method === 'paypal') {
        const postURL = serverURL + '/api/paypalcancel';
        await axios.post(postURL, dataToSend).then(res => {
          setProcessingCancel(false);
          toast({
            title: "Subscription Cancelled",
            description: "Your subscription has been cancelled.",
          });
          sessionStorage.setItem('type', 'free');
          window.location.href = websiteURL + '/dashboard/profile';
        });
      } else if (method === 'paystack') {
        const dataToSends = {
          code: jsonData.subscription_code,
          token: jsonData.email_token,
          email: sessionStorage.getItem('email')
        };
        const postURL = serverURL + '/api/paystackcancel';
        await axios.post(postURL, dataToSends).then(res => {
          setProcessingCancel(false);
          toast({
            title: "Subscription Cancelled",
            description: "Your subscription has been cancelled.",
          });
          sessionStorage.setItem('type', 'free');
          window.location.href = websiteURL + '/dashboard/profile';
        });

      }
      else if (method === 'flutterwave') {
        const dataToSends = {
          code: jsonData.id,
          token: jsonData.plan,
          email: sessionStorage.getItem('email')
        };
        const postURL = serverURL + '/api/flutterwavecancel';
        await axios.post(postURL, dataToSends).then(res => {
          setProcessingCancel(false);
          toast({
            title: "Subscription Cancelled",
            description: "Your subscription has been cancelled.",
          });
          sessionStorage.setItem('type', 'free');
          window.location.href = websiteURL + '/dashboard/profile';
        });
      }
      else {
        const postURL = serverURL + '/api/razorpaycancel';
        await axios.post(postURL, dataToSend).then(res => {
          setProcessingCancel(false);
          toast({
            title: "Subscription Cancelled",
            description: "Your subscription has been cancelled.",
          });
          sessionStorage.setItem('type', 'free');
          window.location.href = websiteURL + '/dashboard/profile';
        });
      }
    } catch (error) {
      setProcessingCancel(false);
      console.error(error);
    }
  }

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <Button
          variant={isEditing ? "default" : "outline"}
          disabled={processing}
          onClick={() => {
            if (isEditing) {
              handleSubmit();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <>
            {processing ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <></>}
            {isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />{processing ? 'Saving...' : 'Save'}
              </>
            ) : (
              <>
                <PenLine className="mr-2 h-4 w-4" /> Edit Profile
              </>
            )}
          </>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <Card className="md:col-span-1">
          <CardHeader className="text-center">
            <CardTitle>{formData.name}</CardTitle>
            <CardDescription>{formData.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">


              <Separator />

              <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Account Status</h3>
                {sessionStorage.getItem('type') !== 'free' ?
                  <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs rounded px-2 py-1 inline-flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Active Paid Plan
                  </div>
                  :
                  <div className="bg-gray-200 dark:gray-700 text-black dark:text-black text-xs rounded px-2 py-1 inline-flex items-center">
                    <ShieldCheck className="h-3 w-3 mr-1" />
                    Active Free Plan
                  </div>
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Settings */}
        <Card className="md:col-span-2">
          <CardContent className="p-0">
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="notifications">Settings</TabsTrigger>
                <TabsTrigger onClick={() => getDetails()} value="billing">Billing</TabsTrigger>
              </TabsList>

              <TabsContent value="account" className="p-6">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">New Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="notifications" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Settings</h3>

                  <div className="space-y-4">
                    {installPrompt && (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="course-updates">Desktop App</Label>
                            <p className="text-sm text-muted-foreground">Download the desktop application for Windows and Mac</p>
                          </div>
                          <Button onClick={handleInstallClick}><DownloadIcon /> Download</Button>
                        </div>
                        <Separator />
                      </>
                    )
                    }

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="marketing">Delete Profile</Label>
                        <p className="text-sm text-muted-foreground">Permanently remove profile and all associated data</p>
                      </div>
                      <Dialog>
                        <DialogTrigger><Button className='bg-red-500 hover:bg-red-600'><TrashIcon /> Delete</Button></DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Are you sure you want to delete your profile?</DialogTitle>
                            <DialogDescription>
                              This action cannot be undone. This will permanently delete your account
                              and remove your data.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-40"
                              >
                                No
                              </Button>
                            </DialogTrigger>
                            <Button onClick={deleteProfile} className='bg-red-500 hover:bg-red-600 w-40'>{processingDelete ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <></>}{processingDelete ? 'Deleting...' : 'Delete'}</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                  </div>
                </div>
              </TabsContent>

              <TabsContent value="billing" className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Subscription Plan</h3>
                  {sessionStorage.getItem('type') !== 'free' ?
                    <>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base font-medium">{plan}</CardTitle>
                          <CardDescription>${cost}/{plan === MonthType ? 'month' : 'year'}</CardDescription>
                        </CardHeader>
                        <CardFooter className="flex justify-between">
                          <Dialog>
                            <DialogTrigger><Button variant="outline" size="sm">Cancel Plan</Button></DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Are you sure you want to cancel your plan?</DialogTitle>
                                <DialogDescription>
                                  This action is irreversible. Your premium plan will be canceled immediately,
                                  and no refunds will be issued for any remaining days.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="w-40"
                                  >
                                    No
                                  </Button>
                                </DialogTrigger>
                                <Button onClick={cancelSubscription} className='bg-red-500 hover:bg-red-600 w-40'>{processingCancel ? <Loader className="animate-spin mr-2 h-4 w-4" /> : <></>}{processingCancel ? 'Canceling...' : 'Cancel Plan'}</Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      </Card>

                      <div className="pt-4">
                        <h3 className="text-lg font-medium mb-2">Payment Methods</h3>

                        <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center">
                            <CreditCard className="h-8 w-8 mr-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium">{method.toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                    :
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">Free Plan</CardTitle>
                        <CardDescription>$0</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">This plan is completely free, <strong>for lifetime.</strong></p>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button onClick={redirectPricing} size="sm">Change Plan</Button>
                      </CardFooter>
                    </Card>
                  }
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
