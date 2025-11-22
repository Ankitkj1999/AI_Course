// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Link } from 'react-router-dom';
import {
  Home,
  User,
  DollarSign,
  Settings2Icon,
  Brain,
  CreditCard,
  Layers,
  BookOpen,
  Compass,
  Sparkles,
  FileText,
  TestTube,
} from 'lucide-react';
import { appName } from '@/constants';
import Logo from '../../res/logo.svg';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { NavMain } from '@/components/nav-main';
import { NavLearning } from '@/components/nav-learning';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { NavQuickCreate } from '@/components/nav-quick-create';
import { NavDevTools } from '@/components/nav-dev-tools';

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
  showLearningContent,
  showQuickCreate,
  isAdmin,
}: AppSidebarProps) => {
  const { toast } = useToast();


  // Navigation data structure
  const navMain = isAuthenticated
    ? [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: Home,
        },
        {
          title: 'Discover',
          url: '/discover',
          icon: Compass,
        },
      ]
    : [
        {
          title: 'Home',
          url: '/',
          icon: Home,
        },
        {
          title: 'Discover',
          url: '/discover',
          icon: Compass,
        },
      ];

  const navLearning = [
    {
      title: 'My Courses',
      url: '/dashboard/courses',
      icon: BookOpen,
    },
    {
      title: 'My Quizzes',
      url: '/dashboard/quizzes',
      icon: Brain,
    },
    {
      title: 'My Flashcards',
      url: '/dashboard/flashcards',
      icon: CreditCard,
    },
    {
      title: 'My Guides',
      url: '/dashboard/guides',
      icon: Layers,
    },
  ];

  const navQuickCreate = [
    {
      title: 'Generate Course',
      url: '/dashboard/generate-course',
      icon: Sparkles,
    },
    {
      title: 'Create Quiz',
      url: '/dashboard/create-quiz',
      icon: Brain,
    },
    {
      title: 'Create Flashcards',
      url: '/dashboard/create-flashcard',
      icon: CreditCard,
    },
    {
      title: 'Create Guide',
      url: '/dashboard/create-guide',
      icon: FileText,
    },
  ];

  const navDevTools = [
    {
      title: 'Test LLM',
      url: '/dashboard/test-llm',
      icon: TestTube,
    },
  ];

  const navSecondary = [
    {
      title: 'Profile',
      url: '/dashboard/profile',
      icon: User,
    },
    {
      title: 'Pricing',
      url: '/dashboard/pricing',
      icon: DollarSign,
    },
    ...(isAdmin
      ? [
          {
            title: 'Admin Panel',
            url: '/admin',
            icon: Settings2Icon,
          },
        ]
      : []),
  ];

  async function Logout() {
    try {
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
    const websiteURL = await import('@/constants').then((m) => m.websiteURL);
    window.location.href = websiteURL + '/login';
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-border/40">
      <SidebarHeader className="border-b border-border/40">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link to={isAuthenticated ? '/dashboard' : '/'}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                  <img src={Logo} alt="Logo" className="size-5 invert dark:invert-0" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{appName}</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
        {showLearningContent && isAuthenticated && <NavLearning items={navLearning} />}
        {showQuickCreate && isAuthenticated && <NavQuickCreate items={navQuickCreate} />}
        {process.env.NODE_ENV === 'development' && isAuthenticated && <NavDevTools items={navDevTools} />}
        {isAuthenticated && <NavSecondary items={navSecondary} className="mt-auto" />}
      </SidebarContent>

      {isAuthenticated && (
        <SidebarFooter className="border-t border-border/40">
          <NavUser 
            onLogout={Logout} 
            userName={localStorage.getItem('mName') || 'User'} 
            userEmail={localStorage.getItem('email') || ''}
            userAvatar={localStorage.getItem('photo') || ''}
          />
        </SidebarFooter>
      )}
      <SidebarRail />
    </Sidebar>
  );
};
