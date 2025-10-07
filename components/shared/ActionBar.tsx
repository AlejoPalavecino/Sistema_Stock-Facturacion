import React from 'react';
import { SearchIcon } from './Icons';

interface ActionBarProps {
  children: React.ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder: string;
}

export const ActionBar: React.FC<ActionBarProps> = ({ 
  children, 
  searchQuery, 
  onSearchChange, 
  searchPlaceholder 
}) => {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {children}
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input w-full md:w-80"
        />
      </div>
    </div>
  );
};