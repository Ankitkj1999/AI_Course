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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NavQuickCreateItem {
  title: string;
  url: string;
  icon: LucideIcon;
  tooltip?: string;
}

interface NavQuickCreateProps {
  items: NavQuickCreateItem[];
}

export function NavQuickCreate({ items }: NavQuickCreateProps) {
  const location = useLocation();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Quick Create</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive = location.pathname === item.url;
            const menuButton = (
              <SidebarMenuButton asChild isActive={isActive}>
                <Link to={item.url} className={cn(isActive && 'text-primary')}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={item.title}>
                {item.tooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {menuButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p>{item.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  menuButton
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
