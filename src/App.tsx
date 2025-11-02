// import { useState } from 'react';
// import { BarChart3, Users, Upload, FileText, Plus, GraduationCap, Settings } from 'lucide-react';
// import StudentForm from './components/StudentForm';
// import StudentList from './components/StudentList';
// import ExcelImport from './components/ExcelImport';
// import ParetoChart from './components/ParetoChart';
// import Reports from './components/Reports';
// import SetupWizard from './components/SetupWizard';

// type View = 'dashboard' | 'students' | 'analysis' | 'import' | 'reports' | 'setup';

// function App() {
//   const [currentView, setCurrentView] = useState<View>('dashboard');
//   const [showStudentForm, setShowStudentForm] = useState(false);
//   const [filters, setFilters] = useState<{ semester?: number; majorId?: string }>({});
//   const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>('admin');

//   const renderView = () => {
//     switch (currentView) {
//       case 'students':
//         return <StudentList userRole={userRole} />;
//       case 'analysis':
//         return <ParetoChart filters={filters} />;
//       case 'import':
//         return <ExcelImport onSuccess={() => setCurrentView('students')} />;
//       case 'reports':
//         return <Reports />;
//       case 'setup':
//         return <SetupWizard onComplete={() => setCurrentView('dashboard')} />;
//       default:
//         return (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('students')}>
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="p-3 bg-blue-100 rounded-lg">
//                   <Users className="w-8 h-8 text-blue-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Estudiantes</h3>
//                   <p className="text-sm text-gray-600">Gestionar registros</p>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-700">
//                 Visualiza y administra los registros académicos de los estudiantes y sus factores de riesgo.
//               </p>
//             </div>

//             <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('analysis')}>
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="p-3 bg-green-100 rounded-lg">
//                   <BarChart3 className="w-8 h-8 text-green-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Análisis de Pareto</h3>
//                   <p className="text-sm text-gray-600">Herramienta de calidad</p>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-700">
//                 Identifica los factores de riesgo más frecuentes que afectan el desempeño estudiantil.
//               </p>
//             </div>

//             <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('import')}>
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="p-3 bg-orange-100 rounded-lg">
//                   <Upload className="w-8 h-8 text-orange-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Importar Datos</h3>
//                   <p className="text-sm text-gray-600">Desde Excel/CSV</p>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-700">
//                 Carga datos de estudiantes masivamente desde archivos CSV o Excel.
//               </p>
//             </div>

//             <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('reports')}>
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="p-3 bg-red-100 rounded-lg">
//                   <FileText className="w-8 h-8 text-red-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Reportes</h3>
//                   <p className="text-sm text-gray-600">Análisis automático</p>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-700">
//                 Genera reportes automáticos con recomendaciones para mejorar indicadores de calidad.
//               </p>
//             </div>

//             {userRole !== 'student' && (
//               <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setShowStudentForm(true)}>
//                 <div className="flex items-center gap-4 mb-4">
//                   <div className="p-3 bg-cyan-100 rounded-lg">
//                     <Plus className="w-8 h-8 text-cyan-600" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-800">Nuevo Registro</h3>
//                     <p className="text-sm text-gray-600">Agregar estudiante</p>
//                   </div>
//                 </div>
//                 <p className="text-sm text-gray-700">
//                   Registra manualmente un nuevo estudiante con sus calificaciones y asistencia.
//                 </p>
//               </div>
//             )}

//             {userRole === 'admin' && (
//               <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('setup')}>
//               <div className="flex items-center gap-4 mb-4">
//                 <div className="p-3 bg-slate-100 rounded-lg">
//                   <Settings className="w-8 h-8 text-slate-600" />
//                 </div>
//                 <div>
//                   <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>
//                   <p className="text-sm text-gray-600">Carreras y materias</p>
//                 </div>
//               </div>
//               <p className="text-sm text-gray-700">
//                 Administra el catálogo de carreras y materias del instituto.
//               </p>
//               </div>
//             )}
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
//       <nav className="bg-white shadow-md border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center gap-3">
//               <GraduationCap className="w-8 h-8 text-blue-600" />
//               <div>
//                 <h1 className="text-xl font-bold text-gray-800">
//                   Sistema de Análisis de Calidad Académica
//                 </h1>
//                 <p className="text-xs text-gray-600">
//                   Instituto Tecnológico de Tijuana
//                 </p>
//               </div>
//             </div>
//             {currentView !== 'dashboard' && (
//               <button
//                 onClick={() => setCurrentView('dashboard')}
//                 className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
//               >
//                 Volver al inicio
//               </button>
//             )}
//           </div>
//         </div>
//       </nav>

//       <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {renderView()}
//       </main>

//       {showStudentForm && (
//         <StudentForm
//           onSuccess={() => {
//             setShowStudentForm(false);
//             setCurrentView('students');
//           }}
//           onCancel={() => setShowStudentForm(false)}
//         />
//       )}
//     </div>
//   );
// }

// export default App;


import { useState } from 'react';
import { BarChart3, Users, Upload, FileText, Plus, GraduationCap, Settings } from 'lucide-react';
import StudentForm from './components/StudentForm';
import StudentList from './components/StudentList';
import ExcelImport from './components/ExcelImport';
import ParetoChart from './components/ParetoChart';
import Reports from './components/Reports';
import SetupWizard from './components/SetupWizard';

type View = 'dashboard' | 'students' | 'analysis' | 'import' | 'reports' | 'setup';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [filters, setFilters] = useState<{ semester?: number; majorId?: string }>({});
  const [userRole, setUserRole] = useState<'admin' | 'teacher' | 'student'>('admin');

  const renderView = () => {
    switch (currentView) {
      case 'students':
        return <StudentList />;
      case 'analysis':
        return <ParetoChart filters={filters} />;
      case 'import':
        return <ExcelImport onSuccess={() => setCurrentView('students')} />;
      case 'reports':
        return <Reports />;
      case 'setup':
        return <SetupWizard onComplete={() => setCurrentView('dashboard')} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('students')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Estudiantes</h3>
                  <p className="text-sm text-gray-600">Gestionar registros</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Visualiza y administra los registros académicos de los estudiantes y sus factores de riesgo.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('analysis')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Análisis de Pareto</h3>
                  <p className="text-sm text-gray-600">Herramienta de calidad</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Identifica los factores de riesgo más frecuentes que afectan el desempeño estudiantil.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('import')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Upload className="w-8 h-8 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Importar Datos</h3>
                  <p className="text-sm text-gray-600">Desde Excel/CSV</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Carga datos de estudiantes masivamente desde archivos CSV o Excel.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('reports')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Reportes</h3>
                  <p className="text-sm text-gray-600">Análisis automático</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Genera reportes automáticos con recomendaciones para mejorar indicadores de calidad.
              </p>
            </div>

            {userRole !== 'student' && (
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setShowStudentForm(true)}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-cyan-100 rounded-lg">
                    <Plus className="w-8 h-8 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Nuevo Registro</h3>
                    <p className="text-sm text-gray-600">Agregar estudiante</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">
                  Registra manualmente un nuevo estudiante con sus calificaciones y asistencia.
                </p>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('setup')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 rounded-lg">
                  <Settings className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>
                  <p className="text-sm text-gray-600">Carreras y materias</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Administra el catálogo de carreras y materias del instituto.
              </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Sistema de Análisis de Calidad Académica
                </h1>
                <p className="text-xs text-gray-600">
                  Instituto Tecnológico de Tijuana
                </p>
              </div>
            </div>
            {currentView !== 'dashboard' && (
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Volver al inicio
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>

      {showStudentForm && (
        <StudentForm
          onSuccess={() => {
            setShowStudentForm(false);
            setCurrentView('students');
          }}
          onCancel={() => setShowStudentForm(false)}
        />
      )}
    </div>
  );
}

export default App;