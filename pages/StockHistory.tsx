import React from 'react';
import * as Router from 'react-router-dom';
import { useStockHistory } from '../hooks/useStockHistory.ts';
import { formatDateTime } from '../utils/format.ts';
import { StockMovementType } from '../types';
import { LoadingSpinner } from '../components/shared/LoadingSpinner.tsx';
import { PageHeader } from '../components/shared/PageHeader.tsx';

// FIX: Add 'sale' and 'purchase' to the map to cover all StockMovementType variants and use new pastel colors.
const MOVEMENT_TYPE_MAP: Record<StockMovementType, { label: string; color: string }> = {
    creation: { label: 'Creación', color: 'bg-pastel-blue-100 text-pastel-blue-700' },
    manual_adjustment: { label: 'Ajuste Manual', color: 'bg-indigo-100 text-indigo-800' },
    import: { label: 'Importación', color: 'bg-purple-100 text-purple-800' },
    deletion: { label: 'Eliminación', color: 'bg-pastel-red-100 text-pastel-red-700' },
    sale: { label: 'Venta', color: 'bg-pastel-green-100 text-pastel-green-700' },
    purchase: { label: 'Compra', color: 'bg-pastel-yellow-100 text-yellow-800' },
};

const StockHistory: React.FC = () => {
    const { history, loading, error } = useStockHistory();

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader title="Historial de Movimientos" backTo="/stock" />
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader title="Historial de Movimientos" backTo="/stock" />
                <p className="text-pastel-red-600">Error: {error}</p>
            </div>
        );
    }

    return (
        <div className="bg-cream-100 min-h-screen">
            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <PageHeader title="Historial de Movimientos de Stock" backTo="/stock" />
                
                <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-cream-200">
                    <table className="w-full text-base text-left">
                        <thead className="text-sm text-text-medium uppercase bg-cream-100 font-semibold tracking-wider border-b-2 border-cream-300">
                            <tr className="divide-x divide-cream-200">
                                <th scope="col" className="px-6 py-4">Fecha y Hora</th>
                                <th scope="col" className="px-6 py-4">Producto</th>
                                <th scope="col" className="px-6 py-4">Tipo de Movimiento</th>
                                <th scope="col" className="px-6 py-4 text-center">Cambio</th>
                                <th scope="col" className="px-6 py-4 text-center">Stock Resultante</th>
                                <th scope="col" className="px-6 py-4">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-cream-200">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-text-medium">
                                        No hay movimientos registrados en el historial.
                                    </td>
                                </tr>
                            ) : (
                                history.map((movement) => (
                                    <tr key={movement.id} className="divide-x divide-cream-200 hover:bg-cream-100 odd:bg-white even:bg-cream-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-text-medium">{formatDateTime(movement.timestamp)}</td>
                                        <th scope="row" className="px-6 py-4 font-medium text-text-dark">
                                            <div>{movement.productName}</div>
                                            <div className="font-mono text-xs text-text-light">{movement.productSku}</div>
                                        </th>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${MOVEMENT_TYPE_MAP[movement.type]?.color || 'bg-gray-100 text-gray-800'}`}>
                                                {MOVEMENT_TYPE_MAP[movement.type]?.label || movement.type}
                                            </span>
                                        </td>
                                        <td className={`px-6 py-4 text-center font-semibold ${movement.change > 0 ? 'text-pastel-green-700' : 'text-pastel-red-700'}`}>
                                            {movement.change > 0 ? `+${movement.change}` : movement.change}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-text-dark">{movement.newStock}</td>
                                        <td className="px-6 py-4 text-sm text-text-medium">{movement.notes}</td>
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