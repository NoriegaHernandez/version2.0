import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download, Info } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImporterProps {
  onSuccess?: () => void;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string }>;
  warnings: Array<{ row: number; warning: string }>;
}

export default function ExcelImporter({ onSuccess }: ExcelImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importType, setImportType] = useState<'students' | 'grades' | 'risk_factors'>('students');
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Obtener usuario actual al cargar
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const downloadTemplate = () => {
    let templateData: any[] = [];
    let filename = '';

    switch (importType) {
      case 'students':
        templateData = [
          {
            'Número de Control': '20210001',
            'Nombre': 'Juan',
            'Apellido Paterno': 'Pérez',
            'Apellido Materno': 'García',
            'Carrera (código o nombre)': 'ISC',
            'Semestre Actual': 3
          }
        ];
        filename = 'plantilla_estudiantes.xlsx';
        break;

      // case 'grades':
      //   templateData = [
      //     {
      //       'Número de Control': '20210001',
      //       'Código Materia': 'MAT101',
      //       'Calificación Unidad 1': 85,
      //       'Calificación Unidad 2': 90,
      //       'Calificación Unidad 3': 88,
      //       'Calificación Final': 87.67,
      //       'Porcentaje Asistencia': 95,
      //       'Estado': 'aprobado'
      //     }
      //   ];
      //   filename = 'plantilla_calificaciones.xlsx';
      //   break;

      // case 'risk_factors':
      //   templateData = [
      //     {
      //       'Número de Control': '20210001',
      //       'Código Materia': 'MAT101',
      //       'Factor de Riesgo': 'Problemas económicos',
      //       'Severidad': 'alta',
      //       'Observaciones': 'Requiere apoyo de becas'
      //     }
      //   ];
      //   filename = 'plantilla_factores_riesgo.xlsx';
      //   break;
    }

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, filename);
  };

  const importStudents = async (data: any[]): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2; // +2 porque Excel empieza en 1 y la primera fila es encabezado

      try {
        // Validaciones
        if (!row['Número de Control']) {
          result.errors.push({ row: rowNum, error: 'Número de control es obligatorio' });
          continue;
        }
        if (!row['Nombre'] || !row['Apellido Paterno'] || !row['Apellido Materno']) {
          result.errors.push({ row: rowNum, error: 'Nombre completo es obligatorio' });
          continue;
        }
        if (!row['Semestre Actual'] || row['Semestre Actual'] <= 0) {
          result.errors.push({ row: rowNum, error: 'Semestre actual debe ser mayor a 0' });
          continue;
        }

        // Buscar carrera
        let carreraId = null;
        if (row['Carrera (código o nombre)']) {
          const { data: carrera } = await supabase
            .from('carreras')
            .select('id')
            .or(`codigo.eq.${row['Carrera (código o nombre)']},nombre.ilike.%${row['Carrera (código o nombre)']}%`)
            .single();
          
          if (carrera) {
            carreraId = carrera.id;
          } else {
            result.warnings.push({ 
              row: rowNum, 
              warning: `Carrera "${row['Carrera (código o nombre)']}" no encontrada. Estudiante creado sin carrera.` 
            });
          }
        }

        // Verificar si el estudiante ya existe
        const { data: existingStudent } = await supabase
          .from('estudiantes')
          .select('id')
          .eq('numero_control', row['Número de Control'])
          .single();

        if (existingStudent) {
          // Actualizar estudiante existente
          const { error } = await supabase
            .from('estudiantes')
            .update({
              nombre: row['Nombre'],
              apellido_paterno: row['Apellido Paterno'],
              apellido_materno: row['Apellido Materno'],
              carrera_id: carreraId,
              semestre_actual: row['Semestre Actual'],
              actualizado_en: new Date().toISOString()
            })
            .eq('id', existingStudent.id);

          if (error) throw error;
          result.warnings.push({ row: rowNum, warning: 'Estudiante actualizado (ya existía)' });
        } else {
          // Crear nuevo estudiante
          const { error } = await supabase
            .from('estudiantes')
            .insert({
              numero_control: row['Número de Control'],
              nombre: row['Nombre'],
              apellido_paterno: row['Apellido Paterno'],
              apellido_materno: row['Apellido Materno'],
              carrera_id: carreraId,
              semestre_actual: row['Semestre Actual']
            });

          if (error) throw error;
        }

        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNum, error: error.message });
      }
    }

    return result;
  };

  const importGrades = async (data: any[]): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        // Validaciones
        if (!row['Número de Control']) {
          result.errors.push({ row: rowNum, error: 'Número de control es obligatorio' });
          continue;
        }
        if (!row['Código Materia']) {
          result.errors.push({ row: rowNum, error: 'Código de materia es obligatorio' });
          continue;
        }

        // Buscar estudiante
        const { data: estudiante, error: studentError } = await supabase
          .from('estudiantes')
          .select('id')
          .eq('numero_control', row['Número de Control'])
          .single();

        if (studentError || !estudiante) {
          result.errors.push({ 
            row: rowNum, 
            error: `Estudiante con número de control ${row['Número de Control']} no encontrado` 
          });
          continue;
        }

        // Buscar materia
        const { data: materia, error: materiaError } = await supabase
          .from('materias')
          .select('id, semestre')
          .eq('codigo', row['Código Materia'])
          .single();

        if (materiaError || !materia) {
          result.errors.push({ 
            row: rowNum, 
            error: `Materia con código ${row['Código Materia']} no encontrada` 
          });
          continue;
        }

        // Validar calificaciones
        const validEstados = ['en_progreso', 'aprobado', 'reprobado', 'baja'];
        const estado = row['Estado']?.toLowerCase() || 'en_progreso';
        if (!validEstados.includes(estado)) {
          result.errors.push({ 
            row: rowNum, 
            error: `Estado "${row['Estado']}" no válido. Debe ser: ${validEstados.join(', ')}` 
          });
          continue;
        }

        // Verificar si ya existe un registro
        const { data: existingRecord } = await supabase
          .from('registros_estudiante_materia')
          .select('id')
          .eq('estudiante_id', estudiante.id)
          .eq('materia_id', materia.id)
          .single();

        const recordData = {
          estudiante_id: estudiante.id,
          materia_id: materia.id,
          semestre: materia.semestre,
          calificacion_unidad1: row['Calificación Unidad 1'] || null,
          calificacion_unidad2: row['Calificación Unidad 2'] || null,
          calificacion_unidad3: row['Calificación Unidad 3'] || null,
          calificacion_final: row['Calificación Final'] || null,
          porcentaje_asistencia: row['Porcentaje Asistencia'] || null,
          estado: estado,
          actualizado_en: new Date().toISOString()
        };

        if (existingRecord) {
          // Actualizar registro existente
          const { error } = await supabase
            .from('registros_estudiante_materia')
            .update(recordData)
            .eq('id', existingRecord.id);

          if (error) throw error;
          result.warnings.push({ row: rowNum, warning: 'Calificaciones actualizadas (registro existente)' });
        } else {
          // Crear nuevo registro
          const { error } = await supabase
            .from('registros_estudiante_materia')
            .insert(recordData);

          if (error) throw error;
        }

        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNum, error: error.message });
      }
    }

    return result;
  };

  const importRiskFactors = async (data: any[]): Promise<ImportResult> => {
    const result: ImportResult = { success: 0, errors: [], warnings: [] };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 2;

      try {
        // Validaciones
        if (!row['Número de Control']) {
          result.errors.push({ row: rowNum, error: 'Número de control es obligatorio' });
          continue;
        }
        if (!row['Código Materia']) {
          result.errors.push({ row: rowNum, error: 'Código de materia es obligatorio' });
          continue;
        }
        if (!row['Factor de Riesgo']) {
          result.errors.push({ row: rowNum, error: 'Factor de riesgo es obligatorio' });
          continue;
        }

        // Buscar estudiante
        const { data: estudiante } = await supabase
          .from('estudiantes')
          .select('id')
          .eq('numero_control', row['Número de Control'])
          .single();

        if (!estudiante) {
          result.errors.push({ 
            row: rowNum, 
            error: `Estudiante ${row['Número de Control']} no encontrado` 
          });
          continue;
        }

        // Buscar materia
        const { data: materia } = await supabase
          .from('materias')
          .select('id')
          .eq('codigo', row['Código Materia'])
          .single();

        if (!materia) {
          result.errors.push({ 
            row: rowNum, 
            error: `Materia ${row['Código Materia']} no encontrada` 
          });
          continue;
        }

        // Buscar registro estudiante-materia
        const { data: registro } = await supabase
          .from('registros_estudiante_materia')
          .select('id')
          .eq('estudiante_id', estudiante.id)
          .eq('materia_id', materia.id)
          .single();

        if (!registro) {
          result.errors.push({ 
            row: rowNum, 
            error: `No existe registro académico para ${row['Número de Control']} en ${row['Código Materia']}` 
          });
          continue;
        }

        // Buscar factor de riesgo
        const { data: factor } = await supabase
          .from('factores_riesgo')
          .select('id')
          .ilike('nombre', `%${row['Factor de Riesgo']}%`)
          .single();

        if (!factor) {
          result.errors.push({ 
            row: rowNum, 
            error: `Factor de riesgo "${row['Factor de Riesgo']}" no encontrado en el catálogo` 
          });
          continue;
        }

        // Validar severidad
        const validSeverities = ['baja', 'media', 'alta'];
        const severidad = (row['Severidad']?.toLowerCase() || 'media');
        if (!validSeverities.includes(severidad)) {
          result.errors.push({ 
            row: rowNum, 
            error: `Severidad "${row['Severidad']}" no válida. Debe ser: baja, media o alta` 
          });
          continue;
        }

        // Verificar si ya existe este factor para este estudiante-materia
        const { data: existingFactor } = await supabase
          .from('factores_riesgo_estudiante')
          .select('id')
          .eq('registro_estudiante_materia_id', registro.id)
          .eq('factor_riesgo_id', factor.id)
          .single();

        if (existingFactor) {
          // Actualizar
          const { error } = await supabase
            .from('factores_riesgo_estudiante')
            .update({
              severidad: severidad,
              observaciones: row['Observaciones'] || null
            })
            .eq('id', existingFactor.id);

          if (error) throw error;
          result.warnings.push({ row: rowNum, warning: 'Factor de riesgo actualizado (ya existía)' });
        } else {
          // Crear nuevo
          const { error } = await supabase
            .from('factores_riesgo_estudiante')
            .insert({
              registro_estudiante_materia_id: registro.id,
              factor_riesgo_id: factor.id,
              severidad: severidad,
              observaciones: row['Observaciones'] || null
            });

          if (error) throw error;
        }

        result.success++;
      } catch (error: any) {
        result.errors.push({ row: rowNum, error: error.message });
      }
    }

    return result;
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setResult(null);

    try {
      const fileBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(fileBuffer, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      if (data.length === 0) {
        setResult({
          success: 0,
          errors: [{ row: 0, error: 'El archivo está vacío o no tiene el formato correcto' }],
          warnings: []
        });
        return;
      }

      let importResult: ImportResult;

      switch (importType) {
        case 'students':
          importResult = await importStudents(data);
          break;
        case 'grades':
          importResult = await importGrades(data);
          break;
        case 'risk_factors':
          importResult = await importRiskFactors(data);
          break;
        default:
          throw new Error('Tipo de importación no válido');
      }

      setResult(importResult);
      
      // Llamar a onSuccess si la importación fue exitosa
      if (importResult.success > 0 && onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (error: any) {
      setResult({
        success: 0,
        errors: [{ row: 0, error: `Error al procesar el archivo: ${error.message}` }],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Upload className="w-8 h-8 text-blue-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Importar Datos desde Excel</h2>
          <p className="text-sm text-gray-600">
            Carga masiva de información académica
          </p>
        </div>
      </div>

      {/* Selector de tipo de importación */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Datos a Importar
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setImportType('students')}
            className={`p-4 rounded-lg border-2 transition-all ${
              importType === 'students'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-semibold text-gray-800">Estudiantes</div>
            <div className="text-xs text-gray-600 mt-1">
              Datos personales y carrera
            </div>
          </button>         
        </div>
      </div>

      {/* Información sobre el formato */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-2">Instrucciones:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Descarga la plantilla correspondiente al tipo de datos que deseas importar</li>
              <li>Completa la información en el archivo Excel siguiendo el formato exacto</li>
              <li>Guarda el archivo y selecciónalo para importar</li>
              <li>Revisa los resultados y corrige cualquier error reportado</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Botón descargar plantilla */}
      <div className="mb-6">
        <button
          onClick={downloadTemplate}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Descargar Plantilla Excel
        </button>
      </div>

      {/* Selector de archivo */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Archivo Excel
        </label>
        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer">
            <FileSpreadsheet className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">
              {file ? file.name : 'Seleccionar archivo .xlsx o .xls'}
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {file && (
            <button
              onClick={() => setFile(null)}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* Botón importar */}
      <button
        onClick={handleImport}
        disabled={!file || importing}
        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
          !file || importing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {importing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Importando...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Importar Datos
          </>
        )}
      </button>

      {/* Resultados de la importación */}
      {result && (
        <div className="mt-6 space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Exitosos</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{result.success}</p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-900">Advertencias</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{result.warnings.length}</p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-900">Errores</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{result.errors.length}</p>
            </div>
          </div>

          {/* Lista de advertencias */}
          {result.warnings.length > 0 && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Advertencias
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.warnings.map((warning, index) => (
                  <div key={index} className="text-sm text-yellow-800">
                    <span className="font-medium">Fila {warning.row}:</span> {warning.warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de errores */}
          {result.errors.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Errores
              </h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {result.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-800">
                    <span className="font-medium">
                      {error.row > 0 ? `Fila ${error.row}:` : 'Error general:'}
                    </span>{' '}
                    {error.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje de éxito */}
          {result.success > 0 && result.errors.length === 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">
                  ¡Importación completada exitosamente! Se procesaron {result.success} registro(s).
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notas importantes */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">📝 Notas Importantes:</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Los registros duplicados serán actualizados automáticamente</li>
          <li>• Las referencias (carreras, materias, factores) deben existir previamente</li>
          <li>• Revisa las advertencias aunque la importación sea exitosa</li>
          <li>• Los errores detallados te ayudarán a corregir el archivo</li>
        </ul>
      </div>
    </div>
  );
}