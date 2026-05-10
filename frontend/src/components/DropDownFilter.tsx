import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button'; 

export interface FilterOption {
  label: string;
  value: string;
}

interface DropdownFilterProps {
  title?: string;
  options: FilterOption[]; // <-- Changed to use the new object structure
  selectedValues: string[];
  onChange: (newSelection: string[]) => void;
  multiSelect?: boolean;
}

export function DropdownFilter({ 
  title, 
  options, 
  selectedValues, 
  onChange, 
  multiSelect = true 
}: DropdownFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = (targetValue: string) => {
    if (!multiSelect) {
      // Single select
      onChange(selectedValues.includes(targetValue) ? [] : [targetValue]);
      setIsOpen(false); 
      return;
    }

    // Multi select
    if (selectedValues.includes(targetValue)) {
      onChange(selectedValues.filter((v) => v !== targetValue));
    } else {
      onChange([...selectedValues, targetValue]);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return `Select ${title ? title.toLowerCase() : 'options'}...`;
    if (selectedValues.length === 1) {
      // Find the label matching the selected value
      const selectedOption = options.find(o => o.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    }
    return `${selectedValues.length} selected`;
  };

  return (
    // Added min-w-[160px] to stop the button from resizing awkwardly when text changes
    <div className="flex flex-col gap-1.5 min-w-[160px] flex-1" ref={dropdownRef}>
      {title && <span className="text-sm font-semibold text-gray-700">{title}</span>}
      
      <div className="relative">
        <Button 
          variant="outline" 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full justify-between font-normal text-left"
          type="button"
        >
          <span className="truncate mr-2">{getDisplayText()}</span>
          <svg 
            className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
            <div className="p-1">
              {options.map((option) => {
                const isSelected = selectedValues.includes(option.value); // <-- Checks against value now
                
                return (
                  <label 
                    key={option.value} 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 cursor-pointer rounded-sm hover:bg-gray-100 transition-colors"
                  >
                    <input
                      type={multiSelect ? "checkbox" : "radio"}
                      checked={isSelected}
                      onChange={() => handleToggle(option.value)} // <-- Passes value, not label
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2.5 cursor-pointer"
                    />
                    <span className="truncate">{option.label}</span>
                  </label>
                );
              })}
              {options.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-500 italic">
                  No options available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}