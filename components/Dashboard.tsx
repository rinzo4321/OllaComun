
import React, { useEffect, useRef } from 'react';
import Card from './shared/Card';

declare var Chart: any;

const Dashboard: React.FC = () => {
    const savingsChartRef = useRef<HTMLCanvasElement>(null);
    const portionsChartRef = useRef<HTMLCanvasElement>(null);
    const nutritionChartRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const createCharts = () => {
            if (savingsChartRef.current) {
                new Chart(savingsChartRef.current, {
                    type: 'bar',
                    data: {
                        labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (proy.)'],
                        datasets: [{
                            label: 'Ahorro por recetas inteligentes (S/)',
                            data: [120, 190, 150, 210],
                            backgroundColor: '#5fa25f',
                        }]
                    },
                    options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
                });
            }
            if (portionsChartRef.current) {
                new Chart(portionsChartRef.current, {
                    type: 'line',
                    data: {
                        labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                        datasets: [{
                            label: 'Raciones Servidas',
                            data: [150, 175, 160, 180, 200],
                            borderColor: '#f4a949',
                            tension: 0.1,
                            fill: true,
                            backgroundColor: '#f4a94933'
                        }]
                    },
                     options: { responsive: true, plugins: { legend: { display: false } } }
                });
            }
            if (nutritionChartRef.current) {
                new Chart(nutritionChartRef.current, {
                    type: 'doughnut',
                    data: {
                        labels: ['Carbohidratos', 'Proteínas', 'Grasas', 'Vitaminas/Minerales'],
                        datasets: [{
                            label: 'Distribución Nutricional',
                            data: [50, 25, 15, 10],
                            backgroundColor: ['#f4a949', '#5fa25f', '#4a90e2', '#e2bf4a'],
                        }]
                    },
                    options: { responsive: true }
                });
            }
        };
        
        // A small timeout to ensure canvas is ready
        const timeoutId = setTimeout(createCharts, 100);

        return () => {
            clearTimeout(timeoutId);
            // Destroy charts if component unmounts
             if(Chart.getChart(savingsChartRef.current)) Chart.getChart(savingsChartRef.current).destroy();
             if(Chart.getChart(portionsChartRef.current)) Chart.getChart(portionsChartRef.current).destroy();
             if(Chart.getChart(nutritionChartRef.current)) Chart.getChart(nutritionChartRef.current).destroy();
        };
    }, []);

    const metrics = [
        { label: 'Ahorro Total del Mes', value: 'S/ 460.00', color: 'text-green-600' },
        { label: 'Raciones Servidas Hoy', value: '200', color: 'text-orange-600' },
        { label: 'Intercambios Realizados', value: '12', color: 'text-blue-600' },
    ];

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map(metric => (
                     <Card key={metric.label}>
                        <h3 className="text-lg text-gray-500">{metric.label}</h3>
                        <p className={`text-4xl font-bold ${metric.color}`}>{metric.value}</p>
                    </Card>
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <h3 className="text-xl font-bold mb-4">Ahorro Semanal</h3>
                    <canvas ref={savingsChartRef}></canvas>
                </Card>
                 <Card>
                    <h3 className="text-xl font-bold mb-4">Raciones Servidas por Día</h3>
                    <canvas ref={portionsChartRef}></canvas>
                </Card>
            </div>
             <Card>
                <h3 className="text-xl font-bold mb-4 text-center">Distribución Nutricional Promedio de Menús</h3>
                <div className="max-w-md mx-auto">
                   <canvas ref={nutritionChartRef}></canvas>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;
