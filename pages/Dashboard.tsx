
import React from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import Logo from '@/components/Logo';

// SVG Icons for the cards
const FacturacionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V7a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const StockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const ClientesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ProveedoresIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
);


const Dashboard: React.FC = () => {
  const cardClasses = "group block p-8 bg-white rounded-xl shadow-sm hover:shadow-xl focus:shadow-xl transition-all duration-300 ease-in-out border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  return (
    <main className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="mb-12">
        <Logo />
      </div>
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Facturación Card */}
        <Router.Link to="/facturacion" aria-label="Ir a la sección de Facturación" className={cardClasses}>
          <div className="flex items-center mb-3">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <FacturacionIcon />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 ml-4">Facturación</h2>
          </div>
          <p className="text-slate-600">Emite y gestiona comprobantes fiscales de forma rápida y segura.</p>
        </Router.Link>
        
        {/* Stock Card */}
        <Router.Link to="/stock" aria-label="Ir a la sección de Control de Stock" className={cardClasses}>
          <div className="flex items-center mb-3">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <StockIcon />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 ml-4">Control de Stock</h2>
          </div>
          <p className="text-slate-600">Administra inventario, productos, y movimientos de mercadería.</p>
        </Router.Link>
        
        {/* Clientes Card */}
        <Router.Link to="/clientes" aria-label="Ir a la sección de Clientes" className={cardClasses}>
          <div className="flex items-center mb-3">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <ClientesIcon />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 ml-4">Clientes</h2>
          </div>
          <p className="text-slate-600">Gestiona tu cartera de clientes, cuentas y datos de contacto.</p>
        </Router.Link>
        
        {/* Proveedores Card */}
        <Router.Link to="/proveedores" aria-label="Ir a la sección de Proveedores" className={cardClasses}>
          <div className="flex items-center mb-3">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <ProveedoresIcon />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 ml-4">Proveedores</h2>
          </div>
          <p className="text-slate-600">Administra proveedores, órdenes de compra y cuentas por pagar.</p>
        </Router.Link>
      </div>
    </main>
  );
};

export default Dashboard;