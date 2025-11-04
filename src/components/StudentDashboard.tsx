import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, BookOpen, Award, Mail, Save, GraduationCap } from 'lucide-react';

interface EstudianteData {
  id: string;
  numero_control: string;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string;
  carrera_id: string | null;
  semestre_actual: number;
}

interface Carrera {
  id: string;
  nombre: string;
}

interface Calificacion {
  id: string;
  calificacion_final: number | null;
  grupos_materia: {
    nombre_grupo: string;
    periodo_academico: string;
    materia_id: string;
  };
  materia_nombre: string;
}

export default function StudentDashboard() {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'perfil' | 'calificaciones'>('perfil');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estudianteData, setEstudianteData] = useState<EstudianteData | null>(null);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    carrera_id: '',
    semestre_actual: 1,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Primero intentar obtener el estudiante asociado al user_id
      const { data: estudianteByUser, error: userError } = await supabase
        .from('estudiantes')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      let estudiante = estudianteByUser;

      // Si no existe, intentar obtener por profile.estudiante_id
      if (!estudiante && profile?.estudiante_id) {
        const { data: estudianteByProfile } = await supabase
          .from('estudiantes')
          .select('*')
          .eq('id', profile.estudiante_id)
          .maybeSingle();
        
        estudiante = estudianteByProfile;
      }

      if (!estudiante) {
        console.error('No se encontró estudiante para este usuario');
        setLoading(false);
        return;
      }

      setEstudianteData(estudiante);
      setFormData({
        nombre: estudiante.nombre,
        apellido_paterno: estudiante.apellido_paterno,
        apellido_materno: estudiante.apellido_materno,
        carrera_id: estudiante.carrera_id || '',
        semestre_actual: estudiante.semestre_actual,
      });

      // Cargar carreras
      const { data: carrerasData } = await supabase
        .from('carreras')
        .select('id, nombre')
        .order('nombre');

      if (carrerasData) setCarreras(carrerasData);

      // Cargar calificaciones del estudiante
      const { data: inscripciones, error: inscError } = await supabase
        .from('inscripciones_grupo')
        .select(`
          id,
          calificacion_final,
          grupos_materia!inner (
            nombre_grupo,
            periodo_academico,
            materia_id
          )
        `)
        .eq('estudiante_id', estudiante.id)
        .order('fecha_inscripcion', { ascending: false });

      if (inscError) {
        console.error('Error cargando inscripciones:', inscError);
      } else if (inscripciones) {
        // Obtener los nombres de las materias
        const materiaIds = inscripciones.map((i: any) => i.grupos_materia.materia_id);
        const { data: materiasData } = await supabase
          .from('materias')
          .select('id, nombre')
          .in('id', materiaIds);

        const materiasMap = new Map(materiasData?.map(m => [m.id, m.nombre]));

        const calificacionesFormateadas = inscripciones.map((item: any) => ({
          id: item.id,
          calificacion_final: item.calificacion_final,
          grupos_materia: {
            nombre_grupo: item.grupos_materia.nombre_grupo,
            periodo_academico: item.grupos_materia.periodo_academico,
            materia_id: item.grupos_materia.materia_id,
          },
          materia_nombre: materiasMap.get(item.grupos_materia.materia_id) || 'Sin nombre',
        }));
        
        setCalificaciones(calificacionesFormateadas);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!estudianteData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('estudiantes')
        .update({
          nombre: formData.nombre,
          apellido_paterno: formData.apellido_paterno,
          apellido_materno: formData.apellido_materno,
          carrera_id: formData.carrera_id || null,
          semestre_actual: formData.semestre_actual,
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', estudianteData.id);

      if (error) throw error;

      alert('Información actualizada correctamente');
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      alert(`Error al actualizar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPromedioGeneral = () => {
    const calificacionesConNota = calificaciones.filter(c => c.calificacion_final !== null);
    if (calificacionesConNota.length === 0) return null;
    
    const suma = calificacionesConNota.reduce((acc, c) => acc + (c.calificacion_final || 0), 0);
    return (suma / calificacionesConNota.length).toFixed(2);
  };

  const getEstadisticas = () => {
    const total = calificaciones.length;
    const aprobadas = calificaciones.filter(c => c.calificacion_final && c.calificacion_final >= 70).length;
    const reprobadas = calificaciones.filter(c => c.calificacion_final && c.calificacion_final < 70).length;
    const sinCalificar = calificaciones.filter(c => c.calificacion_final === null).length;

    return { total, aprobadas, reprobadas, sinCalificar };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!estudianteData) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No se encontró información de estudiante.</p>
          <p className="text-sm text-gray-500">Contacta al administrador del sistema.</p>
        </div>
      </div>
    );
  }

  const estadisticas = getEstadisticas();
  const promedio = getPromedioGeneral();

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <User className="w-10 h-10" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {estudianteData.apellido_paterno} {estudianteData.apellido_materno}, {estudianteData.nombre}
            </h2>
            <p className="text-blue-100 mt-1">Número de Control: {estudianteData.numero_control}</p>
            <div className="flex items-center gap-2 mt-2 text-blue-100">
              <Mail className="w-4 h-4" />
              <span className="text-sm">{user?.email}</span>
            </div>
          </div>
          {promedio && (
            <div className="text-center bg-white bg-opacity-20 rounded-lg p-4">
              <Award className="w-8 h-8 mx-auto mb-1" />
              <p className="text-3xl font-bold">{promedio}</p>
              <p className="text-xs text-blue-100">Promedio General</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Materias Inscritas</p>
          <p className="text-2xl font-bold text-gray-800">{estadisticas.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Aprobadas</p>
          <p className="text-2xl font-bold text-green-600">{estadisticas.aprobadas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Reprobadas</p>
          <p className="text-2xl font-bold text-red-600">{estadisticas.reprobadas}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">En Progreso</p>
          <p className="text-2xl font-bold text-blue-600">{estadisticas.sinCalificar}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('perfil')}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'perfil' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <User className="w-5 h-5" />
              Mi Perfil
            </div>
          </button>
          <button
            onClick={() => setActiveTab('calificaciones')}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'calificaciones' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="w-5 h-5" />
              Mis Calificaciones
            </div>
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'perfil' ? (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-800">Información Personal</h3>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre(s) *</label>
                    <input
                      type="text"
                      required
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Paterno *</label>
                    <input
                      type="text"
                      required
                      value={formData.apellido_paterno}
                      onChange={(e) => setFormData({ ...formData, apellido_paterno: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Apellido Materno *</label>
                    <input
                      type="text"
                      required
                      value={formData.apellido_materno}
                      onChange={(e) => setFormData({ ...formData, apellido_materno: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
                    <select
                      value={formData.carrera_id}
                      onChange={(e) => setFormData({ ...formData, carrera_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccionar carrera</option>
                      {carreras.map((carrera) => (
                        <option key={carrera.id} value={carrera.id}>{carrera.nombre}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Semestre Actual *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="12"
                      value={formData.semestre_actual}
                      onChange={(e) => setFormData({ ...formData, semestre_actual: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Control</label>
                    <input
                      type="text"
                      value={estudianteData.numero_control}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Este campo no se puede modificar</p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Nota:</strong> Solo puedes modificar tu información personal. Las calificaciones son asignadas por los docentes.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">Historial de Calificaciones</h3>

              {calificaciones.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No tienes materias inscritas aún</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Materia</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Grupo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Periodo</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Calificación</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calificaciones.map((cal) => (
                        <tr key={cal.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {cal.materia_nombre}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{cal.grupos_materia.nombre_grupo}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{cal.grupos_materia.periodo_academico}</td>
                          <td className="px-4 py-3 text-sm">
                            {cal.calificacion_final !== null ? (
                              <span className={`font-semibold text-lg ${
                                cal.calificacion_final >= 70 ? 'text-green-700' : 'text-red-700'
                              }`}>
                                {cal.calificacion_final.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">En progreso</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {cal.calificacion_final !== null ? (
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                cal.calificacion_final >= 70
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {cal.calificacion_final >= 70 ? 'Aprobado' : 'Reprobado'}
                              </span>
                            ) : (
                              <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Cursando
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}