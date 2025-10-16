import React from 'react';
import { Monitor, Smartphone } from 'lucide-react';

interface VersionSelectionScreenProps {
    onSelect: (version: 'sencillo' | 'completo') => void;
}

const VersionSelectionScreen: React.FC<VersionSelectionScreenProps> = ({ onSelect }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-blue-600 p-4">
            <div className="w-full max-w-md p-8 text-center bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
                <h1 className="text-4xl font-bold text-indigo-900 dark:text-indigo-300">¡Bienvenido!</h1>
                <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">Elija el modo de experiencia que prefiera.</p>
                
                <div className="mt-10 space-y-6">
                    <button
                        onClick={() => onSelect('sencillo')}
                        className="group flex flex-col items-center justify-center w-full p-6 text-left transition duration-300 border-2 border-transparent rounded-lg bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:border-blue-500"
                    >
                         <Smartphone className="w-12 h-12 mb-3 text-blue-600 dark:text-blue-400" />
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Versión Sencilla</h2>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Ideal para un registro rápido y fácil.</p>
                    </button>
                    
                    <button
                        onClick={() => onSelect('completo')}
                        className="group flex flex-col items-center justify-center w-full p-6 text-left transition duration-300 border-2 border-transparent rounded-lg bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-lg dark:bg-gray-700 dark:hover:bg-gray-600 dark:hover:border-blue-500"
                    >
                        <Monitor className="w-12 h-12 mb-3 text-indigo-800 dark:text-indigo-400" />
                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Versión Completa</h2>
                        <p className="mt-1 text-gray-500 dark:text-gray-400">Acceso a todas las funciones, incluyendo informes mensuales y administración avanzada.</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VersionSelectionScreen;