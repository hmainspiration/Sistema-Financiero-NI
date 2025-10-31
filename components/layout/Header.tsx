// Fix: Created a functional header component.
import React, { FC } from 'react';
import { Sun, Moon, RotateCw, LogOut } from 'lucide-react';

interface HeaderProps {
    onLogout: () => void;
    onSwitchVersion: () => void;
    showSwitchVersion: boolean;
    theme: string;
    toggleTheme: () => void;
}

const Header: FC<HeaderProps> = ({ 
    onLogout, 
    onSwitchVersion, 
    showSwitchVersion, 
    theme, 
    toggleTheme,
}) => {
    
    return (
        <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-20">
            <div className="max-w-4xl mx-auto px-4 py-3 flex justify-between items-center">
                <h1 className="text-xl font-bold text-indigo-900 dark:text-white">Sistema de Finanzas</h1>
                <div className="flex items-center gap-2">
                    {showSwitchVersion && (
                        <button
                            onClick={onSwitchVersion}
                            className="flex items-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            aria-label="Cambiar versión"
                            title="Cambiar versión"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                    )}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-2 p-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        aria-label="Cambiar tema"
                        title={theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'}
                    >
                        {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={onLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        aria-label="Cerrar sesión"
                    >
                        <LogOut className="w-5 h-5" />
                        <span className="hidden sm:inline">Salir</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
