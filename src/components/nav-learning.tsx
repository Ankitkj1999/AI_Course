import { Link, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface NavLearningItem {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavLearningProps {
  items: NavLearningItem[];
}

export function NavLearning({ items }: NavLearningProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Learning Content</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link to={item.url} className={cn(isActive && 'text-primary')}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
