import React from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import Logo from '../components/Logo.tsx';
import { FacturacionIcon, StockIcon, ClientesIcon, ProveedoresIcon } from '../components/shared/Icons.tsx';

const Dashboard: React.FC = () => {
  const cardClasses = "group block p-6 sm:p-8 bg-white rounded-xl shadow-sm hover:shadow-xl focus:shadow-xl transition-all duration-300 ease-in-out border border-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";

  return (
    <main className="min-h-screen w-full bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="mb-8 sm:mb-12">
        <Logo />
      </div>
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Facturación Card */}
        <Router.Link to="/facturacion" aria-label="Ir a la sección de Facturación" className={cardClasses}>
          <div className="flex items-center mb-4">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <FacturacionIcon />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 ml-5">Facturación</h2>
          </div>
          <p className="text-base text-slate-700">Emite y gestiona comprobantes fiscales de forma rápida y segura.</p>
        </Router.Link>
        
        {/* Stock Card */}
        <Router.Link to="/stock" aria-label="Ir a la sección de Control de Stock" className={cardClasses}>
          <div className="flex items-center mb-4">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <StockIcon />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 ml-5">Control de Stock</h2>
          </div>
          <p className="text-base text-slate-700">Administra inventario, productos, y movimientos de mercadería.</p>
        </Router.Link>
        
        {/* Clientes Card */}
        <Router.Link to="/clientes" aria-label="Ir a la sección de Clientes" className={cardClasses}>
          <div className="flex items-center mb-4">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <ClientesIcon />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 ml-5">Clientes</h2>
          </div>
          <p className="text-base text-slate-700">Gestiona tu cartera de clientes, cuentas y datos de contacto.</p>
        </Router.Link>
        
        {/* Proveedores Card */}
        <Router.Link to="/proveedores" aria-label="Ir a la sección de Proveedores" className={cardClasses}>
          <div className="flex items-center mb-4">
            <div className="text-slate-500 group-hover:text-blue-600 transition-colors">
              <ProveedoresIcon />
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 ml-5">Proveedores</h2>
          </div>
          <p className="text-base text-slate-700">Administra proveedores, órdenes de compra y cuentas por pagar.</p>
        </Router.Link>
      </div>
    </main>
  );
};

export default Dashboard;
