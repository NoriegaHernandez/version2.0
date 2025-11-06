import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FileText, Download, TrendingDown, AlertCircle, Award, Users, BookOpen, RefreshCw } from 'lucide-react';
import jsPDF from "jspdf";

interface ReportData {
  totalStudents: number;
  totalRecords: number;
  failureRate: number;
  dropoutRate: number;
  approvalRate: number;
  averageGrade: number;
  studentsWithGrades: number;
  topRiskFactors: Array<{ 
    factor: string; 
    count: number; 
    avgGrade: number;
    approvalRate: number;
  }>;
  bySemester: Array<{ 
    semester: number; 
    failed: number; 
    dropout: number;
    avgGrade: number;
    total: number;
  }>;
  byMajor: Array<{ 
    major: string; 
    failed: number; 
    dropout: number;
    avgGrade: number;
    total: number;
  }>;
  gradeDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    failed: number;
  };
  criticalStudents: Array<{
    name: string;
    grade: number;
    riskFactors: number;
  }>;
}

export default function Reports() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReportData();
  }, []);

  const loadReportData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { data: students } = await supabase.from('estudiantes').select('id, nombre, apellido_paterno, apellido_materno');
      const { data: records } = await supabase.from('registros_estudiante_materia').select(`estado, semestre, calificacion_final, estudiantes!inner (id, nombre, apellido_paterno, carreras (nombre))`);
      const { data: inscripciones } = await supabase.from('inscripciones_grupo').select(`calificacion_final, estado, estudiantes!inner (id, nombre, apellido_paterno), grupos_materia!inner (semestre_periodo)`);

      const totalStudents = students?.length || 0;
      const totalRecords = (records?.length || 0) + (inscripciones?.length || 0);
      const allGrades: number[] = [];
      let approved = 0, failed = 0, dropout = 0;

      records?.forEach((r: any) => {
        if (r.estado === 'aprobado') approved++;
        if (r.estado === 'reprobado') failed++;
        if (r.estado === 'baja') dropout++;
        if (r.calificacion_final !== null) allGrades.push(r.calificacion_final);
      });

      inscripciones?.forEach((i: any) => {
        if (i.calificacion_final !== null) {
          allGrades.push(i.calificacion_final);
          if (i.calificacion_final >= 70) approved++; else failed++;
        }
      });

      const failureRate = totalRecords > 0 ? (failed / totalRecords) * 100 : 0;
      const dropoutRate = totalRecords > 0 ? (dropout / totalRecords) * 100 : 0;
      const approvalRate = totalRecords > 0 ? (approved / totalRecords) * 100 : 0;
      const averageGrade = allGrades.length > 0 ? allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length : 0;

      const gradeDistribution = {
        excellent: allGrades.filter(g => g >= 90).length,
        good: allGrades.filter(g => g >= 80 && g < 90).length,
        satisfactory: allGrades.filter(g => g >= 70 && g < 80).length,
        failed: allGrades.filter(g => g < 70).length,
      };

      const { data: riskFactorsData } = await supabase.from('factores_riesgo_estudiante').select(`id, factores_riesgo!inner (nombre, categorias_factores_riesgo!inner (nombre)), registros_estudiante_materia!inner (calificacion_final, estado)`);
      const factorStats = new Map<string, { count: number; grades: number[]; approved: number; total: number; }>();

      riskFactorsData?.forEach((rf: any) => {
        const factorName = rf.factores_riesgo?.categorias_factores_riesgo?.nombre || rf.factores_riesgo?.nombre || 'Desconocido';
        if (!factorStats.has(factorName)) factorStats.set(factorName, { count: 0, grades: [], approved: 0, total: 0 });
        const stats = factorStats.get(factorName)!;
        stats.count++;
        const grade = rf.registros_estudiante_materia?.calificacion_final;
        if (grade !== null && grade !== undefined) {
          stats.grades.push(grade);
          stats.total++;
          if (grade >= 70) stats.approved++;
        }
      });

      const topRiskFactors = Array.from(factorStats.entries()).map(([factor, stats]) => ({
        factor, count: stats.count,
        avgGrade: stats.grades.length > 0 ? stats.grades.reduce((sum, g) => sum + g, 0) / stats.grades.length : 0,
        approvalRate: stats.total > 0 ? (stats.approved / stats.total) * 100 : 0,
      })).sort((a, b) => b.count - a.count).slice(0, 8);

      const semesterMap = new Map<number, { failed: number; dropout: number; grades: number[]; total: number; }>();
      records?.forEach((item: any) => {
        const semester = item.semestre;
        if (!semesterMap.has(semester)) semesterMap.set(semester, { failed: 0, dropout: 0, grades: [], total: 0 });
        const current = semesterMap.get(semester)!;
        current.total++;
        if (item.estado === 'reprobado') current.failed++;
        if (item.estado === 'baja') current.dropout++;
        if (item.calificacion_final !== null) current.grades.push(item.calificacion_final);
      });

      const bySemester = Array.from(semesterMap.entries()).map(([semester, stats]) => ({
        semester, failed: stats.failed, dropout: stats.dropout,
        avgGrade: stats.grades.length > 0 ? stats.grades.reduce((sum, g) => sum + g, 0) / stats.grades.length : 0,
        total: stats.total,
      })).sort((a, b) => a.semester - b.semester);

      const majorMap = new Map<string, { failed: number; dropout: number; grades: number[]; total: number; }>();
      records?.forEach((item: any) => {
        const majorName = item.estudiantes?.carreras?.nombre || 'Sin carrera';
        if (!majorMap.has(majorName)) majorMap.set(majorName, { failed: 0, dropout: 0, grades: [], total: 0 });
        const current = majorMap.get(majorName)!;
        current.total++;
        if (item.estado === 'reprobado') current.failed++;
        if (item.estado === 'baja') current.dropout++;
        if (item.calificacion_final !== null) current.grades.push(item.calificacion_final);
      });

      const byMajor = Array.from(majorMap.entries()).map(([major, stats]) => ({
        major, failed: stats.failed, dropout: stats.dropout,
        avgGrade: stats.grades.length > 0 ? stats.grades.reduce((sum, g) => sum + g, 0) / stats.grades.length : 0,
        total: stats.total,
      })).sort((a, b) => (b.failed + b.dropout) - (a.failed + a.dropout));

      const { data: studentRisks } = await supabase.from('registros_estudiante_materia').select(`calificacion_final, estudiantes!inner (id, nombre, apellido_paterno, apellido_materno)`);
      const studentRiskCounts = new Map<string, { name: string; grades: number[]; riskCount: number; }>();

      studentRisks?.forEach((sr: any) => {
        const studentId = sr.estudiantes.id;
        const name = `${sr.estudiantes.nombre} ${sr.estudiantes.apellido_paterno} ${sr.estudiantes.apellido_materno}`;
        if (!studentRiskCounts.has(studentId)) studentRiskCounts.set(studentId, { name, grades: [], riskCount: 0 });
        const student = studentRiskCounts.get(studentId)!;
        if (sr.calificacion_final !== null) student.grades.push(sr.calificacion_final);
      });

      const { data: allRisks } = await supabase.from('factores_riesgo_estudiante').select(`registros_estudiante_materia!inner (estudiantes!inner (id))`);
      allRisks?.forEach((risk: any) => {
        const studentId = risk.registros_estudiante_materia?.estudiantes?.id;
        if (studentId && studentRiskCounts.has(studentId)) studentRiskCounts.get(studentId)!.riskCount++;
      });

      const criticalStudents = Array.from(studentRiskCounts.values()).map(student => ({
        name: student.name,
        grade: student.grades.length > 0 ? student.grades.reduce((sum, g) => sum + g, 0) / student.grades.length : 0,
        riskFactors: student.riskCount,
      })).filter(s => s.grade > 0 && s.grade < 70 && s.riskFactors > 0).sort((a, b) => b.riskFactors - a.riskFactors || a.grade - b.grade).slice(0, 10);

      setData({ totalStudents, totalRecords, failureRate, dropoutRate, approvalRate, averageGrade, studentsWithGrades: allGrades.length, topRiskFactors, bySemester, byMajor, gradeDistribution, criticalStudents });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  };

const exportReport = () => {
  if (!data) return;

  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  // Encabezado
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("REPORTE AUTOMÁTICO - ANÁLISIS DE CALIDAD ACADÉMICA", 105, 20, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Instituto Tecnológico de Tijuana", 105, 28, { align: "center" });
  doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`, 105, 35, { align: "center" });

  let y = 45;
  const lineGap = 7;

  const addSection = (title: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 10, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
  };

  const addText = (text: string) => {
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, y);
    y += splitText.length * 5;
  };

  addSection("RESUMEN EJECUTIVO");
  addText(
    `Total de estudiantes registrados: ${data.totalStudents}\n` +
    `Total de registros académicos: ${data.totalRecords}\n` +
    `Estudiantes con calificaciones: ${data.studentsWithGrades}\n\n` +
    `Tasa de aprobación: ${data.approvalRate.toFixed(2)}%\n` +
    `Tasa de reprobación: ${data.failureRate.toFixed(2)}%\n` +
    `Tasa de deserción: ${data.dropoutRate.toFixed(2)}%\n` +
    `Calificación promedio: ${data.averageGrade.toFixed(2)}`
  );

  addSection("DISTRIBUCIÓN DE CALIFICACIONES");
  addText(
    `Excelente (90-100): ${data.gradeDistribution.excellent} (${((data.gradeDistribution.excellent / data.studentsWithGrades) * 100).toFixed(1)}%)\n` +
    `Bueno (80-89): ${data.gradeDistribution.good} (${((data.gradeDistribution.good / data.studentsWithGrades) * 100).toFixed(1)}%)\n` +
    `Satisfactorio (70-79): ${data.gradeDistribution.satisfactory} (${((data.gradeDistribution.satisfactory / data.studentsWithGrades) * 100).toFixed(1)}%)\n` +
    `Reprobado (0-69): ${data.gradeDistribution.failed} (${((data.gradeDistribution.failed / data.studentsWithGrades) * 100).toFixed(1)}%)`
  );

  addSection("FACTORES DE RIESGO PRINCIPALES");
  data.topRiskFactors.forEach((f, i) => {
    addText(`${i + 1}. ${f.factor}\n   • Casos: ${f.count}\n   • Calif. promedio: ${f.avgGrade.toFixed(2)}\n   • Tasa aprobación: ${f.approvalRate.toFixed(1)}%`);
  });

  addSection("ANÁLISIS POR SEMESTRE");
  data.bySemester.forEach(s => {
    addText(
      `Semestre ${s.semester}: ${s.total} registros\n` +
      `   • Reprobados: ${s.failed} (${((s.failed / s.total) * 100).toFixed(1)}%)\n` +
      `   • Deserciones: ${s.dropout} (${((s.dropout / s.total) * 100).toFixed(1)}%)\n` +
      `   • Calif. promedio: ${s.avgGrade.toFixed(2)}`
    );
  });

  addSection("ANÁLISIS POR CARRERA");
  data.byMajor.forEach(m => {
    addText(
      `${m.major}: ${m.total} registros\n` +
      `   • Reprobados: ${m.failed} (${((m.failed / m.total) * 100).toFixed(1)}%)\n` +
      `   • Deserciones: ${m.dropout} (${((m.dropout / m.total) * 100).toFixed(1)}%)\n` +
      `   • Calif. promedio: ${m.avgGrade.toFixed(2)}`
    );
  });

  addSection("ESTUDIANTES EN SITUACIÓN CRÍTICA");
  if (data.criticalStudents.length > 0) {
    data.criticalStudents.forEach((s, i) => {
      addText(`${i + 1}. ${s.name}\n   • Calificación: ${s.grade.toFixed(2)}\n   • Factores de riesgo: ${s.riskFactors}`);
    });
  } else {
    addText("No se identificaron estudiantes en situación crítica.");
  }

  addSection("RECOMENDACIONES ESTRATÉGICAS");
  const recommendations = getRecommendations(data);
  recommendations.forEach(r => addText(r));

  // Pie de página
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(10);
  doc.text("Fin del reporte", 105, 285, { align: "center" });

  // Descargar PDF
  doc.save(`reporte-calidad-${new Date().toISOString().split('T')[0]}.pdf`);
};

  const getRecommendations = (data: ReportData): string[] => {
    const recommendations: string[] = [];
    if (data.failureRate > 30) recommendations.push('🚨 CRÍTICO - TASA DE REPROBACIÓN:\n   La tasa de reprobación supera el 30%. Se requiere:\n   - Programa de tutorías intensivas\n   - Revisión de metodologías de enseñanza\n   - Talleres de técnicas de estudio');
    else if (data.failureRate > 20) recommendations.push('⚠️ ATENCIÓN - TASA DE REPROBACIÓN:\n   Implementar estrategias de apoyo académico adicionales.');
    if (data.dropoutRate > 15) recommendations.push('🚨 CRÍTICO - DESERCIÓN ESTUDIANTIL:\n   Alta tasa de deserción. Acciones urgentes:\n   - Programa de retención estudiantil\n   - Becas y apoyos económicos\n   - Seguimiento personalizado');
    else if (data.dropoutRate > 10) recommendations.push('⚠️ ATENCIÓN - DESERCIÓN:\n   Reforzar apoyo institucional y seguimiento.');
    if (data.averageGrade < 70) recommendations.push('🚨 CRÍTICO - PROMEDIO GENERAL:\n   El promedio institucional está en nivel reprobatorio.\n   Se requiere intervención inmediata y revisión curricular.');
    else if (data.averageGrade < 80) recommendations.push('⚠️ ATENCIÓN - PROMEDIO GENERAL:\n   El promedio es bajo. Considerar programas de mejora académica.');
    else if (data.averageGrade >= 85) recommendations.push('✅ POSITIVO - PROMEDIO GENERAL:\n   Excelente promedio institucional. Mantener estrategias actuales.');
    if (data.topRiskFactors.length > 0) {
      const worstFactor = data.topRiskFactors.reduce((worst, f) => f.avgGrade < worst.avgGrade ? f : worst);
      recommendations.push(`📊 PRIORIDAD - FACTOR DE RIESGO:\n   "${worstFactor.factor}" muestra el peor rendimiento (${worstFactor.avgGrade.toFixed(1)}).\n   Enfoque prioritario en este factor.`);
    }
    if (data.criticalStudents.length > 0) recommendations.push(`👥 INTERVENCIÓN INMEDIATA:\n   ${data.criticalStudents.length} estudiantes requieren atención urgente.\n   - Bajo rendimiento académico\n   - Múltiples factores de riesgo\n   - Riesgo alto de deserción`);
    if (data.bySemester.length > 0) {
      const worstSemester = data.bySemester.reduce((worst, s) => s.avgGrade < worst.avgGrade ? s : worst);
      if (worstSemester.avgGrade < 75) recommendations.push(`📚 FOCO EN SEMESTRE:\n   Semestre ${worstSemester.semester} muestra el peor desempeño (${worstSemester.avgGrade.toFixed(1)}).\n   Requiere revisión de contenidos y apoyo especial.`);
    }
    recommendations.push('📈 SEGUIMIENTO:\n   - Monitoreo trimestral de KPIs\n   - Reuniones con docentes y tutores\n   - Evaluación continua de intervenciones');
    recommendations.push('🤝 COMUNICACIÓN:\n   - Canales efectivos entre docentes-tutores-estudiantes\n   - Retroalimentación constante\n   - Sistema de alertas tempranas');
    return recommendations;
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-700 bg-green-100';
    if (grade >= 80) return 'text-blue-700 bg-blue-100';
    if (grade >= 70) return 'text-yellow-700 bg-yellow-100';
    return 'text-red-700 bg-red-100';
  };

  if (loading) return (<div className="flex items-center justify-center h-96"><div className="text-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-500">Generando reporte...</p></div></div>);
  if (!data) return (<div className="flex items-center justify-center h-96"><div className="text-gray-500">No hay datos disponibles</div></div>);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Reporte Automático</h2>
              <p className="text-sm text-gray-600">Análisis integral de calidad académica con métricas de rendimiento</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={exportReport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />Exportar Reporte
            </button>
            <button onClick={() => loadReportData(true)} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Reiniciar Vista'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><Award className="w-5 h-5 text-blue-600" /><span className="text-sm font-medium text-blue-900">Promedio General</span></div>
            <p className={`text-3xl font-bold ${data.averageGrade >= 80 ? 'text-blue-700' : data.averageGrade >= 70 ? 'text-yellow-700' : 'text-red-700'}`}>{data.averageGrade.toFixed(1)}</p>
            <p className="text-xs text-blue-600 mt-1">{data.studentsWithGrades} calificaciones</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div><span className="text-sm font-medium text-green-900">Aprobación</span></div>
            <p className="text-3xl font-bold text-green-700">{data.approvalRate.toFixed(1)}%</p>
            <p className="text-xs text-green-600 mt-1">de {data.totalRecords} registros</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><TrendingDown className="w-4 h-4 text-yellow-600" /><span className="text-sm font-medium text-yellow-900">Reprobación</span></div>
            <p className="text-3xl font-bold text-yellow-700">{data.failureRate.toFixed(1)}%</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2"><AlertCircle className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-900">Deserción</span></div>
            <p className="text-3xl font-bold text-red-700">{data.dropoutRate.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" />Distribución de Calificaciones</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Excelente (90-100)</div>
              <div className="text-2xl font-bold text-green-700">{data.gradeDistribution.excellent}</div>
              <div className="text-xs text-gray-500">{((data.gradeDistribution.excellent/data.studentsWithGrades)*100).toFixed(1)}%</div>
            </div>
            <div className="bg-white p-3 rounded border border-blue-200">
              <div className="text-xs text-gray-600 mb-1">Bueno (80-89)</div>
              <div className="text-2xl font-bold text-blue-700">{data.gradeDistribution.good}</div>
              <div className="text-xs text-gray-500">{((data.gradeDistribution.good/data.studentsWithGrades)*100).toFixed(1)}%</div>
            </div>
            <div className="bg-white p-3 rounded border border-yellow-200">
              <div className="text-xs text-gray-600 mb-1">Satisfactorio (70-79)</div>
              <div className="text-2xl font-bold text-yellow-700">{data.gradeDistribution.satisfactory}</div>
              <div className="text-xs text-gray-500">{((data.gradeDistribution.satisfactory/data.studentsWithGrades)*100).toFixed(1)}%</div>
            </div>
            <div className="bg-white p-3 rounded border border-red-200">
              <div className="text-xs text-gray-600 mb-1">Reprobado (0-69)</div>
              <div className="text-2xl font-bold text-red-700">{data.gradeDistribution.failed}</div>
              <div className="text-xs text-gray-500">{((data.gradeDistribution.failed/data.studentsWithGrades)*100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Factores de Riesgo e Impacto Académico</h3>
            {data.topRiskFactors.length > 0 ? (
              <div className="space-y-2">
                {data.topRiskFactors.map((factor, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-semibold text-gray-700 shadow-sm">{index + 1}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{factor.factor}</div>
                      <div className="text-xs text-gray-600">{factor.count} casos</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(factor.avgGrade)}`}>{factor.avgGrade.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 mt-1">Calif. promedio</div>
                      </div>
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${factor.approvalRate >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{factor.approvalRate.toFixed(0)}%</div>
                        <div className="text-xs text-gray-500 mt-1">Aprobación</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-center py-4">No hay factores de riesgo registrados</p>)}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><BookOpen className="w-5 h-5" />Análisis por Semestre</h3>
            {data.bySemester.length > 0 ? (
              <div className="space-y-2">
                {data.bySemester.map((sem, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-sm font-semibold text-blue-700">{sem.semester}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Semestre {sem.semester}</div>
                      <div className="text-xs text-gray-600">{sem.total} registros</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(sem.avgGrade)}`}>{sem.avgGrade.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 mt-1">Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm"><span className="text-red-700 font-semibold">{sem.failed}</span><span className="text-gray-500 mx-1">/</span><span className="text-orange-700 font-semibold">{sem.dropout}</span></div>
                        <div className="text-xs text-gray-500 mt-1">Rep. / Des.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-center py-4">No hay datos por semestre</p>)}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3">Análisis por Carrera</h3>
            {data.byMajor.length > 0 ? (
              <div className="space-y-2">
                {data.byMajor.map((major, index) => (
                  <div key={index} className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-sm font-semibold text-gray-700 shadow-sm">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{major.major}</div>
                      <div className="text-xs text-gray-600">{major.total} registros</div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(major.avgGrade)}`}>{major.avgGrade.toFixed(1)}</div>
                        <div className="text-xs text-gray-500 mt-1">Promedio</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm"><span className="text-red-700 font-semibold">{major.failed}</span><span className="text-gray-500 mx-1">/</span><span className="text-orange-700 font-semibold">{major.dropout}</span></div>
                        <div className="text-xs text-gray-500 mt-1">Rep. / Des.</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-500 text-center py-4">No hay datos por carrera</p>)}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-red-600" />Estudiantes en Situación Crítica</h3>
            {data.criticalStudents.length > 0 ? (
              <div className="space-y-2">
                {data.criticalStudents.map((student, index) => (
                  <div key={index} className="flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-red-200 text-sm font-semibold text-red-700">{index + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">{student.name}</div>
                      <div className="text-xs text-red-600">{student.riskFactors} factor{student.riskFactors !== 1 ? 'es' : ''} de riesgo</div>
                    </div>
                    <div className="text-center flex-shrink-0">
                      <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(student.grade)}`}>{student.grade.toFixed(1)}</div>
                      <div className="text-xs text-gray-500 mt-1">Calificación</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-green-50 border border-green-200 rounded-lg">
                <Award className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-medium">No se identificaron estudiantes en situación crítica</p>
                <p className="text-sm text-green-600 mt-1">Todos los estudiantes con factores de riesgo mantienen calificaciones aprobatorias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}