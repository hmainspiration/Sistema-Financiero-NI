

import React, { useState, useMemo } from 'react';
import { WeeklyRecord } from '../../types';
import { MONTH_NAMES } from '../../constants';

interface ResumenMensualTabProps {
  records: WeeklyRecord[];
  categories: string[];
}

const ResumenMensualTab: React.FC<ResumenMensualTabProps> = ({ records, categories }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthlyData = useMemo(() => {
    const filteredRecords = records.filter(r => r.month === selectedMonth && r.year === selectedYear);
    if (filteredRecords.length === 0) return null;

    const subtotals: Record<string, number> = {};
    categories.forEach(cat => { subtotals[cat] = 0 });

    let totalDiezmoDeDiezmo = 0;
    let totalRemanente = 0;

    filteredRecords.forEach(record => {
        record.offerings.forEach(offering => {
            if (subtotals[offering.category] !== undefined) {
                subtotals[offering.category] += offering.amount;
            }
        });

        const weeklyTotal = (record.offerings.filter(d => d.category === 'Diezmo').reduce((s, d) => s + d.amount, 0)) + 
                            (record.offerings.filter(d => d.category === 'Ordinaria').reduce((s, d) => s + d.amount, 0));
        
        totalDiezmoDeDiezmo += Math.round(weeklyTotal * (record.formulas.diezmoPercentage / 100));
        if (weeklyTotal > record.formulas.remanenteThreshold) {
            totalRemanente += Math.round(weeklyTotal - record.formulas.remanenteThreshold);
        }
    });
    
    const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
    const gomerMinistro = Math.round(total - totalDiezmoDeDiezmo);

    return { subtotals, total, totalDiezmoDeDiezmo, totalRemanente, gomerMinistro };
  }, [records, selectedMonth, selectedYear, categories]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Resumen Mensual</h2>
      <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
            <select id="reportMonth" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
              {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="reportYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
            <input type="number" id="reportYear" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
          </div>
        </div>
      </div>
      
      {monthlyData ? (
        <div className="p-6 bg-white rounded-xl shadow-lg space-y-4 dark:bg-gray-800">
            <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">Resultados para {MONTH_NAMES[selectedMonth - 1]} {selectedYear}</h3>
            <div className="p-4 space-y-2 bg-blue-50 rounded-lg dark:bg-blue-900/30">
              <h4 className="font-bold text-blue-800 dark:text-blue-300">Ingresos Totales por Categoría</h4>
              {categories.map(cat => (
                <div key={cat} className="flex justify-between">
                  <span className="dark:text-gray-300">{cat}:</span>
                  <span className="font-semibold dark:text-gray-100">C$ {monthlyData.subtotals[cat]?.toFixed(2) || '0.00'}</span>
                </div>
              ))}
            </div>
             <div className="p-4 space-y-2 bg-green-50 rounded-lg dark:bg-green-900/30">
              <h4 className="font-bold text-green-800 dark:text-green-300">Cálculos Totales del Mes</h4>
               <div className="flex justify-between font-bold text-lg border-b pb-2 dark:border-gray-600">
                  <span>TOTAL (Diezmo + Ordinaria):</span>
                  <span>C$ {monthlyData.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="dark:text-gray-300">Total Diezmo de Diezmo:</span>
                  <span className="font-semibold dark:text-gray-100">C$ {monthlyData.totalDiezmoDeDiezmo.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="dark:text-gray-300">Total Remanente:</span>
                  <span className="font-semibold dark:text-gray-100">C$ {monthlyData.totalRemanente.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between">
                  <span className="dark:text-gray-300">Total Gomer del Ministro:</span>
                  <span className="font-semibold dark:text-gray-100">C$ {monthlyData.gomerMinistro.toFixed(2)}</span>
                </div>
            </div>
        </div>
      ) : (
        <div className="p-6 text-center bg-white rounded-xl shadow-lg dark:bg-gray-800">
            <p className="dark:text-gray-300">No hay datos para {MONTH_NAMES[selectedMonth - 1]} de {selectedYear}.</p>
        </div>
      )}
    </div>
  );
};

export default ResumenMensualTab;