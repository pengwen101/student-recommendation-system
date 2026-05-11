import { useState, useRef, useEffect } from 'react';

// Generic interfaces for the dropdown data
export interface DropdownOption {
  id: string;
  label: string;
}

export interface DropdownGroup {
  groupId: string;
  groupLabel: string;
  options: DropdownOption[];
}

interface NestedDropdownProps {
  title: string; // e.g., "Faculty & Major"
  groups: DropdownGroup[];
  selectedValues: string[];
  onChange: (selectedIds: string[]) => void;
}

export function NestedDropdown({ title, groups, selectedValues, onChange }: NestedDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle Parent Group Checkbox Click
  const handleGroupToggle = (optionsInGroup: DropdownOption[]) => {
    const optionIds = optionsInGroup.map(opt => opt.id);
    const allSelected = optionIds.every(id => selectedValues.includes(id));

    if (allSelected) {
      // If all are selected, uncheck them all
      onChange(selectedValues.filter(id => !optionIds.includes(id)));
    } else {
      // Otherwise, select them all (using Set to prevent duplicates)
      const newSelection = new Set([...selectedValues, ...optionIds]);
      onChange(Array.from(newSelection));
    }
  };

  // Handle Individual Option Checkbox Click
  const handleOptionToggle = (optionId: string) => {
    if (selectedValues.includes(optionId)) {
      onChange(selectedValues.filter(id => id !== optionId));
    } else {
      onChange([...selectedValues, optionId]);
    }
  };

  return (
    <div className="relative flex-1 min-w-[200px]" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{title}</label>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[38px] px-3 bg-white border border-gray-300 rounded-md text-sm text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className="truncate text-gray-700">
          {selectedValues.length === 0 
            ? `Select ${title}...` 
            : `${selectedValues.length} Selected`}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-72 overflow-y-auto">
          {groups.length === 0 ? (
            <div className="p-3 text-sm text-gray-500 italic text-center">No options available</div>
          ) : (
            <div className="py-2">
              {groups.map((group) => {
                const optionIds = group.options.map(o => o.id);
                // Determine if all options in this group are currently selected
                const isGroupFullySelected = optionIds.length > 0 && optionIds.every(id => selectedValues.includes(id));
                // Determine indeterminate state (some but not all selected)
                const isGroupPartiallySelected = !isGroupFullySelected && optionIds.some(id => selectedValues.includes(id));

                return (
                  <div key={group.groupId} className="mb-2 last:mb-0">
                    {/* Parent Group Level Checkbox */}
                    <label className="flex items-center px-4 py-1.5 hover:bg-gray-50 cursor-pointer group transition-colors">
                      <input
                        type="checkbox"
                        checked={isGroupFullySelected}
                        ref={el => { if (el) el.indeterminate = isGroupPartiallySelected; }}
                        onChange={() => handleGroupToggle(group.options)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="ml-2 text-sm font-bold text-gray-800 group-hover:text-blue-700">
                        {group.groupLabel}
                      </span>
                    </label>

                    {/* Child Option Level Checkboxes */}
                    <div className="pl-8 pr-4">
                      {group.options.map((option) => (
                        <label key={option.id} className="flex items-center py-1.5 hover:bg-gray-50 cursor-pointer group transition-colors rounded">
                          <input
                            type="checkbox"
                            checked={selectedValues.includes(option.id)}
                            onChange={() => handleOptionToggle(option.id)}
                            className="w-3.5 h-3.5 text-blue-500 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="ml-2 text-sm text-gray-600 group-hover:text-blue-600">
                            {option.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}