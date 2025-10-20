import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThemeColor {
  name: string;
  value: string;
  preview: string;
}

const themeColors: ThemeColor[] = [
  { name: 'Blue', value: '211 100% 50%', preview: 'bg-blue-500' },
  { name: 'Purple', value: '262.1 83.3% 57.8%', preview: 'bg-purple-500' },
  { name: 'Green', value: '142.1 76.2% 36.3%', preview: 'bg-green-500' },
  { name: 'Orange', value: '24.6 95% 53.1%', preview: 'bg-orange-500' },
  { name: 'Teal', value: '173.4 80.4% 40%', preview: 'bg-teal-500' },
  { name: 'Pink', value: '330.4 81.2% 60.4%', preview: 'bg-pink-500' },
  { name: 'Dark Blue', value: '220 91% 25%', preview: 'bg-blue-900' },
  { name: 'Dark Grey', value: '220 9% 30%', preview: 'bg-gray-700' },
  { name: 'Jet Black', value: '0 0% 15%', preview: 'bg-gray-900' },
];

export function ThemeColorPicker() {
  const [selectedColor, setSelectedColor] = useState<string>('262.1 83.3% 57.8%'); // Default to purple

  useEffect(() => {
    // Load saved theme color from localStorage
    const savedColor = localStorage.getItem('theme-color');
    if (savedColor) {
      setSelectedColor(savedColor);
      applyThemeColor(savedColor);
    }
  }, []);

  const applyThemeColor = (colorValue: string) => {
    // Update CSS custom properties
    document.documentElement.style.setProperty('--primary', colorValue);
    
    // Save to localStorage
    localStorage.setItem('theme-color', colorValue);
  };

  const handleColorChange = (colorValue: string) => {
    setSelectedColor(colorValue);
    applyThemeColor(colorValue);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Theme Color</Label>
        <p className="text-sm text-muted-foreground">
          Choose your preferred accent color for the interface
        </p>
      </div>
      <div className="flex flex-wrap gap-2 max-w-xs">
        {themeColors.map((color) => (
          <Button
            key={color.name}
            variant="outline"
            size="sm"
            className={cn(
              "relative h-8 w-8 p-0 rounded-full border-2",
              selectedColor === color.value
                ? "border-foreground"
                : "border-muted-foreground/20"
            )}
            onClick={() => handleColorChange(color.value)}
            title={color.name}
          >
            <div
              className={cn("h-full w-full rounded-full", color.preview)}
            />
            {selectedColor === color.value && (
              <Check className="absolute inset-0 h-3 w-3 m-auto text-white" />
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}