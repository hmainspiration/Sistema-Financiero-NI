import React, { useState } from 'react';
import { Member, Formulas, ChurchInfo, Comisionado } from '../../types';
import { useSupabase } from '../../context/SupabaseContext';
import { UserPlus, Pencil, Trash2, Check, X, Server, Wifi, AlertTriangle, Save } from 'lucide-react';


const SupabaseStatusIndicator: React.FC = () => {
    const { supabase, error } = useSupabase();

    if (error) {
        const isCorsError = error.toLowerCase().includes('failed to fetch');

        return (
            <div className="p-4 text-sm text-left text-red-800 bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/50" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Error de conexión a la Nube (Supabase)</p>
                    {isCorsError ? (
                        <div className="mt-2 space-y-2">
                            <p><strong>Error detectado:</strong> Falló la conexión (TypeError: Failed to fetch). Este es comúnmente un <strong>problema de CORS</strong>.</p>
                            <p>CORS es un mecanismo de seguridad del navegador que impide que una página web solicite recursos de un dominio diferente. Para solucionarlo, debe autorizar explícitamente el dominio de esta aplicación en la configuración de su proyecto de Supabase.</p>
                            <p className="font-semibold mt-3">Siga estos pasos para solucionarlo:</p>
                            <ol className="list-decimal list-inside space-y-1 pl-2">
                                <li>Vaya a su panel de control de Supabase en <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline dark:text-blue-400">supabase.com</a>.</li>
                                <li>Seleccione su proyecto.</li>
                                <li>En el menú de la izquierda, haga clic en el ícono de <strong>Configuración del Proyecto</strong> (engranaje).</li>
                                <li>Seleccione <strong>API</strong> en la lista de configuraciones.</li>
                                <li>Busque la sección <strong>Configuración de CORS</strong> (Cross-Origin Resource Sharing).</li>
                                <li>En el campo de texto, agregue una nueva línea con <strong className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded">*</strong> (un asterisco).</li>
                                <li>Haga clic en <strong>Guardar</strong>.</li>
                            </ol>
                            <p className="mt-3 text-xs"><strong>Nota de Seguridad:</strong> Usar <code className="font-mono">*</code> permite el acceso desde cualquier dominio. Para producción, es más seguro reemplazar el asterisco con la URL específica donde se alojará su aplicación.</p>
                        </div>
                    ) : (
                        <p className="mt-2">{error}</p>
                    )}
                  </div>
                </div>
            </div>
        );
    }

    if (supabase) {
        return (
            <div className="flex items-center gap-4 p-3 bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/30 dark:border-green-500/50">
                <Wifi className="w-5 h-5 text-green-800 dark:text-green-300"/>
                <p className="text-sm text-green-800 dark:text-green-300">Conectado a Supabase exitosamente.</p>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg dark:bg-yellow-900/30 dark:border-yellow-500/50">
             <Server className="w-5 h-5 text-yellow-800 dark:text-yellow-300"/>
             <p className="text-sm text-yellow-800 dark:text-yellow-300">Inicializando conexión con Supabase...</p>
        </div>
    );
};


const AdminPanelTab: React.FC<{
    members: Member[];
    setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
    categories: string[];
    setCategories: React.Dispatch<React.SetStateAction<string[]>>;
    formulas: Formulas;
    setFormulas: React.Dispatch<React.SetStateAction<Formulas>>;
    churchInfo: ChurchInfo;
    setChurchInfo: React.Dispatch<React.SetStateAction<ChurchInfo>>;
    comisionados: Comisionado[];
    setComisionados: React.Dispatch<React.SetStateAction<Comisionado[]>>;
}> = ({
    members, setMembers, categories, setCategories, formulas, setFormulas, churchInfo, setChurchInfo, comisionados, setComisionados
}) => {
    const { addItem, updateItem, deleteItem } = useSupabase();
    const [newMemberName, setNewMemberName] = useState('');
    const [newCategory, setNewCategory] = useState('');
    const [tempFormulas, setTempFormulas] = useState<Formulas>(formulas);
    const [tempChurchInfo, setTempChurchInfo] = useState<ChurchInfo>(churchInfo);
    const [editingMember, setEditingMember] = useState<Member | null>(null);
    const [newComisionado, setNewComisionado] = useState({ nombre: '', cargo: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Helper function to map Supabase's snake_case to the app's camelCase
    const mapSupabaseMemberToAppMember = (supabaseMember: any): Member => {
        return {
            id: supabaseMember.id,
            name: supabaseMember.name,
            isActive: supabaseMember.is_active,
        };
    };

    const handleAddMember = async () => {
        if (!newMemberName.trim() || members.some(m => m.name.toLowerCase() === newMemberName.trim().toLowerCase())) {
            alert('El nombre del miembro no puede estar vacío o ya existe.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newMemberFromSupabase = await addItem('members', { name: newMemberName.trim(), is_active: true });
            const appMember = mapSupabaseMemberToAppMember(newMemberFromSupabase);
            setMembers(prev => [...prev, appMember].sort((a,b) => a.name.localeCompare(b.name)));
            setNewMemberName('');
        } catch (error) {
            alert(`Error al agregar miembro: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleToggleMemberActive = async (id: string, newStatus: boolean) => {
      try {
        const updatedMemberFromSupabase = await updateItem('members', id, { is_active: newStatus });
        const appMember = mapSupabaseMemberToAppMember(updatedMemberFromSupabase);
        setMembers(prev => prev.map(m => m.id === appMember.id ? appMember : m));
      } catch (error) {
        alert(`Error al actualizar estado: ${error instanceof Error ? error.message : String(error)}`);
      }
    };

    const handleStartEdit = (member: Member) => {
        setEditingMember(JSON.parse(JSON.stringify(member)));
    };

    const handleSaveEdit = async () => {
        if (editingMember) {
            setIsSubmitting(true);
            try {
                const updatedMemberFromSupabase = await updateItem('members', editingMember.id, { name: editingMember.name });
                const appMember = mapSupabaseMemberToAppMember(updatedMemberFromSupabase);
                setMembers(prev => prev.map(m => m.id === appMember.id ? appMember : m));
                setEditingMember(null);
            } catch (error) {
                 alert(`Error al guardar cambios: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                 setIsSubmitting(false);
            }
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (window.confirm("¿Seguro que quiere eliminar este miembro?")) {
            try {
                await deleteItem('members', id);
                setMembers(prev => prev.filter(m => m.id !== id));
            } catch (error) {
                alert(`Error al eliminar miembro: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    };

    const handleAddCategory = async () => {
        if (!newCategory.trim() || categories.includes(newCategory.trim())) {
            alert('La categoría no puede estar vacía o ya existe.');
            return;
        }
        setIsSubmitting(true);
        try {
            const newItem = await addItem('categories', { name: newCategory.trim() });
            setCategories(prev => [...prev, newItem.name].sort());
            setNewCategory('');
        } catch (error) {
            alert(`Error al agregar categoría: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteCategory = async (catToDelete: string) => {
        if (window.confirm("¿Seguro que quiere eliminar esta categoría?")) {
            try {
                const categoryToDelete = await (window as any).supabase.from('categories').select('id').eq('name', catToDelete).single();
                if (categoryToDelete.data) {
                    await deleteItem('categories', categoryToDelete.data.id);
                    setCategories(prev => prev.filter(c => c !== catToDelete));
                } else {
                    throw new Error("Categoría no encontrada en la base de datos.");
                }
            } catch (error) {
                alert(`Error al eliminar categoría: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    };

    const handleFormulaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTempFormulas(prev => ({...prev, [name]: parseFloat(value) }));
    };

    const handleSaveFormulas = () => {
        setFormulas(tempFormulas);
        alert("Fórmulas guardadas.");
    };

    const handleChurchInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setTempChurchInfo(prev => ({...prev, [name]: value }));
    };

    const handleSaveChurchInfo = () => {
        setChurchInfo(tempChurchInfo);
        alert("Información predeterminada guardada.");
    };

    const handleAddComisionado = async () => {
        if (!newComisionado.nombre.trim() || !newComisionado.cargo.trim()) {
            alert('Nombre y cargo son requeridos.');
            return;
        }
        setIsSubmitting(true);
        try {
            const added = await addItem('comisionados', newComisionado);
            setComisionados(prev => [...prev, added].sort((a,b) => a.nombre.localeCompare(b.nombre)));
            setNewComisionado({ nombre: '', cargo: '' });
        } catch (error) {
            alert(`Error al agregar comisionado: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComisionado = async (id: string) => {
        if (window.confirm("¿Seguro que quiere eliminar este comisionado?")) {
            try {
                await deleteItem('comisionados', id);
                setComisionados(prev => prev.filter(c => c.id !== id));
            } catch (error) {
                alert(`Error al eliminar comisionado: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">Panel de Administración</h2>
            <SupabaseStatusIndicator />

            <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 dark:text-indigo-300">Gestión de Miembros</h3>
                <div className="flex gap-2 mb-4">
                    <input type="text" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} placeholder="Nombre completo" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    <button onClick={handleAddMember} disabled={isSubmitting} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">
                        <UserPlus className="w-5 h-5"/> Añadir
                    </button>
                </div>
                <ul className="space-y-2 max-h-72 overflow-y-auto">
                    {members.map(member => (
                        <li key={member.id} className={`flex items-center justify-between p-2 rounded-md ${member.isActive ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-gray-200 dark:bg-gray-600'}`}>
                           {editingMember?.id === member.id ? (
                                <div className="flex-grow flex gap-2 items-center">
                                    <input type="text" value={editingMember.name} onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })} className="flex-grow p-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" autoFocus />
                                    <button onClick={handleSaveEdit} disabled={isSubmitting} className="p-2 text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></button>
                                    <button onClick={() => setEditingMember(null)} className="p-2 text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                                </div>
                            ) : (
                                <>
                                    <span className={`${!member.isActive && 'line-through'}`}>{member.name}</span>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleToggleMemberActive(member.id, !member.isActive)} title={member.isActive ? "Marcar como inactivo" : "Marcar como activo"} className={`px-2 py-1 text-xs rounded-full ${member.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                                            {member.isActive ? "Activo" : "Inactivo"}
                                        </button>
                                        <button onClick={() => handleStartEdit(member)} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteMember(member.id)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
            
            <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 dark:text-indigo-300">Gestión de Categorías</h3>
                 <div className="flex gap-2 mb-4">
                    <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nombre de categoría" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <button onClick={handleAddCategory} disabled={isSubmitting} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Añadir</button>
                </div>
                 <ul className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <li key={cat} className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm dark:bg-gray-700">
                            <span>{cat}</span>
                            <button onClick={() => handleDeleteCategory(cat)} className="text-red-500 hover:text-red-700"><X className="w-4 h-4"/></button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">Fórmulas de Cálculo</h3>
                    <button onClick={handleSaveFormulas} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><Save className="w-5 h-5"/> Guardar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Porcentaje Diezmo (%)</label>
                        <input type="number" name="diezmoPercentage" value={tempFormulas.diezmoPercentage} onChange={handleFormulaChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Umbral Remanente (C$)</label>
                        <input type="number" name="remanenteThreshold" value={tempFormulas.remanenteThreshold} onChange={handleFormulaChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-indigo-900 dark:text-indigo-300">Información de Iglesia</h3>
                    <button onClick={handleSaveChurchInfo} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"><Save className="w-5 h-5"/> Guardar</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ministro por Defecto</label>
                        <input type="text" name="defaultMinister" value={tempChurchInfo.defaultMinister} onChange={handleChurchInfoChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Grado del Ministro</label>
                        <input type="text" name="ministerGrade" value={tempChurchInfo.ministerGrade} onChange={handleChurchInfoChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distrito</label>
                        <input type="text" name="district" value={tempChurchInfo.district} onChange={handleChurchInfoChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Departamento</label>
                        <input type="text" name="department" value={tempChurchInfo.department} onChange={handleChurchInfoChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Teléfono Ministro</label>
                        <input type="text" name="ministerPhone" value={tempChurchInfo.ministerPhone} onChange={handleChurchInfoChange} className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"/>
                    </div>
                </div>
            </div>

             <div className="p-4 bg-white rounded-xl shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-bold text-indigo-900 mb-4 dark:text-indigo-300">Comisión de Finanzas</h3>
                <div className="flex flex-col md:flex-row gap-2 mb-4">
                    <input type="text" value={newComisionado.nombre} onChange={(e) => setNewComisionado({...newComisionado, nombre: e.target.value})} placeholder="Nombre completo" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <input type="text" value={newComisionado.cargo} onChange={(e) => setNewComisionado({...newComisionado, cargo: e.target.value})} placeholder="Cargo" className="flex-grow p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                    <button onClick={handleAddComisionado} disabled={isSubmitting} className="flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400">Añadir</button>
                </div>
                <ul className="space-y-2">
                    {comisionados.map(com => (
                        <li key={com.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md dark:bg-gray-700/50">
                            <div>
                                <p className="font-semibold">{com.nombre}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{com.cargo}</p>
                            </div>
                            <button onClick={() => handleDeleteComisionado(com.id)} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AdminPanelTab;
