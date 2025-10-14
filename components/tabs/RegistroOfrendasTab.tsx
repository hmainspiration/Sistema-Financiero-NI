// Fix: Implemented a full functional component instead of a placeholder.
import React, { useState } from 'react';
import { WeeklyRecord, Member, Donation, Formulas, ChurchInfo } from '../../types';
import { MONTH_NAMES } from '../../constants';
import { TrashIcon, PlusIcon, CalendarIcon } from '@heroicons/react/24/outline';

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
            <input type="text" value={inputValue} onChange={handleChange} placeholder="Buscar o escribir nombre..." className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-700 dark:border-gray-600"/>
            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 dark:bg-gray-800 dark:border-gray-600">
                    {suggestions.map(member => (
                        <li key={member.id} onClick={() => handleSelect(member)} className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700">
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

    const handleCreateRecord = () => {
        const newRecord: WeeklyRecord = {
            id: `wr-${Date.now()}`,
            day: parseInt(dateInfo.day),
            month: parseInt(dateInfo.month),
            year: parseInt(dateInfo.year),
            minister: churchInfo.defaultMinister,
            donations: [],
            formulas: defaultFormulas,
        };
        setCurrentRecord(newRecord);
    };

    const handleAddDonation = () => {
        if (!currentRecord || !selectedMember || !amount || parseFloat(amount) <= 0) {
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
        setCurrentRecord({ ...currentRecord, donations: [...currentRecord.donations, newDonation] });
        setSelectedMember(null);
        setAmount('');
    };

    const handleRemoveDonation = (donationId: string) => {
        if (currentRecord) {
            setCurrentRecord({
                ...currentRecord,
                donations: currentRecord.donations.filter(d => d.id !== donationId),
            });
        }
    };
    
    if (!currentRecord) {
        return (
            <div className="p-6 bg-white rounded-xl shadow-lg h-full flex flex-col justify-center dark:bg-gray-800">
                <div className="text-center">
                    <CalendarIcon className="w-16 h-16 mx-auto text-blue-600 dark:text-blue-400" />
                    <h2 className="text-3xl font-bold text-indigo-900 mt-4 mb-2 dark:text-indigo-300">Iniciar Nuevo Registro Semanal</h2>
                    <p className="text-gray-500 mb-6 dark:text-gray-400">Seleccione la fecha de cierre de la semana (usualmente domingo).</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label htmlFor="day-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día</label>
                        <input type="number" name="day" id="day-reg" value={dateInfo.day} onChange={e => setDateInfo({...dateInfo, day: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
                    </div>
                    <div>
                        <label htmlFor="month-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                        <select name="month" id="month-reg" value={dateInfo.month} onChange={e => setDateInfo({...dateInfo, month: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600">
                            {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="year-reg" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                        <input type="number" name="year" id="year-reg" value={dateInfo.year} onChange={e => setDateInfo({...dateInfo, year: e.target.value})} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"/>
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
            <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Registro de Ofrendas</h2>
                <p className="text-gray-500 dark:text-gray-400">{`Semana del ${currentRecord.day} de ${MONTH_NAMES[currentRecord.month - 1]}, ${currentRecord.year}`}</p>
                 <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <AutocompleteInput members={members} onSelect={setSelectedMember} />
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Cantidad C$" className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600"/>
                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600">
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <button onClick={handleAddDonation} className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                       <PlusIcon className="w-5 h-5"/> Agregar Ofrenda
                    </button>
                </div>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                 <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300 mb-4">Donaciones Registradas</h3>
                 <div className="space-y-2 max-h-96 overflow-y-auto">
                    {currentRecord.donations.length > 0 ? (
                        [...currentRecord.donations].reverse().map(donation => (
                            <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-700/50">
                                <div>
                                    <p className="font-semibold">{donation.memberName}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{donation.category} - C$ {donation.amount.toFixed(2)}</p>
                                </div>
                                <button onClick={() => handleRemoveDonation(donation.id)} className="text-red-500 hover:text-red-700 p-2 dark:text-red-400 dark:hover:text-red-300"><TrashIcon className="w-5 h-5" /></button>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-8 dark:text-gray-400">Aún no hay donaciones para esta semana.</p>
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
