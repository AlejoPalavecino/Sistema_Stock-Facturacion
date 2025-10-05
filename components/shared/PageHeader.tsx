import React from 'react';
import * as Router from 'react-router-dom';
import { BackIcon } from './Icons.tsx';

interface PageHeaderProps {
  title: string;
  backTo: string;
  backToText: string;
  children?: React.ReactNode; // For action buttons
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backTo, backToText, children }) => {
  return (
    <header className="mb-8">
      <Router.Link to={backTo} className="inline-block mb-2">
        <button className="flex items-center text-base font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-4 py-2 hover:bg-slate-50 shadow-sm transition-all">
          <BackIcon className="h-4 w-4 mr-2" />
          {backToText}
        </button>
      </Router.Link>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-2">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  );
};
