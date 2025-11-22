import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";
import { appName, facebookClientId, serverURL } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
import { getPendingFork, clearPendingFork } from "@/utils/forkRedirect";
import Logo from "../res/logo.svg";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import FacebookLogin from "@greatsumini/react-facebook-login";

interface DecodedToken {
  email: string;
  name: string;
}

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Get dynamic values from settings
  const googleClientId = settings.GOOGLE_CLIENT_ID?.value || facebookClientId;
  const facebookClientIdDynamic =
    settings.FACEBOOK_CLIENT_ID?.value || facebookClientId;
  const googleLoginEnabled = settings.GOOGLE_LOGIN_ENABLED?.value === "true";
  const facebookLoginEnabled =
    settings.FACEBOOK_LOGIN_ENABLED?.value === "true";

  useEffect(() => {
    const auth = localStorage.getItem("auth");
    const uid = localStorage.getItem("uid");
    if (auth && uid) {
      const pendingFork = getPendingFork();
      if (pendingFork) {
        console.log('Found pending fork operation, redirecting to:', pendingFork.returnUrl);
        clearPendingFork();
        navigate(pendingFork.returnUrl, { replace: true });
        return;
      }
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  function redirectHome() {
    navigate("/dashboard", { replace: true });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const postURL = serverURL + "/api/signin";
      const response = await axios.post(postURL, { email, password }, { withCredentials: true });
      if (response.data.success) {
        localStorage.setItem("email", response.data.userData.email);
        localStorage.setItem("mName", response.data.userData.mName);
        localStorage.setItem("auth", "true");
        localStorage.setItem("uid", response.data.userData._id);
        localStorage.setItem("type", response.data.userData.type);
        localStorage.setItem("isAdmin", response.data.userData.isAdmin);
        toast({
          title: "Login successful",
          description: "Welcome back to " + appName,
        });
        
        const pendingFork = getPendingFork();
        if (pendingFork) {
          console.log('Found pending fork operation after login, redirecting to:', pendingFork.returnUrl);
          clearPendingFork();
          navigate(pendingFork.returnUrl, { replace: true });
          return;
        }
        
        if (localStorage.getItem("shared") === null) {
          redirectHome();
        } else {
          getDataFromDatabase(localStorage.getItem("shared"));
        }
      } else {
        setError(response.data.message);
        setIsLoading(false);
      }
    } catch (err) {
      setError("Failed to login. Please check your credentials.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  async function getDataFromDatabase(id: string) {
    const postURL = serverURL + `/api/shareable?id=${id}`;
    try {
      const response = await axios.get(postURL);
      const dat = response.data[0].content;
      const jsonData = JSON.parse(dat);
      const type = response.data[0].type.toLowerCase();
      const mainTopic = response.data[0].mainTopic;
      const user = localStorage.getItem("uid");
      const content = JSON.stringify(jsonData);

      const postURLs = serverURL + "/api/courseshared";
      const responses = await axios.post(postURLs, {
        user,
        content,
        type,
        mainTopic,
      });
      if (responses.data.success) {
        localStorage.removeItem("shared");
        redirectHome();
      } else {
        redirectHome();
      }
    } catch (error) {
      console.error(error);
      redirectHome();
    }
  }

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link to="/" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <img src={Logo} alt="Logo" className="size-4 invert dark:invert-0" />
          </div>
          {appName}
        </Link>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              {(googleLoginEnabled || facebookLoginEnabled) 
                ? "Login with your Google or Facebook account" 
                : "Sign in to your account to continue"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col gap-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {(googleLoginEnabled || facebookLoginEnabled) && (
                  <>
                    <div className="flex flex-col gap-3">
                      {googleLoginEnabled && (
                        <GoogleLogin
                          theme="outline"
                          type="standard"
                          size="large"
                          width="100%"
                          logo_alignment="left"
                          onSuccess={async (credentialResponse) => {
                            const decoded = jwtDecode<DecodedToken>(credentialResponse.credential);
                            const email = decoded.email;
                            const name = decoded.name;
                            const postURL = serverURL + "/api/social";
                            try {
                              setIsLoading(true);
                              const response = await axios.post(postURL, { email, name }, { withCredentials: true });
                              if (response.data.success) {
                                toast({
                                  title: "Login successful",
                                  description: "Welcome back to " + appName,
                                });
                                setIsLoading(false);
                                localStorage.setItem("email", decoded.email);
                                localStorage.setItem("mName", decoded.name);
                                localStorage.setItem("auth", "true");
                                localStorage.setItem("uid", response.data.userData._id);
                                localStorage.setItem("type", response.data.userData.type);
                                
                                const pendingFork = getPendingFork();
                                if (pendingFork) {
                                  console.log('Found pending fork operation after Google login, redirecting to:', pendingFork.returnUrl);
                                  clearPendingFork();
                                  navigate(pendingFork.returnUrl, { replace: true });
                                  return;
                                }
                                
                                redirectHome();
                              } else {
                                setIsLoading(false);
                                setError(response.data.message);
                              }
                            } catch (error) {
                              console.error(error);
                              setIsLoading(false);
                              setError("Internal Server Error");
                            }
                          }}
                          onError={() => {
                            setIsLoading(false);
                            setError("Internal Server Error");
                          }}
                        />
                      )}

                      {facebookLoginEnabled && (
                        <FacebookLogin
                          appId={facebookClientIdDynamic}
                          style={{
                            backgroundColor: "#1877F2",
                            color: "#fff",
                            fontSize: "14px",
                            padding: "12px 24px",
                            width: "100%",
                            height: "40px",
                            border: "none",
                            borderRadius: "0.375rem",
                            fontWeight: 500,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "background-color 0.2s",
                          }}
                          onFail={(error) => {
                            console.error(error);
                            setIsLoading(false);
                            setError("Internal Server Error");
                          }}
                          onProfileSuccess={async (response) => {
                            const email = response.email;
                            const name = response.name;
                            const postURL = serverURL + "/api/social";
                            try {
                              setIsLoading(true);
                              const response = await axios.post(postURL, { email, name }, { withCredentials: true });
                              if (response.data.success) {
                                toast({
                                  title: "Login successful",
                                  description: "Welcome back to " + appName,
                                });
                                setIsLoading(false);
                                localStorage.setItem("email", email);
                                localStorage.setItem("mName", name);
                                localStorage.setItem("auth", "true");
                                localStorage.setItem("uid", response.data.userData._id);
                                localStorage.setItem("type", response.data.userData.type);
                                
                                const pendingFork = getPendingFork();
                                if (pendingFork) {
                                  console.log('Found pending fork operation after Facebook login, redirecting to:', pendingFork.returnUrl);
                                  clearPendingFork();
                                  navigate(pendingFork.returnUrl, { replace: true });
                                  return;
                                }
                                
                                redirectHome();
                              } else {
                                setIsLoading(false);
                                setError(response.data.message);
                              }
                            } catch (error) {
                              console.error(error);
                              setIsLoading(false);
                              setError("Internal Server Error");
                            }
                          }}
                        />
                      )}
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="m@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        to="/forgot-password"
                        className="text-sm underline-offset-4 hover:underline"
                      >
                        Forgot your password?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Login"}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link to="/signup" className="underline underline-offset-4 hover:text-primary">
                      Sign up
                    </Link>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary">
          By clicking continue, you agree to our{" "}
          <Link to="/terms">Terms of Service</Link> and{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>.
        </div>
      </div>
    </div>
  );
};

export default Login;
