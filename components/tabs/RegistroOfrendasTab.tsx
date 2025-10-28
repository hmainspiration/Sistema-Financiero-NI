// Fix: Implemented a full functional component instead of a placeholder.
import React, { useState } from 'react';
import { WeeklyRecord, Member, Offering, Formulas, ChurchInfo } from '../../types';
import { MONTH_NAMES } from '../../constants';
import { Trash2, Plus, Calendar, X } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';

// Autocomplete component, similar to the one in SemanasRegistradasTab
const AutocompleteInput: React.FC<{ members: Member[], onSelect: (member: Member) => void }> = ({ members, onSelect }) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<Member[]>([]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInputValue(value);
        if (value) {
            setSuggestions(
                members.filter(m => m.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5)
            );
        } else {
            setSuggestions([]);
        }
    };

    const handleSelect = (member: Member) => {
        onSelect(member);
        setInputValue(''); // Clear input after selection
        setSuggestions([]);
    };

    return (
        <div className="relative">
            <input type="text" value={inputValue} onChange={handleChange} placeholder="Buscar o escribir nombre..." className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"/>
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 dark:bg-gray-800 dark:border-gray-600">
                    {suggestions.map(member => (
                        <li key={member.id} onClick={() => handleSelect(member)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700">
                            {member.name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface RegistroOfrendasTabProps {
  currentRecord: WeeklyRecord | null;
  setCurrentRecord: React.Dispatch<React.SetStateAction<WeeklyRecord | null>>;
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
  onSaveRecord: () => void;
  onStartNew: () => void;
  defaultFormulas: Formulas;
  weeklyRecords: WeeklyRecord[];
  churchInfo: ChurchInfo;
}

const RegistroOfrendasTab: React.FC<RegistroOfrendasTabProps> = ({
  currentRecord, setCurrentRecord, members, setMembers, categories, setCategories, onSaveRecord, onStartNew, defaultFormulas, churchInfo
}) => {
    const { addItem } = useSupabase();
    // State for creating a new record
    const [dateInfo, setDateInfo] = useState({
        day: new Date().getDate().toString(),
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
    });

    // State for adding a donation
    const [selectedMember, setSelectedMember] = useState<Member | null>(null);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(categories.find(c => c === "Diezmo") || categories[0]);

    // State for modal
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newMemberName, setNewMemberName] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateRecord = () => {
        const newRecord: WeeklyRecord = {
            id: `wr-${Date.now()}`,
            day: parseInt(dateInfo.day),
            month: parseInt(dateInfo.month),
            year: parseInt(dateInfo.year),
            minister: churchInfo.defaultMinister,
            offerings: [],
            formulas: defaultFormulas,
        };
        setCurrentRecord(newRecord);
    };

    const handleAddOffering = () => {
        if (!currentRecord || !selectedMember || !amount || parseFloat(amount) <= 0) {
            alert("Por favor, seleccione un miembro y una cantidad válida.");
            return;
        }
        const newOffering: Offering = {
            id: `d-${Date.now()}`,
            memberId: selectedMember.id,
            memberName: selectedMember.name,
            category: category,
            amount: parseFloat(amount),
        };
        setCurrentRecord({ ...currentRecord, offerings: [...currentRecord.offerings, newOffering] });
        setSelectedMember(null);
        setAmount('');
    };

    const handleRemoveOffering = (offeringId: string) => {
        if (currentRecord) {
            setCurrentRecord({
                ...currentRecord,
                offerings: currentRecord.offerings.filter(d => d.id !== offeringId),
            });
        }
    };
    
    const handleAddNewMember = async () => {
        if (!newMemberName.trim() || members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
            alert('El nombre del miembro no puede estar vacío o ya existe.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newMember = await addItem('members', { name: newMemberName.trim() });
            setMembers(prev => [...prev, newMember].sort((a,b) => a.name.localeCompare(b.name)));
            setNewMemberName('');
            alert(`Miembro "${newMember.name}" agregado.`);
        } catch (error) {
            alert(`Error al agregar miembro: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddNewCategory = async () => {
        if (!newCategoryName.trim() || categories.includes(newCategoryName.trim())) {
             alert('La categoría no puede estar vacía o ya existe.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newCategoryItem = await addItem('categories', { name: newCategoryName.trim() });
            setCategories(prev => [...prev, newCategoryItem.name].sort());
            setCategory(newCategoryItem.name);
            setNewCategoryName('');
            alert(`Categoría "${newCategoryItem.name}" agregada.`);
        } catch (error) {
            alert(`Error al agregar categoría: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!currentRecord) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-lg h-full flex flex-col justify-center dark:bg-gray-800">
                <div className="text-center">
                    <Calendar className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
                    <h2 className="text-3xl font-bold text-indigo-900 mt-4 mb-2 dark:text-indigo-300">Iniciar Nuevo Registro Semanal</h2>
                    <p className="text-gray-500 mb-6 dark:text-gray-400">Seleccione la fecha de cierre de la semana (usualmente domingo).</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="day-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día</label>
                        <input type="number" name="day" id="day-reg" value={dateInfo.day} onChange={e => setDateInfo({...dateInfo, day: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                    <div>
                        <label htmlFor="month-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                        <select name="month" id="month-reg" value={dateInfo.month} onChange={e => setDateInfo({...dateInfo, month: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                            {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                        <input type="number" name="year" id="year-reg" value={dateInfo.year} onChange={e => setDateInfo({...dateInfo, year: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                </div>
                <button onClick={handleCreateRecord} className="w-full mt-6 py-3 font-bold text-white text-lg transition duration-300 bg-blue-600 rounded-lg hover:bg-blue-700">
                    Crear Registro
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative dark:bg-gray-800">
                        <button onClick={() => setIsAddModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                            <X className="w-8 h-8"/>
                        </button>
                        <div className="p-6 space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-indigo-900 mb-3 dark:text-indigo-300">Agregar Nuevo Miembro</h3>
                                <div className="flex gap-2">
                                    <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Nombre completo" className="flex-grow p-2 border rounded-md text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"/>
                                    <button onClick={handleAddNewMember} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Guardar</button>
                                </div>
                            </div>
                            <div className="border-t pt-6 dark:border-gray-700">
                                <h3 className="text-xl font-bold text-indigo-900 mb-3 dark:text-indigo-300">Agregar Nueva Categoría</h3>
                                <div className="flex gap-2">
                                    <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="Nombre de categoría" className="flex-grow p-2 border rounded-md text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"/>
                                    <button onClick={handleAddNewCategory} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Guardar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Registro de Ofrendas</h2>
                        <p className="text-gray-500 dark:text-gray-400">{`Semana del ${currentRecord.day} de ${MONTH_NAMES[currentRecord.month - 1]}, ${currentRecord.year}`}</p>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900" title="Agregar Miembro/Categoría">
                        <Plus className="w-6 h-6"/>
                    </button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                        <AutocompleteInput members={members} onSelect={setSelectedMember} />
                        {selectedMember && (
                            <div className="mt-2 p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex justify-between items-center">
                                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                                    Miembro: <span className="font-bold">{selectedMember.name}</span>
                                </p>
                                <button onClick={() => setSelectedMember(null)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300" aria-label="Limpiar selección">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Cantidad C$" className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"/>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button onClick={handleAddOffering} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                       <Plus className="w-5 h-5"/> Agregar Ofrenda
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                 <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Ofrendas Registradas</h3>
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentRecord.offerings.length > 0 ? (
                        [...currentRecord.offerings].reverse().map(offering => (
                            <div key={offering.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{offering.memberName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{offering.category} - C$ {offering.amount.toFixed(2)}</p>
                                </div>
                                <button onClick={() => handleRemoveOffering(offering.id)} className="text-red-500 hover:text-red-700 p-2 dark:text-red-400 dark:hover:text-red-300"><Trash2 className="w-5 h-5" /></button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8 dark:text-gray-400">Aún no hay ofrendas para esta semana.</p>
                    )}
                 </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800 flex flex-col sm:flex-row gap-4">
                <button onClick={onSaveRecord} className="flex-1 py-3 font-semibold text-white transition duration-300 bg-green-600 rounded-lg hover:bg-green-700">Guardar y Cerrar Semana</button>
                <button onClick={onStartNew} className="flex-1 py-3 font-semibold text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900">Iniciar Nueva Semana</button>
            </div>
        </div>
    );
};

export default RegistroOfrendasTab;