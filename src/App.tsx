import { useState } from 'react';
import { BarChart3, Upload, FileText, Settings, LogOut, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import ExcelImport from './components/ExcelImport';
import ParetoAnalysisView from './components/ParetoAnalysisView';
import Reports from './components/Reports';
import SetupWizard from './components/SetupWizard';
import UserManagement from './components/UserManagement';
import GroupManagement from './components/GroupManagement';
import TeacherGroupsView from './components/TeacherGroupsView';
import StudentDashboard from './components/StudentDashboard';

type View = 'dashboard' | 'my-groups' | 'analysis' | 'reports' | 'import' | 'setup' | 'users' | 'groups';

function AppContent() {
  const { user, profile, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  const handleSignOut = async () => {
    if (confirm('¿Estás seguro de cerrar sesión?')) {
      await signOut();
    }
  };

  const renderView = () => {
    // Student views
    if (profile.role === 'student') {
      return <StudentDashboard />;
    }

    // Teacher views
    if (profile.role === 'teacher') {
      switch (currentView) {
        case 'my-groups':
        case 'dashboard':
          return <TeacherGroupsView />;
        case 'analysis':
          return <ParetoAnalysisView />; 
        case 'reports':
          return <Reports />;
        case 'import': 
          return <ExcelImport onSuccess={() => setCurrentView('dashboard')} />;
        default:
          return <TeacherGroupsView />;
      }
    }

    // Admin views
    switch (currentView) {
      case 'analysis':
        return <ParetoAnalysisView />;
      case 'import':
        return <ExcelImport onSuccess={() => setCurrentView('groups')} />;
      case 'reports':
        return <Reports />;
      case 'setup':
        return <SetupWizard onComplete={() => setCurrentView('dashboard')} />;
      case 'users':
        return <UserManagement />;
      case 'groups':
        return <GroupManagement />;
      default:
        return (
             
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('groups')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Gestión de Grupos</h3>
                  <p className="text-sm text-gray-600">Materias y docentes</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Crea grupos de materias, asigna docentes e inscribe estudiantes.
              </p>
            </div>

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

            <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setCurrentView('users')}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Settings className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Gestión de Usuarios</h3>
                  <p className="text-sm text-gray-600">Admin, docentes y alumnos</p>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                Crea y administra cuentas de usuarios del sistema con diferentes roles.
              </p>
            </div>
          </div>
        );
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      teacher: 'Docente',
      student: 'Estudiante',
    };
    return labels[role as keyof typeof labels] || role;
  };

  // Menú de navegación para docentes
  const teacherMenu = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setCurrentView('dashboard')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          currentView === 'dashboard' || currentView === 'my-groups'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Mis Grupos
      </button>
      <button
        onClick={() => setCurrentView('analysis')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          currentView === 'analysis'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Análisis de Pareto
      </button>
      <button
        onClick={() => setCurrentView('reports')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          currentView === 'reports'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Reportes
      </button>
      <button
        onClick={() => setCurrentView('import')}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          currentView === 'import'
            ? 'bg-blue-100 text-blue-700'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        Importar
      </button>
    </div>
  );

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="flex justify-center items-center gap-6 py-4 bg-white shadow-sm">
      <img
        src="/src/Images/educacionnuevo.jpg"
        alt="Logo Educación"
        className="w-60 h-60 object-contain"
      />
      <img
        src="/src/Images/logo-tecnm.svg"
        alt="Logo TecNM"
        className="w-60 h-60 object-contain"
      />
      <img
        src="/src/Images/logo_TECT.jpg"
        alt="Logo Instituto Tecnológico de Tijuana"
        className="w-40 h-40 object-contain"
      />
    </div>
    
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <nav className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Sistema de Análisis de Calidad Académica
                </h1>
                <p className="text-xs text-gray-600">
                  Instituto Tecnológico de Tijuana
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {profile.role === 'teacher' && teacherMenu}
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{profile.full_name}</p>
                <p className="text-xs text-gray-600">{getRoleLabel(profile.role)}</p>
              </div>
              
              {currentView !== 'dashboard' && profile.role === 'admin' && (
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Inicio
                </button>
              )}
              
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderView()}
      </main>
    </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;