import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import CoursePage from "./pages/CoursePage";
import { CourseIdRedirect } from "./pages/CourseRedirect";
import GenerateCourse from "./pages/GenerateCourse";
import { AppLayout } from "./components/layouts/AppLayout";
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
import { useThemeInitialization } from "./hooks/useThemeInitialization";

// Quiz imports
import DashboardQuizListPage from "./pages/dashboard/QuizList";
import DashboardCreateQuizPage from "./pages/dashboard/CreateQuiz";
import QuizViewerPage from "./pages/QuizViewer";

// Flashcard imports
import FlashcardListPage from "./pages/FlashcardList";
import CreateFlashcardPage from "./pages/CreateFlashcard";
import FlashcardViewerPage from "./pages/FlashcardViewer";

// Guide imports
import GuideListPage from "./pages/GuideList";
import CreateGuidePage from "./pages/CreateGuide";
import GuideViewerPage from "./pages/GuideViewer";
import GuideEditor from "./pages/GuideEditor";

// Courses import
import CoursesPage from "./pages/dashboard/Courses";

// LLM Test imports
import TestLLM from "./pages/TestLLM";
import TestPlate from "./pages/TestPlate";
import TestLexical from "./pages/TestLexical";
import Editor from "./editor";

// Public Content imports
import PublicContent from "./pages/PublicContent";

// Admin imports
import AdminLayout from "./components/layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminPaidUsers from "./pages/admin/AdminPaidUsers";
import AdminAdmins from "./pages/admin/AdminAdmins";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminTerms from "./pages/admin/AdminTerms";
import AdminPrivacy from "./pages/admin/AdminPrivacy";
import AdminCancellation from "./pages/admin/AdminCancellation";
import AdminRefund from "./pages/admin/AdminRefund";
import AdminBilling from "./pages/admin/AdminBilling";
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

// Redirect components for backward compatibility
const RedirectToFlashcard = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/flashcard/${slug}`} replace />;
};

const RedirectToGuide = () => {
  const { slug } = useParams<{ slug: string }>();
  return <Navigate to={`/guide/${slug}`} replace />;
};

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

const App = () => {
  useThemeInitialization();
  
  return (
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
                <Route path="/dashboard" element={<AppLayout mode="authenticated" />}>
                  <Route index element={<Dashboard />} />
                  <Route path="courses" element={<CoursesPage />} />
                  <Route path="generate-course" element={<GenerateCourse />} />
                  <Route path="pricing" element={<ProfilePricing />} />
                  <Route path="payment/:planId" element={<PaymentDetails />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="quizzes" element={<DashboardQuizListPage />} />
                  <Route path="create-quiz" element={<DashboardCreateQuizPage />} />
                  <Route path="flashcards" element={<FlashcardListPage />} />
                  <Route path="create-flashcard" element={<CreateFlashcardPage />} />
                  <Route path="guides" element={<GuideListPage />} />
                  <Route path="create-guide" element={<CreateGuidePage />} />
                  <Route path="test-llm" element={<TestLLM />} />
                  <Route path="test-plate" element={<TestPlate />} />
                  <Route path="test-lexical" element={<TestLexical />} />
                </Route>

                {/* Course Routes */}
                {/* ID-based redirect route (for backward compatibility) */}
                <Route path="/course/id/:id" element={<CourseIdRedirect />} />
                {/* Slug-based route (primary) - matches kebab-case slugs */}
                <Route path="/course/:slug" element={<CoursePage />} />
                <Route path="/course/:slug/certificate" element={<Certificate />} />
                <Route path="/course/:slug/quiz" element={<QuizPage />} />

                {/* Quiz Routes */}
                <Route path="/quiz/:slug" element={
                  <AppLayout mode="public">
                    <QuizViewerPage />
                  </AppLayout>
                } />
                <Route path="/quiz/id/:id" element={
                  <AppLayout mode="public">
                    <QuizViewerPage />
                  </AppLayout>
                } />

                {/* Flashcard Routes */}
                <Route path="/flashcard/:slug" element={
                  <AppLayout mode="public">
                    <FlashcardViewerPage />
                  </AppLayout>
                } />

                {/* Guide Routes */}
                <Route path="/guide/:slug" element={
                  <AppLayout mode="public">
                    <GuideViewerPage />
                  </AppLayout>
                } />
                <Route path="/guide/:slug/edit" element={
                  <AppLayout mode="authenticated">
                    <GuideEditor />
                  </AppLayout>
                } />

                {/* Backward Compatibility Redirects */}
                <Route path="/dashboard/flashcard/:slug" element={<RedirectToFlashcard />} />
                <Route path="/dashboard/guide/:slug" element={<RedirectToGuide />} />

                {/* Public Content Discovery */}
                <Route path="/discover" element={
                  <AppLayout mode="public">
                    <PublicContent />
                  </AppLayout>
                } />

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
                  <Route path="settings" element={<AdminSettings />} />
                  <Route path="contacts" element={<AdminContacts />} />
                  <Route path="terms" element={<AdminTerms />} />
                  <Route path="privacy" element={<AdminPrivacy />} />
                  <Route path="cancellation" element={<AdminCancellation />} />
                  <Route path="refund" element={<AdminRefund />} />
                  <Route path="subscription-billing" element={<AdminBilling />} />
                  <Route path="create-blog" element={<AdminCreateBlog />} />
                  <Route path="blogs" element={<AdminBlogs />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                {/* Editor Route */}
                <Route path="/editor" element={<Editor />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </HelmetProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </GoogleOAuthProvider>
  );
};

export default App;
