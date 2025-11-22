// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuthState } from '@/hooks/useAuthState';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Home, User, Sparkles, BookOpen, PanelLeftOpen } from 'lucide-react';
import { appName, websiteURL } from '@/constants';
import { useEffect } from 'react';

interface AppLayoutProps {
  mode?: 'authenticated' | 'public';
  showQuickCreate?: boolean;
  showAccountSection?: boolean;
  showLearningContent?: boolean;
  children?: React.ReactNode;
}

export const AppLayout = ({
  mode = 'authenticated',
  showQuickCreate = true,
  showAccountSection = true,
  showLearningContent = true,
  children,
}: AppLayoutProps) => {
  const { isAuthenticated, isAdmin, userId } = useAuthState();
  const isMobile = useIsMobile();
  const location = useLocation();

  // Handle authentication redirect for authenticated mode
  useEffect(() => {
    if (mode === 'authenticated' && !isAuthenticated) {
      // Use navigate instead of window.location to avoid full page reload
      window.location.href = websiteURL + '/login';
    }
  }, [mode, isAuthenticated]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-muted/30">
        <AppSidebar
          isAuthenticated={isAuthenticated}
          mode={mode}
          showQuickCreate={showQuickCreate}
          showAccountSection={showAccountSection}
          showLearningContent={showLearningContent}
          isAdmin={isAdmin}
          currentPath={location.pathname}
        />

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
          {isMobile && (
            <div className="flex items-center justify-between mb-6 py-2">
              <SidebarTrigger>
                <PanelLeftOpen className="h-6 w-6" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                {appName}
              </h1>
              <ThemeToggle variant="ghost" size="sm" />
            </div>
          )}
          {children || <Outlet />}
        </main>

        {/* Mobile Bottom Navigation - Only for authenticated users */}
        {isMobile && isAuthenticated && (
          <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 flex justify-around items-center">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Link to="/dashboard">
                <Home className="h-5 w-5" />
                <span className="text-xs">Home</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Link to="/dashboard/courses">
                <BookOpen className="h-5 w-5" />
                <span className="text-xs">Courses</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Link to="/dashboard/generate-course">
                <Sparkles className="h-5 w-5" />
                <span className="text-xs">Create</span>
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex flex-col items-center gap-1 h-auto py-2"
            >
              <Link to="/dashboard/profile">
                <User className="h-5 w-5" />
                <span className="text-xs">Profile</span>
              </Link>
            </Button>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
};
