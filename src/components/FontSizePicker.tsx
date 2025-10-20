import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FontSize {
  name: string;
  value: string;
  class: string;
}

const fontSizes: FontSize[] = [
  { name: 'Small', value: '14px', class: 'text-sm' },
  { name: 'Medium', value: '16px', class: 'text-base' },
  { name: 'Large', value: '18px', class: 'text-lg' },
  { name: 'Extra Large', value: '20px', class: 'text-xl' },
];

export function FontSizePicker() {
  const [selectedSize, setSelectedSize] = useState<string>('16px'); // Default to Medium

  useEffect(() => {
    // Load saved font size from localStorage
    const savedSize = localStorage.getItem('font-size');
    if (savedSize) {
      setSelectedSize(savedSize);
      applyFontSize(savedSize);
    }
  }, []);

  const applyFontSize = (sizeValue: string) => {
    // Update CSS custom property for base font size
    document.documentElement.style.setProperty('--base-font-size', sizeValue);
    
    // Also update body font size directly
    document.body.style.fontSize = sizeValue;
    
    // Save to localStorage
    localStorage.setItem('font-size', sizeValue);
  };

  const handleSizeChange = (sizeValue: string) => {
    setSelectedSize(sizeValue);
    applyFontSize(sizeValue);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>Font Size</Label>
        <p className="text-sm text-muted-foreground">
          Adjust text size for better readability
        </p>
      </div>
      <div className="flex gap-2">
        {fontSizes.map((size) => (
          <Button
            key={size.name}
            variant={selectedSize === size.value ? "default" : "outline"}
            size="sm"
            className="min-w-[60px]"
            onClick={() => handleSizeChange(size.value)}
          >
            {selectedSize === size.value && (
              <Check className="h-3 w-3 mr-1" />
            )}
            {size.name}
          </Button>
        ))}
      </div>
    </div>
  );
}