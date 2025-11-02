import { useState, useEffect } from 'react';
import { supabase, Major, Subject } from '../lib/supabase';
import { Settings, Plus, Trash2, Save } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export default function SetupWizard({ onComplete }: SetupWizardProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [activeTab, setActiveTab] = useState<'majors' | 'subjects'>('majors');
  const [loading, setLoading] = useState(false);

  const [newMajor, setNewMajor] = useState({ name: '', code: '' });
  const [newSubject, setNewSubject] = useState({ name: '', code: '', semester: 1, major_id: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: majorsData } = await supabase.from('majors').select('*').order('name');
    const { data: subjectsData } = await supabase.from('subjects').select('*').order('name');

    if (majorsData) setMajors(majorsData);
    if (subjectsData) setSubjects(subjectsData);
  };

  const addMajor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('majors').insert({
        name: newMajor.name,
        code: newMajor.code || null,
      });

      if (error) {
        console.error('Error adding major:', error);
        alert(`Error al agregar carrera: ${error.message}`);
        return;
      }

      setNewMajor({ name: '', code: '' });
      loadData();
    } catch (error: any) {
      console.error('Error adding major:', error);
      alert(`Error al agregar carrera: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteMajor = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta carrera?')) return;
    try {
      await supabase.from('majors').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting major:', error);
    }
  };

  const addSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        name: newSubject.name,
        code: newSubject.code || null,
        semester: newSubject.semester,
        major_id: newSubject.major_id || null,
      });

      if (error) {
        console.error('Error adding subject:', error);
        alert(`Error al agregar materia: ${error.message}`);
        return;
      }

      setNewSubject({ name: '', code: '', semester: 1, major_id: '' });
      loadData();
    } catch (error: any) {
      console.error('Error adding subject:', error);
      alert(`Error al agregar materia: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteSubject = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta materia?')) return;
    try {
      await supabase.from('subjects').delete().eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting subject:', error);
    }
  };


  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-slate-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
          <p className="text-sm text-gray-600">
            Administra carreras y materias del instituto
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('majors')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'majors'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Carreras
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === 'subjects'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Materias
        </button>
      </div>

      {activeTab === 'majors' && (
        <div className="space-y-6">
          <form onSubmit={addMajor} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-800">Agregar Carrera</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Nombre de la carrera"
                value={newMajor.name}
                onChange={(e) => setNewMajor({ ...newMajor, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Código (opcional)"
                value={newMajor.code}
                onChange={(e) => setNewMajor({ ...newMajor, code: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </form>

          <div className="space-y-2">
            {majors.map((major) => (
              <div key={major.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{major.name}</p>
                  {major.code && <p className="text-sm text-gray-600">Código: {major.code}</p>}
                </div>
                <button
                  onClick={() => deleteMajor(major.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-6">
          <form onSubmit={addSubject} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-semibold text-gray-800">Agregar Materia</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                required
                placeholder="Nombre de la materia"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Código (opcional)"
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                required
                min="1"
                placeholder="Semestre"
                value={newSubject.semester}
                onChange={(e) => setNewSubject({ ...newSubject, semester: parseInt(e.target.value) })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newSubject.major_id}
                onChange={(e) => setNewSubject({ ...newSubject, major_id: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin carrera específica</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </form>

          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{subject.name}</p>
                  <p className="text-sm text-gray-600">
                    Semestre {subject.semester}
                    {subject.code && ` • Código: ${subject.code}`}
                  </p>
                </div>
                <button
                  onClick={() => deleteSubject(subject.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <button
          onClick={onComplete}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <Save className="w-5 h-5" />
          Guardar y Continuar
        </button>
      </div>
    </div>
  );
}
