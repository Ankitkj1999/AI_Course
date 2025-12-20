import React, { useState } from 'react';

interface ColorPickerProps {
  onColorSelect: (color: string) => void;
  type: 'highlight' | 'text';
  currentColor?: string;
}

const PREDEFINED_COLORS = [
  // Highlight colors (background)
  '#ffeb3b', // Yellow
  '#4caf50', // Green
  '#2196f3', // Blue
  '#ff9800', // Orange
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#f44336', // Red
  '#00bcd4', // Cyan
  
  // Text colors
  '#000000', // Black
  '#424242', // Dark Gray
  '#757575', // Medium Gray
  '#bdbdbd', // Light Gray
  '#ffffff', // White
  '#3f51b5', // Indigo
  '#673ab7', // Deep Purple
  '#795548', // Brown
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ 
  onColorSelect, 
  type, 
  currentColor 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorClick = (color: string) => {
    onColorSelect(color);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="toolbar-item spaced flex items-center gap-1"
        aria-label={`${type === 'highlight' ? 'Text Highlight' : 'Text Color'}`}
      >
        <i className={`format ${type === 'highlight' ? 'highlighter' : 'text-color'}`} />
        {currentColor && (
          <div 
            className="w-4 h-4 rounded border border-gray-300"
            style={{ backgroundColor: currentColor }}
          />
        )}
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="grid grid-cols-4 gap-1 w-32">
            {PREDEFINED_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorClick(color)}
                className={`w-6 h-6 rounded border-2 hover:scale-110 transition-transform ${
                  currentColor === color ? 'border-blue-500' : 'border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          <button
            onClick={() => handleColorClick('')}
            className="mt-2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear {type === 'highlight' ? 'Highlight' : 'Color'}
          </button>
        </div>
      )}
      
      {/* Backdrop to close when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};