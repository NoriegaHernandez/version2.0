// import { useState, useEffect } from 'react';
// import { supabase } from '../lib/supabase';
// import { BarChart3, AlertCircle, Download } from 'lucide-react';

// interface RiskFactorData {
//   nombre_factor: string;
//   categoria: string;
//   count: number;
//   percentage: number;
//   cumulative_percentage: number;
// }

// interface ParetoChartProps {
//   filters?: {
//     semester?: number;
//     majorId?: string;
//   };
// }

// export default function ParetoChart({ filters }: ParetoChartProps) {
//   const [data, setData] = useState<RiskFactorData[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     loadParetoData();
//   }, [filters]);

//   const loadParetoData = async () => {
//     setLoading(true);
//     setError('');

//     try {
//       // Query para obtener los factores de riesgo con sus categorías
//       let query = supabase
//         .from('factores_riesgo_estudiante')
//         .select(`
//           id,
//           factor_riesgo_id,
//           factores_riesgo!inner (
//             nombre,
//             categorias_factores_riesgo!inner (
//               nombre
//             )
//           ),
//           registro_estudiante_materia_id,
//           registros_estudiante_materia!inner (
//             semestre,
//             estudiantes!inner (
//               carrera_id
//             )
//           )
//         `);

//       const { data: riskFactorData, error: queryError } = await query;

//       if (queryError) {
//         console.error('Error en query:', queryError);
//         throw queryError;
//       }

//       if (!riskFactorData || riskFactorData.length === 0) {
//         setData([]);
//         setLoading(false);
//         return;
//       }

//       // Procesar los datos aplicando filtros
//       const factorCounts = new Map<string, { 
//         name: string; 
//         categoria: string; 
//         count: number 
//       }>();

//       riskFactorData.forEach((item: any) => {
//         // Aplicar filtros si existen
//         if (filters?.semester && item.registros_estudiante_materia.semestre !== filters.semester) {
//           return;
//         }
//         if (filters?.majorId && item.registros_estudiante_materia.estudiantes.carrera_id !== filters.majorId) {
//           return;
//         }

//         const factorId = item.factor_riesgo_id;
//         const factorName = item.factores_riesgo.nombre || 'Factor Desconocido';
//         const categoria = item.factores_riesgo.categorias_factores_riesgo?.nombre || 'Sin Categoría';

//         if (factorCounts.has(factorId)) {
//           factorCounts.get(factorId)!.count++;
//         } else {
//           factorCounts.set(factorId, { 
//             name: factorName, 
//             categoria: categoria.toLowerCase(), 
//             count: 1 
//           });
//         }
//       });

//       if (factorCounts.size === 0) {
//         setData([]);
//         setLoading(false);
//         return;
//       }

//       // Ordenar por frecuencia descendente
//       const sortedFactors = Array.from(factorCounts.values())
//         .sort((a, b) => b.count - a.count);

//       const totalCount = sortedFactors.reduce((sum, factor) => sum + factor.count, 0);

//       // Calcular porcentajes y acumulados
//       let cumulativeCount = 0;
//       const paretoData: RiskFactorData[] = sortedFactors.map(factor => {
//         const percentage = (factor.count / totalCount) * 100;
//         cumulativeCount += factor.count;
//         const cumulative_percentage = (cumulativeCount / totalCount) * 100;

//         return {
//           nombre_factor: factor.name,
//           categoria: factor.categoria,
//           count: factor.count,
//           percentage,
//           cumulative_percentage
//         };
//       });

//       setData(paretoData);
//     } catch (err: any) {
//       console.error('Error completo:', err);
//       setError(err.message || 'Error al cargar datos del análisis de Pareto');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const exportToCSV = () => {
//     if (data.length === 0) return;

//     const headers = ['Factor de Riesgo', 'Categoría', 'Frecuencia', 'Porcentaje (%)', 'Acumulado (%)'];
//     const rows = data.map(d => [
//       d.nombre_factor,
//       d.categoria,
//       d.count,
//       d.percentage.toFixed(2),
//       d.cumulative_percentage.toFixed(2),
//     ]);

//     const csv = [
//       headers.join(','),
//       ...rows.map(row => row.join(',')),
//     ].join('\n');

//     const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
//     const url = window.URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `analisis-pareto-${new Date().toISOString().split('T')[0]}.csv`;
//     a.click();
//     window.URL.revokeObjectURL(url);
//   };

//   const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;

//   const getCategoryColor = (categoria: string) => {
//     const colors: Record<string, string> = {
//       'académico': '#3b82f6',
//       'academico': '#3b82f6',
//       'psicológico': '#8b5cf6',
//       'psicologico': '#8b5cf6',
//       'económico': '#10b981',
//       'economico': '#10b981',
//       'institucional': '#f59e0b',
//       'tecnológico': '#06b6d4',
//       'tecnologico': '#06b6d4',
//       'contextual': '#ef4444',
//       'social': '#ec4899',
//       'familiar': '#f97316',
//     };
//     return colors[categoria.toLowerCase()] || '#6b7280';
//   };

//   if (loading) {
//     return (
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <div className="flex items-center justify-center h-64">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-500">Cargando análisis de Pareto...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
//           <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
//           <div>
//             <p className="font-medium text-red-900">Error al cargar datos</p>
//             <p className="text-sm text-red-700 mt-1">{error}</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   if (data.length === 0) {
//     return (
//       <div className="bg-white rounded-lg shadow-lg p-6">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <BarChart3 className="w-8 h-8 text-blue-600" />
//             <div>
//               <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
//               <p className="text-sm text-gray-600">Factores de riesgo más frecuentes</p>
//             </div>
//           </div>
//         </div>
//         <div className="text-center py-12">
//           <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
//           <p className="text-gray-500 mb-2">No hay datos de factores de riesgo disponibles</p>
//           <p className="text-sm text-gray-400">
//             Los docentes deben asignar factores de riesgo desde la vista de grupos
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-white rounded-lg shadow-lg p-6">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <BarChart3 className="w-8 h-8 text-blue-600" />
//           <div>
//             <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
//             <p className="text-sm text-gray-600">Factores de riesgo más frecuentes</p>
//           </div>
//         </div>
//         <button
//           onClick={exportToCSV}
//           className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//         >
//           <Download className="w-4 h-4" />
//           Exportar CSV
//         </button>
//       </div>

//       <div className="space-y-6">
//         {/* Gráfica de Pareto */}
//         <div className="relative bg-gray-50 rounded-lg p-6">
//           <div className="relative h-96 border-l-2 border-b-2 border-gray-300 p-4">
//             {/* Eje Y izquierdo (Frecuencia) */}
//             <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-600">
//               <span className="text-right pr-2">{maxCount}</span>
//               <span className="text-right pr-2">{Math.round(maxCount * 0.75)}</span>
//               <span className="text-right pr-2">{Math.round(maxCount * 0.5)}</span>
//               <span className="text-right pr-2">{Math.round(maxCount * 0.25)}</span>
//               <span className="text-right pr-2">0</span>
//             </div>

//             {/* Eje Y derecho (Porcentaje) */}
//             <div className="absolute right-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-600">
//               <span className="pl-2">100%</span>
//               <span className="pl-2">75%</span>
//               <span className="pl-2">50%</span>
//               <span className="pl-2">25%</span>
//               <span className="pl-2">0%</span>
//             </div>

//             {/* Área de gráfica */}
//             <div className="h-full ml-14 mr-14 flex items-end gap-1 relative">
//               {/* Línea acumulativa */}
//               <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
//                 <polyline
//                   points={data.map((d, i) => {
//                     const x = ((i + 0.5) / data.length) * 100;
//                     const y = 100 - d.cumulative_percentage;
//                     return `${x}%,${y}%`;
//                   }).join(' ')}
//                   fill="none"
//                   stroke="#ef4444"
//                   strokeWidth="3"
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                 />
//                 {data.map((d, i) => {
//                   const x = ((i + 0.5) / data.length) * 100;
//                   const y = 100 - d.cumulative_percentage;
//                   return (
//                     <circle
//                       key={i}
//                       cx={`${x}%`}
//                       cy={`${y}%`}
//                       r="4"
//                       fill="#ef4444"
//                       stroke="white"
//                       strokeWidth="2"
//                     />
//                   );
//                 })}
//               </svg>

//               {/* Barras */}
//               {data.map((item, index) => (
//                 <div
//                   key={index}
//                   className="flex-1 flex flex-col items-center relative group"
//                   style={{ height: '100%' }}
//                 >
//                   <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
//                     <div
//                       className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm"
//                       style={{
//                         height: `${(item.count / maxCount) * 100}%`,
//                         backgroundColor: getCategoryColor(item.categoria),
//                         minHeight: '2px'
//                       }}
//                       title={`${item.nombre_factor}: ${item.count} ocurrencias (${item.percentage.toFixed(1)}%)`}
//                     />
//                   </div>

//                   {/* Tooltip */}
//                   <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
//                     <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
//                       <div className="font-semibold">{item.nombre_factor}</div>
//                       <div className="text-gray-300">{item.count} casos ({item.percentage.toFixed(1)}%)</div>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </div>

//             {/* Línea del 80% */}
//             <div className="absolute left-14 right-14 h-px bg-orange-400" style={{ bottom: `calc(12px + 80%)` }}>
//               <span className="absolute right-0 -top-5 text-xs text-orange-600 font-medium bg-white px-1 rounded">
//                 80% Acumulado
//               </span>
//             </div>
//           </div>

//           {/* Leyenda de la línea acumulativa */}
//           <div className="mt-4 flex items-center justify-center gap-4 text-sm">
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-1 bg-red-500 rounded"></div>
//               <span className="text-gray-700">Porcentaje Acumulado</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-4 h-1 bg-orange-400 rounded"></div>
//               <span className="text-gray-700">Línea 80% (Principio de Pareto)</span>
//             </div>
//           </div>
//         </div>

//         {/* Lista detallada de factores */}
//         <div className="space-y-2">
//           <h3 className="font-semibold text-gray-800 mb-3 text-lg">Detalle de Factores de Riesgo</h3>
//           {data.map((item, index) => (
//             <div 
//               key={index} 
//               className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
//             >
//               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-semibold text-gray-700 shadow-sm">
//                 {index + 1}
//               </div>
//               <div
//                 className="w-4 h-4 rounded shadow-sm"
//                 style={{ backgroundColor: getCategoryColor(item.categoria) }}
//               />
//               <div className="flex-1">
//                 <div className="font-medium text-gray-800">{item.nombre_factor}</div>
//                 <div className="text-sm text-gray-600 capitalize">{item.categoria}</div>
//               </div>
//               <div className="text-right">
//                 <div className="font-semibold text-gray-800">{item.count} casos</div>
//                 <div className="text-sm text-gray-600">
//                   {item.percentage.toFixed(1)}% | ↗ {item.cumulative_percentage.toFixed(1)}%
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* Información y análisis */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
//             <h4 className="font-semibold text-blue-900 mb-2">📊 Estadísticas Generales</h4>
//             <ul className="text-sm text-blue-800 space-y-1">
//               <li>• <strong>Total de casos:</strong> {data.reduce((sum, d) => sum + d.count, 0)}</li>
//               <li>• <strong>Factores distintos:</strong> {data.length}</li>
//               <li>• <strong>Factor más común:</strong> {data[0]?.nombre_factor} ({data[0]?.count} casos)</li>
//             </ul>
//           </div>

//           <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
//             <h4 className="font-semibold text-green-900 mb-2">🎯 Análisis de Pareto (80/20)</h4>
//             <ul className="text-sm text-green-800 space-y-1">
//               <li>
//                 • <strong>Factores vitales (80%):</strong>{' '}
//                 {data.filter(d => d.cumulative_percentage <= 80).length} de {data.length}
//               </li>
//               <li>
//                 • <strong>Recomendación:</strong> Enfocarse en los primeros{' '}
//                 {data.filter(d => d.cumulative_percentage <= 80).length} factores para 
//                 maximizar el impacto de las intervenciones.
//               </li>
//             </ul>
//           </div>
//         </div>

//         {/* Interpretación del Principio de Pareto */}
//         <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
//           <h4 className="font-semibold text-purple-900 mb-2">💡 Interpretación del Análisis</h4>
//           <p className="text-sm text-purple-800">
//             El principio de Pareto (regla 80/20) sugiere que aproximadamente el 80% de los efectos 
//             provienen del 20% de las causas. En este contexto, los factores en la parte superior de 
//             la gráfica son los que tienen mayor impacto en el fracaso y deserción estudiantil. 
//             Priorizar intervenciones en estos factores puede maximizar los resultados con recursos limitados.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, AlertCircle, Download } from 'lucide-react';

interface RiskFactorData {
  nombre_factor: string;
  categoria: string;
  count: number;
  percentage: number;
  cumulative_percentage: number;
}

interface ParetoChartProps {
  filters?: {
    semester?: number;
    majorId?: string;
    grupoId?: string;
  };
}

export default function ParetoChart({ filters }: ParetoChartProps) {
  const [data, setData] = useState<RiskFactorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadParetoData();
  }, [filters]);

  const loadParetoData = async () => {
    setLoading(true);
    setError('');

    try {
      // Si hay filtro por grupo, usar una consulta específica
      if (filters?.grupoId) {
        // Obtener datos del grupo
        const { data: grupoData, error: grupoError } = await supabase
          .from('grupos_materia')
          .select('materia_id, semestre_periodo')
          .eq('id', filters.grupoId)
          .single();

        if (grupoError) throw grupoError;

        // Obtener estudiantes del grupo
        const { data: inscripciones, error: inscError } = await supabase
          .from('inscripciones_grupo')
          .select('estudiante_id')
          .eq('grupo_id', filters.grupoId)
          .in('estado', ['activo', 'completado']);

        if (inscError) throw inscError;

        const estudianteIds = inscripciones.map((i: any) => i.estudiante_id);

        if (estudianteIds.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Obtener registros de estudiante_materia para estos estudiantes
        const { data: registros, error: regError } = await supabase
          .from('registros_estudiante_materia')
          .select('id')
          .in('estudiante_id', estudianteIds)
          .eq('materia_id', grupoData.materia_id)
          .eq('semestre', grupoData.semestre_periodo);

        if (regError) throw regError;

        if (!registros || registros.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        const registroIds = registros.map(r => r.id);

        // Obtener factores de riesgo
        const { data: riskFactorData, error: factorError } = await supabase
          .from('factores_riesgo_estudiante')
          .select(`
            id,
            factor_riesgo_id,
            factores_riesgo!inner (
              nombre,
              categorias_factores_riesgo!inner (
                nombre
              )
            )
          `)
          .in('registro_estudiante_materia_id', registroIds);

        if (factorError) throw factorError;

        if (!riskFactorData || riskFactorData.length === 0) {
          setData([]);
          setLoading(false);
          return;
        }

        // Procesar datos
        const factorCounts = new Map<string, { 
          name: string; 
          categoria: string; 
          count: number 
        }>();

        riskFactorData.forEach((item: any) => {
          const factorId = item.factor_riesgo_id;
          const factorName = item.factores_riesgo.nombre || 'Factor Desconocido';
          const categoria = item.factores_riesgo.categorias_factores_riesgo?.nombre || 'Sin Categoría';

          if (factorCounts.has(factorId)) {
            factorCounts.get(factorId)!.count++;
          } else {
            factorCounts.set(factorId, { 
              name: factorName, 
              categoria: categoria.toLowerCase(), 
              count: 1 
            });
          }
        });

        // Ordenar y calcular porcentajes
        const sortedFactors = Array.from(factorCounts.values())
          .sort((a, b) => b.count - a.count);

        const totalCount = sortedFactors.reduce((sum, factor) => sum + factor.count, 0);

        let cumulativeCount = 0;
        const paretoData: RiskFactorData[] = sortedFactors.map(factor => {
          const percentage = (factor.count / totalCount) * 100;
          cumulativeCount += factor.count;
          const cumulative_percentage = (cumulativeCount / totalCount) * 100;

          return {
            nombre_factor: factor.name,
            categoria: factor.categoria,
            count: factor.count,
            percentage,
            cumulative_percentage
          };
        });

        setData(paretoData);
        setLoading(false);
        return;
      }

      // Query original para cuando no hay filtro de grupo
      let query = supabase
        .from('factores_riesgo_estudiante')
        .select(`
          id,
          factor_riesgo_id,
          factores_riesgo!inner (
            nombre,
            categorias_factores_riesgo!inner (
              nombre
            )
          ),
          registro_estudiante_materia_id,
          registros_estudiante_materia!inner (
            semestre,
            estudiantes!inner (
              carrera_id
            )
          )
        `);

      const { data: riskFactorData, error: queryError } = await query;

      if (queryError) {
        console.error('Error en query:', queryError);
        throw queryError;
      }

      if (!riskFactorData || riskFactorData.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Procesar los datos aplicando filtros
      const factorCounts = new Map<string, { 
        name: string; 
        categoria: string; 
        count: number 
      }>();

      riskFactorData.forEach((item: any) => {
        // Aplicar filtros si existen
        if (filters?.semester && item.registros_estudiante_materia.semestre !== filters.semester) {
          return;
        }
        if (filters?.majorId && item.registros_estudiante_materia.estudiantes.carrera_id !== filters.majorId) {
          return;
        }

        const factorId = item.factor_riesgo_id;
        const factorName = item.factores_riesgo.nombre || 'Factor Desconocido';
        const categoria = item.factores_riesgo.categorias_factores_riesgo?.nombre || 'Sin Categoría';

        if (factorCounts.has(factorId)) {
          factorCounts.get(factorId)!.count++;
        } else {
          factorCounts.set(factorId, { 
            name: factorName, 
            categoria: categoria.toLowerCase(), 
            count: 1 
          });
        }
      });

      if (factorCounts.size === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Ordenar por frecuencia descendente
      const sortedFactors = Array.from(factorCounts.values())
        .sort((a, b) => b.count - a.count);

      const totalCount = sortedFactors.reduce((sum, factor) => sum + factor.count, 0);

      // Calcular porcentajes y acumulados
      let cumulativeCount = 0;
      const paretoData: RiskFactorData[] = sortedFactors.map(factor => {
        const percentage = (factor.count / totalCount) * 100;
        cumulativeCount += factor.count;
        const cumulative_percentage = (cumulativeCount / totalCount) * 100;

        return {
          nombre_factor: factor.name,
          categoria: factor.categoria,
          count: factor.count,
          percentage,
          cumulative_percentage
        };
      });

      setData(paretoData);
    } catch (err: any) {
      console.error('Error completo:', err);
      setError(err.message || 'Error al cargar datos del análisis de Pareto');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (data.length === 0) return;

    const headers = ['Factor de Riesgo', 'Categoría', 'Frecuencia', 'Porcentaje (%)', 'Acumulado (%)'];
    const rows = data.map(d => [
      d.nombre_factor,
      d.categoria,
      d.count,
      d.percentage.toFixed(2),
      d.cumulative_percentage.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-pareto-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      'académico': '#3b82f6',
      'academico': '#3b82f6',
      'psicológico': '#8b5cf6',
      'psicologico': '#8b5cf6',
      'económico': '#10b981',
      'economico': '#10b981',
      'institucional': '#f59e0b',
      'tecnológico': '#06b6d4',
      'tecnologico': '#06b6d4',
      'contextual': '#ef4444',
      'social': '#ec4899',
      'familiar': '#f97316',
    };
    return colors[categoria.toLowerCase()] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando análisis de Pareto...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error al cargar datos</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
              <p className="text-sm text-gray-600">Factores de riesgo más frecuentes</p>
            </div>
          </div>
        </div>
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4 opacity-50" />
          <p className="text-gray-500 mb-2">No hay datos de factores de riesgo disponibles</p>
          <p className="text-sm text-gray-400">
            {filters?.grupoId 
              ? 'No se han asignado factores de riesgo a los estudiantes de este grupo'
              : 'Los docentes deben asignar factores de riesgo desde la vista de grupos'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
            <p className="text-sm text-gray-600">
              Factores de riesgo más frecuentes
              {filters?.grupoId && ' - Vista por grupo'}
            </p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="space-y-6">
        {/* Gráfica de Pareto */}
        <div className="relative bg-gray-50 rounded-lg p-6">
          <div className="relative h-96 border-l-2 border-b-2 border-gray-300 p-4">
            {/* Eje Y izquierdo (Frecuencia) */}
            <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-600">
              <span className="text-right pr-2">{maxCount}</span>
              <span className="text-right pr-2">{Math.round(maxCount * 0.75)}</span>
              <span className="text-right pr-2">{Math.round(maxCount * 0.5)}</span>
              <span className="text-right pr-2">{Math.round(maxCount * 0.25)}</span>
              <span className="text-right pr-2">0</span>
            </div>

            {/* Eje Y derecho (Porcentaje) */}
            <div className="absolute right-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-gray-600">
              <span className="pl-2">100%</span>
              <span className="pl-2">75%</span>
              <span className="pl-2">50%</span>
              <span className="pl-2">25%</span>
              <span className="pl-2">0%</span>
            </div>

            {/* Área de gráfica */}
            <div className="h-full ml-14 mr-14 flex items-end gap-1 relative">
              {/* Línea acumulativa */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                <polyline
                  points={data.map((d, i) => {
                    const x = ((i + 0.5) / data.length) * 100;
                    const y = 100 - d.cumulative_percentage;
                    return `${x}%,${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {data.map((d, i) => {
                  const x = ((i + 0.5) / data.length) * 100;
                  const y = 100 - d.cumulative_percentage;
                  return (
                    <circle
                      key={i}
                      cx={`${x}%`}
                      cy={`${y}%`}
                      r="4"
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
              </svg>

              {/* Barras */}
              {data.map((item, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center relative group"
                  style={{ height: '100%' }}
                >
                  <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                    <div
                      className="w-full rounded-t-lg transition-all hover:opacity-80 cursor-pointer shadow-sm"
                      style={{
                        height: `${(item.count / maxCount) * 100}%`,
                        backgroundColor: getCategoryColor(item.categoria),
                        minHeight: '2px'
                      }}
                      title={`${item.nombre_factor}: ${item.count} ocurrencias (${item.percentage.toFixed(1)}%)`}
                    />
                  </div>

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                      <div className="font-semibold">{item.nombre_factor}</div>
                      <div className="text-gray-300">{item.count} casos ({item.percentage.toFixed(1)}%)</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Línea del 80% */}
            <div className="absolute left-14 right-14 h-px bg-orange-400" style={{ bottom: `calc(12px + 80%)` }}>
              <span className="absolute right-0 -top-5 text-xs text-orange-600 font-medium bg-white px-1 rounded">
                80% Acumulado
              </span>
            </div>
          </div>

          {/* Leyenda de la línea acumulativa */}
          <div className="mt-4 flex items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-red-500 rounded"></div>
              <span className="text-gray-700">Porcentaje Acumulado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-orange-400 rounded"></div>
              <span className="text-gray-700">Línea 80% (Principio de Pareto)</span>
            </div>
          </div>
        </div>

        {/* Lista detallada de factores */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 mb-3 text-lg">Detalle de Factores de Riesgo</h3>
          {data.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-semibold text-gray-700 shadow-sm">
                {index + 1}
              </div>
              <div
                className="w-4 h-4 rounded shadow-sm"
                style={{ backgroundColor: getCategoryColor(item.categoria) }}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-800">{item.nombre_factor}</div>
                <div className="text-sm text-gray-600 capitalize">{item.categoria}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-800">{item.count} casos</div>
                <div className="text-sm text-gray-600">
                  {item.percentage.toFixed(1)}% | ↗ {item.cumulative_percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Información y análisis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">📊 Estadísticas Generales</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Total de casos:</strong> {data.reduce((sum, d) => sum + d.count, 0)}</li>
              <li>• <strong>Factores distintos:</strong> {data.length}</li>
              <li>• <strong>Factor más común:</strong> {data[0]?.nombre_factor} ({data[0]?.count} casos)</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">🎯 Análisis de Pareto (80/20)</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>
                • <strong>Factores vitales (80%):</strong>{' '}
                {data.filter(d => d.cumulative_percentage <= 80).length} de {data.length}
              </li>
              <li>
                • <strong>Recomendación:</strong> Enfocarse en los primeros{' '}
                {data.filter(d => d.cumulative_percentage <= 80).length} factores para 
                maximizar el impacto de las intervenciones.
              </li>
            </ul>
          </div>
        </div>

        {/* Interpretación del Principio de Pareto */}
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <h4 className="font-semibold text-purple-900 mb-2">💡 Interpretación del Análisis</h4>
          <p className="text-sm text-purple-800">
            El principio de Pareto (regla 80/20) sugiere que aproximadamente el 80% de los efectos 
            provienen del 20% de las causas. En este contexto, los factores en la parte superior de 
            la gráfica son los que tienen mayor impacto en el fracaso y deserción estudiantil. 
            Priorizar intervenciones en estos factores puede maximizar los resultados con recursos limitados.
          </p>
        </div>
      </div>
    </div>
  );
}