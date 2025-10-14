import React from 'react';

interface LoginScreenProps {
  onLogin: (password: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      try {
        onLogin(password);
      } catch (err: any) {
        setError(err.message || 'Contraseña incorrecta');
      }
    } else {
      setError('Se requiere contraseña');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-xl dark:bg-gray-800">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sistema de Finanzas</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">La Luz del Mundo</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-2 text-gray-900 bg-gray-100 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="Contraseña"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-center text-red-500">{error}</p>}
          <button type="submit" className="w-full px-4 py-2 font-semibold text-white transition-transform transform bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hover:scale-105">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
