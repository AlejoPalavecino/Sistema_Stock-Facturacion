import React from 'react';
import * as Router from 'react-router-dom';
import { BackIcon } from './Icons.tsx';

interface PageHeaderProps {
  title: string;
  backTo: string;
  children?: React.ReactNode; // For action buttons
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backTo, children }) => {
  return (
    <header className="mb-8">
      <Router.Link to={backTo} className="inline-block mb-2">
        <button className="flex items-center text-base font-semibold text-white bg-slate-600 rounded-lg px-4 py-2 hover:bg-slate-700 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2">
          <BackIcon className="h-4 w-4 mr-2" />
          Volver Atrás
        </button>
      </Router.Link>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mt-2">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">{title}</h1>
        {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
      </div>
    </header>
  );
};