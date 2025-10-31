import React, { useState, useMemo, FC, useEffect, useCallback, ReactNode, memo, ChangeEvent } from 'react';
import { WeeklyRecord, Formulas, MonthlyReport, MonthlyReportFormState, ChurchInfo, Comisionado, Member } from '../../types';
import { MONTH_NAMES, initialMonthlyReportFormState } from '../../constants';
import { Upload, Trash2, Save, FileDown } from 'lucide-react';
import { useSupabase } from '../../context/SupabaseContext';


interface InformeMensualTabProps {
    records: WeeklyRecord[];
    formulas: Formulas;
    savedReports: MonthlyReport[];
    setSavedReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
    churchInfo: ChurchInfo;
    comisionados: Comisionado[];
    members: Member[];
}

const Accordion: FC<{ title: string, children: ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-white rounded-xl shadow-md dark:bg-gray-800">
            <button
                type="button"
                className="w-full p-5 text-left font-semibold text-lg flex justify-between items-center text-gray-800 dark:text-gray-100"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transform transition-transform text-gray-500 dark:text-gray-400 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div
                className="overflow-hidden transition-all duration-300 ease-out"
                style={{ maxHeight: isOpen ? '2000px' : '0' }}
            >
                <div className="px-5 pb-5 pt-4 border-t dark:border-gray-700">
                    {children}
                </div>
            </div>
        </div>
    );
};

const CurrencyInput: FC<{ id: string, placeholder: string, value: string, onChange: (e: ChangeEvent<HTMLInputElement>) => void }> = memo(({ id, placeholder, value, onChange }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none dark:text-gray-400">C$</span>
        <input type="number" step="0.01" id={id} name={id} placeholder={placeholder} value={value} onChange={onChange} className="w-full p-2 border rounded-lg pl-10 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
    </div>
));

// Helper components for building the form moved outside the main component to prevent re-creation on render
const Subheading: FC<{ title: string }> = ({ title }) => <h4 className="md:col-span-2 font-semibold text-gray-800 mb-2 mt-4 border-b pb-1 dark:text-gray-200 dark:border-gray-600">{title}</h4>;

const Field: FC<{
    id: keyof MonthlyReportFormState;
    label: string;
    isCurrency?: boolean;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}> = memo(({ id, label, isCurrency = true, value, onChange }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">{label}</label>
        {isCurrency ? (
            <CurrencyInput id={id} placeholder="0.00" value={value} onChange={onChange} />
        ) : (
            <input type="text" id={id} name={id} value={value} onChange={onChange} placeholder={label} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
        )}
    </div>
));


const calculateReportTotals = (formData: MonthlyReportFormState) => {
    const getNumericValue = (key: keyof MonthlyReportFormState) => parseFloat(formData[key]) || 0;

    const ingOfrendas = ['ing-diezmos', 'ing-ofrendas-ordinarias', 'ing-primicias', 'ing-ayuda-encargado'].reduce((sum, key) => sum + getNumericValue(key as keyof MonthlyReportFormState), 0);
    const ingEspeciales = ['ing-ceremonial', 'ing-ofrenda-especial-sdd', 'ing-evangelizacion', 'ing-santa-cena'].reduce((sum, key) => sum + getNumericValue(key as keyof MonthlyReportFormState), 0);
    const ingLocales = [
        'ing-servicios-publicos', 'ing-arreglos-locales', 'ing-mantenimiento', 'ing-construccion-local',
        'ing-muebles', 'ing-viajes-ministro', 'ing-reuniones-ministeriales', 'ing-atencion-ministros',
        'ing-viajes-extranjero', 'ing-actividades-locales', 'ing-ciudad-lldm', 'ing-adquisicion-terreno'
    ].reduce((sum, key) => sum + getNumericValue(key as keyof MonthlyReportFormState), 0);
    
    const totalIngresos = ingOfrendas + ingEspeciales + ingLocales;
    const saldoAnterior = getNumericValue('saldo-anterior');
    const totalDisponible = saldoAnterior + totalIngresos;

    const egrEspeciales = ['egr-ceremonial', 'egr-ofrenda-especial-sdd', 'egr-evangelizacion', 'egr-santa-cena'].reduce((sum, key) => sum + getNumericValue(key as keyof MonthlyReportFormState), 0);
    const egrLocales = [
        'egr-servicios-publicos', 'egr-arreglos-locales', 'egr-mantenimiento', 'egr-traspaso-construccion',
        'egr-muebles', 'egr-viajes-ministro', 'egr-reuniones-ministeriales', 'egr-atencion-ministros',
        'egr-viajes-extranjero', 'egr-actividades-locales', 'egr-ciudad-lldm', 'egr-adquisicion-terreno'
    ].reduce((sum, key) => sum + getNumericValue(key as keyof MonthlyReportFormState), 0);

    const totalSalidas = getNumericValue('egr-gomer') + egrEspeciales + egrLocales;
    const remanente = totalDisponible - totalSalidas;

    return {
        ingOfrendas, ingEspeciales, ingLocales, totalIngresos, saldoAnterior, totalDisponible,
        egrEspeciales, egrLocales, totalSalidas, remanente
    };
};

const UploadedMonthlyReportsList: React.FC = () => {
    const [files, setFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { supabase, listFiles, getPublicUrl } = useSupabase();

    useEffect(() => {
        if (!supabase) {
            setLoading(false);
            setError("Supabase client not initialized.");
            return;
        }

        const fetchFiles = async () => {
            try {
                setLoading(true);
                setError(null);
                const fileList = await listFiles('reportes-mensuales');
                setFiles(fileList || []);
            } catch (e) {
                setError(e instanceof Error ? e.message : 'Error al cargar los reportes de la nube.');
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchFiles();
    }, [supabase, listFiles]);

    if (loading) {
        return <p className="text-center text-gray-500 py-2 dark:text-gray-400">Cargando reportes de la nube...</p>;
    }

    if (error) {
        return <div className="p-3 text-center text-red-600 bg-red-50 rounded-lg dark:bg-red-900/30 dark:text-red-300">{error}</div>;
    }

    return (
        <div className="space-y-3 max-h-60 overflow-y-auto p-1">
            {files.length > 0 ? (
                files.map(file => (
                    <div key={file.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border dark:bg-gray-700 dark:border-gray-600">
                        <div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200">{file.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Subido: {new Date(file.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                            <a
                                href={getPublicUrl('reportes-mensuales', file.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                            >
                                <FileDown className="w-4 h-4" />
                                Descargar
                            </a>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center text-gray-500 py-2 dark:text-gray-400">No hay informes mensuales en la nube.</p>
            )}
        </div>
    );
};


const InformeMensualTab: React.FC<InformeMensualTabProps> = ({ records, formulas, savedReports, setSavedReports, churchInfo, comisionados, members }) => {
    const [formState, setFormState] = useState<MonthlyReportFormState>(initialMonthlyReportFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const { uploadFile, supabase } = useSupabase();

    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    }, []);

    const handleLoadData = () => {
        const filteredRecords = records.filter(r => r.month === selectedMonth && r.year === selectedYear);
        if (filteredRecords.length === 0) {
            alert(`No se encontraron registros para ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`);
            return;
        }

        const publicServiceCategories = ["Luz", "Agua"];
        let totalDiezmo = 0, totalOrdinaria = 0, totalServicios = 0, totalGomer = 0, totalDiezmoDeDiezmo = 0;
        
        const activeMembersCount = members.filter(m => m.isActive).length;

        filteredRecords.forEach(record => {
            let weeklyDiezmo = 0, weeklyOrdinaria = 0;
            record.offerings.forEach(d => {
                if (d.category === "Diezmo") weeklyDiezmo += d.amount;
                if (d.category === "Ordinaria") weeklyOrdinaria += d.amount;
                if (publicServiceCategories.includes(d.category)) totalServicios += d.amount;
            });

            totalDiezmo += weeklyDiezmo;
            totalOrdinaria += weeklyOrdinaria;

            const weeklyTotal = weeklyDiezmo + weeklyOrdinaria;
            const weeklyDiezmoDeDiezmo = Math.round(weeklyTotal * (record.formulas.diezmoPercentage / 100));
            
            totalDiezmoDeDiezmo += weeklyDiezmoDeDiezmo;
            totalGomer += Math.round(weeklyTotal - weeklyDiezmoDeDiezmo);
        });

        setFormState(prev => ({
            ...prev,
            'clave-iglesia': (window as any).CHURCH_NAME || 'La Empresa',
            'nombre-iglesia': (window as any).CHURCH_NAME || 'La Empresa',
            'nombre-ministro': churchInfo.defaultMinister || filteredRecords[0]?.minister || '',
            'grado-ministro': churchInfo.ministerGrade,
            'distrito': churchInfo.district,
            'departamento': churchInfo.department,
            'tel-ministro': churchInfo.ministerPhone,
            'mes-reporte': MONTH_NAMES[selectedMonth - 1],
            'ano-reporte': selectedYear.toString(),
            'miembros-activos': activeMembersCount.toString(),
            'ing-diezmos': totalDiezmo > 0 ? totalDiezmo.toFixed(2) : '',
            'ing-ofrendas-ordinarias': totalOrdinaria > 0 ? totalOrdinaria.toFixed(2) : '',
            'ing-servicios-publicos': totalServicios > 0 ? totalServicios.toFixed(2) : '',
            'egr-servicios-publicos': totalServicios > 0 ? totalServicios.toFixed(2) : '',
            'egr-gomer': totalGomer > 0 ? totalGomer.toFixed(2) : '',
            'dist-direccion': totalDiezmoDeDiezmo > 0 ? totalDiezmoDeDiezmo.toFixed(2) : '',
            'egr-asignacion': formulas.remanenteThreshold.toString(),
        }));
         alert(`Datos cargados para ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`);
    };

    const formatCurrency = (value: number) => `C$ ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const createPdfBlob = (formData: MonthlyReportFormState): { blob: Blob, fileName: string } => {
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        
        const logoBase64 = "data:image/png;base64,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";
        
        const calculations = calculateReportTotals(formData);
        const getNumericValue = (key: keyof MonthlyReportFormState) => parseFloat(formData[key]) || 0;

        const pageW = doc.internal.pageSize.getWidth();
        const margin = 10;
        let startY = 12;
        const getText = (key: keyof MonthlyReportFormState) => formData[key] || '';
        const getValue = (key: keyof MonthlyReportFormState) => formatCurrency(getNumericValue(key));
        
        const comisionNombres = comisionados.slice(0, 3).map(c => c.nombre);
        const firma1 = comisionNombres[0] || 'Firma 1';
        const firma2 = comisionNombres[1] || 'Firma 2';
        const firma3 = comisionNombres[2] || 'Firma 3';

        doc.addImage(logoBase64, 'PNG', margin, startY, 25, 25);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text("IGLESIA DEL DIOS VIVO COLUMNA Y APOYO DE LA VERDAD", pageW / 2, startY + 5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text("La Luz del Mundo", pageW / 2, startY + 10, { align: 'center' });
        doc.setFontSize(8);
        doc.text("MINISTERIO DE ADMINISTRACIÓN FINANCIERA", pageW / 2, startY + 16, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.text("INFORMACIÓN FINANCIERA MENSUAL", pageW / 2, startY + 21, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.text(`Jurisdicción Nicaragua, C.A.`, pageW / 2, startY + 26, { align: 'center' });
        startY += 35;

        const bodyStyle = { fontSize: 7, cellPadding: 0.8, lineColor: '#000', lineWidth: 0.1 };
        const headStyle = { fontSize: 7.5, fontStyle: 'bold', fillColor: '#08818C', textColor: '#FFFFFF', halign: 'center', lineColor: '#000', lineWidth: 0.1 };
        const rightAlign = { halign: 'right' };
        const subheadStyle = { fontStyle: 'bold', fillColor: '#DCEAF7' };
        
        doc.autoTable({
            startY: startY,
            body: [
                [{ content: 'Datos de este Informe', colSpan: 4, styles: { ...headStyle, fontSize: 8 } }],
                [{ content: 'Del Mes de:', styles: { fontStyle: 'bold' } }, getText('mes-reporte'), { content: 'Del Año:', styles: { fontStyle: 'bold' } }, getText('ano-reporte')],
                [{ content: 'Clave Iglesia:', styles: { fontStyle: 'bold' } }, getText('clave-iglesia'), { content: 'Nombre Iglesia:', styles: { fontStyle: 'bold' } }, getText('nombre-iglesia')],
                [{ content: 'Distrito:', styles: { fontStyle: 'bold' } }, getText('distrito'), { content: 'Departamento:', styles: { fontStyle: 'bold' } }, getText('departamento')],
                [{ content: 'Nombre Ministro:', styles: { fontStyle: 'bold' } }, getText('nombre-ministro'), { content: 'Grado:', styles: { fontStyle: 'bold' } }, getText('grado-ministro')],
                [{ content: 'Teléfono:', styles: { fontStyle: 'bold' } }, getText('tel-ministro'), { content: 'Miembros Activos:', styles: { fontStyle: 'bold' } }, getText('miembros-activos')],
            ],
            theme: 'grid', styles: { ...bodyStyle, fontSize: 7, cellPadding: 1 }
        });
        startY = (doc as any).autoTable.previous.finalY + 2;

        const ingresosData = [
            [{ content: 'Ingresos por Ofrendas', styles: subheadStyle, colSpan: 2 }],
            ['Diezmos', { content: getValue('ing-diezmos'), styles: rightAlign }],
            ['Ofrendas Ordinarias', { content: getValue('ing-ofrendas-ordinarias'), styles: rightAlign }],
            ['Primicias', { content: getValue('ing-primicias'), styles: rightAlign }],
            ['Ayuda al Encargado', { content: getValue('ing-ayuda-encargado'), styles: rightAlign }],
            [{ content: 'Ingresos por Colectas Especiales', styles: subheadStyle, colSpan: 2 }],
            ['Ceremonial', { content: getValue('ing-ceremonial'), styles: rightAlign }],
            ['Ofrenda Especial SdD NJG', { content: getValue('ing-ofrenda-especial-sdd'), styles: rightAlign }],
            ['Evangelización Mundial', { content: getValue('ing-evangelizacion'), styles: rightAlign }],
            ['Colecta de Santa Cena', { content: getValue('ing-santa-cena'), styles: rightAlign }],
            [{ content: 'Ingresos por Colectas Locales', styles: subheadStyle, colSpan: 2 }],
            ['Pago de Servicios Públicos', { content: getValue('ing-servicios-publicos'), styles: rightAlign }],
            ['Arreglos Locales', { content: getValue('ing-arreglos-locales'), styles: rightAlign }],
            ['Mantenimiento y Conservación', { content: getValue('ing-mantenimiento'), styles: rightAlign }],
            ['Construcción Local', { content: getValue('ing-construccion-local'), styles: rightAlign }],
            ['Muebles y Artículos', { content: getValue('ing-muebles'), styles: rightAlign }],
            ['Viajes y viáticos para Ministro', { content: getValue('ing-viajes-ministro'), styles: rightAlign }],
            ['Reuniones Ministeriales', { content: getValue('ing-reuniones-ministeriales'), styles: rightAlign }],
            ['Atención a Ministros', { content: getValue('ing-atencion-ministros'), styles: rightAlign }],
            ['Viajes fuera del País', { content: getValue('ing-viajes-extranjero'), styles: rightAlign }],
            ['Actividades Locales', { content: getValue('ing-actividades-locales'), styles: rightAlign }],
            ['Ofrendas para Ciudad LLDM', { content: getValue('ing-ciudad-lldm'), styles: rightAlign }],
            ['Adquisición Terreno/Edificio', { content: getValue('ing-adquisicion-terreno'), styles: rightAlign }],
        ];

        const egresosData = [
            [{ content: 'Manutención del Ministro', styles: subheadStyle, colSpan: 2 }],
            ['Asignación Autorizada', { content: getValue('egr-asignacion'), styles: rightAlign }],
            ['Gomer del Mes', { content: getValue('egr-gomer'), styles: rightAlign }],
            [{ content: 'Egresos por Colectas Especiales', styles: subheadStyle, colSpan: 2 }],
            ['Ceremonial', { content: getValue('egr-ceremonial'), styles: rightAlign }],
            ['Ofrenda Especial SdD NJG', { content: getValue('egr-ofrenda-especial-sdd'), styles: rightAlign }],
            ['Evangelización Mundial', { content: getValue('egr-evangelizacion'), styles: rightAlign }],
            ['Colecta de Santa Cena', { content: getValue('egr-santa-cena'), styles: rightAlign }],
            [{ content: 'Egresos por Colectas Locales', styles: subheadStyle, colSpan: 2 }],
            ['Pago de Servicios Públicos', { content: getValue('egr-servicios-publicos'), styles: rightAlign }],
            ['Arreglos Locales', { content: getValue('egr-arreglos-locales'), styles: rightAlign }],
            ['Mantenimiento y Conservación', { content: getValue('egr-mantenimiento'), styles: rightAlign }],
            ['Traspaso para Construcción Local', { content: getValue('egr-traspaso-construccion'), styles: rightAlign }],
            ['Muebles y Artículos', { content: getValue('egr-muebles'), styles: rightAlign }],
            ['Viajes y viáticos para Ministro', { content: getValue('egr-viajes-ministro'), styles: rightAlign }],
            ['Reuniones Ministeriales', { content: getValue('egr-reuniones-ministeriales'), styles: rightAlign }],
            ['Atención a Ministros', { content: getValue('egr-atencion-ministros'), styles: rightAlign }],
            ['Viajes fuera del País', { content: getValue('ing-viajes-extranjero'), styles: rightAlign }],
            ['Actividades Locales', { content: getValue('egr-actividades-locales'), styles: rightAlign }],
            ['Ofrendas para Ciudad LLDM', { content: getValue('egr-ciudad-lldm'), styles: rightAlign }],
            ['Adquisición Terreno/Edificio', { content: getValue('egr-adquisicion-terreno'), styles: rightAlign }],
        ];

        const tableConfig = { theme: 'grid', styles: bodyStyle, headStyles: headStyle, columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: 30 } } };
        const tableStartY = startY;
        let finalYIngresos, finalYEgresos;

        doc.autoTable({ head: [['Entradas (Ingresos)', '']], body: ingresosData, startY: tableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: margin }, });
        finalYIngresos = (doc as any).autoTable.previous.finalY;

        doc.autoTable({ head: [['Salidas (Egresos)', '']], body: egresosData, startY: tableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: pageW / 2 + 1 }, });
        finalYEgresos = (doc as any).autoTable.previous.finalY;
        
        startY = Math.max(finalYIngresos, finalYEgresos) + 2;
        
        const resumenData = [
            ['Saldo Inicial del Mes', { content: formatCurrency(calculations.saldoAnterior), styles: rightAlign }],
            ['Total Ingresos del Mes', { content: formatCurrency(calculations.totalIngresos), styles: rightAlign }],
            [{ content: 'Total Disponible del Mes', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculations.totalDisponible), styles: { ...rightAlign, fontStyle: 'bold' } }],
            ['Total Salidas del Mes', { content: formatCurrency(calculations.totalSalidas), styles: rightAlign }],
            [{ content: 'Utilidad o Remanente', styles: { fontStyle: 'bold'} }, { content: formatCurrency(calculations.remanente), styles: { ...rightAlign, fontStyle: 'bold', fillColor: '#C2F1C8' } }],
        ];
        const distribucionData = [
            ['Dirección General (Diezmos de Diezmos)', { content: getValue('dist-direccion'), styles: rightAlign }],
            ['Tesorería (Cuenta de Remanentes)', { content: getValue('dist-tesoreria'), styles: rightAlign }],
            ['Pro-Construcción', { content: getValue('dist-pro-construccion'), styles: rightAlign }],
            ['Otros', { content: getValue('dist-otros'), styles: rightAlign }],
        ];

        doc.autoTable({ head: [['Saldo del Remanente Distribuido a:', '']], body: distribucionData, startY: startY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: margin }, });
        finalYIngresos = (doc as any).autoTable.previous.finalY;

        doc.autoTable({ head: [['Resumen y Cierre', '']], body: resumenData, startY: startY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: pageW / 2 + 1 }, });
        finalYEgresos = (doc as any).autoTable.previous.finalY;
        
        startY = Math.max(finalYIngresos, finalYEgresos) + 5;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`_________________________`, pageW / 2, startY, { align: 'center' });
        startY += 4;
        doc.text(`Firma Ministro: ${getText('nombre-ministro')}`, pageW / 2, startY, { align: 'center' });
        
        startY += 6;

        doc.autoTable({
            startY,
            body: [
                [{ content: 'Comisión Local de Finanzas:', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } }],
                ['\n\n_________________________', '\n\n_________________________', '\n\n_________________________'],
                [firma1, firma2, firma3],
            ],
            theme: 'plain', styles: { fontSize: 8, halign: 'center' }, tableWidth: pageW - margin*2, margin: { left: margin }
        });
        
        const mes = getText('mes-reporte') || 'Mes';
        const anio = getText('ano-reporte') || 'Año';
        const iglesia = getText('nombre-iglesia') || 'Iglesia';
        const pdfFileName = `Informe-Mensual_${mes}-${anio}_${iglesia.replace(/ /g, '_')}.pdf`;

        return { blob: doc.output('blob'), fileName: pdfFileName };
    };

    const processPdf = async (pdfGenerator: () => { blob: Blob, fileName: string }) => {
        setIsGenerating(true);
        try {
            const { blob, fileName } = pdfGenerator();
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            if (!supabase) {
                alert(`Informe "${fileName}" generado y descargado. La conexión a la nube no está activa para guardarlo automáticamente.`);
            } else {
                 await uploadFile('reportes-mensuales', fileName, blob, true);
                 alert(`Informe "${fileName}" generado, descargado y guardado en la nube exitosamente.`);
            }
        } catch (error) {
            console.error("PDF upload failed:", error);
            let errorMessage = 'Ocurrió un error desconocido.';
            if (error instanceof Error) {
                errorMessage = error.message;
            } else if (error && typeof error === 'object' && 'message' in error) {
                errorMessage = String((error as { message: string }).message);
            } else {
                errorMessage = String(error);
            }
            
            if (errorMessage.toLowerCase().includes('failed to fetch')) {
                 alert(`Error al subir a la nube: Falló la conexión con el servidor. Esto puede ser un problema de CORS o de red. Verifique la configuración de CORS en su panel de Supabase y su conexión a internet.\n\nEl PDF se guardó localmente.`);
            } else if (errorMessage.toLowerCase().includes('bucket not found')) {
                alert(`Error al subir a la nube: El "bucket" (contenedor) 'reportes-mensuales' no fue encontrado.\n\nPor favor, vaya a su panel de Supabase -> Storage y cree un nuevo bucket PÚBLICO con ese nombre exacto.\n\nEl PDF se guardó localmente.`);
            } else {
                alert(`Hubo un error al generar o subir el PDF: ${errorMessage}`);
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateCurrentReport = () => {
        processPdf(() => createPdfBlob(formState));
    };

    const handleExportSavedReport = (report: MonthlyReport) => {
        processPdf(() => createPdfBlob(report.formData));
    };

    const handleClearForm = () => {
        if (window.confirm('¿Estás seguro de que quieres limpiar todos los campos?')) {
            setFormState(initialMonthlyReportFormState);
        }
    };
    
    const handleSaveReport = () => {
        const reportId = `report-${selectedYear}-${selectedMonth}`;
        const existingReportIndex = savedReports.findIndex(r => r.id === reportId);

        if (existingReportIndex > -1) {
            if (!window.confirm('Ya existe un informe para este mes. ¿Desea sobrescribirlo?')) {
                return;
            }
        }

        const newReport: MonthlyReport = {
            id: reportId,
            month: selectedMonth,
            year: selectedYear,
            formData: formState,
        };

        if (existingReportIndex > -1) {
            const updatedReports = [...savedReports];
            updatedReports[existingReportIndex] = newReport;
            setSavedReports(updatedReports);
        } else {
            setSavedReports(prev => [...prev, newReport]);
        }

        alert('Informe guardado exitosamente.');
    };

    const handleLoadReport = (report: MonthlyReport) => {
        const isDirty = JSON.stringify(formState) !== JSON.stringify(initialMonthlyReportFormState);
        if (isDirty && !window.confirm('¿Está seguro de que desea cargar este informe? Los datos actuales del formulario se perderán.')) {
            return;
        }
        setFormState(report.formData);
        setSelectedMonth(report.month);
        setSelectedYear(report.year);
        alert(`Informe de ${MONTH_NAMES[report.month - 1]} ${report.year} cargado.`);
    };

    const handleDeleteReport = (reportId: string) => {
        if (window.confirm('¿Está seguro de que desea eliminar este informe guardado?')) {
            setSavedReports(prev => prev.filter(r => r.id !== reportId));
        }
    };

    const sortedReports = useMemo(() => {
        return [...savedReports].sort((a, b) => {
            const dateA = new Date(a.year, a.month - 1);
            const dateB = new Date(b.year, b.month - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [savedReports]);

    return (
        <div className="space-y-6">
            <header className="text-center p-6 bg-white rounded-xl shadow-md dark:bg-gray-800">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-400">MINISTERIO DE ADMINISTRACIÓN FINANCIERA</h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">Información Financiera Mensual - Jurisdicción Nicaragua, C.A.</p>
            </header>
            
            {supabase && (
                <Accordion title="Informes en la Nube">
                    <UploadedMonthlyReportsList />
                </Accordion>
            )}

            <Accordion title="Informes Guardados (Local)">
                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                    {sortedReports.length > 0 ? (
                        sortedReports.map(report => (
                            <div key={report.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg border dark:bg-gray-700 dark:border-gray-600">
                                <div>
                                    <p className="font-semibold text-blue-700 dark:text-blue-400">{MONTH_NAMES[report.month - 1]} {report.year}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">ID: {report.id}</p>
                                </div>
                                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                                    <button onClick={() => handleLoadReport(report)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors">
                                        <Upload className="w-4 h-4" />
                                        Cargar
                                    </button>
                                     <button onClick={() => handleExportSavedReport(report)} disabled={isGenerating} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors disabled:bg-gray-400">
                                        <FileDown className="w-4 h-4" />
                                        Exportar
                                    </button>
                                    <button onClick={() => handleDeleteReport(report.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-2 dark:text-gray-400">No hay informes guardados localmente.</p>
                    )}
                </div>
            </Accordion>

             <div className="p-6 bg-white rounded-xl shadow-lg space-y-4 dark:bg-gray-800">
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Cargar Datos del Sistema</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="reportMonth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mes</label>
                        <select id="reportMonth" value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600">
                            {MONTH_NAMES.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="reportYear" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Año</label>
                        <input type="number" id="reportYear" value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600" />
                    </div>
                    <button onClick={handleLoadData} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                        Cargar Datos del Mes
                    </button>
                </div>
                 <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Nota: Esto llenará automáticamente los campos del informe con los datos de las semanas registradas para el mes seleccionado. Los campos como "Primicias" o "Colectas Especiales" deben llenarse manualmente.</p>
            </div>

            <form id="financial-form" className="space-y-4">
                <Accordion title="1. Información General del Reporte" initialOpen>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Field id="clave-iglesia" label="Clave Iglesia" isCurrency={false} value={formState['clave-iglesia']} onChange={handleChange} />
                        <Field id="mes-reporte" label="Mes del Reporte" isCurrency={false} value={formState['mes-reporte']} onChange={handleChange} />
                        <Field id="nombre-iglesia" label="Nombre Iglesia Local" isCurrency={false} value={formState['nombre-iglesia']} onChange={handleChange} />
                        <Field id="ano-reporte" label="Año del Reporte" isCurrency={false} value={formState['ano-reporte']} onChange={handleChange} />
                        <Field id="distrito" label="Distrito" isCurrency={false} value={formState['distrito']} onChange={handleChange} />
                        <Field id="nombre-ministro" label="Nombre del Ministro" isCurrency={false} value={formState['nombre-ministro']} onChange={handleChange} />
                        <Field id="departamento" label="Departamento" isCurrency={false} value={formState['departamento']} onChange={handleChange} />
                        <Field id="grado-ministro" label="Grado del Ministro" isCurrency={false} value={formState['grado-ministro']} onChange={handleChange} />
                        <Field id="miembros-activos" label="Miembros Activos" isCurrency={false} value={formState['miembros-activos']} onChange={handleChange} />
                        <Field id="tel-ministro" label="Teléfono / Celular" isCurrency={false} value={formState['tel-ministro']} onChange={handleChange} />
                    </div>
                </Accordion>

                <Accordion title="2. Entradas (Ingresos)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="md:col-span-2"><Field id="saldo-anterior" label="Saldo del Mes Anterior" value={formState['saldo-anterior']} onChange={handleChange} /></div>
                        
                        <Subheading title="Ingresos por Ofrendas" />
                        <Field id="ing-diezmos" label="Diezmos" value={formState['ing-diezmos']} onChange={handleChange} />
                        <Field id="ing-ofrendas-ordinarias" label="Ofrendas Ordinarias" value={formState['ing-ofrendas-ordinarias']} onChange={handleChange} />
                        <Field id="ing-primicias" label="Primicias" value={formState['ing-primicias']} onChange={handleChange} />
                        <Field id="ing-ayuda-encargado" label="Ayuda al Encargado" value={formState['ing-ayuda-encargado']} onChange={handleChange} />

                        <Subheading title="Ingresos por Colectas Especiales" />
                        <Field id="ing-ceremonial" label="Ceremonial" value={formState['ing-ceremonial']} onChange={handleChange} />
                        <Field id="ing-ofrenda-especial-sdd" label="Ofrenda Especial SdD NJG" value={formState['ing-ofrenda-especial-sdd']} onChange={handleChange} />
                        <Field id="ing-evangelizacion" label="Evangelización Mundial" value={formState['ing-evangelizacion']} onChange={handleChange} />
                        <Field id="ing-santa-cena" label="Colecta de Santa Cena" value={formState['ing-santa-cena']} onChange={handleChange} />
                        
                        <Subheading title="Ingresos por Colectas Locales" />
                        <Field id="ing-servicios-publicos" label="Pago de Servicios Públicos" value={formState['ing-servicios-publicos']} onChange={handleChange} />
                        <Field id="ing-arreglos-locales" label="Arreglos Locales" value={formState['ing-arreglos-locales']} onChange={handleChange} />
                        <Field id="ing-mantenimiento" label="Mantenimiento y Conservación" value={formState['ing-mantenimiento']} onChange={handleChange} />
                        <Field id="ing-construccion-local" label="Construcción Local" value={formState['ing-construccion-local']} onChange={handleChange} />
                        <Field id="ing-muebles" label="Muebles y Artículos" value={formState['ing-muebles']} onChange={handleChange} />
                        <Field id="ing-viajes-ministro" label="Viajes y viáticos para Ministro" value={formState['ing-viajes-ministro']} onChange={handleChange} />
                        <Field id="ing-reuniones-ministeriales" label="Reuniones Ministeriales" value={formState['ing-reuniones-ministeriales']} onChange={handleChange} />
                        <Field id="ing-atencion-ministros" label="Atención a Ministros" value={formState['ing-atencion-ministros']} onChange={handleChange} />
                        <Field id="ing-viajes-extranjero" label="Viajes fuera del País" value={formState['ing-viajes-extranjero']} onChange={handleChange} />
                        <Field id="ing-actividades-locales" label="Actividades Locales" value={formState['ing-actividades-locales']} onChange={handleChange} />
                        <Field id="ing-ciudad-lldm" label="Ofrendas para Ciudad LLDM" value={formState['ing-ciudad-lldm']} onChange={handleChange} />
                        <Field id="ing-adquisicion-terreno" label="Adquisición Terreno/Edificio" value={formState['ing-adquisicion-terreno']} onChange={handleChange} />
                    </div>
                </Accordion>
{/* Fix: The component was truncated. I have completed the form with the missing sections. */}
                <Accordion title="3. Salidas (Egresos)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <Subheading title="Manutención del Ministro" />
                        <Field id="egr-asignacion" label="Asignación Autorizada" value={formState['egr-asignacion']} onChange={handleChange} />
                        <Field id="egr-gomer" label="Gomer del Mes" value={formState['egr-gomer']} onChange={handleChange} />
                        
                        <Subheading title="Egresos por Colectas Especiales" />
                        <Field id="egr-ceremonial" label="Ceremonial" value={formState['egr-ceremonial']} onChange={handleChange} />
                        <Field id="egr-ofrenda-especial-sdd" label="Ofrenda Especial SdD NJG" value={formState['egr-ofrenda-especial-sdd']} onChange={handleChange} />
                        <Field id="egr-evangelizacion" label="Evangelización Mundial" value={formState['egr-evangelizacion']} onChange={handleChange} />
                        <Field id="egr-santa-cena" label="Colecta de Santa Cena" value={formState['egr-santa-cena']} onChange={handleChange} />
                        
                        <Subheading title="Egresos por Colectas Locales" />
                        <Field id="egr-servicios-publicos" label="Pago de Servicios Públicos" value={formState['egr-servicios-publicos']} onChange={handleChange} />
                        <Field id="egr-arreglos-locales" label="Arreglos Locales" value={formState['egr-arreglos-locales']} onChange={handleChange} />
                        <Field id="egr-mantenimiento" label="Mantenimiento y Conservación" value={formState['egr-mantenimiento']} onChange={handleChange} />
                        <Field id="egr-traspaso-construccion" label="Traspaso para Construcción Local" value={formState['egr-traspaso-construccion']} onChange={handleChange} />
                        <Field id="egr-muebles" label="Muebles y Artículos" value={formState['egr-muebles']} onChange={handleChange} />
                        <Field id="egr-viajes-ministro" label="Viajes y viáticos para Ministro" value={formState['egr-viajes-ministro']} onChange={handleChange} />
                        <Field id="egr-reuniones-ministeriales" label="Reuniones Ministeriales" value={formState['egr-reuniones-ministeriales']} onChange={handleChange} />
                        <Field id="egr-atencion-ministros" label="Atención a Ministros" value={formState['egr-atencion-ministros']} onChange={handleChange} />
                        <Field id="egr-viajes-extranjero" label="Viajes fuera del País" value={formState['egr-viajes-extranjero']} onChange={handleChange} />
                        <Field id="egr-actividades-locales" label="Actividades Locales" value={formState['egr-actividades-locales']} onChange={handleChange} />
                        <Field id="egr-ciudad-lldm" label="Ofrendas para Ciudad LLDM" value={formState['egr-ciudad-lldm']} onChange={handleChange} />
                        <Field id="egr-adquisicion-terreno" label="Adquisición Terreno/Edificio" value={formState['egr-adquisicion-terreno']} onChange={handleChange} />
                    </div>
                </Accordion>

                <Accordion title="4. Resumen y Cierre">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Subheading title="Saldo del Remanente Distribuido a:" />
                        <Field id="dist-direccion" label="Dirección General (Diezmos de Diezmos)" value={formState['dist-direccion']} onChange={handleChange} />
                        <Field id="dist-tesoreria" label="Tesorería (Cuenta de Remanentes)" value={formState['dist-tesoreria']} onChange={handleChange} />
                        <Field id="dist-pro-construccion" label="Pro-Construcción" value={formState['dist-pro-construccion']} onChange={handleChange} />
                        <Field id="dist-otros" label="Otros" value={formState['dist-otros']} onChange={handleChange} />
                    </div>
                </Accordion>
            </form>
            <div className="p-6 bg-white rounded-xl shadow-lg flex flex-col sm:flex-row gap-4 items-center dark:bg-gray-800">
                <button
                    onClick={handleGenerateCurrentReport}
                    disabled={isGenerating}
                    className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                >
                    {isGenerating ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Generando...</span>
                        </>
                    ) : (
                        <>
                            <FileDown className="w-5 h-5" />
                            <span>Generar y Subir PDF</span>
                        </>
                    )}
                </button>
                 <button onClick={handleSaveReport} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                    <Save className="w-5 h-5" />
                    Guardar Formulario
                </button>
                <button onClick={handleClearForm} className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                    Limpiar Formulario
                </button>
            </div>
        </div>
    );
};
{/* Fix: Added missing default export. */}
export default InformeMensualTab;
