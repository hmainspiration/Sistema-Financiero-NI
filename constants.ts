import { Member, Formulas, MonthlyReportFormState, ChurchInfo } from './types';

// Lista de miembros actualizada según la solicitud del usuario.
export const INITIAL_MEMBERS: Member[] = [
  { id: 'm-1', name: 'Elmer Ocampo' },
  { id: 'm-2', name: 'Rubén Ocampo' },
  { id: 'm-3', name: 'Santos Pichardo' },
  { id: 'm-4', name: 'Adilia Martínez' },
  { id: 'm-5', name: 'Salía Ocampo' },
  { id: 'm-6', name: 'Janny Morales' },
  { id: 'm-7', name: 'Hilda Morales Ocampo' },
  { id: 'm-8', name: 'Reina Matamoros' },
  { id: 'm-9', name: 'Anny Blanchard Ocampo' },
  { id: 'm-10', name: 'Marta García' },
  { id: 'm-11', name: 'Victorina Matamoros' },
  { id: 'm-12', name: 'María Campo' },
  { id: 'm-13', name: 'Neli Ocampo (Apartada)' },
  { id: 'm-14', name: 'Damaris Ortiz (Esposa de ministro)' },
  { id: 'm-15', name: 'Katerin Blanchard Ocampo (Apartada)' },
  { id: 'm-16', name: 'Miurel Blanchard Ocampo (Apartada)' },
  { id: 'm-17', name: 'Fernando Pichardo Ocampo' },
  { id: 'm-18', name: 'Nain Alvarez' },
  { id: 'm-19', name: 'Libni Alvarez' },
];

export const INITIAL_CATEGORIES: string[] = [
  'Diezmo',
  'Ordinaria',
  'Primicias',
  'Luz',
  'Agua',
  'Ceremonial',
];

export const DEFAULT_FORMULAS: Formulas = {
  diezmoPercentage: 10,
  remanenteThreshold: 4500, // Ajustado de 5000 a 4500
};

export const DEFAULT_CHURCH_INFO: ChurchInfo = {
  defaultMinister: '',
  ministerGrade: '',
  district: '',
  department: '',
  ministerPhone: '',
};

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const initialMonthlyReportFormState: MonthlyReportFormState = {
    // 1. Información General
    'clave-iglesia': '',
    'nombre-iglesia': '',
    'distrito': '',
    'departamento': '',
    'miembros-activos': '',
    'mes-reporte': '',
    'ano-reporte': '',
    'nombre-ministro': '',
    'grado-ministro': '',
    'tel-ministro': '',
    // 2. Entradas
    'saldo-anterior': '',
    'ing-diezmos': '',
    'ing-ofrendas-ordinarias': '',
    'ing-primicias': '',
    'ing-ayuda-encargado': '',
    'ing-ceremonial': '',
    'ing-ofrenda-especial-sdd': '',
    'ing-evangelizacion': '',
    'ing-santa-cena': '',
    'ing-servicios-publicos': '',
    'ing-arreglos-locales': '',
    'ing-mantenimiento': '',
    'ing-construccion-local': '',
    'ing-muebles': '',
    'ing-viajes-ministro': '',
    'ing-reuniones-ministeriales': '',
    'ing-atencion-ministros': '',
    'ing-viajes-extranjero': '',
    'ing-actividades-locales': '',
    'ing-ciudad-lldm': '',
    'ing-adquisicion-terreno': '',
    // 3. Salidas
    'egr-asignacion': '',
    'egr-gomer': '',
    'egr-ceremonial': '',
    'egr-ofrenda-especial-sdd': '',
    'egr-evangelizacion': '',
    'egr-santa-cena': '',
    'egr-servicios-publicos': '',
    'egr-arreglos-locales': '',
    'egr-mantenimiento': '',
    'egr-traspaso-construccion': '',
    'egr-muebles': '',
    'egr-viajes-ministro': '',
    'egr-reuniones-ministeriales': '',
    'egr-atencion-ministros': '',
    'egr-viajes-extranjero': '',
    'egr-actividades-locales': '',
    'egr-ciudad-lldm': '',
    'egr-adquisicion-terreno': '',
    // 4. Resumen
    'dist-direccion': '',
    'dist-tesoreria': '',
    'dist-pro-construccion': '',
    'dist-otros': '',
    'comision-nombre-1': '',
    'comision-nombre-2': '',
    'comision-nombre-3': '',
};

// Las credenciales de Google Drive y los IDs de carpetas se han movido a variables de entorno
// para mayor seguridad y para permitir el despliegue en plataformas como Vercel.
// Se configuran directamente en el panel de administración del servicio de hosting.
