// src/components/GradeAssignment.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BookOpen, Save, X } from 'lucide-react';

interface Student {
  id: string;
  control_number: string;
  first_name: string;
  paternal_surname: string;
  maternal_surname: string;
}

interface Subject {
  id: string;
  name: string;
  semester: number;
}

interface GradeAssignmentProps {
  onSuccess: () => void;
  onCancel: () => void;
  existingRecord?: {
    id: string;
    student_id: string;
    subject_id: string;
    semester: number;
    unit1_grade: number | null;
    unit2_grade: number | null;
    unit3_grade: number | null;
    attendance_percentage: number | null;
  };
}

export default function GradeAssignment({ onSuccess, onCancel, existingRecord }: GradeAssignmentProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    student_id: existingRecord?.student_id || '',
    subject_id: existingRecord?.subject_id || '',
    semester: existingRecord?.semester || 1,
    unit1_grade: existingRecord?.unit1_grade?.toString() || '',
    unit2_grade: existingRecord?.unit2_grade?.toString() || '',
    unit3_grade: existingRecord?.unit3_grade?.toString() || '',
    attendance_percentage: existingRecord?.attendance_percentage?.toString() || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: studentsData } = await supabase
      .from('students')
      .select('id, control_number, first_name, paternal_surname, maternal_surname')
      .order('paternal_surname');

    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('id, name, semester')
      .order('name');

    if (studentsData) setStudents(studentsData);
    if (subjectsData) setSubjects(subjectsData);
  };

  const calculateFinalGrade = () => {
    const u1 = parseFloat(formData.unit1_grade) || 0;
    const u2 = parseFloat(formData.unit2_grade) || 0;
    const u3 = parseFloat(formData.unit3_grade) || 0;
    
    if (u1 === 0 && u2 === 0 && u3 === 0) return null;
    
    return ((u1 + u2 + u3) / 3).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const finalGrade = calculateFinalGrade();
      const status = finalGrade && parseFloat(finalGrade) >= 70 ? 'approved' : 'failed';

      const recordData = {
        student_id: formData.student_id,
        subject_id: formData.subject_id,
        semester: formData.semester,
        unit1_grade: formData.unit1_grade ? parseFloat(formData.unit1_grade) : null,
        unit2_grade: formData.unit2_grade ? parseFloat(formData.unit2_grade) : null,
        unit3_grade: formData.unit3_grade ? parseFloat(formData.unit3_grade) : null,
        final_grade: finalGrade ? parseFloat(finalGrade) : null,
        attendance_percentage: formData.attendance_percentage ? parseFloat(formData.attendance_percentage) : null,
        status,
      };

      if (existingRecord) {
        const { error } = await supabase
          .from('student_subject_records')
          .update(recordData)
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('student_subject_records')
          .insert(recordData);

        if (error) throw error;
      }

      onSuccess();
    } catch (error: any) {
      console.error('Error saving grades:', error);
      alert(`Error al guardar calificaciones: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (student: Student) => {
    return `${student.paternal_surname} ${student.maternal_surname}, ${student.first_name} (${student.control_number})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">
              {existingRecord ? 'Editar Calificaciones' : 'Asignar Calificaciones'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estudiante *
              </label>
              <select
                required
                disabled={!!existingRecord}
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar estudiante</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentName(student)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Materia *
              </label>
              <select
                required
                disabled={!!existingRecord}
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              >
                <option value="">Seleccionar materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} (Sem. {subject.semester})
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
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
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
                placeholder="0-100"
              />
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Calificaciones por Unidad</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad 1
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit1_grade}
                  onChange={(e) => setFormData({ ...formData, unit1_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad 2
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit2_grade}
                  onChange={(e) => setFormData({ ...formData, unit2_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidad 3
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.unit3_grade}
                  onChange={(e) => setFormData({ ...formData, unit3_grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0-100"
                />
              </div>
            </div>

            {calculateFinalGrade() && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-900">
                    Calificación Final:
                  </span>
                  <span className={`text-2xl font-bold ${
                    parseFloat(calculateFinalGrade()!) >= 70 ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {calculateFinalGrade()}
                  </span>
                </div>
                <p className="text-xs text-blue-800 mt-1">
                  {parseFloat(calculateFinalGrade()!) >= 70 ? '✓ Aprobado' : '✗ Reprobado'}
                </p>
              </div>
            )}
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
              {loading ? 'Guardando...' : 'Guardar Calificaciones'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}