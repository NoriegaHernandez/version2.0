import { useState, useEffect } from 'react';
import { supabase, Major, Subject, Student, StudentSubjectRecord } from '../lib/supabase';
import { Save, X } from 'lucide-react';

interface StudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StudentForm({ onSuccess, onCancel }: StudentFormProps) {
  const [majors, setMajors] = useState<Major[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    control_number: '',
    first_name: '',
    paternal_surname: '',
    maternal_surname: '',
    major_id: '',
    current_semester: 1,
    subject_id: '',
    subject_semester: 1,
    unit1_grade: '',
    unit2_grade: '',
    unit3_grade: '',
    attendance_percentage: '',
  });

  useEffect(() => {
    loadMajors();
    loadSubjects();
  }, []);

  const loadMajors = async () => {
    const { data } = await supabase.from('majors').select('*').order('name');
    if (data) setMajors(data);
  };

  const loadSubjects = async () => {
    const { data } = await supabase.from('subjects').select('*').order('name');
    if (data) setSubjects(data);
  };

  const calculateFinalGrade = () => {
    const u1 = parseFloat(formData.unit1_grade) || 0;
    const u2 = parseFloat(formData.unit2_grade) || 0;
    const u3 = parseFloat(formData.unit3_grade) || 0;
    return ((u1 + u2 + u3) / 3).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('control_number', formData.control_number)
        .maybeSingle();

      let studentId: string;

      if (existingStudent) {
        studentId = existingStudent.id;
        await supabase
          .from('students')
          .update({
            first_name: formData.first_name,
            paternal_surname: formData.paternal_surname,
            maternal_surname: formData.maternal_surname,
            major_id: formData.major_id || null,
            current_semester: formData.current_semester,
            updated_at: new Date().toISOString(),
          })
          .eq('id', studentId);
      } else {
        const { data: newStudent, error } = await supabase
          .from('students')
          .insert({
            control_number: formData.control_number,
            first_name: formData.first_name,
            paternal_surname: formData.paternal_surname,
            maternal_surname: formData.maternal_surname,
            major_id: formData.major_id || null,
            current_semester: formData.current_semester,
          })
          .select()
          .single();

        if (error) throw error;
        studentId = newStudent.id;
      }

      const finalGrade = parseFloat(calculateFinalGrade());
      const status = finalGrade >= 70 ? 'approved' : 'failed';

      await supabase.from('student_subject_records').insert({
        student_id: studentId,
        subject_id: formData.subject_id,
        semester: formData.subject_semester,
        unit1_grade: parseFloat(formData.unit1_grade) || null,
        unit2_grade: parseFloat(formData.unit2_grade) || null,
        unit3_grade: parseFloat(formData.unit3_grade) || null,
        final_grade: finalGrade,
        attendance_percentage: parseFloat(formData.attendance_percentage) || null,
        status,
      });

      onSuccess();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Error al guardar el estudiante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Registro de Estudiante</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Control *
              </label>
              <input
                type="text"
                required
                value={formData.control_number}
                onChange={(e) => setFormData({ ...formData, control_number: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 20210001"
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

            <div className="md:col-span-2">
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
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Registro de Materia</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Materia *
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar materia</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre Cursado *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="12"
                  value={formData.subject_semester}
                  onChange={(e) => setFormData({ ...formData, subject_semester: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación Unidad 1
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit1_grade}
                  onChange={(e) => setFormData({ ...formData, unit1_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación Unidad 2
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit2_grade}
                  onChange={(e) => setFormData({ ...formData, unit2_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Calificación Unidad 3
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit3_grade}
                  onChange={(e) => setFormData({ ...formData, unit3_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Asistencia (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.attendance_percentage}
                  onChange={(e) => setFormData({ ...formData, attendance_percentage: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.unit1_grade && formData.unit2_grade && formData.unit3_grade && (
                <div className="md:col-span-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900">
                      Calificación Final: <span className="text-xl">{calculateFinalGrade()}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
