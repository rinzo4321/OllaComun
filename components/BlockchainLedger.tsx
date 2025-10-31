import React from 'react';
import Card from './shared/Card';
import { Transaction } from '../types';

interface BlockchainLedgerProps {
    transactions: Transaction[];
}

const BlockchainLedger: React.FC<BlockchainLedgerProps> = ({ transactions }) => {
    return (
        <Card>
            <h2 className="text-2xl font-bold text-[#5fa25f] mb-4">Trazabilidad de Insumos (Simulación Blockchain)</h2>
            <p className="mb-6 text-gray-600">
                Cada donación o intercambio genera un registro inmutable en una cadena de bloques simulada. Esto garantiza la transparencia y confianza en la gestión de los recursos comunitarios.
            </p>
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border">
                    <thead className="bg-[#f4a949]/20">
                        <tr>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Fecha</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Tipo</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Producto</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Origen</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Destino</th>
                            <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Hash (ID Único)</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="border-b hover:bg-gray-50">
                                <td className="py-3 px-4">{tx.date}</td>
                                <td className="py-3 px-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${tx.type === 'Donación' ? 'bg-[#fff8ed] text-[#f7931e] border border-[#f7931e]/30' : 'bg-[#fff8ed] text-[#f7931e] border border-[#f7931e]/30'}`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="py-3 px-4">{tx.product} ({tx.quantity} {tx.unit})</td>
                                <td className="py-3 px-4">{tx.from}</td>
                                <td className="py-3 px-4">{tx.to}</td>
                                <td className="py-3 px-4 font-mono text-xs text-gray-500 truncate" title={tx.hash}>
                                    {tx.hash.substring(0, 16)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default BlockchainLedger;