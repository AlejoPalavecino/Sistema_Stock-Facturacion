import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
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
    <HashRouter>
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
    </HashRouter>
  );
};

export default AppRouter;