import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Filter, X, BarChart3 } from 'lucide-react';
import ParetoChart from './ParetoChart';

interface Grupo {
  id: string;
  nombre_grupo: string;
  periodo_academico: string;
  materia_nombre: string;
  inscritos: number;
}

export default function ParetoAnalysisView() {
  const { profile } = useAuth();
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      loadGrupos();
    }
  }, [profile]);

  const loadGrupos = async () => {
    setLoading(true);
    try {
      // Si es docente, cargar solo sus grupos
      let query = supabase
        .from('grupos_materia')
        .select(`
          id,
          nombre_grupo,
          periodo_academico,
          esta_activo,
          materias!materia_id (nombre)
        `)
        .eq('esta_activo', true)
        .order('creado_en', { ascending: false });

      // Si es docente, filtrar por sus grupos
      if (profile?.role === 'teacher') {
        query = query.eq('docente_id', profile.id);
      }

      const { data: gruposData, error } = await query;

      if (error) throw error;

      if (gruposData) {
        // Obtener conteo de inscritos para cada grupo
        const gruposConConteo = await Promise.all(
          gruposData.map(async (grupo: any) => {
            const { count } = await supabase
              .from('inscripciones_grupo')
              .select('id', { count: 'exact', head: true })
              .eq('grupo_id', grupo.id)
              .in('estado', ['activo', 'completado']);

            return {
              id: grupo.id,
              nombre_grupo: grupo.nombre_grupo,
              periodo_academico: grupo.periodo_academico,
              materia_nombre: grupo.materias?.nombre || 'Materia',
              inscritos: count || 0
            };
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

  const handleSelectGrupo = (grupoId: string) => {
    setSelectedGrupo(grupoId === selectedGrupo ? null : grupoId);
  };

  const handleClearFilter = () => {
    setSelectedGrupo(null);
  };

  return (
    <div className="space-y-6">
      {/* Header con botón de filtro */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
              <p className="text-sm text-gray-600">
                Factores de riesgo más frecuentes - Principio 80/20
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              showFilter || selectedGrupo
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Filter className="w-5 h-5" />
            {selectedGrupo ? 'Filtro activo' : 'Filtrar por grupo'}
          </button>
        </div>
      </div>

      {/* Panel de selección de grupos */}
      {showFilter && (
        <div className="bg-white rounded-lg shadow-lg p-6 animate-in slide-in-from-top">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-800">Filtrar por Grupo</h3>
                <p className="text-sm text-gray-600">
                  Selecciona un grupo para analizar sus factores de riesgo específicos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedGrupo && (
                <button
                  onClick={handleClearFilter}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Limpiar filtro
                </button>
              )}
              <button
                onClick={() => setShowFilter(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
              Cargando grupos...
            </div>
          ) : grupos.length === 0 ? (
            <div className="text-center py-8">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No hay grupos disponibles</p>
              <p className="text-sm text-gray-400">
                {profile?.role === 'teacher' 
                  ? 'No tienes grupos asignados'
                  : 'No hay grupos activos en el sistema'}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {grupos.map((grupo) => (
                  <button
                    key={grupo.id}
                    onClick={() => handleSelectGrupo(grupo.id)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedGrupo === grupo.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{grupo.materia_nombre}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          Grupo {grupo.nombre_grupo}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-blue-600 text-sm">
                        <span className="font-medium">{grupo.inscritos}</span>
                        <span className="text-xs text-gray-500">estudiantes</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{grupo.periodo_academico}</div>
                    {selectedGrupo === grupo.id && (
                      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        Seleccionado
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {selectedGrupo && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        Filtro activo
                      </p>
                      <p className="text-sm text-blue-800">
                        Mostrando factores de riesgo de{' '}
                        <span className="font-semibold">
                          {grupos.find(g => g.id === selectedGrupo)?.materia_nombre} -{' '}
                          Grupo {grupos.find(g => g.id === selectedGrupo)?.nombre_grupo}
                        </span>
                        {' '}({grupos.find(g => g.id === selectedGrupo)?.inscritos} estudiantes)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Badge de filtro activo cuando el panel está cerrado */}
      {!showFilter && selectedGrupo && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                <Filter className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Filtro activo por grupo</p>
                <p className="text-sm text-blue-700">
                  {grupos.find(g => g.id === selectedGrupo)?.materia_nombre} -{' '}
                  Grupo {grupos.find(g => g.id === selectedGrupo)?.nombre_grupo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilter(true)}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Cambiar
              </button>
              <button
                onClick={handleClearFilter}
                className="flex items-center gap-1 px-3 py-2 text-sm bg-white text-gray-700 rounded-lg hover:bg-gray-50 border border-gray-300"
              >
                <X className="w-4 h-4" />
                Quitar filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Componente de Pareto */}
      <ParetoChart filters={{ grupoId: selectedGrupo || undefined }} />

      {/* Instrucciones de uso */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">📖</span>
          Cómo usar el análisis por grupos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                1
              </div>
              <p className="text-sm text-gray-700">
                Haz clic en <strong>"Filtrar por grupo"</strong> para ver la lista de grupos disponibles
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                2
              </div>
              <p className="text-sm text-gray-700">
                Selecciona un grupo para analizar los factores de riesgo específicos de sus estudiantes
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                3
              </div>
              <p className="text-sm text-gray-700">
                El gráfico se actualizará automáticamente mostrando solo los datos del grupo seleccionado
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                4
              </div>
              <p className="text-sm text-gray-700">
                Usa <strong>"Limpiar filtro"</strong> para volver a ver el análisis general de todos los grupos
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                5
              </div>
              <p className="text-sm text-gray-700">
                Compara diferentes grupos cambiando la selección para identificar patrones específicos
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-bold flex-shrink-0">
                💡
              </div>
              <p className="text-sm text-gray-700">
                Los factores de riesgo se asignan desde la <strong>vista de grupos</strong> al gestionar estudiantes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}