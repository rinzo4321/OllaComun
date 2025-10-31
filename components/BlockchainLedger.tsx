import React from 'react';
import Card from './shared/Card';
import { Transaction } from '../types';
import { Blocks, Calendar, Package, ArrowRight, Hash } from 'lucide-react';

interface BlockchainLedgerProps {
    transactions: Transaction[];
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({ transactions }) => {
    return (
        <Card padding="md">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
                    <Blocks className="text-white" size={28} strokeWidth={2.5} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Ledger Blockchain</h2>
                    <p className="text-sm text-gray-600">Trazabilidad de Insumos</p>
                </div>
            </div>
            <p className="mb-6 text-gray-600 bg-[#fff8ed] p-4 rounded-xl border border-[#f7931e]/20">
                Cada donación o intercambio genera un registro inmutable en una cadena de bloques simulada. Esto garantiza la transparencia y confianza en la gestión de los recursos comunitarios.
            </p>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full bg-white">
                    <thead className="bg-gradient-to-r from-[#f7931e] to-[#ff9f3a]">
                        <tr>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar size={16} />
                                    Fecha
                                </div>
                            </th>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                    <Blocks size={16} />
                                    Tipo
                                </div>
                            </th>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                    <Package size={16} />
                                    Producto
                                </div>
                            </th>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">Origen</th>
                            <th className="text-center py-4 px-2 text-white font-semibold text-sm">
                                <ArrowRight size={16} className="mx-auto" />
                            </th>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">Destino</th>
                            <th className="text-left py-4 px-4 text-white font-semibold text-sm">
                                <div className="flex items-center gap-2">
                                    <Hash size={16} />
                                    Hash
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {transactions.map((tx, idx) => (
                            <tr key={tx.id} className={`border-b hover:bg-[#fff8ed] transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="py-4 px-4">
                                    <span className="text-sm font-medium">{tx.date}</span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-[#fff8ed] text-[#f7931e] border border-[#f7931e]/30">
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-gray-900">{tx.product}</span>
                                        <span className="text-xs text-gray-500">{tx.quantity} {tx.unit}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-medium">
                                        {tx.from}
                                    </span>
                                </td>
                                <td className="py-4 px-2">
                                    <ArrowRight size={16} className="text-[#f7931e] mx-auto" />
                                </td>
                                <td className="py-4 px-4">
                                    <span className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium">
                                        {tx.to}
                                    </span>
                                </td>
                                <td className="py-4 px-4">
                                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" title={tx.hash}>
                                        {tx.hash.substring(0, 12)}...
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length === 0 && (
                <div className="text-center py-12">
                    <Blocks size={48} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No hay transacciones registradas</p>
                    <p className="text-sm text-gray-400 mt-1">Las transacciones aparecerán aquí cuando se registren donaciones o intercambios</p>
                </div>
            )}
        </Card>
    );
};

export default BlockchainLedger;