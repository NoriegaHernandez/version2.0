import { useState, useEffect } from 'react';
import { supabase, RiskFactorCategory, RiskFactor, StudentRiskFactor } from '../lib/supabase';
import { AlertTriangle, X, Save } from 'lucide-react';

interface RiskFactorFormProps {
  recordId: string;
  studentName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function RiskFactorForm({ recordId, studentName, onSuccess, onCancel }: RiskFactorFormProps) {
  const [categories, setCategories] = useState<RiskFactorCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    severity: 'medium' as 'low' | 'medium' | 'high',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [recordId]);

  const loadData = async () => {
    const { data: cats } = await supabase
      .from('risk_factor_categories')
      .select('*')
      .order('name');

    const { data: existing } = await supabase
      .from('student_risk_factors')
      .select(`
        risk_factor_id,
        risk_factors!inner (category_id)
      `)
      .eq('student_subject_record_id', recordId);

    if (cats) setCategories(cats);
    if (existing) {
      const categoryIds = existing.map((e: any) => e.risk_factors.category_id);
      setSelectedCategories([...new Set(categoryIds)]);
    }
  };

  const handleAddFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id) return;

    setLoading(true);
    try {
      const { data: existingFactor } = await supabase
        .from('risk_factors')
        .select('id')
        .eq('category_id', formData.category_id)
        .maybeSingle();

      let factorId: string;

      if (existingFactor) {
        factorId = existingFactor.id;
      } else {
        const category = categories.find(c => c.id === formData.category_id);
        const { data: newFactor, error } = await supabase
          .from('risk_factors')
          .insert({
            category_id: formData.category_id,
            name: category?.name || 'Factor',
            description: category?.description,
          })
          .select()
          .single();

        if (error) throw error;
        factorId = newFactor.id;
      }

      const { error: insertError } = await supabase.from('student_risk_factors').insert({
        student_subject_record_id: recordId,
        risk_factor_id: factorId,
        severity: formData.severity,
        notes: formData.notes || null,
      });

      if (insertError) throw insertError;

      setSelectedCategories([...selectedCategories, formData.category_id]);
      setFormData({ category_id: '', severity: 'medium', notes: '' });
    } catch (error) {
      console.error('Error adding risk factor:', error);
      alert('Error al agregar factor de riesgo');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFactor = async (categoryId: string) => {
    try {
      const { data: factorData } = await supabase
        .from('risk_factors')
        .select('id')
        .eq('category_id', categoryId);

      if (factorData && factorData.length > 0) {
        const factorIds = factorData.map(f => f.id);
        await supabase
          .from('student_risk_factors')
          .delete()
          .eq('student_subject_record_id', recordId)
          .in('risk_factor_id', factorIds);
      }

      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } catch (error) {
      console.error('Error removing risk factor:', error);
    }
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || '';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Factores de Riesgo</h2>
            <p className="text-sm text-gray-600 mt-1">{studentName}</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {selectedCategories.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Factores de Riesgo Identificados ({selectedCategories.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedCategories.map(categoryId => (
                      <div key={categoryId} className="flex justify-between items-center bg-white px-3 py-2 rounded">
                        <span className="text-sm text-gray-700">{getCategoryName(categoryId)}</span>
                        <button
                          onClick={() => handleRemoveFactor(categoryId)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleAddFactor} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría de Riesgo *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar categoría de riesgo</option>
                {categories.map(category => (
                  <option
                    key={category.id}
                    value={category.id}
                    disabled={selectedCategories.includes(category.id)}
                  >
                    {category.name} {selectedCategories.includes(category.id) ? '(Ya agregado)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Severidad *
              </label>
              <div className="flex gap-4">
                {(['low', 'medium', 'high'] as const).map((severity) => (
                  <label key={severity} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="severity"
                      value={severity}
                      checked={formData.severity === severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {severity === 'low' ? 'Baja' : severity === 'medium' ? 'Media' : 'Alta'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Información adicional sobre este factor de riesgo..."
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.category_id}
              className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Agregando...' : 'Agregar Factor'}
            </button>
          </form>

          <div className="pt-4 border-t">
            <button
              onClick={onSuccess}
              className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Finalizar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
