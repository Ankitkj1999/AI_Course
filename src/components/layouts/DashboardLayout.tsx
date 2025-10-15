// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import {
  SidebarProvider,
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
  SidebarTrigger
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, User, DollarSign, LogOut, Sparkles, Menu, Settings2Icon, Brain, List, Plus, CreditCard, Layers, BookOpen, FileText, Moon, Sun } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { appName, serverURL, websiteURL } from '@/constants';
import Logo from '../../res/logo.svg';
import { DownloadIcon } from '@radix-ui/react-icons';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const DashboardLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [installPrompt, setInstallPrompt] = useState(null);
  const { toast } = useToast();
  const { theme, toggleTheme } = useTheme();
  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('uid') === null) {
      window.location.href = websiteURL + '/login';
    }
    async function dashboardData() {
      const postURL = serverURL + `/api/dashboard`;
      const response = await axios.post(postURL);
      sessionStorage.setItem('adminEmail', response.data.admin.email);
      if (response.data.admin.email === sessionStorage.getItem('email')) {
        setAdmin(true);
      }
    }
    if (sessionStorage.getItem('adminEmail')) {
      if (sessionStorage.getItem('adminEmail') === sessionStorage.getItem('email')) {
        setAdmin(true);
      }
    } else {
      dashboardData();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    });
  }, []);

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

  function Logout() {
    sessionStorage.clear();
    toast({
      title: "Logged Out",
      description: "You have logged out successfully",
    });
    window.location.href = websiteURL + '/login';
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-muted/30">
        <Sidebar className="border-r border-border/40">
          <SidebarHeader className="border-b border-border/40">
            <Link to="/dashboard" className="flex items-center space-x-2 px-4 py-3">
              <div className="h-8 w-8 rounded-md bg-primary from-primary flex items-center justify-center">
                <img src={Logo} alt="Logo" className='h-6 w-6' />
              </div>
              <span className="font-display text-lg font-bold bg-primary text-gradient">{appName}</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Navigation */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Dashboard Home" isActive={isActive('/dashboard')}>
                      <Link to="/dashboard" className={cn(isActive('/dashboard') && "text-primary")}>
                        <Home />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Generate Course" isActive={isActive('/dashboard/generate-course')}>
                      <Link to="/dashboard/generate-course" className={cn(isActive('/dashboard/generate-course') && "text-primary")}>
                        <Sparkles />
                        <span>Generate Course</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Learning Content */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Learning Content
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Quizzes" isActive={isActive('/dashboard/quizzes')}>
                      <Link to="/dashboard/quizzes" className={cn(isActive('/dashboard/quizzes') && "text-primary")}>
                        <Brain />
                        <span>My Quizzes</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Flashcards" isActive={isActive('/dashboard/flashcards')}>
                      <Link to="/dashboard/flashcards" className={cn(isActive('/dashboard/flashcards') && "text-primary")}>
                        <CreditCard />
                        <span>My Flashcards</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="My Guides" isActive={isActive('/dashboard/guides')}>
                      <Link to="/dashboard/guides" className={cn(isActive('/dashboard/guides') && "text-primary")}>
                        <BookOpen />
                        <span>My Guides</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Quick Create Actions */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Create
                </h4>
              </div>
              <SidebarGroupContent>
                <div className="px-2 space-y-2">
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
                      <Layers className="mr-2 h-4 w-4" />
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

            {/* Account & Settings */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Account
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Profile Settings" isActive={isActive('/dashboard/profile')}>
                      <Link to="/dashboard/profile" className={cn(isActive('/dashboard/profile') && "text-primary")}>
                        <User />
                        <span>Profile</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Pricing Plans" isActive={isActive('/dashboard/pricing')}>
                      <Link to="/dashboard/pricing" className={cn(isActive('/dashboard/pricing') && "text-primary")}>
                        <DollarSign />
                        <span>Pricing</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  {admin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Admin Panel" isActive={isActive('/admin')}>
                        <Link to="/admin" className={cn(isActive('/admin') && "text-primary")}>
                          <Settings2Icon />
                          <span>Admin Panel</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
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
                  Install Desktop App
                </Button>
              )}

              {/* Theme Toggle Button */}
              <ThemeToggle
                variant="outline"
                showLabel={true}
                className="w-full hover:bg-accent/50 transition-colors"
              />

              {/* Logout Button */}
              <Button
                onClick={Logout}
                variant="outline"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {isMobile && (
            <div className="flex items-center mb-6 bg-background/80 backdrop-blur-sm rounded-lg p-3 shadow-sm">
              <SidebarTrigger className="mr-3">
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-primary to-indigo-500 text-gradient flex-1">{appName}</h1>
              <ThemeToggle
                variant="ghost"
                size="sm"
                className="ml-2 hover:bg-accent/50"
              />
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
