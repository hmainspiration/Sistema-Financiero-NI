
import React from 'react';

// This component receives all state and handlers but is just a placeholder for now.
const MainAppSencillo: React.FC<any> = (props) => {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400">Main Application (Sencillo)</h1>
      <p className="mt-4">This is where the simplified application interface will be rendered.</p>
      <button onClick={props.onLogout} className="mt-8 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700">Logout</button>
    </div>
  );
};

export default MainAppSencillo;
