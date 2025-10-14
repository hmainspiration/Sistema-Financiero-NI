import React, { useState, useMemo, useEffect } from 'react';
import { WeeklyRecord, Member, Donation, Formulas, ChurchInfo } from '../../types';
import { PencilIcon, TrashIcon, XMarkIcon, PlusIcon, CloudArrowUpIcon, DocumentArrowDownIcon, ArrowDownOnSquareStackIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES } from '../../constants';
import { useSupabase } from '../../context/SupabaseContext';

// Copied from RegistroOfrendasTab, to be used inside the modal
interface AutocompleteInputProps {
  members: Member[];
  onSelect: (member: Member) => void;
  selectedMemberName: string;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ members, onSelect, selectedMemberName }) => {
  const [inputValue, setInputValue] = useState(selectedMemberName);
  const [suggestions, setSuggestions] = useState<Member[]>([]);

  useEffect(() => {
    setInputValue(selectedMemberName);
  }, [selectedMemberName]);

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
    setInputValue(member.name);
    setSuggestions([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={handleChange}
        placeholder="Escriba el nombre del miembro..."
        className="w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 overflow-y-auto bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 dark:bg-gray-800 dark:border-gray-600">
          {suggestions.map(member => (
            <li
              key={member.id}
              onClick={() => handleSelect(member)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              {member.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const UploadedReportsList: React.FC<{
    records: WeeklyRecord[];
    setRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
    formulas: Formulas;
    churchInfo: ChurchInfo;
}> = ({ records, setRecords, formulas, churchInfo }) => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { supabase, listFiles, getPublicUrl } = useSupabase();
    const [isLoadingToApp, setIsLoadingToApp] = useState<string | null>(null);

    const monthNameToNumber = useMemo(() => 
        Object.fromEntries(MONTH_NAMES.map((name, i) => [name.toLowerCase(), i + 1]))
    , []);

    useEffect(() => {
        if (!supabase) return;

        const fetchFiles = async () => {
            try {
                setLoading(true);
                setError(null);
                const fileList = await listFiles('reportes-semanales');
                setFiles(fileList || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al cargar los reportes.');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, [supabase, listFiles]);
    
    const handleLoadToApp = async (file: any) => {
        setIsLoadingToApp(file.id);
        try {
            // 1. Parse filename to get date
            const nameParts = file.name.split('_')[0].split('-');
            if (nameParts.length < 3) throw new Error("Nombre de archivo no válido para extraer fecha.");
            
            const day = parseInt(nameParts[0]);
            const monthName = nameParts[1].toLowerCase();
            const year = 2000 + parseInt(nameParts[2]);
            const month = monthNameToNumber[monthName];

            if (!day || !month || !year) throw new Error("No se pudo extraer una fecha válida del nombre del archivo.");
            
            // 2. Fetch and parse Excel file
            const url = getPublicUrl('reportes-semanales', file.name);
            const response = await fetch(url);
            if (!response.ok) throw new Error("No se pudo descargar el archivo.");
            const arrayBuffer = await response.arrayBuffer();
            const wb = (window as any).XLSX.read(arrayBuffer, { type: 'buffer' });
            const ws = wb.Sheets['Detalle de Ofrendas'];
            if (!ws) throw new Error("La hoja 'Detalle de Ofrendas' no se encontró en el archivo.");
            const donationsJson = (window as any).XLSX.utils.sheet_to_json(ws);
            
            const donations: Donation[] = donationsJson.map((d: any, index: number) => ({
                id: `d-${Date.now()}-${index}`,
                memberId: `m-cloud-${Date.now()}-${index}`,
                memberName: d['Miembro'],
                category: d['Categoría'],
                amount: d['Monto'],
            }));

            // 3. Create a new WeeklyRecord object
            const newRecord: WeeklyRecord = {
                id: `wr-cloud-${Date.now()}`,
                day, month, year,
                minister: churchInfo.defaultMinister,
                donations,
                formulas: formulas,
            };

            // 4. Check for duplicates and update state
            const existingRecord = records.find(r => r.day === day && r.month === month && r.year === year);
            if (existingRecord) {
                if (window.confirm(`Ya existe un registro local para el ${day}/${month}/${year}. ¿Desea sobrescribirlo con los datos de la nube?`)) {
                    setRecords(prev => prev.map(r => r.id === existingRecord.id ? { ...newRecord, id: existingRecord.id } : r));
                    alert("Registro local actualizado con éxito desde la nube.");
                }
            } else {
                setRecords(prev => [...prev, newRecord]);
                alert("Registro cargado desde la nube y añadido a la lista local.");
            }

        } catch (e) {
            alert(`Error al cargar la semana en la app: ${e instanceof Error ? e.message : String(e)}`);
        } finally {
            setIsLoadingToApp(null);
        }
    };


    if (loading) {
        return <div className="p-4 text-center text-gray-500 dark:text-gray-400">Cargando reportes de la nube...</div>;
    }

    if (error) {
        return <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-300">{error}</div>;
    }
    
    return (
        <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-indigo-900 mb-4 dark:text-indigo-300">Reportes Semanales en la Nube</h2>
            {files.length > 0 ? (
                <ul className="space-y-3 max-h-72 overflow-y-auto">
                    {files.map(file => (
                        <li key={file.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 bg-gray-50 rounded-md border dark:bg-gray-700/50 dark:border-gray-600">
                           <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">{file.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Subido: {new Date(file.created_at).toLocaleString()}</p>
                           </div>
                           <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <button
                                    onClick={() => handleLoadToApp(file)}
                                    disabled={isLoadingToApp === file.id}
                                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                                >
                                    {isLoadingToApp === file.id
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        : <ArrowDownOnSquareStackIcon className="w-4 h-4"/>
                                    }
                                    <span>{isLoadingToApp === file.id ? 'Cargando...' : 'Cargar en App'}</span>
                                </button>
                                <a 
                                 href={getPublicUrl('reportes-semanales', file.name)}
                                 target="_blank"
                                 rel="noopener noreferrer"
                                 className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700"
                                >
                                   <DocumentArrowDownIcon className="w-4 h-4"/>
                                   <span>Descargar</span>
                                </a>
                           </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500 py-4 dark:text-gray-400">No hay reportes semanales en la nube.</p>
            )}
        </div>
    );
};


interface SemanasRegistradasTabProps {
  records: WeeklyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<WeeklyRecord[]>>;
  members: Member[];
  categories: string[];
  formulas: Formulas;
  churchInfo: ChurchInfo;
}

const SemanasRegistradasTab: React.FC<SemanasRegistradasTabProps> = ({ records, setRecords, members, categories, formulas, churchInfo }) => {
  const [editingRecord, setEditingRecord] = useState<WeeklyRecord | null>(null);
  const [tempRecord, setTempRecord] = useState<WeeklyRecord | null>(null);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const supabase = useSupabase();

  // Modal form state
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(categories[0] || '');

  useEffect(() => {
    if (editingRecord) {
      setTempRecord(JSON.parse(JSON.stringify(editingRecord))); // Deep copy
    } else {
      setTempRecord(null);
    }
  }, [editingRecord]);

  const handleOpenEditModal = (record: WeeklyRecord) => {
    setEditingRecord(record);
  };

  const handleCloseModal = () => {
    setEditingRecord(null);
  };

  const handleSaveChanges = () => {
    if (tempRecord) {
      setRecords(prevRecords => prevRecords.map(r => r.id === tempRecord.id ? tempRecord : r));
      handleCloseModal();
    }
  };

  const handleDelete = (recordId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta semana registrada? Esta acción no se puede deshacer.')) {
        setRecords(prevRecords => prevRecords.filter(r => r.id !== recordId));
    }
  };

  const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (tempRecord) {
      const { name, value } = e.target;
      const isNumeric = ['day', 'month', 'year'].includes(name);
      setTempRecord({ ...tempRecord, [name]: isNumeric ? parseInt(value) : value });
    }
  };

  const handleAddDonation = () => {
    if (!tempRecord || !selectedMember || !amount || parseFloat(amount) <= 0) {
      alert('Por favor, seleccione un miembro e ingrese una cantidad válida.');
      return;
    }
    const newDonation: Donation = {
        id: `d-${Date.now()}`,
        memberId: selectedMember.id,
        memberName: selectedMember.name,
        category: category,
        amount: parseFloat(amount),
    };
    setTempRecord({ ...tempRecord, donations: [...tempRecord.donations, newDonation] });
    setSelectedMember(null);
    setAmount('');
  };

  const handleRemoveDonation = (donationId: string) => {
    if(tempRecord) {
      setTempRecord({ ...tempRecord, donations: tempRecord.donations.filter(d => d.id !== donationId)});
    }
  };
  
  const handleExportAndUpload = async (record: WeeklyRecord) => {
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
    const donationsData = record.donations.map(d => ({ Miembro: d.memberName, Categoría: d.category, Monto: d.amount, }));

    const wb = (window as any).XLSX.utils.book_new();
    const wsSummary = (window as any).XLSX.utils.aoa_to_sheet(summaryData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");
    
    const wsDonations = (window as any).XLSX.utils.json_to_sheet(donationsData);
    (window as any).XLSX.utils.book_append_sheet(wb, wsDonations, "Detalle de Ofrendas");

    const monthName = MONTH_NAMES[record.month - 1];
    const yearShort = record.year.toString().slice(-2);
    const dayPadded = record.day.toString().padStart(2, '0');
    const churchName = (window as any).CHURCH_NAME || 'La_Empresa';
    const fileName = `${dayPadded}-${monthName}-${yearShort}_${churchName.replace(/ /g, '_')}.xlsx`;
    
    const excelBuffer = (window as any).XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    if (supabase.supabase) {
        const bucketName = 'reportes-semanales';
        try {
            setIsUploading(record.id);
            await supabase.uploadFile(bucketName, fileName, blob, true);
            alert(`Reporte semanal guardado exitosamente en la nube: ${fileName}`);
        } catch(err) {
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.toLowerCase().includes('bucket not found')) {
                alert(`Error: El "bucket" (contenedor) de almacenamiento en la nube no fue encontrado.\n\nPor favor, vaya a su panel de Supabase -> Storage y cree un nuevo bucket PÚBLICO con el nombre exacto: '${bucketName}'`);
            } else {
                alert(`Error al subir a Supabase: ${errorMessage}.`);
            }
        } finally {
            setIsUploading(null);
        }
    } else {
        alert("No está conectado a Supabase. Por favor, verifique la configuración en el Panel de Administración.");
    }
  };

  return (
    <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-lg dark:bg-gray-800">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Semanas Registradas (Local)</h2>
        </div>

        <div className="space-y-4">
            {records.length > 0 ? (
                records
                    .sort((a, b) => new Date(b.year, b.month - 1, b.day).getTime() - new Date(a.year, a.month - 1, a.day).getTime())
                    .map(record => (
                        <div key={record.id} className="p-4 bg-white rounded-xl shadow-md flex flex-col sm:flex-row justify-between sm:items-center gap-4 dark:bg-gray-800">
                            <div>
                                <p className="font-bold text-lg text-indigo-900 dark:text-indigo-300">{`Semana del ${record.day} de ${MONTH_NAMES[record.month - 1]} de ${record.year}`}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ministro: {record.minister}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button onClick={() => handleOpenEditModal(record)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-yellow-500 rounded-md hover:bg-yellow-600">
                                    <PencilIcon className="w-4 h-4" /> Editar
                                </button>
                                <button onClick={() => handleDelete(record.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700">
                                    <TrashIcon className="w-4 h-4" /> Eliminar
                                </button>
                                <button 
                                    onClick={() => handleExportAndUpload(record)} 
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:bg-gray-400"
                                    disabled={isUploading === record.id}
                                >
                                    {isUploading === record.id 
                                        ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        : <CloudArrowUpIcon className="w-4 h-4" />
                                    }
                                    {isUploading === record.id ? 'Subiendo...' : 'Subir'}
                                </button>
                            </div>
                        </div>
                    ))
            ) : (
                <div className="p-6 text-center bg-white rounded-xl shadow-lg dark:bg-gray-800">
                    <p className="dark:text-gray-300">No hay semanas registradas. Comience en la pestaña 'Registro'.</p>
                </div>
            )}
        </div>
        
        {supabase.supabase && <UploadedReportsList records={records} setRecords={setRecords} formulas={formulas} churchInfo={churchInfo} />}

        {editingRecord && tempRecord && (
            <div className="fixed inset-0 z-40 bg-black bg-opacity-50 flex justify-center items-start overflow-y-auto p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8 relative dark:bg-gray-800">
                    <div className="sticky top-0 bg-white p-6 border-b rounded-t-2xl z-10 dark:bg-gray-800 dark:border-gray-700">
                         <h3 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Editando Semana</h3>
                         <p className="text-gray-500 dark:text-gray-400">{`${tempRecord.day} de ${MONTH_NAMES[tempRecord.month - 1]} de ${tempRecord.year}`}</p>
                        <button onClick={handleCloseModal} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                            <XMarkIcon className="w-8 h-8"/>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Día</label>
                                <input type="number" name="day" value={tempRecord.day} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                                <select name="month" value={tempRecord.month} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                    {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                                <input type="number" name="year" value={tempRecord.year} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ministro</label>
                                <input type="text" name="minister" value={tempRecord.minister} onChange={handleModalInputChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                            </div>
                        </div>

                        <div className="p-4 border-t space-y-4 dark:border-gray-700">
                            <h4 className="text-lg font-semibold text-indigo-900 dark:text-indigo-300">Agregar Nueva Donación</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div className="md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Miembro</label>
                                    <AutocompleteInput members={members} onSelect={setSelectedMember} selectedMemberName={selectedMember?.name || ''} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="mt-1 w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="mt-1 w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                                </div>
                                <button onClick={handleAddDonation} className="flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <PlusIcon className="w-5 h-5"/> Agregar
                                </button>
                            </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto space-y-2 p-2 bg-gray-50 rounded-lg dark:bg-gray-900/50">
                             <h4 className="text-lg font-semibold text-indigo-900 mb-2 px-2 dark:text-indigo-300">Donaciones Registradas</h4>
                            {tempRecord.donations.length > 0 ? tempRecord.donations.map(donation => (
                                <div key={donation.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm dark:bg-gray-700">
                                    <div>
                                        <p className="font-medium dark:text-gray-200">{donation.memberName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{donation.category} - C$ {donation.amount.toFixed(2)}</p>
                                    </div>
                                    <button onClick={() => handleRemoveDonation(donation.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                                        <TrashIcon className="w-5 h-5"/>
                                    </button>
                                </div>
                            )) : <p className="text-center text-gray-500 py-4 dark:text-gray-400">No hay donaciones en este registro.</p>}
                        </div>

                    </div>
                    <div className="sticky bottom-0 bg-gray-50 p-4 border-t rounded-b-2xl flex justify-end gap-3 dark:bg-gray-800/80 dark:border-gray-700 backdrop-blur-sm">
                        <button onClick={handleCloseModal} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Cancelar</button>
                        <button onClick={handleSaveChanges} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Guardar Cambios</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SemanasRegistradasTab;