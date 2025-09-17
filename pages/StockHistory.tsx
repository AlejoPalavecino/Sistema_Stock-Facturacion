
import React from 'react';
// FIX: Using namespace import for react-router-dom to avoid potential module resolution issues.
import * as rr from 'react-router-dom';
import { useStockHistory } from '../hooks/useStockHistory';
import { formatDateTime } from '../utils/format';
import { StockMovementType } from '../types/history';

// FIX: Add 'sale' to the map to cover all StockMovementType variants.
const MOVEMENT_TYPE_MAP: Record<StockMovementType, { label: string; color: string }> = {
    creation: { label: 'Creación', color: 'bg-blue-100 text-blue-800' },
    manual_adjustment: { label: 'Ajuste Manual', color: 'bg-indigo-100 text-indigo-800' },
    import: { label: 'Importación', color: 'bg-purple-100 text-purple-800' },
    deletion: { label: 'Eliminación', color: 'bg-red-100 text-red-800' },
    sale: { label: 'Venta', color: 'bg-green-100 text-green-800' },
};

const StockHistory: React.FC = () => {
    const { history, loading, error } = useStockHistory();

    const PageHeader = () => (
        <header className="mb-8">
            <rr.Link to="/stock" className="inline-block mb-2">
                <button className="flex items-center text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg px-3 py-2 hover:bg-slate-50 shadow-sm transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Control de Stock
                </button>
            </rr.Link>
            <h1 className="text-4xl font-bold text-slate-800">Historial de Movimientos de Stock</h1>
        </header>
    );

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader />
                <p>Cargando historial...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader />
                <p className="text-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader />
                
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-slate-200">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                            <tr>
                                <th scope="col" className="px-6 py-3">Fecha y Hora</th>
                                <th scope="col" className="px-6 py-3">Producto</th>
                                <th scope="col" className="px-6 py-3">Tipo de Movimiento</th>
                                <th scope="col" className="px-6 py-3 text-center">Cambio</th>
                                <th scope="col" className="px-6 py-3 text-center">Stock Resultante</th>
                                <th scope="col" className="px-6 py-3">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-slate-500">
                                        No hay movimientos registrados en el historial.
                                    </td>
                                </tr>
                            ) : (
                                history.map((movement) => (
                                    <tr key={movement.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDateTime(movement.timestamp)}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-slate-900">
                                            <div>{movement.productName}</div>
                                            <div className="font-mono text-xs text-slate-400">{movement.productSku}</div>
                                        </th>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MOVEMENT_TYPE_MAP[movement.type]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {MOVEMENT_TYPE_MAP[movement.type]?.label || movement.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-semibold ${movement.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {movement.change > 0 ? `+${movement.change}` : movement.change}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-slate-800">{movement.newStock}</td>
                                        <td className="px-6 py-4 text-xs text-slate-500">{movement.notes}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StockHistory;
