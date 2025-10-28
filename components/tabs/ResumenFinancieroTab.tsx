// Fix: Implemented a full functional component instead of a placeholder.
import React, { useMemo } from 'react';
import { WeeklyRecord } from '../../types';

interface ResumenFinancieroTabProps {
  // FIX: Changed prop name from 'record' to 'currentRecord' and added 'categories'.
  currentRecord: WeeklyRecord | null;
  categories: string[];
}

const StatCard: React.FC<{label: string, value: string, color?: string}> = ({ label, value, color = 'bg-gray-100 dark:bg-gray-700' }) => (
    <div className={`p-4 rounded-xl shadow-md ${color}`}>
        <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
);

const ResumenFinancieroTab: React.FC<ResumenFinancieroTabProps> = ({ currentRecord, categories }) => {
  const calculations = useMemo(() => {
    if (!currentRecord) return null;

    const subtotals: Record<string, number> = {};
    categories.forEach(cat => { subtotals[cat] = 0; });
    currentRecord.offerings.forEach(d => {
      if (subtotals[d.category] !== undefined) {
        subtotals[d.category] += d.amount;
      }
    });

    const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
    const diezmoDeDiezmo = Math.round(total * (currentRecord.formulas.diezmoPercentage / 100));
    const remanente = total > currentRecord.formulas.remanenteThreshold ? Math.round(total - currentRecord.formulas.remanenteThreshold) : 0;
    const gomerMinistro = Math.round(total - diezmoDeDiezmo);

    return { subtotals, total, diezmoDeDiezmo, remanente, gomerMinistro };
  }, [currentRecord, categories]);


  if (!currentRecord || !calculations) {
    return (
      <div className="p-6 text-center bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Resumen Financiero</h2>
        <p className="dark:text-gray-300">No hay una semana activa. Por favor, cree o seleccione una en la pestaña 'Registro'.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Resumen Financiero Semanal</h2>
        {/* FIX: Correctly display date from day, month, and year properties. */}
        <p className="text-gray-500 dark:text-gray-400">Semana del {currentRecord.day}/{currentRecord.month}/{currentRecord.year}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="TOTAL (Diezmo + Ordinaria)" value={`C$ ${calculations.total.toFixed(2)}`} color="bg-blue-100 dark:bg-blue-900/50"/>
        <StatCard label="Gomer del Ministro" value={`C$ ${calculations.gomerMinistro.toFixed(2)}`} color="bg-green-100 dark:bg-green-900/50"/>
        <StatCard label="Diezmo de Diezmo" value={`C$ ${calculations.diezmoDeDiezmo.toFixed(2)}`} color="bg-indigo-100 dark:bg-indigo-900/50"/>
        <StatCard label="Remanente" value={`C$ ${calculations.remanente.toFixed(2)}`} color="bg-purple-100 dark:bg-purple-900/50"/>
      </div>

      <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
          <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Desglose por Categoría</h3>
          <div className="space-y-2">
              {categories.map(cat => (
                  calculations.subtotals[cat] > 0 &&
                  <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                      <span className="font-medium text-gray-700 dark:text-gray-200">{cat}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">C$ {calculations.subtotals[cat].toFixed(2)}</span>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default ResumenFinancieroTab;