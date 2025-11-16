import React, { useEffect, useRef, useState, useMemo } from 'react';
import Card from './shared/Card';
import { Transaction, OllaLocation } from '../types';
import { TrendingUp, Users, Package, Repeat } from 'lucide-react';

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
            .reduce((acc, tx) => {
                const quantity = Number(tx.quantity) || 0;
                return acc + quantity;
            }, 0);

        const totalDonationsCount = filteredTransactions.filter(tx => tx.type === 'Donación').length;
        const totalExchanges = filteredTransactions.filter(tx => tx.type === 'Intercambio').length;

        return {
            totalDonationsKg: Number(totalDonationsKg).toFixed(2),
            activeOllas: ollas.length,
            totalDonationsCount,
            totalExchanges,
        };
    }, [filteredTransactions, ollas]);

    useEffect(() => {
        const charts: any[] = [];
        
        const destroyCharts = () => {
            charts.forEach(chart => {
                try {
                    chart.destroy();
                } catch (e) {
                    // Chart already destroyed
                }
            });
            try {
                if (activityChartRef.current && Chart.getChart(activityChartRef.current)) {
                    Chart.getChart(activityChartRef.current).destroy();
                }
                if (timelineChartRef.current && Chart.getChart(timelineChartRef.current)) {
                    Chart.getChart(timelineChartRef.current).destroy();
                }
                if (productsChartRef.current && Chart.getChart(productsChartRef.current)) {
                    Chart.getChart(productsChartRef.current).destroy();
                }
            } catch (e) {
                // Chart not available yet
            }
        };

        const createCharts = () => {
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.warn('Chart.js not loaded yet');
                return;
            }
            
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
                            backgroundColor: ['#f7931e', '#ff9f3a'],
                            borderWidth: 0,
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 15,
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
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
                            borderColor: '#f7931e',
                            backgroundColor: 'rgba(247, 147, 30, 0.1)',
                            tension: 0.3,
                            fill: true,
                            borderWidth: 3,
                            pointBackgroundColor: '#f7931e',
                            pointBorderColor: '#fff',
                            pointBorderWidth: 2,
                            pointRadius: 5,
                            pointHoverRadius: 7
                        }]
                    },
                    options: { 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            x: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
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
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 5);

                const productsChart = new Chart(productsChartRef.current, {
                    type: 'bar',
                    data: {
                        labels: topProducts.map(([name]) => name.charAt(0).toUpperCase() + name.slice(1)),
                        datasets: [{
                            label: 'Cantidad (kg/unidades)',
                            data: topProducts.map(([, qty]) => qty),
                            backgroundColor: ['#f7931e', '#ff9f3a', '#ffaa4d', '#ffb560', '#ffc073'],
                            borderRadius: 8,
                            borderWidth: 0,
                        }]
                    },
                    options: { 
                        indexAxis: 'y', 
                        responsive: true, 
                        maintainAspectRatio: false,
                        plugins: { 
                            legend: { display: false }
                        },
                        scales: {
                            x: {
                                beginAtZero: true,
                                grid: {
                                    color: 'rgba(0, 0, 0, 0.05)'
                                }
                            },
                            y: {
                                grid: {
                                    display: false
                                }
                            }
                        }
                    }
                });
                charts.push(productsChart);
            }
        };
        
        // Wait for Chart.js to load, retry if needed
        let timeoutId: NodeJS.Timeout;
        let retryCount = 0;
        const maxRetries = 10;
        
        const tryCreateCharts = () => {
            if (typeof Chart === 'undefined' && retryCount < maxRetries) {
                retryCount++;
                timeoutId = setTimeout(tryCreateCharts, 200);
            } else {
                createCharts();
            }
        };
        
        timeoutId = setTimeout(tryCreateCharts, 100);

        return () => {
            clearTimeout(timeoutId);
            destroyCharts();
        };
    }, [filteredTransactions]);

    const metrics = [
        { 
            label: 'Total Donaciones', 
            value: kpiMetrics.totalDonationsKg, 
            unit: 'kg',
            icon: TrendingUp,
            gradient: 'from-[#f7931e] to-[#ff9f3a]'
        },
        { 
            label: 'Ollas Activas', 
            value: kpiMetrics.activeOllas,
            unit: 'ollas',
            icon: Users,
            gradient: 'from-[#f7931e] to-[#ff9f3a]'
        },
        { 
            label: 'Donaciones', 
            value: kpiMetrics.totalDonationsCount,
            unit: 'registros',
            icon: Package,
            gradient: 'from-[#f7931e] to-[#ff9f3a]'
        },
        { 
            label: 'Intercambios', 
            value: kpiMetrics.totalExchanges,
            unit: 'realizados',
            icon: Repeat,
            gradient: 'from-[#f7931e] to-[#ff9f3a]'
        },
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] bg-clip-text text-transparent">
                    Panel de Control
                </h2>
                <div className="flex bg-gray-100 p-1.5 rounded-xl border border-gray-200">
                    {(['7d', '30d', 'all'] as TimeRange[]).map(range => (
                        <button 
                            key={range} 
                            onClick={() => setTimeRange(range)} 
                            className={`px-5 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                                timeRange === range 
                                    ? 'bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white shadow-md' 
                                    : 'text-gray-600 hover:bg-white hover:text-[#f7931e]'
                            }`}
                        >
                           {range === '7d' ? '7 Días' : range === '30d' ? '30 Días' : 'Historial'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {metrics.map(metric => {
                    const Icon = metric.icon;
                    return (
                        <Card key={metric.label} padding="md" hover>
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-600 mb-2">{metric.label}</p>
                                    <p className="text-3xl font-bold text-gray-900 mb-1">{metric.value}</p>
                                    <p className="text-xs text-gray-500">{metric.unit}</p>
                                </div>
                                <div className={`bg-gradient-to-br ${metric.gradient} p-3 rounded-xl shadow-lg`}>
                                    <Icon className="text-white" size={24} strokeWidth={2.5} />
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                 <Card className="lg:col-span-2" padding="md">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#f7931e] to-[#ff9f3a] rounded-full"></div>
                        Actividad por Tipo
                    </h3>
                    <div className="h-64"><canvas ref={activityChartRef}></canvas></div>
                </Card>
                 <Card className="lg:col-span-3" padding="md">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-[#f7931e] to-[#ff9f3a] rounded-full"></div>
                        Transacciones en el Tiempo
                    </h3>
                    <div className="h-64"><canvas ref={timelineChartRef}></canvas></div>
                </Card>
            </div>
            
             <Card padding="md">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-[#f7931e] to-[#ff9f3a] rounded-full"></div>
                    Top 5 Productos Donados
                </h3>
                 <div className="h-80"><canvas ref={productsChartRef}></canvas></div>
            </Card>
        </div>
    );
};

export default Dashboard;