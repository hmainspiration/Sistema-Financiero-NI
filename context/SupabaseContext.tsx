import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, FC } from 'react';

// This assumes the Supabase client library is loaded via a script tag in index.html
declare global {
    interface Window {
        supabase: any;
    }
}

interface SupabaseContextType {
    supabase: any | null;
    error: string | null;
    // File storage functions
    uploadFile: (bucket: string, fileName: string, file: Blob, upsert?: boolean) => Promise<any>;
    listFiles: (bucket: string) => Promise<any[] | null>;
    getPublicUrl: (bucket: string, path: string) => string;
    // Database table functions
    fetchItems: (tableName: string) => Promise<any[]>;
    addItem: (tableName: string, item: object) => Promise<any>;
    updateItem: (tableName: string, id: any, updates: object) => Promise<any>;
    deleteItem: (tableName: string, id: any) => Promise<any>;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = (): SupabaseContextType => {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

export const SupabaseProvider: FC<{ children: ReactNode }> = ({ children }) => {
    const [supabase, setSupabase] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Read Supabase credentials from Vite's environment variables
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY) {
            setError("La configuración de Supabase no se encontró. Asegúrese de que VITE_SUPABASE_URL y VITE_SUPABASE_KEY estén definidas en sus variables de entorno.");
            return;
        }

        try {
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            setSupabase(supabaseClient);
        } catch (e) {
            console.error("Error initializing Supabase client:", e);
            setError(`Error al inicializar el cliente de Supabase: ${e instanceof Error ? e.message : String(e)}`);
        }
    }, []);

    // --- File Storage Methods ---

    const uploadFile = async (bucket: string, fileName: string, file: Blob, upsert: boolean = true) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data, error: uploadError } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '3600', upsert });
        if (uploadError) {
            setError(uploadError.message);
            throw uploadError;
        }
        return data;
    };

    const listFiles = async (bucket: string): Promise<any[] | null> => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data, error: listError } = await supabase.storage.from(bucket).list(undefined, { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
        if (listError) {
            setError(listError.message);
            throw listError;
        }
        return data;
    };
    
    const getPublicUrl = (bucket: string, path: string): string => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };
    
    // --- Database Table Methods ---

    const fetchItems = useCallback(async (tableName: string) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        // FIX: Removed default ordering by 'name' to support tables without that column (e.g., 'comisionados').
        const { data, error: fetchError } = await supabase.from(tableName).select('*');
        if (fetchError) {
            setError(fetchError.message);
            throw fetchError;
        }
        return data;
    }, [supabase]);

    const addItem = useCallback(async (tableName: string, item: object) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data, error: addError } = await supabase.from(tableName).insert([item]).select();
        if (addError) {
            setError(addError.message);
            throw addError;
        }
        return data[0];
    }, [supabase]);

    const updateItem = useCallback(async (tableName: string, id: any, updates: object) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data, error: updateError } = await supabase.from(tableName).update(updates).eq('id', id).select();
        if (updateError) {
            setError(updateError.message);
            throw updateError;
        }
        return data[0];
    }, [supabase]);

    const deleteItem = useCallback(async (tableName: string, id: any) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { error: deleteError } = await supabase.from(tableName).delete().eq('id', id);
        if (deleteError) {
            setError(deleteError.message);
            throw deleteError;
        }
    }, [supabase]);


    const value = {
        supabase,
        error,
        uploadFile,
        listFiles,
        getPublicUrl,
        fetchItems,
        addItem,
        updateItem,
        deleteItem
    };

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
};