import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import GenerateCourse from "./pages/GenerateCourse";
import DashboardLayout from "./components/layouts/DashboardLayout";
import ProfilePricing from "./pages/ProfilePricing";
import PaymentDetails from "./pages/PaymentDetails";
import Profile from "./pages/Profile";
import Certificate from "./pages/Certificate";
import PaymentSuccess from "./pages/PaymentSuccess";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import { ThemeProvider } from "./contexts/ThemeContext";
import PaymentPending from "./pages/PaymentPending";
import PaymentFailed from "./pages/PaymentFailed";

// Admin imports
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminPaidUsers from "./pages/admin/AdminPaidUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminTerms from "./pages/admin/AdminTerms";
import AdminPrivacy from "./pages/admin/AdminPrivacy";
import AdminCancellation from "./pages/admin/AdminCancellation";
import AdminRefund from "./pages/admin/AdminRefund";
import AdminSubscriptionBilling from "./pages/admin/AdminSubscriptionBilling";
import AdminCreateBlog from "./pages/admin/AdminCreateBlog";
import SubscriptionBillingPolicy from "./pages/SubscriptionBillingPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import CancellationPolicy from "./pages/CancellationPolicy";
import QuizPage from "./pages/QuizPage";
import BlogPost from "./pages/BlogPost";
import AdminBlogs from "./pages/admin/AdminBlogs";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { googleClientId } from "./constants";

const queryClient = new QueryClient();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered:', registration);
      })
      .catch(error => {
        console.log('SW registration failed:', error);
      });
  });
}

//TODO : Add failed payment link in server.js
//TODO : compare main server with edited server file

const App = () => (
  <GoogleOAuthProvider clientId={googleClientId}>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <HelmetProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* Dashboard Routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="generate-course" element={<GenerateCourse />} />
                  <Route path="pricing" element={<ProfilePricing />} />
                  <Route path="payment/:planId" element={<PaymentDetails />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Course Routes */}
                <Route path="/course/:courseId" element={<CoursePage />} />
                <Route path="/course/:courseId/certificate" element={<Certificate />} />
                <Route path="/course/:courseId/quiz" element={<QuizPage />} />

                {/* Payment Routes */}
                <Route path="/payment-success/:planId" element={<PaymentSuccess />} />
                <Route path="/payment-pending" element={<PaymentPending />} />
                <Route path="/payment-failed" element={<PaymentFailed />} />

                {/* Static Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cancellation-policy" element={<CancellationPolicy />} />
                <Route path="/refund-policy" element={<RefundPolicy />} />
                <Route path="/subscription-billing-policy" element={<SubscriptionBillingPolicy />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="courses" element={<AdminCourses />} />
                  <Route path="paid-users" element={<AdminPaidUsers />} />
                  <Route path="admins" element={<AdminAdmins />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="terms" element={<AdminTerms />} />
                  <Route path="privacy" element={<AdminPrivacy />} />
                  <Route path="cancellation" element={<AdminCancellation />} />
                  <Route path="refund" element={<AdminRefund />} />
                  <Route path="subscription-billing" element={<AdminSubscriptionBilling />} />
                  <Route path="create-blog" element={<AdminCreateBlog />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
);

export default App;
