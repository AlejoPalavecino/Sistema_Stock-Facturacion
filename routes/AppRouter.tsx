
import React, { Suspense, lazy } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

// Lazy load all page components for code-splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Stock = lazy(() => import('@/pages/Stock'));
const Facturacion = lazy(() => import('@/pages/Facturacion'));
const Clientes = lazy(() => import('@/pages/Clientes'));
const Proveedores = lazy(() => import('@/pages/Proveedores'));
const StockHistory = lazy(() => import('@/pages/StockHistory'));
const ClientDetail = lazy(() => import('@/pages/ClientDetail').then(module => ({ default: module.ClientDetail })));
const SupplierDetail = lazy(() => import('@/pages/SupplierDetail').then(module => ({ default: module.SupplierDetail })));


const AppRouter: React.FC = () => {
  return (
    <Router.HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Router.Routes>
          <Router.Route path="/" element={<Dashboard />} />
          <Router.Route path="/stock" element={<Stock />} />
          <Router.Route path="/stock/history" element={<StockHistory />} />
          <Router.Route path="/facturacion" element={<Facturacion />} />
          <Router.Route path="/clientes" element={<Clientes />} />
          <Router.Route path="/clientes/:clientId" element={<ClientDetail />} />
          <Router.Route path="/proveedores" element={<Proveedores />} />
          <Router.Route path="/proveedores/:supplierId" element={<SupplierDetail />} />
        </Router.Routes>
      </Suspense>
    </Router.HashRouter>
  );
};

export default AppRouter;
