import React, { useState } from 'react';
import { Tab, WeeklyRecord, Member, Formulas, MonthlyReport, ChurchInfo } from '../types';
import Header from '../components/layout/Header';
import BottomNav from '../components/layout/BottomNav';
import RegistroOfrendasTab from '../components/tabs/RegistroOfrendasTab';
import ResumenFinancieroTab from '../components/tabs/ResumenFinancieroTab';
import SemanasRegistradasTab from '../components/tabs/SemanasRegistradasTab';
import ResumenMensualTab from '../components/tabs/ResumenMensualTab';
import AdminPanelTab from '../components/tabs/AdminPanelTab';
import InformeMensualTab from '../components/tabs/InformeMensualTab';
import { useSupabase } from '../context/SupabaseContext';
import { MONTH_NAMES } from '../constants';

// Define props based on what App.tsx passes
interface AppData {
    members: Member[];
    categories: string[];
    weeklyRecords: WeeklyRecord[];
    currentRecord: WeeklyRecord | null;
    formulas: Formulas;
    monthlyReports: MonthlyReport[];
    churchInfo: ChurchInfo;
}

interface AppHandlers {
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    setWeeklyRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
    setCurrentRecord: React.Dispatch<React.SetStateAction<WeeklyRecord | null>>;
    setFormulas: React.Dispatch<React.SetStateAction<Formulas>>;
    setMonthlyReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
    setChurchInfo: React.Dispatch<React.SetStateAction<ChurchInfo>>;
}

interface MainAppProps {
  onLogout: () => void;
  onSwitchVersion: () => void;
  data: AppData;
  handlers: AppHandlers;
  theme: string;
  toggleTheme: () => void;
}

const MainApp: React.FC<MainAppProps> = ({ onLogout, onSwitchVersion, data, handlers, theme, toggleTheme }) => {
  const [activeTab, setActiveTab] = useState<Tab>('register');
  const [isSaving, setIsSaving] = useState(false);
  const { uploadFile, supabase } = useSupabase();
  
  // Destructure props for easier use
  const { members, categories, weeklyRecords, currentRecord, formulas, monthlyReports, churchInfo } = data;
  const { setMembers, setCategories, setWeeklyRecords, setCurrentRecord, setFormulas, setMonthlyReports, setChurchInfo } = handlers;

  const uploadRecordToSupabase = async (record: WeeklyRecord) => {
    if (!supabase) {
        console.error("Supabase client not available for upload.");
        return { success: false, error: new Error("Supabase client not initialized.") };
    }

    const churchName = (window as any).CHURCH_NAME || 'La_Empresa';
    const monthName = MONTH_NAMES[record.month - 1];
    const yearShort = record.year.toString().slice(-2);
    const dayPadded = record.day.toString().padStart(2, '0');
    const fileName = `${dayPadded}-${monthName}-${yearShort}_${churchName.replace(/ /g, '_')}.xlsx`;

    // Generate detailed report with summary
    const subtotals: Record<string, number> = {};
    categories.forEach(cat => { subtotals[cat] = 0; });
    record.donations.forEach(d => {
        if (subtotals[d.category] !== undefined) {
            subtotals[d.category] += d.amount;
        }
    });
    const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
    const diezmoDeDiezmo = Math.round(total * (record.formulas.diezmoPercentage / 100));
    const remanente = total > record.formulas.remanenteThreshold ? Math.round(total - record.formulas.remanenteThreshold) : 0;
    const gomerMinistro = Math.round(total - diezmoDeDiezmo);

    const summaryData = [
        ["Resumen Semanal"], [], ["Fecha:", `${record.day}/${record.month}/${record.year}`], ["Ministro:", record.minister], [],
        ["Concepto", "Monto (C$)"], ...categories.map(cat => [cat, subtotals[cat] || 0]), [],
        ["Cálculos Finales", ""], ["TOTAL (Diezmo + Ordinaria)", total], [`Diezmo de Diezmo (${record.formulas.diezmoPercentage}%)`, diezmoDeDiezmo],
        [`Remanente (Umbral C$ ${record.formulas.remanenteThreshold})`, remanente], ["Gomer del Ministro", gomerMinistro]
    ];
    const donationsData = record.donations.map(d => ({ Miembro: d.memberName, Categoría: d.category, Monto: d.amount }));

    const wb = (window as any).XLSX.utils.book_new();
    const wsSummary = (window as any).XLSX.utils.aoa_to_sheet(summaryData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    
    const wsDonations = (window as any).XLSX.utils.json_to_sheet(donationsData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsDonations, "Detalle de Ofrendas");
    
    const excelBuffer = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    try {
        await uploadFile('reportes-semanales', fileName, blob, true);
        return { success: true, fileName };
    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Upload failed:", error);
        return { success: false, error };
    }
  };
  
  const handleSaveCurrentRecord = async () => {
    if (!currentRecord) return;
    setIsSaving(true);

    const existingIndex = weeklyRecords.findIndex(r => r.id === currentRecord.id);
    let updatedRecords = [...weeklyRecords];
    if (existingIndex > -1) {
      updatedRecords[existingIndex] = currentRecord;
    } else {
      updatedRecords.push(currentRecord);
    }
    setWeeklyRecords(updatedRecords);
    
    const uploadResult = await uploadRecordToSupabase(currentRecord);

    if (uploadResult.success) {
        alert(`Semana guardada localmente y subida a la nube como:\n${uploadResult.fileName}`);
    } else {
        alert(`Semana guardada localmente, pero falló la subida a la nube.\nError: ${uploadResult.error?.message}\n\nPuede reintentar desde la pestaña 'Semanas'.`);
    }

    setCurrentRecord(null);
    setActiveTab('history');
    setIsSaving(false);
  };

  const startNewRecord = () => {
    setCurrentRecord(null);
    setActiveTab('register');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'register':
        return (
          // FIX: Corrected component props to match definition.
          <RegistroOfrendasTab
            currentRecord={currentRecord}
            setCurrentRecord={setCurrentRecord}
            members={members}
            setMembers={setMembers}
            categories={categories}
            setCategories={setCategories}
            onSaveRecord={handleSaveCurrentRecord}
            onStartNew={startNewRecord}
            defaultFormulas={formulas}
            weeklyRecords={weeklyRecords}
            churchInfo={churchInfo}
          />
        );
      case 'summary':
        // FIX: Corrected component props to match definition.
        return <ResumenFinancieroTab currentRecord={currentRecord} categories={categories} />;
      case 'history':
        return <SemanasRegistradasTab 
                    records={weeklyRecords} 
                    setRecords={setWeeklyRecords}
                    members={members}
                    categories={categories}
                    formulas={formulas}
                    churchInfo={churchInfo}
                />;
      case 'monthly':
        return <ResumenMensualTab records={weeklyRecords} categories={categories} />;
      case 'informe':
        return <InformeMensualTab 
                    records={weeklyRecords} 
                    formulas={formulas} 
                    savedReports={monthlyReports}
                    setSavedReports={setMonthlyReports}
                    churchInfo={churchInfo}
                />;
      case 'admin':
        return (
          <AdminPanelTab
            members={members}
            setMembers={setMembers}
            categories={categories}
            setCategories={setCategories}
            formulas={formulas}
            setFormulas={setFormulas}
            churchInfo={churchInfo}
            setChurchInfo={setChurchInfo}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* FIX: Corrected component props to match definition. */}
      <Header onLogout={onLogout} onSwitchVersion={onSwitchVersion} showSwitchVersion={true} theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow p-4 pb-24 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
         {renderContent()}
        </div>
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
       {isSaving && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg flex items-center gap-4 dark:bg-gray-800">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-semibold">Guardando y Subiendo...</span>
                </div>
            </div>
        )}
    </div>
  );
};

export default MainApp;