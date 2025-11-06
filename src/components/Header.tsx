
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { appName } from '@/constants';
import { User, LogOut } from 'lucide-react';
import Logo from '../res/logo.svg';
import axios from 'axios';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check authentication status
    const checkAuth = () => {
      const auth = sessionStorage.getItem('auth');
      const name = sessionStorage.getItem('mName');
      setIsAuthenticated(auth === 'true');
      setUserName(name || '');
    };

    checkAuth();
    
    // Listen for storage changes (when user logs in/out in another tab)
    window.addEventListener('storage', checkAuth);
    
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = async () => {
    try {
      // Call server logout endpoint to clear httpOnly cookie
      const serverURL = await import('../utils/config').then(m => m.detectServerURL());
      await axios.post(`${serverURL}/api/logout`, {}, { withCredentials: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Clear session storage
    sessionStorage.clear();
    setIsAuthenticated(false);
    setUserName('');
    navigate('/');
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out px-6 md:px-10 py-4",
        isScrolled ? "bg-glass border-b border-border/40" : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
            <img src={Logo} alt="Logo" className='h-6 w-6' />
          </div>
          <span className="font-display font-medium text-lg">{appName}</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">How It Works</a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
        </nav>

        {/* Call to Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">Hi, {userName}</span>
              </div>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-primary hover:bg-primary/90 transition-colors">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center space-x-2">
          <ThemeToggle />
          <button
            className="flex flex-col space-y-1.5"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className={cn(
              "block w-6 h-0.5 bg-foreground transition-transform duration-300",
              isMobileMenuOpen && "translate-y-2 rotate-45"
            )}></span>
            <span className={cn(
              "block w-6 h-0.5 bg-foreground transition-opacity duration-300",
              isMobileMenuOpen && "opacity-0"
            )}></span>
            <span className={cn(
              "block w-6 h-0.5 bg-foreground transition-transform duration-300",
              isMobileMenuOpen && "-translate-y-2 -rotate-45"
            )}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden fixed inset-x-0 bg-background border-b border-border/40 transition-all duration-300 ease-in-out",
        isMobileMenuOpen ? "top-[64px] opacity-100" : "-top-full opacity-0"
      )}>
        <div className="px-6 py-6 flex flex-col space-y-4">
          <a href="#features" className="text-base font-medium py-2">Features</a>
          <a href="#how-it-works" className="text-base font-medium py-2">How It Works</a>
          <a href="#pricing" className="text-base font-medium py-2">Pricing</a>
          <div className="flex flex-col space-y-2 pt-2">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-sm py-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">Hi, {userName}</span>
                </div>
                <Link to="/dashboard">
                  <Button variant="outline" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="w-full">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="w-full">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
