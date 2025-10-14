
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// This assumes the Supabase client library is loaded via a script tag in index.html
declare global {
    interface Window {
        supabase: any;
        SUPABASE_URL: string;
        SUPABASE_KEY: string;
    }
}

interface SupabaseContextType {
    supabase: any | null;
    error: string | null;
    uploadFile: (bucket: string, fileName: string, file: Blob, upsert?: boolean) => Promise<any>;
    listFiles: (bucket: string) => Promise<any[] | null>;
    getPublicUrl: (bucket: string, path: string) => string;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export const useSupabase = (): SupabaseContextType => {
    const context = useContext(SupabaseContext);
    if (!context) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
};

export const SupabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [supabase, setSupabase] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Access credentials from the global window object, set in index.html
        const SUPABASE_URL = window.SUPABASE_URL;
        const SUPABASE_KEY = window.SUPABASE_KEY;

        if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes("PEGUE_SU_URL")) {
            setError("La integración con Supabase no está configurada. Por favor, defina SUPABASE_URL y SUPABASE_KEY en el script de configuración dentro de 'index.html'.");
            return;
        }

        try {
            // The createClient function is available globally from the script
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            setSupabase(supabaseClient);
        } catch (e) {
            console.error("Error initializing Supabase client:", e);
            setError(`Error al inicializar el cliente de Supabase: ${e instanceof Error ? e.message : String(e)}`);
        }
    }, []);

    const uploadFile = async (bucket: string, fileName: string, file: Blob, upsert: boolean = true) => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: upsert,
            });

        if (error) throw error;
        return data;
    };

    const listFiles = async (bucket: string): Promise<any[] | null> => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data, error } = await supabase.storage.from(bucket).list(undefined, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        });
        if (error) throw error;
        return data;
    };
    
    const getPublicUrl = (bucket: string, path: string): string => {
        if (!supabase) throw new Error("Supabase client not initialized.");
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        return data.publicUrl;
    };

    const value = {
        supabase,
        error,
        uploadFile,
        listFiles,
        getPublicUrl
    };

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
};
