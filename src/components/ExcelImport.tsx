import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, CheckCircle, XCircle } from 'lucide-react';

interface ExcelImportProps {
  onSuccess: () => void;
}

interface ImportResult {
  success: number;
  errors: string[];
}

export default function ExcelImport({ onSuccess }: ExcelImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseCSV = (text: string): any[] => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = values[index];
      });
      return obj;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const text = await file.text();
      const records = parseCSV(text);

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        try {
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .eq('control_number', record.control_number || record.numero_control)
            .maybeSingle();

          let studentId: string;

          if (existingStudent) {
            studentId = existingStudent.id;
          } else {
            const { data: newStudent, error: studentError } = await supabase
              .from('students')
              .insert({
                control_number: record.control_number || record.numero_control,
                first_name: record.first_name || record.nombre,
                paternal_surname: record.paternal_surname || record.apellido_paterno,
                maternal_surname: record.maternal_surname || record.apellido_materno,
                current_semester: parseInt(record.current_semester || record.semestre) || 1,
              })
              .select()
              .single();

            if (studentError) {
              errors.push(`Fila ${i + 2}: Error al crear estudiante - ${studentError.message}`);
              continue;
            }
            studentId = newStudent.id;
          }

          const { data: subject } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', record.subject_name || record.materia)
            .maybeSingle();

          if (!subject) {
            errors.push(`Fila ${i + 2}: Materia "${record.subject_name || record.materia}" no encontrada`);
            continue;
          }

          const unit1 = parseFloat(record.unit1_grade || record.unidad1) || null;
          const unit2 = parseFloat(record.unit2_grade || record.unidad2) || null;
          const unit3 = parseFloat(record.unit3_grade || record.unidad3) || null;

          let finalGrade = null;
          if (unit1 !== null && unit2 !== null && unit3 !== null) {
            finalGrade = (unit1 + unit2 + unit3) / 3;
          }

          const status = finalGrade && finalGrade >= 70 ? 'approved' : 'failed';

          await supabase.from('student_subject_records').insert({
            student_id: studentId,
            subject_id: subject.id,
            semester: parseInt(record.semester || record.semestre_cursado) || 1,
            unit1_grade: unit1,
            unit2_grade: unit2,
            unit3_grade: unit3,
            final_grade: finalGrade,
            attendance_percentage: parseFloat(record.attendance || record.asistencia) || null,
            status,
          });

          successCount++;
        } catch (error: any) {
          errors.push(`Fila ${i + 2}: ${error.message}`);
        }
      }

      setResult({ success: successCount, errors });
      if (successCount > 0) {
        onSuccess();
      }
    } catch (error: any) {
      errors.push(`Error general: ${error.message}`);
      setResult({ success: successCount, errors });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="w-8 h-8 text-green-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Importar desde Excel/CSV</h2>
          <p className="text-sm text-gray-600">
            Carga datos de estudiantes desde un archivo CSV
          </p>
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Formato esperado del archivo CSV:</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p><strong>Columnas requeridas:</strong></p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>control_number (número de control del estudiante)</li>
            <li>first_name (nombre)</li>
            <li>paternal_surname (apellido paterno)</li>
            <li>maternal_surname (apellido materno)</li>
            <li>current_semester (semestre actual)</li>
            <li>subject_name (nombre de la materia)</li>
            <li>semester (semestre cursado)</li>
            <li>unit1_grade, unit2_grade, unit3_grade (calificaciones)</li>
            <li>attendance (porcentaje de asistencia)</li>
          </ul>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
          <input
            type="file"
            accept=".csv,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-700 font-medium mb-1">
              {file ? file.name : 'Seleccionar archivo CSV'}
            </p>
            <p className="text-sm text-gray-500">
              Haz clic para seleccionar un archivo
            </p>
          </label>
        </div>

        <button
          onClick={handleImport}
          disabled={!file || loading}
          className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 font-medium"
        >
          {loading ? 'Importando...' : 'Importar Datos'}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          {result.success > 0 && (
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">
                  {result.success} registro{result.success !== 1 ? 's' : ''} importado{result.success !== 1 ? 's' : ''} exitosamente
                </p>
              </div>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-red-900 mb-2">
                  {result.errors.length} error{result.errors.length !== 1 ? 'es' : ''}:
                </p>
                <ul className="text-sm text-red-800 space-y-1 max-h-40 overflow-y-auto">
                  {result.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
