import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, TrendingDown, AlertCircle } from 'lucide-react';

interface ReportData {
  totalStudents: number;
  totalRecords: number;
  failureRate: number;
  dropoutRate: number;
  approvalRate: number;
  topRiskFactors: Array<{ factor: string; count: number }>;
  bySemester: Array<{ semester: number; failed: number; dropout: number }>;
  byMajor: Array<{ major: string; failed: number; dropout: number }>;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async () => {
    setLoading(true);
    try {
      const { data: students } = await supabase.from('students').select('id');

      const { data: records } = await supabase
        .from('student_subject_records')
        .select('status');

      const { data: riskFactors } = await supabase
        .from('student_risk_factors')
        .select(`
          risk_factors (name)
        `);

      const { data: semesterData } = await supabase
        .from('student_subject_records')
        .select('semester, status');

      const { data: majorData } = await supabase
        .from('student_subject_records')
        .select(`
          status,
          students!inner (
            majors (name)
          )
        `);

      const totalStudents = students?.length || 0;
      const totalRecords = records?.length || 0;

      const failed = records?.filter(r => r.status === 'failed').length || 0;
      const dropout = records?.filter(r => r.status === 'dropout').length || 0;
      const approved = records?.filter(r => r.status === 'approved').length || 0;

      const failureRate = totalRecords > 0 ? (failed / totalRecords) * 100 : 0;
      const dropoutRate = totalRecords > 0 ? (dropout / totalRecords) * 100 : 0;
      const approvalRate = totalRecords > 0 ? (approved / totalRecords) * 100 : 0;

      const factorCounts = new Map<string, number>();
      riskFactors?.forEach((rf: any) => {
        const name = rf.risk_factors?.name || 'Desconocido';
        factorCounts.set(name, (factorCounts.get(name) || 0) + 1);
      });

      const topRiskFactors = Array.from(factorCounts.entries())
        .map(([factor, count]) => ({ factor, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const semesterMap = new Map<number, { failed: number; dropout: number }>();
      semesterData?.forEach((item: any) => {
        const semester = item.semester;
        if (!semesterMap.has(semester)) {
          semesterMap.set(semester, { failed: 0, dropout: 0 });
        }
        const current = semesterMap.get(semester)!;
        if (item.status === 'failed') current.failed++;
        if (item.status === 'dropout') current.dropout++;
      });

      const bySemester = Array.from(semesterMap.entries())
        .map(([semester, counts]) => ({ semester, ...counts }))
        .sort((a, b) => a.semester - b.semester);

      const majorMap = new Map<string, { failed: number; dropout: number }>();
      majorData?.forEach((item: any) => {
        const majorName = item.students?.majors?.name || 'Sin carrera';
        if (!majorMap.has(majorName)) {
          majorMap.set(majorName, { failed: 0, dropout: 0 });
        }
        const current = majorMap.get(majorName)!;
        if (item.status === 'failed') current.failed++;
        if (item.status === 'dropout') current.dropout++;
      });

      const byMajor = Array.from(majorMap.entries())
        .map(([major, counts]) => ({ major, ...counts }))
        .sort((a, b) => (b.failed + b.dropout) - (a.failed + a.dropout));

      setData({
        totalStudents,
        totalRecords,
        failureRate,
        dropoutRate,
        approvalRate,
        topRiskFactors,
        bySemester,
        byMajor,
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = () => {
    if (!data) return;

    const reportText = `
REPORTE AUTOMÁTICO - ANÁLISIS DE CALIDAD ACADÉMICA
Instituto Tecnológico de Tijuana
Fecha: ${new Date().toLocaleDateString('es-MX')}

=== RESUMEN GENERAL ===
Total de estudiantes registrados: ${data.totalStudents}
Total de registros académicos: ${data.totalRecords}
Tasa de aprobación: ${data.approvalRate.toFixed(2)}%
Tasa de reprobación: ${data.failureRate.toFixed(2)}%
Tasa de deserción: ${data.dropoutRate.toFixed(2)}%

=== FACTORES DE RIESGO MÁS FRECUENTES ===
${data.topRiskFactors.map((f, i) => `${i + 1}. ${f.factor}: ${f.count} casos`).join('\n')}

=== ANÁLISIS POR SEMESTRE ===
${data.bySemester.map(s => `Semestre ${s.semester}: ${s.failed} reprobados, ${s.dropout} deserciones`).join('\n')}

=== ANÁLISIS POR CARRERA ===
${data.byMajor.map(m => `${m.major}: ${m.failed} reprobados, ${m.dropout} deserciones`).join('\n')}

=== RECOMENDACIONES ===
${getRecommendations(data).join('\n')}
    `;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-calidad-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRecommendations = (data: ReportData): string[] => {
    const recommendations: string[] = [];

    if (data.failureRate > 30) {
      recommendations.push('• CRÍTICO: La tasa de reprobación supera el 30%. Se recomienda implementar programas de tutorías intensivas.');
    } else if (data.failureRate > 20) {
      recommendations.push('• ATENCIÓN: Tasa de reprobación elevada. Considerar estrategias de apoyo académico adicionales.');
    }

    if (data.dropoutRate > 15) {
      recommendations.push('• CRÍTICO: Alta tasa de deserción. Urgente implementar programas de retención estudiantil.');
    } else if (data.dropoutRate > 10) {
      recommendations.push('• ATENCIÓN: Tasa de deserción preocupante. Reforzar apoyo institucional y seguimiento personalizado.');
    }

    if (data.topRiskFactors.length > 0) {
      recommendations.push(`• Priorizar intervenciones en: ${data.topRiskFactors[0].factor} (factor más frecuente).`);
    }

    if (data.bySemester.length > 0) {
      const worstSemester = data.bySemester.reduce((max, s) =>
        (s.failed + s.dropout) > (max.failed + max.dropout) ? s : max
      );
      recommendations.push(`• Semestre ${worstSemester.semester} requiere atención especial (mayor incidencia de problemas).`);
    }

    if (data.approvalRate > 70) {
      recommendations.push('• POSITIVO: La tasa de aprobación es buena. Mantener las estrategias actuales.');
    }

    recommendations.push('• Realizar seguimiento trimestral de estos indicadores para identificar tendencias.');
    recommendations.push('• Establecer canales de comunicación efectivos entre docentes, tutores y estudiantes.');

    return recommendations;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Generando reporte...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">No hay datos disponibles</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Reporte Automático</h2>
              <p className="text-sm text-gray-600">
                Análisis integral de calidad académica
              </p>
            </div>
          </div>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm font-medium text-green-900">Aprobación</span>
            </div>
            <p className="text-3xl font-bold text-green-700">{data.approvalRate.toFixed(1)}%</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">Reprobación</span>
            </div>
            <p className="text-3xl font-bold text-yellow-700">{data.failureRate.toFixed(1)}%</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-900">Deserción</span>
            </div>
            <p className="text-3xl font-bold text-red-700">{data.dropoutRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Factores de Riesgo Más Frecuentes
            </h3>
            <div className="space-y-2">
              {data.topRiskFactors.map((factor, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 px-4 py-2 rounded">
                  <span className="text-sm text-gray-700">
                    {index + 1}. {factor.factor}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {factor.count} casos
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Recomendaciones
            </h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <ul className="space-y-2 text-sm text-blue-900">
                {getRecommendations(data).map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
