import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit, Trash2, BookOpen, UserPlus, Calendar, X, RefreshCw } from 'lucide-react';

interface Materia {
  id: string;
  nombre: string;
  semestre: number;
}

interface Docente {
  id: string;
  full_name: string;
  email: string;
}

interface GrupoMateria {
  id: string;
  materia_id: string;
  docente_id: string | null;
  nombre_grupo: string;
  semestre_periodo: number;
  periodo_academico: string;
  cupo_maximo: number;
  horario: string | null;
  esta_activo: boolean;
  materias: { nombre: string };
  user_profiles: { full_name: string } | null;
  inscritos: number;
}

interface Estudiante {
  id: string;
  numero_control: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  ya_inscrito?: boolean;
}

export default function GroupManagement() {
  const [grupos, setGrupos] = useState<GrupoMateria[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GrupoMateria | null>(null);
  const [editingGroup, setEditingGroup] = useState<GrupoMateria | null>(null);

  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    materia_id: '',
    docente_id: '',
    nombre_grupo: '',
    semestre_periodo: 1,
    periodo_academico: `${currentYear}`,
    cupo_maximo: 40,
    horario: '',
  });

  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: materiasData } = await supabase
        .from('materias')
        .select('id, nombre, semestre')
        .order('nombre');

      const { data: docentesData } = await supabase
        .from('user_profiles')
        .select('id, full_name, email')
        .eq('role', 'teacher')
        .eq('is_active', true)
        .order('full_name');

      const { data: gruposData } = await supabase
        .from('grupos_materia')
        .select(`
          *,
          materias!materia_id (nombre),
          user_profiles!docente_id (full_name)
        `)
        .order('creado_en', { ascending: false });

      if (materiasData) setMaterias(materiasData);
      if (docentesData) setDocentes(docentesData);

      if (gruposData) {
        const gruposConConteo = await Promise.all(
          gruposData.map(async (grupo: any) => {
            const { count } = await supabase
              .from('inscripciones_grupo')
              .select('id', { count: 'exact', head: true })
              .eq('grupo_id', grupo.id)
              .in('estado', ['activo', 'completado']); // Incluir ambos estados

            return { ...grupo, inscritos: count || 0 };
          })
        );
        setGrupos(gruposConConteo);
      }

      const { data: estudiantesData } = await supabase
        .from('estudiantes')
        .select('id, numero_control, nombre, apellido_paterno, apellido_materno')
        .order('apellido_paterno');

      if (estudiantesData) setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStudents = async (grupoId: string) => {
    try {
      // Obtener estudiantes ya inscritos en este grupo
      const { data: inscritosData } = await supabase
        .from('inscripciones_grupo')
        .select('estudiante_id')
        .eq('grupo_id', grupoId)
        .in('estado', ['activo', 'completado']);

      const estudiantesInscritos = new Set(inscritosData?.map(i => i.estudiante_id) || []);

      // Marcar estudiantes ya inscritos
      const estudiantesDisponibles = estudiantes.map(est => ({
        ...est,
        ya_inscrito: estudiantesInscritos.has(est.id)
      }));

      return estudiantesDisponibles;
    } catch (error) {
      console.error('Error cargando estudiantes disponibles:', error);
      return estudiantes;
    }
  };

  const handleSaveGroup = async () => {
    if (!formData.materia_id || !formData.nombre_grupo) {
      alert('Por favor completa los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('grupos_materia')
          .update({
            materia_id: formData.materia_id,
            docente_id: formData.docente_id || null,
            nombre_grupo: formData.nombre_grupo,
            semestre_periodo: formData.semestre_periodo,
            periodo_academico: formData.periodo_academico,
            cupo_maximo: formData.cupo_maximo,
            horario: formData.horario || null,
            actualizado_en: new Date().toISOString(),
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        alert('✅ Grupo actualizado correctamente');
      } else {
        const { error } = await supabase
          .from('grupos_materia')
          .insert({
            materia_id: formData.materia_id,
            docente_id: formData.docente_id || null,
            nombre_grupo: formData.nombre_grupo,
            semestre_periodo: formData.semestre_periodo,
            periodo_academico: formData.periodo_academico,
            cupo_maximo: formData.cupo_maximo,
            horario: formData.horario || null,
          });

        if (error) throw error;
        alert('✅ Grupo creado correctamente');
      }

      setShowForm(false);
      setEditingGroup(null);
      resetForm();
      await loadData(); // Esperar a que se recarguen los datos
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (grupo: GrupoMateria) => {
    setEditingGroup(grupo);
    setFormData({
      materia_id: grupo.materia_id,
      docente_id: grupo.docente_id || '',
      nombre_grupo: grupo.nombre_grupo,
      semestre_periodo: grupo.semestre_periodo,
      periodo_academico: grupo.periodo_academico,
      cupo_maximo: grupo.cupo_maximo,
      horario: grupo.horario || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (grupoId: string) => {
    if (!confirm('⚠️ ¿Eliminar este grupo? Se eliminarán todas las inscripciones y calificaciones asociadas.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('grupos_materia')
        .delete()
        .eq('id', grupoId);

      if (error) throw error;
      alert('✅ Grupo eliminado correctamente');
      await loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error al eliminar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleGroupStatus = async (grupo: GrupoMateria) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('grupos_materia')
        .update({ esta_activo: !grupo.esta_activo })
        .eq('id', grupo.id);

      if (error) throw error;
      await loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEnrollForm = async (grupo: GrupoMateria) => {
    setSelectedGroup(grupo);
    const estudiantesDisponibles = await loadAvailableStudents(grupo.id);
    setEstudiantes(estudiantesDisponibles);
    setShowEnrollForm(true);
  };

  const handleEnrollStudents = async () => {
    if (!selectedGroup || selectedStudents.length === 0) return;

    // Verificar cupo disponible
    const cupoDisponible = selectedGroup.cupo_maximo - selectedGroup.inscritos;
    if (selectedStudents.length > cupoDisponible) {
      alert(`⚠️ Solo hay ${cupoDisponible} lugares disponibles. Has seleccionado ${selectedStudents.length} estudiantes.`);
      return;
    }

    setLoading(true);
    try {
      // Verificar duplicados antes de insertar
      const { data: existentes } = await supabase
        .from('inscripciones_grupo')
        .select('estudiante_id')
        .eq('grupo_id', selectedGroup.id)
        .in('estudiante_id', selectedStudents);

      const yaInscritos = new Set(existentes?.map(e => e.estudiante_id) || []);
      const nuevosEstudiantes = selectedStudents.filter(id => !yaInscritos.has(id));

      if (nuevosEstudiantes.length === 0) {
        alert('⚠️ Todos los estudiantes seleccionados ya están inscritos en este grupo');
        return;
      }

      const inscripciones = nuevosEstudiantes.map(estudianteId => ({
        grupo_id: selectedGroup.id,
        estudiante_id: estudianteId,
        estado: 'activo',
      }));

      const { error } = await supabase
        .from('inscripciones_grupo')
        .insert(inscripciones);

      if (error) throw error;

      alert(`✅ ${nuevosEstudiantes.length} estudiante(s) inscrito(s) correctamente`);
      
      if (yaInscritos.size > 0) {
        alert(`ℹ️ ${yaInscritos.size} estudiante(s) ya estaban inscritos`);
      }

      setShowEnrollForm(false);
      setSelectedGroup(null);
      setSelectedStudents([]);
      
      // Recargar datos para actualizar el conteo
      await loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`❌ Error al inscribir: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      materia_id: '',
      docente_id: '',
      nombre_grupo: '',
      semestre_periodo: 1,
      periodo_academico: `${currentYear}`,
      cupo_maximo: 40,
      horario: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Gestión de Grupos</h2>
              <p className="text-sm text-gray-600">
                {grupos.length} grupo{grupos.length !== 1 ? 's' : ''} registrado{grupos.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              title="Actualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={() => {
                setEditingGroup(null);
                resetForm();
                setShowForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo Grupo
            </button>
          </div>
        </div>

        {loading && grupos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            Cargando grupos...
          </div>
        ) : grupos.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No hay grupos registrados</p>
            <p className="text-sm text-gray-400">Crea el primer grupo para comenzar</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Materia</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grupo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Docente</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Periodo</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{grupo.materias.nombre}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{grupo.nombre_grupo}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {grupo.user_profiles?.full_name || <span className="text-gray-400 italic">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {grupo.periodo_academico}
                      </div>
                    </td>
                   
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleGroupStatus(grupo)}
                        disabled={loading}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          grupo.esta_activo 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {grupo.esta_activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenEnrollForm(grupo)}
                          disabled={grupo.inscritos >= grupo.cupo_maximo}
                          className="text-green-600 hover:text-green-800 p-1 disabled:text-gray-400 disabled:cursor-not-allowed"
                          title={grupo.inscritos >= grupo.cupo_maximo ? 'Grupo lleno' : 'Inscribir estudiantes'}
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(grupo)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(grupo.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingGroup ? 'Editar Grupo' : 'Nuevo Grupo'}
              </h3>
              <button onClick={() => { setShowForm(false); setEditingGroup(null); }} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Materia *</label>
                  <select
                    value={formData.materia_id}
                    onChange={(e) => setFormData({ ...formData, materia_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar materia</option>
                    {materias.map((m) => (
                      <option key={m.id} value={m.id}>{m.nombre} (Sem. {m.semestre})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Docente</label>
                  <select
                    value={formData.docente_id}
                    onChange={(e) => setFormData({ ...formData, docente_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sin asignar</option>
                    {docentes.map((d) => (
                      <option key={d.id} value={d.id}>{d.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Grupo *</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre_grupo}
                    onChange={(e) => setFormData({ ...formData, nombre_grupo: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Grupo A, 101"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Periodo Académico *</label>
                  <input
                    type="text"
                    required
                    value={formData.periodo_academico}
                    onChange={(e) => setFormData({ ...formData, periodo_academico: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Ene-Jun 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semestre *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="12"
                    value={formData.semestre_periodo}
                    onChange={(e) => setFormData({ ...formData, semestre_periodo: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cupo Máximo *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.cupo_maximo}
                    onChange={(e) => setFormData({ ...formData, cupo_maximo: parseInt(e.target.value) || 40 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horario</label>
                  <input
                    type="text"
                    value={formData.horario}
                    onChange={(e) => setFormData({ ...formData, horario: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Lun-Mie-Vie 7:00-9:00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => { setShowForm(false); setEditingGroup(null); }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Guardando...' : editingGroup ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de inscripción */}
      {showEnrollForm && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Inscribir Estudiantes - {selectedGroup.nombre_grupo}
              </h3>
              <button 
                onClick={() => { 
                  setShowEnrollForm(false); 
                  setSelectedGroup(null); 
                  setSelectedStudents([]); 
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>


            <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
              {estudiantes.map((est) => (
                <label 
                  key={est.id} 
                  className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    est.ya_inscrito 
                      ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-60' 
                      : selectedStudents.includes(est.id)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    disabled={est.ya_inscrito}
                    checked={selectedStudents.includes(est.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, est.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== est.id));
                      }
                    }}
                    className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{est.apellido_paterno} {est.apellido_materno}, {est.nombre}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">{est.numero_control}</p>
                      {est.ya_inscrito && (
                        <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-full">
                          Ya inscrito
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <button
                onClick={() => { 
                  setShowEnrollForm(false); 
                  setSelectedGroup(null); 
                  setSelectedStudents([]); 
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnrollStudents}
                disabled={loading || selectedStudents.length === 0}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Inscribiendo...' : `Inscribir ${selectedStudents.length} estudiante${selectedStudents.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}