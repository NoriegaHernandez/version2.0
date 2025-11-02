import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, AlertTriangle, Edit } from 'lucide-react';
import RiskFactorForm from './RiskFactorForm';

interface StudentRecord {
  id: string;
  student: {
    control_number: string;
    first_name: string;
    paternal_surname: string;
    maternal_surname: string;
  };
  subject: {
    name: string;
  };
  semester: number;
  final_grade: number | null;
  status: string;
  risk_count: number;
}

export default function StudentList() {
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<StudentRecord | null>(null);
  const [filter, setFilter] = useState<'all' | 'failed' | 'dropout'>('all');

  useEffect(() => {
    loadRecords();
  }, [filter]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_subject_records')
        .select(`
          id,
          semester,
          final_grade,
          status,
          students!inner (
            control_number,
            first_name,
            paternal_surname,
            maternal_surname
          ),
          subjects!inner (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      const recordsWithRiskCount = await Promise.all(
        (data || []).map(async (record: any) => {
          const { count } = await supabase
            .from('student_risk_factors')
            .select('id', { count: 'exact', head: true })
            .eq('student_subject_record_id', record.id);

          return {
            id: record.id,
            student: record.students,
            subject: record.subjects,
            semester: record.semester,
            final_grade: record.final_grade,
            status: record.status,
            risk_count: count || 0,
          };
        })
      );

      setRecords(recordsWithRiskCount);
    } catch (error) {
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      dropout: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const labels = {
      approved: 'Aprobado',
      failed: 'Reprobado',
      dropout: 'Deserción',
      in_progress: 'En progreso',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando estudiantes...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Registros de Estudiantes</h2>
              <p className="text-sm text-gray-600">
                {records.length} registro{records.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('failed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'failed'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Reprobados
            </button>
            <button
              onClick={() => setFilter('dropout')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'dropout'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Deserción
            </button>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No hay registros para mostrar
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Número de Control
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Estudiante
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Materia
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Semestre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Calificación
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Riesgos
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {record.student.control_number}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {record.student.paternal_surname} {record.student.maternal_surname},{' '}
                      {record.student.first_name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {record.subject.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {record.semester}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {record.final_grade !== null ? (
                        <span className={record.final_grade >= 70 ? 'text-green-700 font-semibold' : 'text-red-700 font-semibold'}>
                          {record.final_grade.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-4 py-3">
                      {record.risk_count > 0 ? (
                        <span className="flex items-center gap-1 text-orange-600 text-sm font-medium">
                          <AlertTriangle className="w-4 h-4" />
                          {record.risk_count}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Ninguno</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedRecord(record)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                      >
                        <Edit className="w-4 h-4" />
                        Riesgos
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRecord && (
        <RiskFactorForm
          recordId={selectedRecord.id}
          studentName={`${selectedRecord.student.paternal_surname} ${selectedRecord.student.maternal_surname}, ${selectedRecord.student.first_name}`}
          onSuccess={() => {
            setSelectedRecord(null);
            loadRecords();
          }}
          onCancel={() => setSelectedRecord(null)}
        />
      )}
    </>
  );
}
