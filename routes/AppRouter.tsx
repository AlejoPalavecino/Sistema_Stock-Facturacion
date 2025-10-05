
import React, { Suspense, lazy } from 'react';
// FIX: Changed react-router-dom import to use namespace import to fix module resolution issues.
import * as Router from 'react-router-dom';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';

// Lazy load all page components for code-splitting
const Dashboard = lazy(() => import('../pages/Dashboard.tsx'));
const Stock = lazy(() => import('../pages/Stock.tsx'));
const Facturacion = lazy(() => import('../pages/Facturacion.tsx'));
const Clientes = lazy(() => import('../pages/Clientes.tsx'));
const Proveedores = lazy(() => import('../pages/Proveedores.tsx'));
const StockHistory = lazy(() => import('../pages/StockHistory.tsx'));
const ClientDetail = lazy(() => import('../pages/ClientDetail.tsx').then(module => ({ default: module.ClientDetail })));
const SupplierDetail = lazy(() => import('../pages/SupplierDetail.tsx').then(module => ({ default: module.SupplierDetail })));

// Centralized route configuration for easier management and scalability
const routeConfig = [
  { path: '/', component: Dashboard },
  { path: '/stock', component: Stock },
  { path: '/stock/history', component: StockHistory },
  { path: '/facturacion', component: Facturacion },
  { path: '/clientes', component: Clientes },
  { path: '/clientes/:clientId', component: ClientDetail },
  { path: '/proveedores', component: Proveedores },
  { path: '/proveedores/:supplierId', component: SupplierDetail },
];

const AppRouter: React.FC = () => {
  return (
    <Router.HashRouter>
      <Suspense fallback={<LoadingSpinner />}>
        <Router.Routes>
          {routeConfig.map(({ path, component: Component }) => (
            <Router.Route key={path} path={path} element={<Component />} />
          ))}
        </Router.Routes>
      </Suspense>
    </Router.HashRouter>
  );
};

export default AppRouter;
