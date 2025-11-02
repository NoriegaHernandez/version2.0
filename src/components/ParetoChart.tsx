import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, Download } from 'lucide-react';

interface ParetoData {
  factor: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

interface ParetoChartProps {
  filters: {
    semester?: number;
    majorId?: string;
  };
}

export default function ParetoChart({ filters }: ParetoChartProps) {
  const [data, setData] = useState<ParetoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('student_risk_factors')
        .select(`
          risk_factor_id,
          risk_factors (name),
          student_subject_records!inner (
            semester,
            students!inner (major_id)
          )
        `);

      if (filters.semester) {
        query = query.eq('student_subject_records.semester', filters.semester);
      }

      if (filters.majorId) {
        query = query.eq('student_subject_records.students.major_id', filters.majorId);
      }

      const { data: riskData, error } = await query;

      if (error) throw error;

      const factorCounts = new Map<string, number>();

      riskData?.forEach((item: any) => {
        const factorName = item.risk_factors?.name || 'Desconocido';
        factorCounts.set(factorName, (factorCounts.get(factorName) || 0) + 1);
      });

      const total = Array.from(factorCounts.values()).reduce((sum, count) => sum + count, 0);

      const sortedData = Array.from(factorCounts.entries())
        .map(([factor, count]) => ({
          factor,
          count,
          percentage: (count / total) * 100,
          cumulativePercentage: 0,
        }))
        .sort((a, b) => b.count - a.count);

      let cumulative = 0;
      sortedData.forEach((item) => {
        cumulative += item.percentage;
        item.cumulativePercentage = cumulative;
      });

      setData(sortedData);
    } catch (error) {
      console.error('Error loading Pareto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...data.map(d => d.count), 1);

  const exportToCSV = () => {
    const headers = ['Factor de Riesgo', 'Frecuencia', 'Porcentaje (%)', 'Acumulado (%)'];
    const rows = data.map(d => [
      d.factor,
      d.count,
      d.percentage.toFixed(2),
      d.cumulativePercentage.toFixed(2),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analisis-pareto-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Cargando datos...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No hay datos disponibles para el análisis de Pareto</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Análisis de Pareto</h2>
          <p className="text-sm text-gray-600 mt-1">
            Factores de riesgo más frecuentes que afectan a los estudiantes
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      <div className="relative">
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700">{item.factor}</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">{item.count} casos</span>
                  <span className="text-blue-600 font-semibold">{item.percentage.toFixed(1)}%</span>
                  <span className="text-orange-600 text-xs">↗ {item.cumulativePercentage.toFixed(1)}%</span>
                </div>
              </div>
              <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end pr-3 transition-all duration-500"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                >
                  <span className="text-white font-semibold text-sm">{item.count}</span>
                </div>
                <div
                  className="absolute inset-y-0 left-0 border-r-2 border-orange-500"
                  style={{ left: `${item.cumulativePercentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Interpretación del Análisis de Pareto</h3>
          <p className="text-sm text-blue-800">
            El principio de Pareto (regla 80/20) sugiere que aproximadamente el 80% de los efectos
            provienen del 20% de las causas. Los factores en la parte superior de esta gráfica son
            los que tienen mayor impacto en el fracaso y deserción estudiantil.
          </p>
          {data.length > 0 && (
            <div className="mt-3 p-3 bg-white rounded border border-blue-100">
              <p className="text-sm font-medium text-gray-800">
                <span className="text-orange-600">Línea acumulada:</span> Muestra el porcentaje acumulado.
                Enfocarse en los primeros factores hasta alcanzar el 80% puede maximizar el impacto
                de las intervenciones.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
