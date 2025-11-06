
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Mail, Lock, User, AlertTriangle } from 'lucide-react';
import { appLogo, appName, companyName, facebookClientId, serverURL, websiteURL } from '@/constants';
import { useSettings } from '@/hooks/useSettings';
import Logo from '../res/logo.svg';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode, JwtPayload } from "jwt-decode";
import FacebookLogin from '@greatsumini/react-facebook-login';

interface GoogleJwtPayload extends JwtPayload {
  email: string;
  name: string;
}

interface FacebookProfileResponse {
  email: string;
  name: string;
}

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Get dynamic values from settings
  const googleClientId = settings.GOOGLE_CLIENT_ID?.value || facebookClientId;
  const facebookClientIdDynamic = settings.FACEBOOK_CLIENT_ID?.value || facebookClientId;
  const googleLoginEnabled = settings.GOOGLE_LOGIN_ENABLED?.value === 'true';
  const facebookLoginEnabled = settings.FACEBOOK_LOGIN_ENABLED?.value === 'true';

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    if (auth) {
      redirectHome();
    }
  });

  function redirectHome() {
    navigate("/dashboard");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (!name || !email || !password) {
      setError('Please fill out all fields');
      return;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (password.length < 9) {
      setError('Password should be at least 9 characters');
      return;
    }

    setIsLoading(true);

    // This is where you would integrate signup logic
    try {
      const postURL = serverURL + '/api/signup';
      const type = 'free';

      const response = await axios.post(postURL, { email, mName: name, password, type });
      if (response.data.success) {
        localStorage.setItem('email', email);
        localStorage.setItem('mName', name);
        localStorage.setItem('auth', 'true');
        localStorage.setItem('uid', response.data.userId);
        localStorage.setItem('type', 'free');
        toast({
          title: "Account created!",
          description: "Welcome to " + appName + ".",
        });
        sendEmail(email);
      } else {
        setError(response.data.message);
        setIsLoading(false);
      }

      sendEmail(email, name);

    } catch (err) {
      setError('Failed to create account. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  async function sendEmail(mEmail: string, mName?: string) {

    try {
      const dataToSend = {
        subject: `Welcome to ${appName}`,
        to: mEmail,
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
                <meta http-equiv="Content-Type" content="text/html charset=UTF-8" />
                <html lang="en">
                
                  <head></head>
                 <div id="__react-email-preview" style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">Welcome to ${appName}</div>
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
                          <h1 style="margin-left:0px;margin-right:0px;margin-top:30px;margin-bottom:30px;padding:0px;text-align:center;font-size:24px;font-weight:400;color:rgb(0,0,0)">Welcome to <strong>${appName}</strong></h1>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Hello <strong>${mName}</strong>,</p>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Welcome to <strong>${appName}</strong>, Unleash your AI potential with our platform, offering a seamless blend of theory and video courses. Dive into comprehensive lessons, from foundational theories to real-world applications, tailored to your learning preferences. Experience the future of AI education with ${appName} – where theory meets engaging visuals for a transformative learning journey!</p>
                          <table align="center" border="0" cellPadding="0" cellSpacing="0" role="presentation" width="100%" style="margin-bottom:32px;margin-top:32px;text-align:center">
                            <tbody>
                              <tr>
                                <td><a href="${websiteURL}" target="_blank" style="p-x:20px;p-y:12px;line-height:100%;text-decoration:none;display:inline-block;max-width:100%;padding:12px 20px;border-radius:0.25rem;background-color:hsl(var(--primary));text-align:center;font-size:12px;font-weight:600;color:hsl(var(--primary-foreground));text-decoration-line:none"><span></span><span style="p-x:20px;p-y:12px;max-width:100%;display:inline-block;line-height:120%;text-decoration:none;text-transform:none;mso-padding-alt:0px;mso-text-raise:9px"><span>Get Started</span></a></td>
                              </tr>
                            </tbody>
                          </table>
                          <p style="font-size:14px;line-height:24px;margin:16px 0;color:rgb(0,0,0)">Best,</p><p target="_blank" style="color:rgb(0,0,0);text-decoration:none;text-decoration-line:none">The <strong>${companyName}</strong> Team</p>
                          </td>
                      </tr>
                    </table>
                  </body>
                
                </html>`
      };
      const postURL = serverURL + '/api/data';
      await axios.post(postURL, dataToSend).then(res => {
        redirectHome();
      }).catch(error => {
        console.error(error);
        redirectHome();
      });

    } catch (error) {
      console.error(error);
      redirectHome();
    }

  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <img src={Logo} alt="Logo" className='h-6 w-6' />
            </div>
            <span className="font-display font-medium text-lg">{appName}</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Create your account</h1>
          <p className="mt-2 text-muted-foreground">Sign up to get started with {appName}</p>
        </div>

        <Card>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 9 characters long
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={agreeToTerms}
                  onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                  disabled={isLoading}
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    terms of service
                  </Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" className="text-primary hover:underline">
                    privacy policy
                  </Link>
                </label>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create account'}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="space-y-3">
              {(googleLoginEnabled || facebookLoginEnabled) && (
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
              )}

              {googleLoginEnabled && (
                <div className="w-full overflow-hidden">
                  <div className="w-full max-w-full">
                    <GoogleLogin
                      theme='outline'
                      type='standard'
                      size='large'
                      width="100%"
                      logo_alignment='left'
                    onSuccess={async (credentialResponse) => {
                      const decoded = jwtDecode<GoogleJwtPayload>(credentialResponse.credential);
                      const email = decoded.email;
                      const name = decoded.name;
                      const postURL = serverURL + '/api/social';
                      try {
                        setIsLoading(true);
                        const response = await axios.post(postURL, { email, name });
                        if (response.data.success) {
                          toast({
                            title: "Login successful",
                            description: "Welcome back to " + appName,
                          });
                          setIsLoading(false);
                          localStorage.setItem('email', decoded.email);
                          localStorage.setItem('mName', decoded.name);
                          localStorage.setItem('auth', 'true');
                          localStorage.setItem('uid', response.data.userData._id);
                          localStorage.setItem('type', response.data.userData.type);
                          sendEmail(decoded.email, decoded.name);
                        } else {
                          setIsLoading(false);
                          setError(response.data.message);
                        }
                      } catch (error) {
                        console.error(error);
                        setIsLoading(false);
                        setError('Internal Server Error');
                      }

                    }}
                    onError={() => {
                      setIsLoading(false);
                      setError('Internal Server Error');
                    }}
                  />
                  </div>
                </div>
              )}

              {facebookLoginEnabled && (
                <FacebookLogin
                  appId={facebookClientIdDynamic}
                  style={{
                    backgroundColor: '#1877F2',
                    color: '#fff',
                    fontSize: '14px',
                    padding: '12px 24px',
                    width: '100%',
                    height: '40px',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onFail={(error) => {
                    console.error(error);
                    setIsLoading(false);
                    setError('Internal Server Error');
                  }}
                  onProfileSuccess={async (response) => {
                    const profile = response as FacebookProfileResponse;
                    const email = profile.email;
                    const name = profile.name;
                    const postURL = serverURL + '/api/social';
                    try {
                      setIsLoading(true);
                      const response = await axios.post(postURL, { email, name });
                      if (response.data.success) {
                        toast({
                          title: "Login successful",
                          description: "Welcome back to " + appName,
                        });
                        setIsLoading(false);
                        localStorage.setItem('email', profile.email);
                        localStorage.setItem('mName', profile.name);
                        localStorage.setItem('auth', 'true');
                        localStorage.setItem('uid', response.data.userData._id);
                        localStorage.setItem('type', response.data.userData.type);
                        sendEmail(profile.email, profile.name);
                      } else {
                        setIsLoading(false);
                        setError(response.data.message);
                      }
                    } catch (error) {
                      console.error(error);
                      setIsLoading(false);
                      setError('Internal Server Error');
                    }
                  }}
                />
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t p-6">
            <div className="text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Signup;
