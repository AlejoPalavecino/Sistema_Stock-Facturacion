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
          className="block w-full pl-10 pr-3 py-2.5 text-base text-slate-900 border border-slate-300 rounded-lg bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );
};
