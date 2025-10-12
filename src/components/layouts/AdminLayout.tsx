
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
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { serverURL } from '@/constants';
import axios from 'axios';
import Logo from '../../res/logo.svg';

const AdminLayout = () => {
  const isMobile = useIsMobile();
  const location = useLocation();

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  const navigate = useNavigate();
  function redirectHome() {
    navigate("/dashboard");
  }

  useEffect(() => {
    async function dashboardData() {
      const postURL = serverURL + `/api/dashboard`;
      const response = await axios.post(postURL);
      sessionStorage.setItem('adminEmail', response.data.admin.email);
      if (response.data.admin.email !== sessionStorage.getItem('email')) {
        redirectHome();
      }
    }
    if (sessionStorage.getItem('adminEmail')) {
      if (sessionStorage.getItem('adminEmail') !== sessionStorage.getItem('email')) {
        redirectHome();
      }
    } else {
      dashboardData();
    }
  });

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
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" isActive={isActive('/admin')}>
                  <Link to="/admin" className={cn(isActive('/admin') && "text-primary")}>
                    <LayoutDashboard />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Users" isActive={isActive('/admin/users')}>
                  <Link to="/admin/users" className={cn(isActive('/admin/users') && "text-primary")}>
                    <Users />
                    <span>Users</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Courses" isActive={isActive('/admin/courses')}>
                  <Link to="/admin/courses" className={cn(isActive('/admin/courses') && "text-primary")}>
                    <BookOpen />
                    <span>Courses</span>
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
                <SidebarMenuButton asChild tooltip="Admins" isActive={isActive('/admin/admins')}>
                  <Link to="/admin/admins" className={cn(isActive('/admin/admins') && "text-primary")}>
                    <UserCog />
                    <span>Admins</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Contacts" isActive={isActive('/admin/contacts')}>
                  <Link to="/admin/contacts" className={cn(isActive('/admin/contacts') && "text-primary")}>
                    <MessageSquare />
                    <span>Contacts</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Blogs" isActive={isActive('/admin/blogs')}>
                  <Link to="/admin/blogs" className={cn(isActive('/admin/blogs') && "text-primary")}>
                    <FileSliders />
                    <span>Manage Blogs</span>
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
                <SidebarMenuButton asChild tooltip="Terms" isActive={isActive('/admin/terms')}>
                  <Link to="/admin/terms" className={cn(isActive('/admin/terms') && "text-primary")}>
                    <FileText />
                    <span>Terms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Privacy" isActive={isActive('/admin/privacy')}>
                  <Link to="/admin/privacy" className={cn(isActive('/admin/privacy') && "text-primary")}>
                    <Shield />
                    <span>Privacy</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Cancellation" isActive={isActive('/admin/cancellation')}>
                  <Link to="/admin/cancellation" className={cn(isActive('/admin/cancellation') && "text-primary")}>
                    <X />
                    <span>Cancellation</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Refund" isActive={isActive('/admin/refund')}>
                  <Link to="/admin/refund" className={cn(isActive('/admin/refund') && "text-primary")}>
                    <ArrowLeft />
                    <span>Refund</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Subscription & Billing" isActive={isActive('/admin/subscription-billing')}>
                  <Link to="/admin/subscription-billing" className={cn(isActive('/admin/subscription-billing') && "text-primary")}>
                    <CreditCard />
                    <span>Subscription & Billing</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="border-t border-border/40">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Theme">
                  <div className="flex items-center space-x-2">
                    <ThemeToggle />
                    <span>Toggle Theme</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
          <SidebarRail />
        </Sidebar>

        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {isMobile && (
            <div className="flex items-center mb-6 bg-background/80 backdrop-blur-sm rounded-lg p-2 shadow-sm">
              <SidebarTrigger className="mr-2">
                <Menu className="h-6 w-6" />
              </SidebarTrigger>
              <h1 className="text-xl font-semibold">Admin Panel</h1>
              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
