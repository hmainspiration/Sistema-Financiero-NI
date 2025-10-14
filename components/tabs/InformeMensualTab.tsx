import React, { useState, useMemo, FC } from 'react';
import { WeeklyRecord, Formulas, MonthlyReport, MonthlyReportFormState, ChurchInfo } from '../../types';
import { MONTH_NAMES, initialMonthlyReportFormState } from '../../constants';
import { ArrowUpOnSquareIcon, TrashIcon, ArchiveBoxArrowDownIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';


interface InformeMensualTabProps {
    records: WeeklyRecord[];
    formulas: Formulas;
    savedReports: MonthlyReport[];
    setSavedReports: React.Dispatch<React.SetStateAction<MonthlyReport[]>>;
    churchInfo: ChurchInfo;
}

const Accordion: FC<{ title: string, children: React.ReactNode, initialOpen?: boolean }> = ({ title, children, initialOpen = false }) => {
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

const CurrencyInput: FC<{ id: string, placeholder: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ id, placeholder, value, onChange }) => (
    <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none dark:text-gray-400">C$</span>
        <input type="number" step="0.01" id={id} name={id} placeholder={placeholder} value={value} onChange={onChange} className="w-full p-2 border rounded-lg pl-10 bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
    </div>
);


const InformeMensualTab: React.FC<InformeMensualTabProps> = ({ records, formulas, savedReports, setSavedReports, churchInfo }) => {
    const [formState, setFormState] = useState<MonthlyReportFormState>(initialMonthlyReportFormState);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormState(prevState => ({ ...prevState, [name]: value }));
    };

    const getNumericValue = (key: keyof MonthlyReportFormState) => parseFloat(formState[key]) || 0;

    const handleLoadData = () => {
        const filteredRecords = records.filter(r => r.month === selectedMonth && r.year === selectedYear);
        if (filteredRecords.length === 0) {
            alert(`No se encontraron registros para ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}.`);
            return;
        }

        const publicServiceCategories = ["Luz", "Agua"];
        let totalDiezmo = 0, totalOrdinaria = 0, totalServicios = 0, totalGomer = 0, totalDiezmoDeDiezmo = 0;

        filteredRecords.forEach(record => {
            let weeklyDiezmo = 0, weeklyOrdinaria = 0;
            record.donations.forEach(d => {
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

    const calculations = useMemo(() => {
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

        const totalManutencion = getNumericValue('egr-asignacion') - getNumericValue('egr-gomer');
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
            totalManutencion, egrEspeciales, egrLocales, totalSalidas, remanente
        };
    }, [formState]);

    const formatCurrency = (value: number) => `C$ ${value.toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
            const dateB = new Date(b.year, a.month - 1);
            return dateB.getTime() - dateA.getTime();
        });
    }, [savedReports]);

    const generateAndSavePdf = () => {
        setIsGenerating(true);
        setTimeout(async () => {
            try {
                const { jsPDF } = (window as any).jspdf;
                const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                const pageW = doc.internal.pageSize.getWidth();
                const pageH = doc.internal.pageSize.getHeight();
                const margin = 10;
                let startY = margin;
                const getText = (key: keyof MonthlyReportFormState) => formState[key] || '';
                const getValue = (key: keyof MonthlyReportFormState) => formatCurrency(getNumericValue(key));
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.text("IGLESIA DEL DIOS VIVO COLUMNA Y APOYO DE LA VERDAD", pageW / 2, startY + 5, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(11);
                doc.text("La Luz del Mundo", pageW / 2, startY + 10, { align: 'center' });
                doc.setFontSize(10);
                doc.text("MINISTERIO DE ADMINISTRACIÓN FINANCIERA", pageW / 2, startY + 16, { align: 'center' });
                doc.setFont('helvetica', 'bold');
                doc.text("INFORMACIÓN FINANCIERA MENSUAL", pageW / 2, startY + 22, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.text(`Jurisdicción Nicaragua, C.A.`, pageW / 2, startY + 27, { align: 'center' });
                startY += 35;
                const bodyStyle = { fontSize: 8, cellPadding: 1, lineColor: '#000', lineWidth: 0.1 };
                const headStyle = { fontSize: 8, fontStyle: 'bold', fillColor: '#f0f0f0', textColor: '#333', halign: 'center', lineColor: '#000', lineWidth: 0.1 };
                const rightAlign = { halign: 'right' };
                const subheadStyle = { fontStyle: 'bold', fillColor: '#ffffff' };
                doc.autoTable({
                    startY: startY,
                    body: [
                        [{ content: 'DATOS DE ESTE INFORME', colSpan: 4, styles: headStyle }],
                        ['DEL MES DE:', getText('mes-reporte'), 'DEL AÑO:', getText('ano-reporte')],
                        ['CLAVE IGLESIA:', getText('clave-iglesia'), 'NOMBRE IGLESIA:', getText('nombre-iglesia')],
                        ['DISTRITO:', getText('distrito'), 'DEPARTAMENTO:', getText('departamento')],
                        ['NOMBRE MINISTRO:', getText('nombre-ministro'), 'GRADO:', getText('grado-ministro')],
                        ['TELÉFONO:', getText('tel-ministro'), 'MIEMBROS ACTIVOS:', getText('miembros-activos')],
                    ],
                    theme: 'grid', styles: { ...bodyStyle, fontSize: 9, cellPadding: 1.5 }, columnStyles: { 0: { fontStyle: 'bold' }, 2: { fontStyle: 'bold' } }
                });
                startY = (doc as any).autoTable.previous.finalY + 3;
                const ingresosData = [
                    [{ content: 'Ingresos por Ofrendas', styles: subheadStyle }, ''],
                    ['Diezmos', { content: getValue('ing-diezmos'), styles: rightAlign }],
                    ['Ofrendas Ordinarias', { content: getValue('ing-ofrendas-ordinarias'), styles: rightAlign }],
                    ['Primicias', { content: getValue('ing-primicias'), styles: rightAlign }],
                    ['Ayuda al Encargado', { content: getValue('ing-ayuda-encargado'), styles: rightAlign }],
                    [{ content: 'Ingresos por Colectas Especiales', styles: subheadStyle }, ''],
                    ['Ceremonial', { content: getValue('ing-ceremonial'), styles: rightAlign }],
                    ['Ofrenda Especial SdD NJG', { content: getValue('ing-ofrenda-especial-sdd'), styles: rightAlign }],
                    ['Evangelización Mundial', { content: getValue('ing-evangelizacion'), styles: rightAlign }],
                    ['Colecta de Santa Cena', { content: getValue('ing-santa-cena'), styles: rightAlign }],
                    [{ content: 'Ingresos por Colectas Locales', styles: subheadStyle }, ''],
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
                    [{ content: 'Manutención del Ministro', styles: subheadStyle }, ''],
                    ['Asignación Autorizada', { content: getValue('egr-asignacion'), styles: rightAlign }],
                    ['Gomer del Mes', { content: getValue('egr-gomer'), styles: rightAlign }],
                    [{ content: 'Total Manutención (Asignación - Gomer)', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculations.totalManutencion), styles: { ...rightAlign, fontStyle: 'bold' } }],
                    [{ content: 'Egresos por Colectas Especiales', styles: subheadStyle }, ''],
                    ['Ceremonial', { content: getValue('egr-ceremonial'), styles: rightAlign }],
                    ['Ofrenda Especial SdD NJG', { content: getValue('egr-ofrenda-especial-sdd'), styles: rightAlign }],
                    ['Evangelización Mundial', { content: getValue('egr-evangelizacion'), styles: rightAlign }],
                    ['Colecta de Santa Cena', { content: getValue('egr-santa-cena'), styles: rightAlign }],
                    [{ content: 'Egresos por Colectas Locales', styles: subheadStyle }, ''],
                    ['Pago de Servicios Públicos', { content: getValue('egr-servicios-publicos'), styles: rightAlign }],
                    ['Arreglos Locales', { content: getValue('egr-arreglos-locales'), styles: rightAlign }],
                    ['Mantenimiento y Conservación', { content: getValue('egr-mantenimiento'), styles: rightAlign }],
                    ['Traspaso para Construcción Local', { content: getValue('egr-traspaso-construccion'), styles: rightAlign }],
                    ['Muebles y Artículos', { content: getValue('egr-muebles'), styles: rightAlign }],
                    ['Viajes y viáticos para Ministro', { content: getValue('egr-viajes-ministro'), styles: rightAlign }],
                    ['Reuniones Ministeriales', { content: getValue('egr-reuniones-ministeriales'), styles: rightAlign }],
                    ['Atención a Ministros', { content: getValue('egr-atencion-ministros'), styles: rightAlign }],
                    ['Viajes fuera del País', { content: getValue('egr-viajes-extranjero'), styles: rightAlign }],
                    ['Actividades Locales', { content: getValue('egr-actividades-locales'), styles: rightAlign }],
                    ['Ofrendas para Ciudad LLDM', { content: getValue('egr-ciudad-lldm'), styles: rightAlign }],
                    ['Adquisición Terreno/Edificio', { content: getValue('egr-adquisicion-terreno'), styles: rightAlign }],
                ];
                const tableConfig = { theme: 'grid', styles: bodyStyle, headStyles: headStyle };
                const tableStartY = startY;
                let finalYIngresos, finalYEgresos;
                doc.autoTable({ head: [['ENTRADAS (INGRESOS)', '']], body: ingresosData, startY: tableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: margin }, });
                finalYIngresos = (doc as any).autoTable.previous.finalY;
                doc.autoTable({ head: [['SALIDAS (EGRESOS)', '']], body: egresosData, startY: tableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: pageW / 2 + 1 }, });
                finalYEgresos = (doc as any).autoTable.previous.finalY;
                startY = Math.max(finalYIngresos, finalYEgresos) + 3;
                const resumenData = [
                    ['Saldo Inicial del Mes', { content: formatCurrency(calculations.saldoAnterior), styles: rightAlign }],
                    ['Total Ingresos del Mes', { content: formatCurrency(calculations.totalIngresos), styles: rightAlign }],
                    [{ content: 'Total Disponible del Mes', styles: { fontStyle: 'bold' } }, { content: formatCurrency(calculations.totalDisponible), styles: { ...rightAlign, fontStyle: 'bold' } }],
                    ['Total Salidas del Mes', { content: formatCurrency(calculations.totalSalidas), styles: rightAlign }],
                    [{ content: 'Utilidad o Remanente', styles: { fontStyle: 'bold', fillColor: '#e0e7ff' } }, { content: formatCurrency(calculations.remanente), styles: { ...rightAlign, fontStyle: 'bold', fillColor: '#e0e7ff' } }],
                ];
                const distribucionData = [
                    ['Dirección General (Diezmos de Diezmos)', { content: getValue('dist-direccion'), styles: rightAlign }],
                    ['Tesorería (Cuenta de Remanentes)', { content: getValue('dist-tesoreria'), styles: rightAlign }],
                    ['Pro-Construcción', { content: getValue('dist-pro-construccion'), styles: rightAlign }],
                    ['Otros', { content: getValue('dist-otros'), styles: rightAlign }],
                ];
                if (startY > pageH - 65) { doc.addPage(); startY = margin; }
                const summaryTableStartY = startY;
                let finalYResumen, finalYDistribucion;
                doc.autoTable({ head: [['RESUMEN Y CIERRE', '']], body: resumenData, startY: summaryTableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: margin }, });
                finalYResumen = (doc as any).autoTable.previous.finalY;
                doc.autoTable({ head: [['SALDO DEL REMANENTE DISTRIBUIDO A:', '']], body: distribucionData, startY: summaryTableStartY, ...tableConfig, tableWidth: (pageW / 2) - margin - 1, margin: { left: pageW / 2 + 1 }, });
                finalYDistribucion = (doc as any).autoTable.previous.finalY;
                startY = Math.max(finalYResumen, finalYDistribucion) + 10;
                if (startY > pageH - 55) { doc.addPage(); startY = margin; }
                doc.autoTable({
                    startY,
                    body: [
                        [{ content: 'Comisión Local de Finanzas:', colSpan: 3, styles: { fontStyle: 'bold', halign: 'center' } }],
                        ['\n\n_________________________', '\n\n_________________________', '\n\n_________________________'],
                        [getText('comision-nombre-1') || 'Firma 1', getText('comision-nombre-2') || 'Firma 2', getText('comision-nombre-3') || 'Firma 3'],
                        [{ content: '', colSpan: 3, styles: { cellPadding: 4 } }],
                        ['\n\n_________________________', '\n\n_________________________', ''],
                        [`Firma Ministro: ${getText('nombre-ministro')}`, `Firma Tesorero(a) Local`, ''],
                    ],
                    theme: 'plain', styles: { fontSize: 9, halign: 'center' }
                });
                
                const mes = getText('mes-reporte') || 'Mes';
                const anio = getText('ano-reporte') || 'Año';
                const iglesia = getText('nombre-iglesia') || 'Iglesia';
                const pdfFileName = `${mes}-${anio}-${iglesia}.pdf`;

                doc.save(pdfFileName);
                alert(`Informe mensual "${pdfFileName}" generado y descargado localmente.`);

            } catch (error) {
                console.error("Error generating PDF:", error);
                alert(`Hubo un error al generar el PDF: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsGenerating(false);
            }
        }, 100);
    };
    
    // Helper components for building the form
    const Field = ({ id, label, isCurrency = true }: { id: keyof MonthlyReportFormState; label: string; isCurrency?: boolean }) => (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">{label}</label>
            {isCurrency ? (
                <CurrencyInput id={id} placeholder="0.00" value={formState[id]} onChange={handleChange} />
            ) : (
                <input type="text" id={id} name={id} value={formState[id]} onChange={handleChange} placeholder={label} className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />
            )}
        </div>
    );
    const Subheading = ({ title }: { title: string }) => <h4 className="md:col-span-2 font-semibold text-gray-800 mb-2 mt-4 border-b pb-1 dark:text-gray-200 dark:border-gray-600">{title}</h4>;


    return (
        <div className="space-y-6">
            <header className="text-center p-6 bg-white rounded-xl shadow-md dark:bg-gray-800">
                <h1 className="text-2xl md:text-3xl font-bold text-blue-800 dark:text-blue-400">MINISTERIO DE ADMINISTRACIÓN FINANCIERA</h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300">Información Financiera Mensual - Jurisdicción Nicaragua, C.A.</p>
            </header>

            <Accordion title="Informes Guardados">
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
                                        <ArrowUpOnSquareIcon className="w-4 h-4" />
                                        Cargar
                                    </button>
                                    <button onClick={() => handleDeleteReport(report.id)} className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors">
                                        <TrashIcon className="w-4 h-4" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-2 dark:text-gray-400">No hay informes guardados.</p>
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
                        <Field id="clave-iglesia" label="Clave Iglesia" isCurrency={false} />
                        <Field id="mes-reporte" label="Mes del Reporte" isCurrency={false} />
                        <Field id="nombre-iglesia" label="Nombre Iglesia Local" isCurrency={false} />
                        <Field id="ano-reporte" label="Año del Reporte" isCurrency={false} />
                        <Field id="distrito" label="Distrito" isCurrency={false} />
                        <Field id="nombre-ministro" label="Nombre del Ministro" isCurrency={false} />
                        <Field id="departamento" label="Departamento" isCurrency={false} />
                        <Field id="grado-ministro" label="Grado del Ministro" isCurrency={false} />
                        <Field id="miembros-activos" label="Miembros Activos" isCurrency={false}/>
                        <Field id="tel-ministro" label="Teléfono / Celular" isCurrency={false} />
                    </div>
                </Accordion>

                <Accordion title="2. Entradas (Ingresos)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <div className="md:col-span-2"><Field id="saldo-anterior" label="Saldo del Mes Anterior" /></div>
                        
                        <Subheading title="Ingresos por Ofrendas" />
                        <Field id="ing-diezmos" label="Diezmos" />
                        <Field id="ing-ofrendas-ordinarias" label="Ofrendas Ordinarias" />
                        <Field id="ing-primicias" label="Primicias" />
                        <Field id="ing-ayuda-encargado" label="Ayuda al Encargado" />

                        <Subheading title="Ingresos por Colectas Especiales" />
                        <Field id="ing-ceremonial" label="Ceremonial" />
                        <Field id="ing-ofrenda-especial-sdd" label="Ofrenda Especial SdD NJG" />
                        <Field id="ing-evangelizacion" label="Evangelización Mundial" />
                        <Field id="ing-santa-cena" label="Colecta de Santa Cena" />
                        
                        <Subheading title="Ingresos por Colectas Locales" />
                        <Field id="ing-servicios-publicos" label="Pago de Servicios Públicos" />
                        <Field id="ing-arreglos-locales" label="Arreglos Locales" />
                        <Field id="ing-mantenimiento" label="Mantenimiento y Conservación" />
                        <Field id="ing-construccion-local" label="Construcción Local" />
                        <Field id="ing-muebles" label="Muebles y Artículos" />
                        <Field id="ing-viajes-ministro" label="Viajes y viáticos para Ministro" />
                        <Field id="ing-reuniones-ministeriales" label="Reuniones Ministeriales" />
                        <Field id="ing-atencion-ministros" label="Atención a Ministros" />
                        <Field id="ing-viajes-extranjero" label="Viajes fuera del País" />
                        <Field id="ing-actividades-locales" label="Actividades Locales" />
                        <Field id="ing-ciudad-lldm" label="Ofrendas para Ciudad LLDM" />
                        <Field id="ing-adquisicion-terreno" label="Adquisición Terreno/Edificio" />
                    </div>
                </Accordion>

                 <Accordion title="3. Salidas (Egresos)">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <Subheading title="Manutención del Ministro" />
                        <Field id="egr-asignacion" label="Asignación Autorizada" />
                        <Field id="egr-gomer" label="Gomer del Mes" />

                        <Subheading title="Egresos por Colectas Especiales" />
                        <Field id="egr-ceremonial" label="Ceremonial" />
                        <Field id="egr-ofrenda-especial-sdd" label="Ofrenda Especial SdD NJG" />
                        <Field id="egr-evangelizacion" label="Evangelización Mundial" />
                        <Field id="egr-santa-cena" label="Colecta de Santa Cena" />

                        <Subheading title="Egresos por Colectas Locales" />
                        <Field id="egr-servicios-publicos" label="Pago de Servicios Públicos" />
                        <Field id="egr-arreglos-locales" label="Arreglos Locales" />
                        <Field id="egr-mantenimiento" label="Mantenimiento y Conservación" />
                        <Field id="egr-traspaso-construccion" label="Traspaso para Construcción" />
                        <Field id="egr-muebles" label="Muebles y Artículos" />
                        <Field id="egr-viajes-ministro" label="Viajes y viáticos para Ministro" />
                        <Field id="egr-reuniones-ministeriales" label="Reuniones Ministeriales" />
                        <Field id="egr-atencion-ministros" label="Atención a Ministros" />
                        <Field id="egr-viajes-extranjero" label="Viajes fuera del País" />
                        <Field id="egr-actividades-locales" label="Actividades Locales" />
                        <Field id="egr-ciudad-lldm" label="Ofrendas para Ciudad LLDM" />
                        <Field id="egr-adquisicion-terreno" label="Adquisición Terreno/Edificio" />
                    </div>
                </Accordion>

                <Accordion title="4. Resumen y Firmas">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                        <Subheading title="Distribución del Remanente" />
                        <Field id="dist-direccion" label="Dirección General (Diezmos de Diezmos)" />
                        <Field id="dist-tesoreria" label="Tesorería (Cuenta de Remanentes)" />
                        <Field id="dist-pro-construccion" label="Pro-Construcción" />
                        <Field id="dist-otros" label="Otros" />

                        <Subheading title="Nombres para Firmas de Comisión" />
                        <Field id="comision-nombre-1" label="Nombre Firma 1" isCurrency={false} />
                        <Field id="comision-nombre-2" label="Nombre Firma 2" isCurrency={false} />
                        <Field id="comision-nombre-3" label="Nombre Firma 3" isCurrency={false} />
                    </div>
                </Accordion>
            </form>

             <div className="p-6 bg-white rounded-xl shadow-lg mt-6 space-y-4 dark:bg-gray-800">
                <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">Acciones del Informe</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button onClick={handleSaveReport} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        <ArchiveBoxArrowDownIcon className="w-5 h-5" />
                        Guardar Borrador
                    </button>
                    <button onClick={handleClearForm} className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        <TrashIcon className="w-5 h-5" />
                        Limpiar Formulario
                    </button>
                    <button 
                        onClick={generateAndSavePdf} 
                        disabled={isGenerating}
                        title="Generar y descargar PDF"
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed sm:col-span-2 lg:col-span-1"
                    >
                        <DocumentArrowDownIcon className="w-5 h-5" />
                        {isGenerating ? 'Generando...' : 'Generar Reporte en PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InformeMensualTab;