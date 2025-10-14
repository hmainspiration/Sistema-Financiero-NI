import React, { useState, useMemo } from 'react';
import { WeeklyRecord, Member, Donation, Formulas, ChurchInfo } from '../types';
import Header from '../components/layout/Header';
import { HomeIcon, ChartBarIcon, CalendarDaysIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../constants';
import { useSupabase } from '../context/SupabaseContext';

// --- Componentes Internos para la UI Sencilla ---

interface AutocompleteInputProps {
  members: Member[];
  onSelect: (member: Member) => void;
  value: string;
  setValue: (value: string) => void;
}

const SimpleAutocompleteInput: React.FC<AutocompleteInputProps> = ({ members, onSelect, value, setValue }) => {
  const [suggestions, setSuggestions] = useState<Member[]>([]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);
    if (val) {
      setSuggestions(
        members.filter(m => m.name.toLowerCase().includes(val.toLowerCase())).slice(0, 5)
      );
    } else {
      setSuggestions([]);
    }
  };
  const handleSelect = (member: Member) => {
    onSelect(member);
    setValue(member.name);
    setSuggestions([]);
  };
  return (
    <div className="relative">
      <input type="text" value={value} onChange={handleChange} placeholder="Buscar miembro..." className="w-full p-4 text-lg bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
      {suggestions.length > 0 && (
        <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 dark:bg-gray-800 dark:border-gray-600">
          {suggestions.map(member => (
            <li key={member.id} onClick={() => handleSelect(member)} className="px-4 py-3 cursor-pointer hover:bg-gray-100 text-lg dark:hover:bg-gray-700">{member.name}</li>
          ))}
        </ul>
      )}
    </div>
  );
};


// --- Pestañas de la UI Sencilla ---

const RegistroSencilloTab: React.FC<{record: WeeklyRecord, setRecord: React.Dispatch<React.SetStateAction<WeeklyRecord | null>>, members: Member[], categories: string[], setCategories: React.Dispatch<React.SetStateAction<string[]>>}> = ({ record, setRecord, members, categories, setCategories }) => {
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [memberNameInput, setMemberNameInput] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories.find(c => c === "Diezmo") || categories[0]);
    const [newCategory, setNewCategory] = useState('');
    const [isAddingCategory, setIsAddingCategory] = useState(false);

    const handleAddDonation = () => {
        if (!selectedMember || !amount || parseFloat(amount) <= 0) {
            alert("Por favor, seleccione un miembro y una cantidad válida.");
            return;
        }
        const newDonation: Donation = {
            id: `d-${Date.now()}`,
            memberId: selectedMember.id,
            memberName: selectedMember.name,
            category: category,
            amount: parseFloat(amount),
        };
        setRecord(prev => prev ? { ...prev, donations: [...prev.donations, newDonation] } : null);
        setSelectedMember(null);
        setMemberNameInput('');
        setAmount('');
    };
    
    const handleRemoveDonation = (donationId: string) => {
        setRecord(prev => prev ? { ...prev, donations: prev.donations.filter(d => d.id !== donationId) } : null);
    };

    const handleAddNewCategory = () => {
        if (newCategory.trim() && !categories.includes(newCategory.trim())) {
            const updatedCategories = [...categories, newCategory.trim()].sort();
            setCategories(updatedCategories);
            setCategory(newCategory.trim());
        }
        setNewCategory('');
        setIsAddingCategory(false);
    };

    return (
        <div className="space-y-6">
            <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">Registrar Ofrenda</h2>
                <p className="text-gray-500 text-lg dark:text-gray-400">{`Semana del ${record.day} de ${MONTH_NAMES[record.month - 1]}, ${record.year}`}</p>
                <div className="space-y-4 mt-6">
                    <SimpleAutocompleteInput members={members} onSelect={setSelectedMember} value={memberNameInput} setValue={setMemberNameInput}/>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Cantidad C$" className="w-full p-4 text-lg bg-white border-2 border-gray-200 rounded-xl dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                    <div className="grid grid-cols-2 gap-2">
                        {categories.slice(0, 4).map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)} className={`p-3 rounded-lg text-center font-semibold ${category === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="mt-2">
                        {!isAddingCategory ? (
                             <button onClick={() => setIsAddingCategory(true)} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-blue-700 bg-blue-100 rounded-xl hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">
                                <PlusIcon className="w-5 h-5" />
                                <span>Agregar Nueva Categoría</span>
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 p-2 border-t mt-4 dark:border-gray-700">
                                <input type="text" value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Nombre" className="flex-grow p-2 text-base bg-gray-100 border border-gray-300 rounded-md dark:bg-gray-600 dark:border-gray-500"/>
                                <button onClick={handleAddNewCategory} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700">Guardar</button>
                                <button onClick={() => setIsAddingCategory(false)} className="px-2 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">X</button>
                            </div>
                        )}
                    </div>
                    <button onClick={handleAddDonation} className="w-full flex items-center justify-center gap-2 py-4 font-bold text-white text-lg transition duration-300 bg-blue-600 rounded-xl hover:bg-blue-700 !mt-6">
                        <PlusIcon className="w-6 h-6" /> Agregar Ofrenda
                    </button>
                </div>
            </div>
            
            <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Ofrendas de la Semana</h3>
                 <div className="space-y-3 max-h-96 overflow-y-auto">
                    {record.donations.length > 0 ? (
                        [...record.donations].reverse().map(donation => (
                            <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                <div>
                                    <p className="font-semibold text-lg">{donation.memberName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{donation.category} - C$ {donation.amount.toFixed(2)}</p>
                                </div>
                                <button onClick={() => handleRemoveDonation(donation.id)} className="text-red-500 hover:text-red-700 p-2 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8 dark:text-gray-400">Aún no hay ofrendas registradas.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};


const ResumenSencilloTab: React.FC<{record: WeeklyRecord, categories: string[]}> = ({ record, categories }) => {
    const totals = useMemo(() => {
        const subtotals: Record<string, number> = {};
        categories.forEach(cat => { subtotals[cat] = 0; });
        record.donations.forEach(d => {
          if (subtotals[d.category] !== undefined) subtotals[d.category] += d.amount;
        });
        const total = (subtotals['Diezmo'] || 0) + (subtotals['Ordinaria'] || 0);
        const diezmoDeDiezmo = Math.round(total * (record.formulas.diezmoPercentage / 100));
        const remanente = total > record.formulas.remanenteThreshold ? Math.round(total - record.formulas.remanenteThreshold) : 0;
        const gomerMinistro = Math.round(total - diezmoDeDiezmo);
        return { subtotals, total, diezmoDeDiezmo, remanente, gomerMinistro };
    }, [record, categories]);
    
    const StatCard: React.FC<{label: string, value: string, color: string}> = ({ label, value, color }) => (
        <div className={`p-6 rounded-2xl shadow-lg ${color}`}>
            <p className="text-lg text-white opacity-90">{label}</p>
            <p className="text-4xl font-bold text-white mt-1">{value}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="text-center">
                 <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">Resumen Semanal</h2>
                 <p className="text-gray-500 text-lg dark:text-gray-400">{`${record.day} de ${MONTH_NAMES[record.month - 1]}, ${record.year}`}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <StatCard label="TOTAL Ingresado" value={`C$ ${totals.total.toFixed(2)}`} color="bg-blue-600" />
                <StatCard label="Gomer del Ministro" value={`C$ ${totals.gomerMinistro.toFixed(2)}`} color="bg-green-600" />
                <StatCard label="Diezmo de Diezmo" value={`C$ ${totals.diezmoDeDiezmo.toFixed(2)}`} color="bg-indigo-700" />
                <StatCard label="Remanente" value={`C$ ${totals.remanente.toFixed(2)}`} color="bg-purple-600" />
            </div>
             <div className="p-6 bg-white rounded-2xl shadow-lg dark:bg-gray-800">
                <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Desglose por Categoría</h3>
                <div className="space-y-3">
                    {categories.map(cat => (
                        totals.subtotals[cat] > 0 &&
                        <div key={cat} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                            <span className="font-semibold text-lg text-gray-700 dark:text-gray-200">{cat}</span>
                            <span className="font-bold text-lg text-gray-900 dark:text-gray-100">C$ {totals.subtotals[cat].toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const HistorialSencilloTab: React.FC<{records: WeeklyRecord[], onSelectRecord: (record: WeeklyRecord) => void, onStartNew: () => void, setActiveTab: (tab: 'register' | 'summary' | 'history') => void}> = ({records, onSelectRecord, onStartNew, setActiveTab}) => {
    
    const handleSelect = (record: WeeklyRecord) => {
        onSelectRecord(record);
        setActiveTab('register');
    }

    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold text-indigo-900 dark:text-indigo-300">Semanas Pasadas</h2>
                <button onClick={onStartNew} className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition duration-300 bg-blue-600 rounded-full shadow-md hover:bg-blue-700">
                    <PlusIcon className="w-5 h-5" /> Nueva
                </button>
            </div>
            <div className="space-y-4">
                {records.length > 0 ? (
                    records
                        .sort((a, b) => new Date(b.year, b.month - 1, b.day).getTime() - new Date(a.year, a.month - 1, a.day).getTime())
                        .map(record => (
                            <button key={record.id} onClick={() => handleSelect(record)} className="w-full text-left p-5 bg-white rounded-xl shadow-md flex justify-between items-center hover:bg-gray-50 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700">
                                <div>
                                    <p className="font-bold text-lg text-indigo-900 dark:text-indigo-300">{`Semana del ${record.day} de ${MONTH_NAMES[record.month - 1]}`}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{record.year} - {record.donations.length} ofrendas</p>
                                </div>
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </button>
                        ))
                ) : (
                    <div className="p-6 text-center bg-white rounded-xl shadow-lg dark:bg-gray-800">
                        <p className="dark:text-gray-300">No hay semanas guardadas.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Componente Principal de la App Sencilla ---

interface SimpleAppData {
    members: Member[];
    categories: string[];
    weeklyRecords: WeeklyRecord[];
    currentRecord: WeeklyRecord | null;
    formulas: Formulas;
    churchInfo: ChurchInfo;
}
interface SimpleAppHandlers {
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    setWeeklyRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
    setCurrentRecord: React.Dispatch<React.SetStateAction<WeeklyRecord | null>>;
}
interface MainAppSencilloProps {
  onLogout: () => void;
  onSwitchVersion: () => void;
  data: SimpleAppData;
  handlers: SimpleAppHandlers;
  theme: string;
  toggleTheme: () => void;
}

const MainAppSencillo: React.FC<MainAppSencilloProps> = ({ onLogout, onSwitchVersion, data, handlers, theme, toggleTheme }) => {
    const [activeTab, setActiveTab] = useState<'register' | 'summary' | 'history'>('register');
    const { members, categories, weeklyRecords, currentRecord, formulas, churchInfo } = data;
    const { setWeeklyRecords, setCurrentRecord, setCategories } = handlers;
    const { uploadFile } = useSupabase();
    const [isSaving, setIsSaving] = useState(false);
    
    const [dateInfo, setDateInfo] = useState({
        day: new Date().getDate().toString(),
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
    });
    
    const activeRecord = useMemo(() => {
        if (currentRecord) return currentRecord;
        if (weeklyRecords.length > 0) {
            const sorted = [...weeklyRecords].sort((a, b) => new Date(b.year, b.month - 1, b.day).getTime() - new Date(a.year, a.month - 1, a.day).getTime());
            return sorted[0];
        }
        return null;
    }, [currentRecord, weeklyRecords]);

    const uploadRecordToSupabase = async (record: WeeklyRecord) => {
        if (!uploadFile) {
            console.error("Supabase client not available for upload.");
            return { success: false, error: new Error("Supabase client not initialized.") };
        }
    
        const churchName = (window as any).CHURCH_NAME || 'La_Empresa';
        const monthName = MONTH_NAMES[record.month - 1];
        const yearShort = record.year.toString().slice(-2);
        const dayPadded = record.day.toString().padStart(2, '0');
        const fileName = `${dayPadded}-${monthName}-${yearShort}_${churchName.replace(/ /g, '_')}.xlsx`;
    
        const donationsData = record.donations.map(d => ({ Miembro: d.memberName, Categoría: d.category, Monto: d.amount }));
        const wb = (window as any).XLSX.utils.book_new();
        const wsDonations = (window as any).XLSX.utils.json_to_sheet(donationsData);
        (window as any).XLSX.utils.book_append_sheet(wb, wsDonations, "Detalle de Ofrendas");
        
        const excelBuffer = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
        try {
            await uploadFile('reportes-semanales', fileName, blob);
            return { success: true, fileName };
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("Upload failed:", error);
            return { success: false, error };
        }
      };

    const handleSaveCurrentRecord = async () => {
        if (!currentRecord) {
             alert("No hay una semana activa para guardar.");
             return;
        }
        setIsSaving(true);

        const existingIndex = weeklyRecords.findIndex(r => r.id === currentRecord.id);
        const updatedRecords = [...weeklyRecords];
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
            alert(`Semana guardada localmente, pero falló la subida a la nube.\nError: ${uploadResult.error?.message}\n\nPuede reintentar desde la pestaña 'Semanas' en la versión completa.`);
        }
        
        setCurrentRecord(null); 
        setIsSaving(false);
        setActiveTab('summary');
    };

    const startNewRecordFlow = () => {
        setCurrentRecord(null);
        setActiveTab('register');
    };

    const handleCreateRecord = () => {
        if (!dateInfo.day || !dateInfo.month || !dateInfo.year) {
          alert('Por favor, complete todos los campos de fecha.');
          return;
        }
        const newRecord: WeeklyRecord = {
          id: `wr-${Date.now()}`,
          day: parseInt(dateInfo.day),
          month: parseInt(dateInfo.month),
          year: parseInt(dateInfo.year),
          minister: churchInfo.defaultMinister,
          donations: [],
          formulas: formulas,
        };
        setCurrentRecord(newRecord);
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setDateInfo({ ...dateInfo, [e.target.name]: e.target.value });
    };

    const navItems = [
      { id: 'register', label: 'Registrar', icon: HomeIcon },
      { id: 'summary', label: 'Resumen', icon: ChartBarIcon },
      { id: 'history', label: 'Semanas', icon: CalendarDaysIcon },
    ];

    const renderContent = () => {
        if (!activeRecord && activeTab !== 'history') {
             return (
                <div className="p-6 bg-white rounded-2xl shadow-lg h-full flex flex-col justify-center dark:bg-gray-800">
                    <h2 className="text-3xl font-bold text-indigo-900 mb-2 text-center dark:text-indigo-300">Iniciar Nuevo Registro</h2>
                    <p className="text-gray-500 text-center mb-6 dark:text-gray-400">Seleccione la fecha para la nueva semana.</p>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="day-s" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día</label>
                            <input type="number" name="day" id="day-s" value={dateInfo.day} onChange={handleDateChange} className="mt-1 block w-full p-3 text-lg border-2 border-gray-200 rounded-xl shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                        </div>
                        <div>
                            <label htmlFor="month-s" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                            <select name="month" id="month-s" value={dateInfo.month} onChange={handleDateChange} className="mt-1 block w-full p-3 text-lg border-2 border-gray-200 rounded-xl shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100">
                                {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="year-s" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                            <input type="number" name="year" id="year-s" value={dateInfo.year} onChange={handleDateChange} className="mt-1 block w-full p-3 text-lg border-2 border-gray-200 rounded-xl shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"/>
                        </div>
                    </div>
                    <button onClick={handleCreateRecord} className="w-full mt-6 py-4 font-bold text-white text-lg transition duration-300 bg-blue-600 rounded-xl hover:bg-blue-700">
                        Crear Registro Semanal
                    </button>
                </div>
            );
        }

        switch (activeTab) {
            case 'register': return <RegistroSencilloTab record={activeRecord!} setRecord={setCurrentRecord} members={members} categories={categories} setCategories={setCategories} />;
            case 'summary': return <ResumenSencilloTab record={activeRecord!} categories={categories} />;
            case 'history': return <HistorialSencilloTab records={weeklyRecords} onSelectRecord={setCurrentRecord} onStartNew={startNewRecordFlow} setActiveTab={setActiveTab} />;
            default: return null;
        }
    };
    
    return (
        <div className="flex flex-col h-screen">
            {/* FIX: Corrected component props to match definition. */}
            <Header onLogout={onLogout} onSwitchVersion={onSwitchVersion} showSwitchVersion={true} theme={theme} toggleTheme={toggleTheme}/>
            <main className="flex-grow p-4 pb-24 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <div className="max-w-2xl mx-auto h-full">
                    {renderContent()}
                    {currentRecord && activeTab === 'register' && (
                        <div className="fixed bottom-24 right-4 z-20">
                            <button onClick={handleSaveCurrentRecord} className="px-6 py-4 bg-green-600 text-white font-bold rounded-full shadow-lg hover:bg-green-700 transition-transform hover:scale-105">
                                Guardar
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <nav className="fixed bottom-0 left-0 right-0 z-10 bg-white border-t border-gray-200 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex justify-around max-w-2xl mx-auto">
                {navItems.map((item) => (
                  <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center justify-center w-full pt-3 pb-2 text-sm transition-colors duration-200 ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'}`}>
                    <item.icon className="w-7 h-7 mb-1" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </nav>
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

export default MainAppSencillo;
