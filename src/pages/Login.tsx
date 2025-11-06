import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Mail, Lock, AlertTriangle } from "lucide-react";
import { appName, facebookClientId, serverURL } from "@/constants";
import { useSettings } from "@/hooks/useSettings";
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
    if (auth) {
      redirectHome();
    }
  });

  function redirectHome() {
    navigate("/dashboard");
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    // This is where you would integrate authentication logic
    try {
      // Simulate authentication delay
      const postURL = serverURL + "/api/signin";
      const response = await axios.post(postURL, { email, password }, { withCredentials: true });
      if (response.data.success) {
        // Token is now stored in httpOnly cookie automatically

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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
              <img src={Logo} alt="Logo" className="h-6 w-6" />
            </div>
            <span className="font-display font-medium text-lg">{appName}</span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to your account to continue
          </p>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
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
                    <span className="bg-background px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              )}

              {googleLoginEnabled && (
                <div className="w-full overflow-hidden">
                  <div className="w-full max-w-full">
                    <GoogleLogin
                      theme="outline"
                      type="standard"
                      size="large"
                      width="100%"
                      logo_alignment="left"
                    onSuccess={async (credentialResponse) => {
                      const decoded = jwtDecode<DecodedToken>(
                        credentialResponse.credential
                      );
                      const email = decoded.email;
                      const name = decoded.name;
                      const postURL = serverURL + "/api/social";
                      try {
                        setIsLoading(true);
                        const response = await axios.post(postURL, {
                          email,
                          name,
                        }, { withCredentials: true });
                        if (response.data.success) {
                          // Token is now stored in httpOnly cookie automatically

                          toast({
                            title: "Login successful",
                            description: "Welcome back to " + appName,
                          });
                          setIsLoading(false);
                          localStorage.setItem("email", decoded.email);
                          localStorage.setItem("mName", decoded.name);
                          localStorage.setItem("auth", "true");
                          localStorage.setItem(
                            "uid",
                            response.data.userData._id
                          );
                          localStorage.setItem(
                            "type",
                            response.data.userData.type
                          );
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
                  </div>
                </div>
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
                      const response = await axios.post(postURL, {
                        email,
                        name,
                      }, { withCredentials: true });
                      if (response.data.success) {
                        // Token is now stored in httpOnly cookie automatically

                        toast({
                          title: "Login successful",
                          description: "Welcome back to " + appName,
                        });
                        setIsLoading(false);
                        localStorage.setItem("email", email);
                        localStorage.setItem("mName", name);
                        localStorage.setItem("auth", "true");
                        localStorage.setItem(
                          "uid",
                          response.data.userData._id
                        );
                        localStorage.setItem(
                          "type",
                          response.data.userData.type
                        );
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
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 border-t p-6">
            <div className="text-center text-sm">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-medium text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
