import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const handleLogin = () => {
    // Lee la credencial desde el objeto window, con un valor de respaldo para desarrollo.
    // Esta configuración se define en un script en `index.html`.
    const validPassword = (window as any).CHURCH_PASSWORD || 'NIMT02';

    // Trim whitespace to be tolerant of mobile autocorrect errors
    if (password.trim() === validPassword) {
      setError('');
      onLoginSuccess();
    } else {
      setError('Credenciales incorrectas. Intente nuevamente.');
    }
  };
  
  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 to-blue-600 p-4">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-indigo-900 dark:text-white">Sistema de Finanzas</h1>
          <p className="text-gray-500 dark:text-gray-400">La Luz del Mundo</p>
        </div>
        
        {error && <div className="p-3 text-sm text-center text-red-800 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/50">{error}</div>}

        <div className="space-y-4">
          <div>
            <label htmlFor="password-login" className="text-sm font-medium text-gray-700 dark:text-gray-300">Clave de Iglesia</label>
            <div className="relative mt-1">
               <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </span>
              <input
                id="password-login"
                type={isPasswordVisible ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                className="w-full py-3 pl-10 pr-10 text-gray-700 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label={isPasswordVisible ? 'Ocultar clave' : 'Mostrar clave'}
              >
                {isPasswordVisible ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="w-full py-3 font-semibold text-white transition duration-300 rounded-lg bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Ingresar
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;