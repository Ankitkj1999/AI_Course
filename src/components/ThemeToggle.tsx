
import { Button } from "@/components/ui/button";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showLabel?: boolean;
}

export function ThemeToggle({ 
  className, 
  variant = "ghost", 
  size = "icon",
  showLabel = false 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <Button
      variant={variant}
      size={showLabel ? "sm" : size}
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-200 hover:scale-105",
        showLabel && "justify-start",
        className
      )}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <Moon className={cn("h-4 w-4", showLabel && "mr-2")} />
      ) : (
        <Sun className={cn("h-4 w-4", showLabel && "mr-2")} />
      )}
      {showLabel && (
        <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
