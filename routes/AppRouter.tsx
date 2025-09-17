import React from 'react';
// FIX: Using namespace import for react-router-dom to avoid potential module resolution issues.
import * as rr from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Stock from '../pages/Stock';
import Facturacion from '../pages/Facturacion';
import Clientes from '../pages/Clientes';
import Proveedores from '../pages/Proveedores';
import StockHistory from '../pages/StockHistory';
import { ClientDetail } from '../pages/ClientDetail';
import { SupplierDetail } from '../pages/SupplierDetail';

const AppRouter: React.FC = () => {
  return (
    <rr.HashRouter>
      <rr.Routes>
        <rr.Route path="/" element={<Dashboard />} />
        <rr.Route path="/stock" element={<Stock />} />
        <rr.Route path="/stock/history" element={<StockHistory />} />
        <rr.Route path="/facturacion" element={<Facturacion />} />
        <rr.Route path="/clientes" element={<Clientes />} />
        <rr.Route path="/clientes/:clientId" element={<ClientDetail />} />
        <rr.Route path="/proveedores" element={<Proveedores />} />
        <rr.Route path="/proveedores/:supplierId" element={<SupplierDetail />} />
      </rr.Routes>
    </rr.HashRouter>
  );
};

export default AppRouter;
