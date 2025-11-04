import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Users, Edit2, Save, X, AlertTriangle, Plus } from 'lucide-react';

interface Grupo {
  id: string;
  nombre_grupo: string;
  periodo_academico: string;
  materias: { nombre: string };
  inscritos: number;
}

interface EstudianteGrupo {
  id: string;
  inscripcion_id: string;
  numero_control: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  calificacion_final: number | null;
}

interface CalificacionForm {
  inscripcion_id: string;
  calificacion_final: string;
}

interface CategoriaRiesgo {
  id: string;
  nombre: string;
  descripcion: string;
}

interface FactorRiesgo {
  id: string;
  categoria_id: string;
  inscripcion_id: string;
  severidad: 'baja' | 'media' | 'alta';
  observaciones: string;
}

export default function TeacherGroupsView() {
  const { profile } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<Grupo | null>(null);
  const [estudiantes, setEstudiantes] = useState<EstudianteGrupo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGrade, setEditingGrade] = useState<CalificacionForm | null>(null);
  const [showRiskModal, setShowRiskModal] = useState(false);
  const [selectedEstudiante, setSelectedEstudiante] = useState<EstudianteGrupo | null>(null);
  const [categorias, setCategorias] = useState<CategoriaRiesgo[]>([]);
  const [factoresRiesgo, setFactoresRiesgo] = useState<FactorRiesgo[]>([]);

  useEffect(() => {
    if (profile?.id) {
      loadGrupos();
      loadCategorias();
    }
  }, [profile]);

  const loadCategorias = async () => {
    try {
      const { data } = await supabase
        .from('categorias_factores_riesgo')
        .select('*')
        .order('nombre');
      
      if (data) setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  const loadGrupos = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const { data: gruposData } = await supabase
        .from('grupos_materia')
        .select(`
          id,
          nombre_grupo,
          periodo_academico,
          esta_activo,
          materias!materia_id (nombre)
        `)
        .eq('docente_id', profile.id)
        .eq('esta_activo', true)
        .order('creado_en', { ascending: false });

      if (gruposData) {
        const gruposConConteo = await Promise.all(
          gruposData.map(async (grupo: any) => {
            const { count } = await supabase
              .from('inscripciones_grupo')
              .select('id', { count: 'exact', head: true })
              .eq('grupo_id', grupo.id)
              .eq('estado', 'activo');

            return { ...grupo, inscritos: count || 0 };
          })
        );
        setGrupos(gruposConConteo);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstudiantes = async (grupoId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('inscripciones_grupo')
        .select(`
          id,
          calificacion_final,
          estudiantes!inner (
            id,
            numero_control,
            nombre,
            apellido_paterno,
            apellido_materno
          )
        `)
        .eq('grupo_id', grupoId)
        .eq('estado', 'activo');

      if (error) throw error;

      const estudiantesFormateados = data?.map((item: any) => ({
        id: item.estudiantes.id,
        inscripcion_id: item.id,
        numero_control: item.estudiantes.numero_control,
        nombre: item.estudiantes.nombre,
        apellido_paterno: item.estudiantes.apellido_paterno,
        apellido_materno: item.estudiantes.apellido_materno,
        calificacion_final: item.calificacion_final,
      })) || [];

      setEstudiantes(estudiantesFormateados);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGrupo = (grupo: Grupo) => {
    setSelectedGrupo(grupo);
    loadEstudiantes(grupo.id);
  };

  const handleEditGrade = (estudiante: EstudianteGrupo) => {
    setEditingGrade({
      inscripcion_id: estudiante.inscripcion_id,
      calificacion_final: estudiante.calificacion_final?.toString() || '',
    });
  };

  const handleSaveGrade = async () => {
    if (!editingGrade) return;

    const calificacion = editingGrade.calificacion_final.trim() === '' 
      ? null 
      : parseFloat(editingGrade.calificacion_final);

    if (calificacion !== null && (calificacion < 0 || calificacion > 100)) {
      alert('La calificación debe estar entre 0 y 100');
      return;
    }

    setLoading(true);
    try {
      // Actualizar la inscripción con la calificación
      const updateData: any = {
        calificacion_final: calificacion,
      };

      if (calificacion !== null) {
        updateData.estado = calificacion >= 70 ? 'completado' : 'completado';
      }

      const { error: inscripcionError } = await supabase
        .from('inscripciones_grupo')
        .update(updateData)
        .eq('id', editingGrade.inscripcion_id);

      if (inscripcionError) throw inscripcionError;

      // Encontrar el estudiante y grupo actual
      const estudiante = estudiantes.find(e => e.inscripcion_id === editingGrade.inscripcion_id);
      
      if (estudiante && selectedGrupo) {
        // Obtener la materia_id del grupo
        const { data: grupoData, error: grupoError } = await supabase
          .from('grupos_materia')
          .select('materia_id, semestre_periodo')
          .eq('id', selectedGrupo.id)
          .single();

        if (grupoError) throw grupoError;

        // Verificar si existe un registro en registros_estudiante_materia
        const { data: existingRecord } = await supabase
          .from('registros_estudiante_materia')
          .select('id')
          .eq('estudiante_id', estudiante.id)
          .eq('materia_id', grupoData.materia_id)
          .eq('semestre', grupoData.semestre_periodo)
          .maybeSingle();

        if (existingRecord) {
          // Actualizar el registro existente
          const { error: updateRecordError } = await supabase
            .from('registros_estudiante_materia')
            .update({
              calificacion_final: calificacion,
              estado: calificacion !== null ? (calificacion >= 70 ? 'aprobado' : 'reprobado') : 'en_progreso',
              actualizado_en: new Date().toISOString(),
            })
            .eq('id', existingRecord.id);

          if (updateRecordError) throw updateRecordError;
        } else {
          // Crear un nuevo registro
          const { error: insertRecordError } = await supabase
            .from('registros_estudiante_materia')
            .insert({
              estudiante_id: estudiante.id,
              materia_id: grupoData.materia_id,
              semestre: grupoData.semestre_periodo,
              calificacion_final: calificacion,
              estado: calificacion !== null ? (calificacion >= 70 ? 'aprobado' : 'reprobado') : 'en_progreso',
            });

          if (insertRecordError) throw insertRecordError;
        }
      }

      alert('Calificación guardada correctamente');
      setEditingGrade(null);
      if (selectedGrupo) {
        await loadEstudiantes(selectedGrupo.id);
      }
    } catch (error: any) {
      console.error('Error completo:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManageRisks = async (estudiante: EstudianteGrupo) => {
    setSelectedEstudiante(estudiante);
    
    // Cargar factores de riesgo existentes para este estudiante
    try {
      const { data: registroMateria } = await supabase
        .from('registros_estudiante_materia')
        .select('id')
        .eq('estudiante_id', estudiante.id)
        .maybeSingle();

      if (registroMateria) {
        const { data: factores } = await supabase
          .from('factores_riesgo_estudiante')
          .select(`
            id,
            factor_riesgo_id,
            severidad,
            observaciones,
            factores_riesgo!inner (categoria_id)
          `)
          .eq('registro_estudiante_materia_id', registroMateria.id);

        if (factores) {
          const factoresFormateados = factores.map((f: any) => ({
            id: f.id,
            categoria_id: f.factores_riesgo.categoria_id,
            inscripcion_id: estudiante.inscripcion_id,
            severidad: f.severidad as 'baja' | 'media' | 'alta',
            observaciones: f.observaciones || '',
          }));
          setFactoresRiesgo(factoresFormateados);
        }
      }
    } catch (error) {
      console.error('Error cargando factores:', error);
    }
    
    setShowRiskModal(true);
  };

  const handleAddRiskFactor = async (categoriaId: string) => {
    if (!selectedEstudiante) return;

    try {
      // Primero obtener o crear el registro de estudiante-materia
      let registroId: string;
      
      const { data: existingRegistro } = await supabase
        .from('registros_estudiante_materia')
        .select('id')
        .eq('estudiante_id', selectedEstudiante.id)
        .maybeSingle();

      if (existingRegistro) {
        registroId = existingRegistro.id;
      } else {
        // Necesitamos crear un registro básico
        const { data: grupoData } = await supabase
          .from('inscripciones_grupo')
          .select('grupos_materia!inner(materia_id)')
          .eq('id', selectedEstudiante.inscripcion_id)
          .single();

        const { data: newRegistro, error: regError } = await supabase
          .from('registros_estudiante_materia')
          .insert({
            estudiante_id: selectedEstudiante.id,
            materia_id: (grupoData as any).grupos_materia.materia_id,
            semestre: 1,
            estado: 'en_progreso',
          })
          .select()
          .single();

        if (regError) throw regError;
        registroId = newRegistro.id;
      }

      // Obtener o crear el factor de riesgo
      const { data: existingFactor } = await supabase
        .from('factores_riesgo')
        .select('id')
        .eq('categoria_id', categoriaId)
        .maybeSingle();

      let factorId: string;
      if (existingFactor) {
        factorId = existingFactor.id;
      } else {
        const categoria = categorias.find(c => c.id === categoriaId);
        const { data: newFactor, error: factorError } = await supabase
          .from('factores_riesgo')
          .insert({
            categoria_id: categoriaId,
            nombre: categoria?.nombre || 'Factor',
            descripcion: categoria?.descripcion,
          })
          .select()
          .single();

        if (factorError) throw factorError;
        factorId = newFactor.id;
      }

      // Insertar el factor de riesgo del estudiante
      const { error } = await supabase
        .from('factores_riesgo_estudiante')
        .insert({
          registro_estudiante_materia_id: registroId,
          factor_riesgo_id: factorId,
          severidad: 'media',
          observaciones: '',
        });

      if (error) throw error;

      alert('Factor de riesgo agregado');
      handleManageRisks(selectedEstudiante);
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading && grupos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando grupos...</div>
      </div>
    );
  }

  if (grupos.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes grupos asignados
          </h3>
          <p className="text-gray-600">
            Contacta al administrador para que te asigne grupos.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Mis Grupos</h2>
            <p className="text-sm text-gray-600">
              {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} asignado{grupos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {grupos.map((grupo) => (
            <div
              key={grupo.id}
              onClick={() => handleSelectGrupo(grupo)}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedGrupo?.id === grupo.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{grupo.materias.nombre}</h3>
                  <p className="text-sm text-gray-600">{grupo.nombre_grupo}</p>
                </div>
                <div className="flex items-center gap-1 text-blue-600">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{grupo.inscritos}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">{grupo.periodo_academico}</p>
            </div>
          ))}
        </div>
      </div>

      {selectedGrupo && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Estudiantes - {selectedGrupo.nombre_grupo}
              </h3>
              <p className="text-sm text-gray-600">
                {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} inscrito{estudiantes.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedGrupo(null);
                setEstudiantes([]);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {estudiantes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay estudiantes inscritos en este grupo
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
                      Calificación Final
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((estudiante) => (
                    <tr key={estudiante.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {estudiante.numero_control}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {estudiante.apellido_paterno} {estudiante.apellido_materno}, {estudiante.nombre}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingGrade?.inscripcion_id === estudiante.inscripcion_id ? (
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={editingGrade.calificacion_final}
                            onChange={(e) => setEditingGrade({
                              ...editingGrade,
                              calificacion_final: e.target.value,
                            })}
                            className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                        ) : estudiante.calificacion_final !== null ? (
                          <span className={`font-semibold ${
                            estudiante.calificacion_final >= 70 ? 'text-green-700' : 'text-red-700'
                          }`}>
                            {estudiante.calificacion_final.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Sin calificar</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {estudiante.calificacion_final !== null ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            estudiante.calificacion_final >= 70
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {estudiante.calificacion_final >= 70 ? 'Aprobado' : 'Reprobado'}
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            En progreso
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {editingGrade?.inscripcion_id === estudiante.inscripcion_id ? (
                            <>
                              <button
                                onClick={handleSaveGrade}
                                disabled={loading}
                                className="text-green-600 hover:text-green-800 p-1"
                                title="Guardar"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingGrade(null)}
                                className="text-gray-600 hover:text-gray-800 p-1"
                                title="Cancelar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditGrade(estudiante)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="Editar calificación"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleManageRisks(estudiante)}
                                className="text-orange-600 hover:text-orange-800 p-1"
                                title="Factores de riesgo"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Instrucciones</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Haz clic en el ícono de editar para calificar a un estudiante</li>
              <li>• Ingresa la calificación final (0-100)</li>
              <li>• Calificación ≥ 70 es aprobatoria</li>
              <li>• Usa el ícono de alerta para gestionar factores de riesgo</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal de Factores de Riesgo */}
      {showRiskModal && selectedEstudiante && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Factores de Riesgo</h3>
                <p className="text-sm text-gray-600">
                  {selectedEstudiante.apellido_paterno} {selectedEstudiante.apellido_materno}, {selectedEstudiante.nombre}
                </p>
              </div>
              <button onClick={() => setShowRiskModal(false)} className="text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {factoresRiesgo.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">
                    Factores Identificados ({factoresRiesgo.length})
                  </h4>
                  <div className="space-y-2">
                    {factoresRiesgo.map((factor) => {
                      const categoria = categorias.find(c => c.id === factor.categoria_id);
                      return (
                        <div key={factor.id} className="bg-white px-3 py-2 rounded flex justify-between items-center">
                          <span className="text-sm text-gray-700">{categoria?.nombre}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            factor.severidad === 'alta' ? 'bg-red-100 text-red-800' :
                            factor.severidad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {factor.severidad}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Agregar Factor de Riesgo</h4>
                <div className="space-y-2">
                  {categorias.map((categoria) => (
                    <button
                      key={categoria.id}
                      onClick={() => handleAddRiskFactor(categoria.id)}
                      disabled={factoresRiesgo.some(f => f.categoria_id === categoria.id)}
                      className="w-full p-3 text-left border rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{categoria.nombre}</p>
                          {categoria.descripcion && (
                            <p className="text-xs text-gray-600">{categoria.descripcion}</p>
                          )}
                        </div>
                        {!factoresRiesgo.some(f => f.categoria_id === categoria.id) && (
                          <Plus className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowRiskModal(false)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}