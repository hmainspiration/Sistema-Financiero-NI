
import React from 'react';

interface VersionSelectionScreenProps {
  onSelectVersion: (version: 'completo' | 'sencillo') => void;
}

const VersionSelectionScreen: React.FC<VersionSelectionScreenProps> = ({ onSelectVersion }) => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-md p-8 space-y-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold">Select Application Version</h2>
        <div className="flex justify-around pt-4">
          <button onClick={() => onSelectVersion('sencillo')} className="px-6 py-3 text-lg font-semibold text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
            Sencillo
          </button>
          <button onClick={() => onSelectVersion('completo')} className="px-6 py-3 text-lg font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Completo
          </button>
        </div>
      </div>
    </div>
  );
};

export default VersionSelectionScreen;
