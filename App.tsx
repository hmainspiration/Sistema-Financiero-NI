// Fix: Implemented the main App component with routing and state management.
import React, { useState, useEffect } from 'react';
import LoginScreen from './components/LoginScreen';
import VersionSelectionScreen from './screens/VersionSelectionScreen';
import MainApp from './screens/MainApp';
import MainAppSencillo from './screens/MainAppSencillo';
import { useSupabase } from './context/SupabaseContext';
import { Member, WeeklyRecord, Formulas, MonthlyReport, ChurchInfo } from './types';
import { INITIAL_MEMBERS, INITIAL_CATEGORIES, DEFAULT_FORMULAS, DEFAULT_CHURCH_INFO } from './constants';

// A custom hook to manage state in localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value: T | ((val: T) => T)) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
}

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [appVersion, setAppVersion] = useState<'completo' | 'sencillo' | null>(null);
    const { supabase, error: supabaseError, fetchItems, addItem } = useSupabase();

    // --- State Management ---
    const [members, setMembers] = useState<Member[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState("Cargando datos desde la nube...");


    // Other states remain in localStorage as they are session/device specific
    const [weeklyRecords, setWeeklyRecords] = useLocalStorage<WeeklyRecord[]>('app_weekly_records', []);
    const [currentRecord, setCurrentRecord] = useState<WeeklyRecord | null>(null);
    const [formulas, setFormulas] = useLocalStorage<Formulas>('app_formulas', DEFAULT_FORMULAS);
    const [monthlyReports, setMonthlyReports] = useLocalStorage<MonthlyReport[]>('app_monthly_reports', []);
    const [churchInfo, setChurchInfo] = useLocalStorage<ChurchInfo>('app_church_info', DEFAULT_CHURCH_INFO);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('app_theme', 'light');

    // --- Effects ---
    useEffect(() => {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const version = sessionStorage.getItem('appVersion') as 'completo' | 'sencillo' | null;
        if (loggedIn) {
            setIsLoggedIn(true);
            if (version) {
                setAppVersion(version);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    // Data Sanitization Effect: Runs once on mount to clean up old data formats.
    useEffect(() => {
        const storedRecordsRaw = window.localStorage.getItem('app_weekly_records');
        if (storedRecordsRaw) {
            try {
                const parsedRecords: WeeklyRecord[] = JSON.parse(storedRecordsRaw);
                let wasMutated = false;
                
                const sanitizedRecords = parsedRecords.map(record => {
                    let newRecord = { ...record };
                    // Ensure 'offerings' exists and is an array
                    if (!Array.isArray(newRecord.offerings)) {
                        newRecord.offerings = [];
                        wasMutated = true;
                    }
                    // Ensure 'formulas' exists and is an object
                    if (typeof newRecord.formulas !== 'object' || newRecord.formulas === null) {
                        newRecord.formulas = DEFAULT_FORMULAS;
                        wasMutated = true;
                    }
                    return newRecord;
                });

                if (wasMutated) {
                    console.warn("Sanitizing old weekly records format from localStorage...");
                    setWeeklyRecords(sanitizedRecords);
                }
            } catch (e) {
                console.error("Failed to parse or sanitize weekly records from localStorage", e);
            }
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    useEffect(() => {
        if (isLoggedIn && supabase) {
            const loadInitialData = async () => {
                setIsLoading(true);
                try {
                    let fetchedMembers = await fetchItems('members');
                    let fetchedCategories = await fetchItems('categories');

                    // If database is empty, seed with initial data from constants
                    if (fetchedMembers.length === 0) {
                        setLoadingMessage("Configurando su base de datos por primera vez (Miembros)...");
                        for (const member of INITIAL_MEMBERS) {
                           await addItem('members', { name: member.name });
                        }
                        fetchedMembers = await fetchItems('members'); // Refetch after seeding
                    }
                    setMembers(fetchedMembers);
                    
                    if (fetchedCategories.length === 0) {
                        setLoadingMessage("Configurando su base de datos por primera vez (Categorías)...");
                        for (const categoryName of INITIAL_CATEGORIES) {
                           await addItem('categories', { name: categoryName });
                        }
                         const refetchedCategories = await fetchItems('categories');
                         fetchedCategories = refetchedCategories;
                    }
                    setCategories(fetchedCategories.map((c: any) => c.name));
                    
                } catch (error) {
                    // FIX: Improved error logging to show a clear message instead of "[object Object]".
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    console.error("Failed to fetch initial data from Supabase:", errorMessage);
                    
                    // Fallback to constants if fetch fails
                    console.warn("Falling back to initial constant data due to Supabase fetch error.");
                    setMembers(INITIAL_MEMBERS);
                    setCategories(INITIAL_CATEGORIES);

                } finally {
                    setIsLoading(false);
                    setLoadingMessage("Cargando datos desde la nube...");
                }
            };
            loadInitialData();
        }
    }, [isLoggedIn, supabase, fetchItems, addItem]);


    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);
    
    // --- Handlers ---
    const handleLoginSuccess = () => {
        sessionStorage.setItem('isLoggedIn', 'true');
        setIsLoggedIn(true);
    };

    const handleSelectVersion = (version: 'completo' | 'sencillo') => {
        sessionStorage.setItem('appVersion', version);
        setAppVersion(version);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('appVersion');
        setIsLoggedIn(false);
        setAppVersion(null);
    };

    const handleSwitchVersion = () => {
        sessionStorage.removeItem('appVersion');
        setAppVersion(null);
    };

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // --- Render Logic ---
    if (supabaseError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50 text-red-800 p-4">
                <div className="max-w-md text-center">
                    <h1 className="text-2xl font-bold mb-4">Error de Configuración</h1>
                    <p>{supabaseError}</p>
                </div>
            </div>
        );
    }
    
    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    if (isLoading) {
        return (
             <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-8 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-200">{loadingMessage}</p>
            </div>
        )
    }

    if (!appVersion) {
        return <VersionSelectionScreen onSelect={handleSelectVersion} />;
    }
    
    const appData = { members, categories, weeklyRecords, currentRecord, formulas, monthlyReports, churchInfo };
    const appHandlers = { setMembers, setCategories, setWeeklyRecords, setCurrentRecord, setFormulas, setMonthlyReports, setChurchInfo };

    if (appVersion === 'completo') {
        return <MainApp 
            onLogout={handleLogout} 
            onSwitchVersion={handleSwitchVersion}
            data={appData}
            handlers={appHandlers}
            theme={theme}
            toggleTheme={toggleTheme}
        />;
    }

    if (appVersion === 'sencillo') {
        return <MainAppSencillo 
            onLogout={handleLogout} 
            onSwitchVersion={handleSwitchVersion}
            data={appData}
            handlers={appHandlers}
            theme={theme}
            toggleTheme={toggleTheme}
        />;
    }

    return null; // Should not happen
};

export default App;