import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error capturado por ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-[#fff8ed] flex items-center justify-center p-6">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="bg-red-100 rounded-full p-3">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">¡Ups! Algo salió mal</h1>
                                <p className="text-gray-600 mt-1">Se ha producido un error inesperado</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                            <p className="text-sm text-gray-700 font-mono break-words">
                                {this.state.error?.message || 'Error desconocido'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-[#5fa25f] hover:bg-[#4d8a4d] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                            >
                                Recargar la página
                            </button>
                            
                            <p className="text-sm text-gray-500 text-center">
                                Si el problema persiste, verifica que:
                            </p>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                <li>Tu conexión a internet esté activa</li>
                                <li>Las librerías externas (Chart.js, Leaflet) se hayan cargado</li>
                                <li>El archivo .env contenga una API Key válida de Google Gemini</li>
                            </ul>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

