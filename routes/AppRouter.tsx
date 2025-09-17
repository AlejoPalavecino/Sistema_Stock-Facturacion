import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { LoadingSpinner } from '../components/shared/LoadingSpinner';

// Lazy load all page components for code-splitting
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Stock = lazy(() => import('../pages/Stock'));
const Facturacion = lazy(() => import('../pages/Facturacion'));
const Clientes = lazy(() => import('../pages/Clientes'));
const Proveedores = lazy(() => import('../pages/Proveedores'));
const StockHistory = lazy(() => import('../pages/StockHistory'));
const ClientDetail = lazy(() => import('../pages/ClientDetail').then(module => ({ default: module.ClientDetail })));
const SupplierDetail = lazy(() => import('../pages/SupplierDetail').then(module => ({ default: module.SupplierDetail })));


const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/stock/history" element={<StockHistory />} />
          <Route path="/facturacion" element={<Facturacion />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:clientId" element={<ClientDetail />} />
          <Route path="/proveedores" element={<Proveedores />} />
          <Route path="/proveedores/:supplierId" element={<SupplierDetail />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
};

export default AppRouter;
