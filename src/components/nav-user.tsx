import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavUserProps {
  onLogout: () => void;
  userName?: string;
}

export function NavUser({ onLogout, userName }: NavUserProps) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ThemeToggle
          variant="outline"
          showLabel={true}
          className="w-full hover:bg-accent/50 transition-colors"
        />
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={onLogout}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut />
          <span>Logout</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
