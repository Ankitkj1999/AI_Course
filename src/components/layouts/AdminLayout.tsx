
import React, { useEffect } from 'react';
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
import { useLocation, Link, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  DollarSign,
  UserCog,
  MessageSquare,
  FileText,
  Shield,
  X,
  ArrowLeft,
  CreditCard,
  LogOut,
  Menu,
  FileEdit,
  FileSliders,
  Settings,
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { serverURL } from '@/constants';
import axios from 'axios';
import Logo from '../../res/logo.svg';

const AdminLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  const navigate = useNavigate();
  function redirectHome() {
    navigate("/dashboard");
  }

  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
      redirectHome();
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background to-muted/20">
        <Sidebar className="border-r border-border/40">
          <SidebarHeader className="border-b border-border/40">
            <Link to="/admin" className="flex items-center space-x-2 px-4 py-3">
              <div className="h-8 w-8 rounded-md bg-primary from-primary flex items-center justify-center">
                <img src={Logo} alt="Logo" className='h-5 w-5' />
              </div>
              <span className="font-display text-lg font-bold">Admin Panel</span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {/* Main Dashboard */}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin Dashboard" isActive={isActive('/admin')}>
                      <Link to="/admin" className={cn(isActive('/admin') && "text-primary")}>
                        <LayoutDashboard />
                        <span>Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* User Management */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                  User Management
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="All Users" isActive={isActive('/admin/users')}>
                      <Link to="/admin/users" className={cn(isActive('/admin/users') && "text-primary")}>
                        <Users />
                        <span>All Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Paid Users" isActive={isActive('/admin/paid-users')}>
                      <Link to="/admin/paid-users" className={cn(isActive('/admin/paid-users') && "text-primary")}>
                        <DollarSign />
                        <span>Paid Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Admin Users" isActive={isActive('/admin/admins')}>
                      <Link to="/admin/admins" className={cn(isActive('/admin/admins') && "text-primary")}>
                        <UserCog />
                        <span>Admin Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Content Management */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                  Content Management
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Courses" isActive={isActive('/admin/courses')}>
                      <Link to="/admin/courses" className={cn(isActive('/admin/courses') && "text-primary")}>
                        <BookOpen />
                        <span>Courses</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Blog Posts" isActive={isActive('/admin/blogs')}>
                      <Link to="/admin/blogs" className={cn(isActive('/admin/blogs') && "text-primary")}>
                        <FileSliders />
                        <span>Blog Posts</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Create Blog" isActive={isActive('/admin/create-blog')}>
                      <Link to="/admin/create-blog" className={cn(isActive('/admin/create-blog') && "text-primary")}>
                        <FileEdit />
                        <span>Create Blog</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Contact Messages" isActive={isActive('/admin/contacts')}>
                      <Link to="/admin/contacts" className={cn(isActive('/admin/contacts') && "text-primary")}>
                        <MessageSquare />
                        <span>Contact Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Legal & Policies */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                  Legal & Policies
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Terms of Service" isActive={isActive('/admin/terms')}>
                      <Link to="/admin/terms" className={cn(isActive('/admin/terms') && "text-primary")}>
                        <FileText />
                        <span>Terms of Service</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Privacy Policy" isActive={isActive('/admin/privacy')}>
                      <Link to="/admin/privacy" className={cn(isActive('/admin/privacy') && "text-primary")}>
                        <Shield />
                        <span>Privacy Policy</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Cancellation Policy" isActive={isActive('/admin/cancellation')}>
                      <Link to="/admin/cancellation" className={cn(isActive('/admin/cancellation') && "text-primary")}>
                        <X />
                        <span>Cancellation Policy</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Refund Policy" isActive={isActive('/admin/refund')}>
                      <Link to="/admin/refund" className={cn(isActive('/admin/refund') && "text-primary")}>
                        <ArrowLeft />
                        <span>Refund Policy</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Billing Policy" isActive={isActive('/admin/subscription-billing')}>
                      <Link to="/admin/subscription-billing" className={cn(isActive('/admin/subscription-billing') && "text-primary")}>
                        <CreditCard />
                        <span>Billing Policy</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* System Configuration */}
            <SidebarGroup>
              <div className="px-3 py-2">
                <h4 className="text-xs font-semibold text-muted-foreground tracking-wider">
                  System
                </h4>
              </div>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="System Settings" isActive={isActive('/admin/settings')}>
                      <Link to="/admin/settings" className={cn(isActive('/admin/settings') && "text-primary")}>
                        <Settings />
                        <span>Settings</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40 p-4">
            <div className="space-y-2">
              {/* Back to Dashboard */}
              <Button
                onClick={redirectHome}
                variant="outline"
                size="sm"
                className="w-full justify-start hover:bg-accent/50 transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>

              {/* Theme Toggle */}
              <ThemeToggle
                variant="outline"
                showLabel={true}
                className="w-full hover:bg-accent/50 transition-colors"
              />

              {/* Logout */}
              <Button
                onClick={() => {
                  sessionStorage.clear();
                  localStorage.removeItem('token');
                  navigate('/login');
                }}
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
              <h1 className="text-xl font-semibold flex-1">Admin Panel</h1>
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

export default AdminLayout;
