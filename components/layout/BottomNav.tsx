
import React from 'react';
import { Tab } from '../../types';
import { HomeIcon, ChartBarIcon, CalendarDaysIcon, ChartPieIcon, Cog6ToothIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const navItems = [
  { id: 'register', label: 'Registro', icon: HomeIcon },
  { id: 'summary', label: 'Resumen', icon: ChartBarIcon },
  { id: 'history', label: 'Semanas', icon: CalendarDaysIcon },
  { id: 'monthly', label: 'Mensual', icon: ChartPieIcon },
  { id: 'informe', label: 'Informe', icon: DocumentTextIcon },
  { id: 'admin', label: 'Admin', icon: Cog6ToothIcon },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 shadow-t-lg dark:bg-gray-800 dark:border-gray-700">
      <div className="flex justify-around max-w-4xl mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as Tab)}
            className={`flex flex-col items-center justify-center w-full pt-2 pb-1 text-xs transition-colors duration-200 ${
              activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
            }`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span>{item.label}</span>
            {activeTab === item.id && <div className="w-8 h-1 mt-1 rounded-full bg-blue-600 dark:bg-blue-400"></div>}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;