// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  User,
  DollarSign,
  LogOut,
  Sparkles,
  Settings2Icon,
  Brain,
  CreditCard,
  Layers,
  BookOpen,
  FileText,
  TestTube,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { appName, websiteURL } from '@/constants';
import Logo from '../../res/logo.svg';
import { DownloadIcon } from '@radix-ui/react-icons';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface AppSidebarProps {
  isAuthenticated: boolean;
  mode: 'authenticated' | 'public';
  showQuickCreate: boolean;
  showAccountSection: boolean;
  showLearningContent: boolean;
  isAdmin: boolean;
  currentPath: string;
}

export const AppSidebar = ({
  isAuthenticated,
  mode,
  showQuickCreate,
  showAccountSection,
  showLearningContent,
  isAdmin,
  currentPath,
}: AppSidebarProps) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const { toast } = useToast();

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choice) => {
      if (choice.outcome === 'accepted') {
        console.log('User accepted install');
      }
      setInstallPrompt(null);
    });
  };

  async function Logout() {
    try {
      // Call server logout endpoint to clear httpOnly cookie
      const serverURL = await import('../../utils/config').then((m) => m.detectServerURL());
      await axios.post(`${serverURL}/api/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }

    localStorage.clear();
    toast({
      title: 'Logged Out',
      description: 'You have logged out successfully',
    });
    window.location.href = websiteURL + '/login';
  }

  return (
    <Sidebar className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40">
        <Link
          to={isAuthenticated ? '/dashboard' : '/'}
          className="flex items-center space-x-2 px-4 py-3"
        >
          <div className="h-8 w-8 rounded-md bg-primary from-primary flex items-center justify-center">
            <img src={Logo} alt="Logo" className="h-6 w-6" />
          </div>
          <span className="font-display text-lg font-bold bg-primary text-gradient">
            {appName}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {isAuthenticated ? (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Dashboard Home"
                    isActive={isActive('/dashboard')}
                  >
                    <Link
                      to="/dashboard"
                      className={cn(isActive('/dashboard') && 'text-primary')}
                    >
                      <Home />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Home" isActive={isActive('/')}>
                    <Link to="/" className={cn(isActive('/') && 'text-primary')}>
                      <Home />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Learning Content - Only for authenticated users */}
        {showLearningContent && isAuthenticated && (
          <SidebarGroup>
            <div className="px-3 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                Learning Content
              </h4>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="My Courses"
                    isActive={isActive('/dashboard/courses')}
                  >
                    <Link
                      to="/dashboard/courses"
                      className={cn(isActive('/dashboard/courses') && 'text-primary')}
                    >
                      <BookOpen />
                      <span>My Courses</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="My Quizzes"
                    isActive={isActive('/dashboard/quizzes')}
                  >
                    <Link
                      to="/dashboard/quizzes"
                      className={cn(isActive('/dashboard/quizzes') && 'text-primary')}
                    >
                      <Brain />
                      <span>My Quizzes</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="My Flashcards"
                    isActive={isActive('/dashboard/flashcards')}
                  >
                    <Link
                      to="/dashboard/flashcards"
                      className={cn(isActive('/dashboard/flashcards') && 'text-primary')}
                    >
                      <CreditCard />
                      <span>My Flashcards</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="My Guides"
                    isActive={isActive('/dashboard/guides')}
                  >
                    <Link
                      to="/dashboard/guides"
                      className={cn(isActive('/dashboard/guides') && 'text-primary')}
                    >
                      <Layers />
                      <span>My Guides</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quick Create Actions - Only for authenticated users */}
        {showQuickCreate && isAuthenticated && (
          <SidebarGroup>
            <div className="px-3 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                Quick Create
              </h4>
            </div>
            <SidebarGroupContent>
              <div className="px-2 space-y-2">
                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-indigo-500 hover:to-blue-500 shadow-md transition-all"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard/generate-course">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Course
                  </Link>
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-pink-500 hover:to-purple-500 shadow-md transition-all"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard/create-quiz">
                    <Brain className="mr-2 h-4 w-4" />
                    Create Quiz
                  </Link>
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-teal-500 hover:to-emerald-500 shadow-md transition-all"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard/create-flashcard">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Create Flashcards
                  </Link>
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-red-500 hover:to-orange-500 shadow-md transition-all"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard/create-guide">
                    <FileText className="mr-2 h-4 w-4" />
                    Create Guide
                  </Link>
                </Button>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Development Tools (only show in development) */}
        {process.env.NODE_ENV === 'development' && isAuthenticated && (
          <SidebarGroup>
            <div className="px-3 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                Development
              </h4>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="LLM Test Screen"
                    isActive={isActive('/dashboard/test-llm')}
                  >
                    <Link
                      to="/dashboard/test-llm"
                      className={cn(isActive('/dashboard/test-llm') && 'text-primary')}
                    >
                      <TestTube />
                      <span>Test LLM</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Account & Settings - Only for authenticated users */}
        {showAccountSection && isAuthenticated && (
          <SidebarGroup>
            <div className="px-3 py-2">
              <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                Account
              </h4>
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Profile Settings"
                    isActive={isActive('/dashboard/profile')}
                  >
                    <Link
                      to="/dashboard/profile"
                      className={cn(isActive('/dashboard/profile') && 'text-primary')}
                    >
                      <User />
                      <span>Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Pricing Plans"
                    isActive={isActive('/dashboard/pricing')}
                  >
                    <Link
                      to="/dashboard/pricing"
                      className={cn(isActive('/dashboard/pricing') && 'text-primary')}
                    >
                      <DollarSign />
                      <span>Pricing</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip="Admin Panel"
                      isActive={isActive('/admin')}
                    >
                      <Link
                        to="/admin"
                        className={cn(isActive('/admin') && 'text-primary')}
                      >
                        <Settings2Icon />
                        <span>Admin Panel</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        <div className="space-y-2">
          {/* Install App Button */}
          {installPrompt && (
            <Button
              onClick={handleInstallClick}
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              {isMobile ? 'Install Mobile App' : 'Install Desktop App'}
            </Button>
          )}

          {/* Theme Toggle Button */}
          <ThemeToggle
            variant="outline"
            showLabel={true}
            className="w-full hover:bg-accent/50 transition-colors"
          />

          {/* Auth Buttons */}
          {isAuthenticated ? (
            <Button
              onClick={Logout}
              variant="outline"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                variant="default"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link to="/signup">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                asChild
              >
                <Link to="/login">
                  <LogIn className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};
