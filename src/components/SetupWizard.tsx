// import { useState, useEffect } from 'react';
// import { supabase, Major, Subject } from '../lib/supabase';
// import { Settings, Plus, Trash2, Save } from 'lucide-react';

// interface SetupWizardProps {
//   onComplete: () => void;
// }

// export default function SetupWizard({ onComplete }: SetupWizardProps) {
//   const [majors, setMajors] = useState<Major[]>([]);
//   const [subjects, setSubjects] = useState<Subject[]>([]);
//   const [activeTab, setActiveTab] = useState<'majors' | 'subjects'>('majors');
//   const [loading, setLoading] = useState(false);

//   const [newMajor, setNewMajor] = useState({ name: '', code: '' });
//   const [newSubject, setNewSubject] = useState({ name: '', code: '', semester: 1, major_id: '' });

//   useEffect(() => {
//     loadData();
//   }, []);

//   const loadData = async () => {
//     const { data: majorsData } = await supabase.from('majors').select('*').order('name');
//     const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');

//     if (majorsData) setMajors(majorsData);
//     if (subjectsData) setSubjects(subjectsData);
//   };

//   const addMajor = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { error } = await supabase.from('majors').insert({
//         name: newMajor.name,
//         code: newMajor.code || null,
//       });

//       if (error) {
//         console.error('Error adding major:', error);
//         alert(`Error al agregar carrera: ${error.message}`);
//         return;
//       }

//       setNewMajor({ name: '', code: '' });
//       loadData();
//     } catch (error: any) {
//       console.error('Error adding major:', error);
//       alert(`Error al agregar carrera: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteMajor = async (id: string) => {
//     if (!confirm('¿Estás seguro de eliminar esta carrera?')) return;
//     try {
//       await supabase.from('majors').delete().eq('id', id);
//       loadData();
//     } catch (error) {
//       console.error('Error deleting major:', error);
//     }
//   };

//   const addSubject = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const { error } = await supabase.from('subjects').insert({
//         name: newSubject.name,
//         code: newSubject.code || null,
//         semester: newSubject.semester,
//         major_id: newSubject.major_id || null,
//       });

//       if (error) {
//         console.error('Error adding subject:', error);
//         alert(`Error al agregar materia: ${error.message}`);
//         return;
//       }

//       setNewSubject({ name: '', code: '', semester: 1, major_id: '' });
//       loadData();
//     } catch (error: any) {
//       console.error('Error adding subject:', error);
//       alert(`Error al agregar materia: ${error.message}`);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const deleteSubject = async (id: string) => {
//     if (!confirm('¿Estás seguro de eliminar esta materia?')) return;
//     try {
//       await supabase.from('subjects').delete().eq('id', id);
//       loadData();
//     } catch (error) {
//       console.error('Error deleting subject:', error);
//     }
//   };


//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <div className="flex items-center gap-3 mb-6">
//         <Settings className="w-8 h-8 text-slate-600" />
//         <div>
//           <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
//           <p className="text-sm text-gray-600">
//             Administra carreras y materias del instituto
//           </p>
//         </div>
//       </div>

//       <div className="flex gap-2 mb-6 border-b border-gray-200">
//         <button
//           onClick={() => setActiveTab('majors')}
//           className={`px-4 py-2 font-medium transition-colors border-b-2 ${
//             activeTab === 'majors'
//               ? 'border-blue-600 text-blue-600'
//               : 'border-transparent text-gray-600 hover:text-gray-800'
//           }`}
//         >
//           Carreras
//         </button>
//         <button
//           onClick={() => setActiveTab('subjects')}
//           className={`px-4 py-2 font-medium transition-colors border-b-2 ${
//             activeTab === 'subjects'
//               ? 'border-blue-600 text-blue-600'
//               : 'border-transparent text-gray-600 hover:text-gray-800'
//           }`}
//         >
//           Materias
//         </button>
//       </div>

//       {activeTab === 'majors' && (
//         <div className="space-y-6">
//           <form onSubmit={addMajor} className="bg-gray-50 p-4 rounded-lg space-y-4">
//             <h3 className="font-semibold text-gray-800">Agregar Carrera</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input
//                 type="text"
//                 required
//                 placeholder="Nombre de la carrera"
//                 value={newMajor.name}
//                 onChange={(e) => setNewMajor({ ...newMajor, name: e.target.value })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <input
//                 type="text"
//                 placeholder="Código (opcional)"
//                 value={newMajor.code}
//                 onChange={(e) => setNewMajor({ ...newMajor, code: e.target.value })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
//             >
//               <Plus className="w-4 h-4" />
//               Agregar
//             </button>
//           </form>

//           <div className="space-y-2">
//             {majors.map((major) => (
//               <div key={major.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
//                 <div>
//                   <p className="font-medium text-gray-800">{major.name}</p>
//                   {major.code && <p className="text-sm text-gray-600">Código: {major.code}</p>}
//                 </div>
//                 <button
//                   onClick={() => deleteMajor(major.id)}
//                   className="text-red-600 hover:text-red-800"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {activeTab === 'subjects' && (
//         <div className="space-y-6">
//           <form onSubmit={addSubject} className="bg-gray-50 p-4 rounded-lg space-y-4">
//             <h3 className="font-semibold text-gray-800">Agregar Materia</h3>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <input
//                 type="text"
//                 required
//                 placeholder="Nombre de la materia"
//                 value={newSubject.name}
//                 onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <input
//                 type="text"
//                 placeholder="Código (opcional)"
//                 value={newSubject.code}
//                 onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <input
//                 type="number"
//                 required
//                 min="1"
//                 placeholder="Semestre"
//                 value={newSubject.semester}
//                 onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               />
//               <select
//                 value={newSubject.major_id}
//                 onChange={(e) => setNewSubject({ ...newSubject, major_id: e.target.value })}
//                 className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//               >
//                 <option value="">Sin carrera específica</option>
//                 {majors.map((major) => (
//                   <option key={major.id} value={major.id}>
//                     {major.name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <button
//               type="submit"
//               disabled={loading}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
//             >
//               <Plus className="w-4 h-4" />
//               Agregar
//             </button>
//           </form>

//           <div className="space-y-2">
//             {subjects.map((subject) => (
//               <div key={subject.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
//                 <div>
//                   <p className="font-medium text-gray-800">{subject.name}</p>
//                   <p className="text-sm text-gray-600">
//                     Semestre {subject.semester}
//                     {subject.code && ` • Código: ${subject.code}`}
//                   </p>
//                 </div>
//                 <button
//                   onClick={() => deleteSubject(subject.id)}
//                   className="text-red-600 hover:text-red-800"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="mt-6 pt-6 border-t">
//         <button
//           onClick={onComplete}
//           className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
//         >
//           <Save className="w-5 h-5" />
//           Guardar y Continuar
//         </button>
//       </div>
//     </div>
//   );
// }



import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, Plus, Trash2, Save, BookOpen, GraduationCap } from 'lucide-react';

interface Carrera {
  id: string;
  nombre: string;
  codigo: string | null;
  creado_en: string;
}

interface Materia {
  id: string;
  nombre: string;
  codigo: string | null;
  semestre: number;
  carrera_id: string | null;
  carreras?: { nombre: string } | null;
  creado_en: string;
}

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [activeTab, setActiveTab] = useState<'carreras' | 'materias'>('carreras');
  const [loading, setLoading] = useState(false);

  const [newCarrera, setNewCarrera] = useState({ nombre: '', codigo: '' });
  const [newMateria, setNewMateria] = useState({ 
    nombre: '', 
    codigo: '', 
    semestre: 1, 
    carrera_id: '' 
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Cargar carreras
      const { data: carrerasData, error: carrerasError } = await supabase
        .from('carreras')
        .select('*')
        .order('nombre');

      if (carrerasError) {
        console.error('Error loading carreras:', carrerasError);
      } else {
        setCarreras(carrerasData || []);
      }

      // Cargar materias con sus carreras
      const { data: materiasData, error: materiasError } = await supabase
        .from('materias')
        .select(`
          *,
          carreras (nombre)
        `)
        .order('nombre');

      if (materiasError) {
        console.error('Error loading materias:', materiasError);
      } else {
        setMaterias(materiasData || []);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    }
  };

  const addCarrera = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCarrera.nombre.trim()) {
      alert('El nombre de la carrera es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('carreras').insert({
        nombre: newCarrera.nombre.trim(),
        codigo: newCarrera.codigo.trim() || null,
      });

      if (error) {
        console.error('Error adding carrera:', error);
        alert(`Error al agregar carrera: ${error.message}`);
        return;
      }

      alert('Carrera agregada correctamente');
      setNewCarrera({ nombre: '', codigo: '' });
      loadData();
    } catch (error: any) {
      console.error('Error adding carrera:', error);
      alert(`Error al agregar carrera: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteCarrera = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta carrera? Esto puede afectar a estudiantes y materias asociadas.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('carreras').delete().eq('id', id);

      if (error) {
        console.error('Error deleting carrera:', error);
        alert(`Error al eliminar: ${error.message}`);
        return;
      }

      alert('Carrera eliminada');
      loadData();
    } catch (error: any) {
      console.error('Error deleting carrera:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMateria = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMateria.nombre.trim()) {
      alert('El nombre de la materia es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('materias').insert({
        nombre: newMateria.nombre.trim(),
        codigo: newMateria.codigo.trim() || null,
        semestre: newMateria.semestre,
        carrera_id: newMateria.carrera_id || null,
      });

      if (error) {
        console.error('Error adding materia:', error);
        alert(`Error al agregar materia: ${error.message}`);
        return;
      }

      alert('Materia agregada correctamente');
      setNewMateria({ nombre: '', codigo: '', semestre: 1, carrera_id: '' });
      loadData();
    } catch (error: any) {
      console.error('Error adding materia:', error);
      alert(`Error al agregar materia: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMateria = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta materia? Esto puede afectar a grupos y registros académicos.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('materias').delete().eq('id', id);

      if (error) {
        console.error('Error deleting materia:', error);
        alert(`Error al eliminar: ${error.message}`);
        return;
      }

      alert('Materia eliminada');
      loadData();
    } catch (error: any) {
      console.error('Error deleting materia:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
          <p className="text-sm text-gray-600">
            Administra carreras y materias del Instituto Tecnológico de Tijuana
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('carreras')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'carreras'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Carreras ({carreras.length})
        </button>
        <button
          onClick={() => setActiveTab('materias')}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'materias'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Materias ({materias.length})
        </button>
      </div>

      {activeTab === 'carreras' && (
        <div className="space-y-6">
          <form onSubmit={addCarrera} className="bg-blue-50 border border-blue-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-blue-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nueva Carrera
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Carrera *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ingeniería en Sistemas Computacionales"
                  value={newCarrera.nombre}
                  onChange={(e) => setNewCarrera({ ...newCarrera, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: ISC"
                  value={newCarrera.codigo}
                  onChange={(e) => setNewCarrera({ ...newCarrera, codigo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Agregando...' : 'Agregar Carrera'}
            </button>
          </form>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 mb-3">
              Carreras Registradas ({carreras.length})
            </h4>
            {carreras.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay carreras registradas</p>
                <p className="text-sm text-gray-400">Agrega la primera carrera usando el formulario</p>
              </div>
            ) : (
              carreras.map((carrera) => (
                <div key={carrera.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800">{carrera.nombre}</p>
                      {carrera.codigo && (
                        <p className="text-sm text-gray-600">Código: {carrera.codigo}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteCarrera(carrera.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Eliminar carrera"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'materias' && (
        <div className="space-y-6">
          <form onSubmit={addMateria} className="bg-green-50 border border-green-200 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-green-900 flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nueva Materia
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la Materia *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Programación Orientada a Objetos"
                  value={newMateria.nombre}
                  onChange={(e) => setNewMateria({ ...newMateria, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: AED-1286"
                  value={newMateria.codigo}
                  onChange={(e) => setNewMateria({ ...newMateria, codigo: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semestre *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="12"
                  placeholder="1-12"
                  value={newMateria.semestre}
                  onChange={(e) => setNewMateria({ ...newMateria, semestre: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carrera
                </label>
                <select
                  value={newMateria.carrera_id}
                  onChange={(e) => setNewMateria({ ...newMateria, carrera_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">General (Todas las carreras)</option>
                  {carreras.map((carrera) => (
                    <option key={carrera.id} value={carrera.id}>
                      {carrera.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Agregando...' : 'Agregar Materia'}
            </button>
          </form>

          <div className="space-y-2">
            <h4 className="font-semibold text-gray-700 mb-3">
              Materias Registradas ({materias.length})
            </h4>
            {materias.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No hay materias registradas</p>
                <p className="text-sm text-gray-400">Agrega la primera materia usando el formulario</p>
              </div>
            ) : (
              materias.map((materia) => (
                <div key={materia.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-800">{materia.nombre}</p>
                      <p className="text-sm text-gray-600">
                        Semestre {materia.semestre}
                        {materia.codigo && ` • Código: ${materia.codigo}`}
                        {materia.carreras && (
                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            {materia.carreras.nombre}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteMateria(materia.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                    title="Eliminar materia"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-t">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          Guardar Configuración y Continuar
        </button>
      </div>
    </div>
  );
}