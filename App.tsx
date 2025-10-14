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
    const { error: supabaseError } = useSupabase();

    // Application State Management
    const [members, setMembers] = useLocalStorage<Member[]>('app_members', INITIAL_MEMBERS);
    const [categories, setCategories] = useLocalStorage<string[]>('app_categories', INITIAL_CATEGORIES);
    const [weeklyRecords, setWeeklyRecords] = useLocalStorage<WeeklyRecord[]>('app_weekly_records', []);
    const [currentRecord, setCurrentRecord] = useState<WeeklyRecord | null>(null);
    const [formulas, setFormulas] = useLocalStorage<Formulas>('app_formulas', DEFAULT_FORMULAS);
    const [monthlyReports, setMonthlyReports] = useLocalStorage<MonthlyReport[]>('app_monthly_reports', []);
    const [churchInfo, setChurchInfo] = useLocalStorage<ChurchInfo>('app_church_info', DEFAULT_CHURCH_INFO);
    const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('app_theme', 'light');

    useEffect(() => {
        const loggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const version = sessionStorage.getItem('appVersion') as 'completo' | 'sencillo' | null;
        if (loggedIn) {
            setIsLoggedIn(true);
            if (version) {
                setAppVersion(version);
            }
        }
    }, []);

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

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

    if (!appVersion) {
        // FIX: Changed prop from 'onSelectVersion' to 'onSelect' to match component definition.
        return <VersionSelectionScreen onSelect={handleSelectVersion} />;
    }
    
    const appData = { members, categories, weeklyRecords, currentRecord, formulas, monthlyReports, churchInfo };
    const appHandlers = { setMembers, setCategories, setWeeklyRecords, setCurrentRecord, setFormulas, setMonthlyReports, setChurchInfo };
    const simpleAppHandlers = { setMembers, setCategories, setWeeklyRecords, setCurrentRecord };

    if (appVersion === 'completo') {
        // FIX: Passed all required props to MainApp.
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
        // FIX: Passed all required props to MainAppSencillo.
        return <MainAppSencillo 
            onLogout={handleLogout} 
            onSwitchVersion={handleSwitchVersion}
            data={{ members, categories, weeklyRecords, currentRecord, formulas, churchInfo }}
            handlers={simpleAppHandlers}
            theme={theme}
            toggleTheme={toggleTheme}
        />;
    }

    return null; // Should not happen
};

export default App;
