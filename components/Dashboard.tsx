import React, { useEffect, useRef, useState, useMemo } from 'react';
import Card from './shared/Card';
import { Transaction, OllaLocation } from '../types';

declare var Chart: any;

interface DashboardProps {
    transactions: Transaction[];
    ollas: OllaLocation[];
}

type TimeRange = '7d' | '30d' | 'all';

const Dashboard: React.FC<DashboardProps> = ({ transactions, ollas }) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('all');

    const activityChartRef = useRef<HTMLCanvasElement>(null);
    const timelineChartRef = useRef<HTMLCanvasElement>(null);
    const productsChartRef = useRef<HTMLCanvasElement>(null);

    const filteredTransactions = useMemo(() => {
        if (timeRange === 'all') {
            return transactions;
        }
        const now = new Date();
        const daysToSubtract = timeRange === '7d' ? 7 : 30;
        const cutoffDate = new Date(now.setDate(now.getDate() - daysToSubtract));

        return transactions.filter(tx => new Date(tx.date) >= cutoffDate);
    }, [transactions, timeRange]);

    const kpiMetrics = useMemo(() => {
        const totalDonationsKg = filteredTransactions
            .filter(tx => tx.type === 'Donación' && (tx.unit === 'kg' || tx.unit === 'kilogramo'))
            .reduce((acc, tx) => acc + tx.quantity, 0);

        const totalDonationsCount = filteredTransactions.filter(tx => tx.type === 'Donación').length;
        const totalExchanges = filteredTransactions.filter(tx => tx.type === 'Intercambio').length;

        return {
            totalDonationsKg: totalDonationsKg.toFixed(2),
            activeOllas: ollas.length,
            totalDonationsCount,
            totalExchanges,
        };
    }, [filteredTransactions, ollas]);

    useEffect(() => {
        const charts: any[] = [];
        
        const destroyCharts = () => {
            charts.forEach(chart => chart.destroy());
            if (Chart.getChart(activityChartRef.current)) Chart.getChart(activityChartRef.current).destroy();
            if (Chart.getChart(timelineChartRef.current)) Chart.getChart(timelineChartRef.current).destroy();
            if (Chart.getChart(productsChartRef.current)) Chart.getChart(productsChartRef.current).destroy();
        };

        const createCharts = () => {
            destroyCharts();

            // Activity Chart (Doughnut)
            if (activityChartRef.current) {
                const donationCount = filteredTransactions.filter(t => t.type === 'Donación').length;
                const exchangeCount = filteredTransactions.filter(t => t.type === 'Intercambio').length;
                const activityChart = new Chart(activityChartRef.current, {
                    type: 'doughnut',
                    data: {
                        labels: ['Donaciones', 'Intercambios'],
                        datasets: [{
                            data: [donationCount, exchangeCount],
                            backgroundColor: ['#5fa25f', '#f4a949'],
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
                charts.push(activityChart);
            }

            // Timeline Chart (Line)
            if (timelineChartRef.current) {
                const txsByDate = filteredTransactions.reduce((acc, tx) => {
                    acc[tx.date] = (acc[tx.date] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const sortedDates = Object.keys(txsByDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
                
                const timelineChart = new Chart(timelineChartRef.current, {
                    type: 'line',
                    data: {
                        labels: sortedDates,
                        datasets: [{
                            label: 'Número de Transacciones',
                            data: sortedDates.map(date => txsByDate[date]),
                            borderColor: '#f4a949',
                            tension: 0.1,
                            fill: true,
                            backgroundColor: '#f4a94933'
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
                charts.push(timelineChart);
            }

            // Top Products Chart (Bar)
            if (productsChartRef.current) {
                const productsData = filteredTransactions
                    .filter(tx => tx.type === 'Donación')
                    .reduce((acc, tx) => {
                        const productName = tx.product.toLowerCase();
                        acc[productName] = (acc[productName] || 0) + (tx.unit === 'kg' ? tx.quantity : 1);
                        return acc;
                    }, {} as Record<string, number>);

                const topProducts = Object.entries(productsData)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 5);

                const productsChart = new Chart(productsChartRef.current, {
                    type: 'bar',
                    data: {
                        labels: topProducts.map(([name]) => name.charAt(0).toUpperCase() + name.slice(1)),
                        datasets: [{
                            label: 'Cantidad (kg/unidades)',
                            data: topProducts.map(([, qty]) => qty),
                            backgroundColor: ['#5fa25f', '#6eb86e', '#82c082', '#97c997', '#aad2aa'],
                        }]
                    },
                    options: { 
                        indexAxis: 'y', 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } } 
                    }
                });
                charts.push(productsChart);
            }
        };
        
        const timeoutId = setTimeout(createCharts, 100);

        return () => {
            clearTimeout(timeoutId);
            destroyCharts();
        };
    }, [filteredTransactions]);

    const metrics = [
        { label: 'Total Donaciones (Kg)', value: kpiMetrics.totalDonationsKg, color: 'text-green-600' },
        { label: 'Ollas Activas', value: kpiMetrics.activeOllas, color: 'text-orange-600' },
        { label: 'Donaciones Registradas', value: kpiMetrics.totalDonationsCount, color: 'text-blue-600' },
        { label: 'Intercambios Realizados', value: kpiMetrics.totalExchanges, color: 'text-purple-600' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-[#5fa25f]">Panel de Control</h2>
                <div className="flex bg-gray-200 p-1 rounded-lg">
                    {(['7d', '30d', 'all'] as TimeRange[]).map(range => (
                        <button key={range} onClick={() => setTimeRange(range)} className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${timeRange === range ? 'bg-white text-[#f4a949] shadow' : 'text-gray-600 hover:bg-white/50'}`}>
                           {range === '7d' ? '7 Días' : range === '30d' ? '30 Días' : 'Historial'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map(metric => (
                     <Card key={metric.label}>
                        <h3 className="text-md text-gray-500 truncate">{metric.label}</h3>
                        <p className={`text-4xl font-bold ${metric.color}`}>{metric.value}</p>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card className="lg:col-span-2">
                    <h3 className="text-xl font-bold mb-4">Actividad por Tipo</h3>
                    <div className="h-64"><canvas ref={activityChartRef}></canvas></div>
                </Card>
                 <Card className="lg:col-span-3">
                    <h3 className="text-xl font-bold mb-4">Transacciones en el Tiempo</h3>
                    <div className="h-64"><canvas ref={timelineChartRef}></canvas></div>
                </Card>
            </div>
             <Card>
                <h3 className="text-xl font-bold mb-4">Top 5 Productos Donados</h3>
                 <div className="h-80"><canvas ref={productsChartRef}></canvas></div>
            </Card>
        </div>
    );
};

export default Dashboard;