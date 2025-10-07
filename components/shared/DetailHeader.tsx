import React from 'react';
import * as Router from 'react-router-dom';
import { BackIcon } from './Icons.tsx';

interface DetailHeaderProps {
  backTo: string;
  title: string;
  subtitle?: string;
  email?: string;
  children: React.ReactNode; // For the right-side content (e.g., debt)
}

export const DetailHeader: React.FC<DetailHeaderProps> = ({ backTo, title, subtitle, email, children }) => {
  return (
    <header className="mb-8">
      <Router.Link to={backTo} className="inline-block mb-4">
        <button className="btn btn-neutral text-base">
          <BackIcon className="h-4 w-4 mr-2" />
          Volver Atrás
        </button>
      </Router.Link>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-cream-200 flex flex-col md:flex-row justify-between items-start">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-text-dark tracking-tight">{title}</h1>
          {subtitle && <p className="text-base text-text-medium mt-1">{subtitle}</p>}
          {email && <p className="text-base text-text-medium">{email}</p>}
        </div>
        <div className="text-left md:text-right mt-4 md:mt-0">
          {children}
        </div>
      </div>
    </header>
  );
};