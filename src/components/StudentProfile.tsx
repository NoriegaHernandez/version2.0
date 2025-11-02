// src/components/StudentProfile.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Save, Mail, GraduationCap } from 'lucide-react';

interface Major {
  id: string;
  name: string;
}

interface StudentData {
  id: string;
  control_number: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
  major_id: string | null;
  current_semester: number;
}

export default function StudentProfile() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [majors, setMajors] = useState<Major[]>([]);
  const [formData, setFormData] = useState({
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    major_id: '',
    current_semester: 1,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.student_id) {
      setLoading(false);
      return;
    }

    try {
      // Load student data
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', profile.student_id)
        .single();

      if (studentError) throw studentError;

      setStudentData(student);
      setFormData({
        first_name: student.first_name,
        paternal_surname: student.paternal_surname,
        maternal_surname: student.maternal_surname,
        major_id: student.major_id || '',
        current_semester: student.current_semester,
      });

      // Load majors
      const { data: majorsData } = await supabase
        .from('majors')
        .select('id, name')
        .order('name');

      if (majorsData) setMajors(majorsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('students')
        .update({
          first_name: formData.first_name,
          paternal_surname: formData.paternal_surname,
          maternal_surname: formData.maternal_surname,
          major_id: formData.major_id || null,
          current_semester: formData.current_semester,
        })
        .eq('id', studentData.id);

      if (error) throw error;

      alert('Información actualizada correctamente');
      loadData();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(`Error al actualizar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando perfil...</div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            No se encontró información de estudiante para este usuario.
          </p>
          <p className="text-sm text-gray-500">
            Contacta al administrador del sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {studentData.paternal_surname} {studentData.maternal_surname}, {studentData.first_name}
            </h2>
            <p className="text-blue-100 mt-1">
              Número de Control: {studentData.control_number}
            </p>
            <div className="flex items-center gap-2 mt-2 text-blue-100">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Información Académica</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre(s) *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Paterno *
              </label>
              <input
                type="text"
                required
                value={formData.paternal_surname}
                onChange={(e) => setFormData({ ...formData, paternal_surname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apellido Materno *
              </label>
              <input
                type="text"
                required
                value={formData.maternal_surname}
                onChange={(e) => setFormData({ ...formData, maternal_surname: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carrera
              </label>
              <select
                value={formData.major_id}
                onChange={(e) => setFormData({ ...formData, major_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar carrera</option>
                {majors.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semestre Actual *
              </label>
              <input
                type="number"
                required
                min="1"
                max="12"
                value={formData.current_semester}
                onChange={(e) => setFormData({ ...formData, current_semester: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Control
              </label>
              <input
                type="text"
                value={studentData.control_number}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Este campo no se puede modificar
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>

      {/* Information Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Nota:</strong> Solo puedes modificar tu información personal y académica.
          Las calificaciones son asignadas únicamente por los docentes.
          Si encuentras algún error en tus calificaciones, contacta a tu maestro o al coordinador académico.
        </p>
      </div>
    </div>
  );
}