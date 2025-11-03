// // src/components/StudentRegister.tsx
// import { useState } from 'react';
// import { useAuth } from '../contexts/AuthContext';
// import { supabase } from '../lib/supabase';
// import { GraduationCap, Mail, Lock, User, ArrowLeft } from 'lucide-react';

// interface RegisterProps {
//   onBack: () => void;
// }

// export default function StudentRegister({ onBack }: RegisterProps) {
//   const { signUp } = useAuth();
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState(false);
  
//   const [formData, setFormData] = useState({
//     email: '',
//     password: '',
//     confirmPassword: '',
//     controlNumber: '',
//     firstName: '',
//     paternalSurname: '',
//     maternalSurname: '',
//     currentSemester: '1',
//   });

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setLoading(true);

//     try {
//       // Validaciones
//       if (formData.password !== formData.confirmPassword) {
//         throw new Error('Las contraseñas no coinciden');
//       }

//       if (formData.password.length < 6) {
//         throw new Error('La contraseña debe tener al menos 6 caracteres');
//       }

//       // Verificar si el número de control ya existe
//       const { data: existingStudent } = await supabase
//         .from('estudiantes')
//         .select('id')
//         .eq('numero_control', formData.controlNumber)
//         .maybeSingle();

//       if (existingStudent) {
//         throw new Error('Este número de control ya está registrado');
//       }

//       // Primero crear el registro de estudiante
//       const { data: newStudent, error: studentError } = await supabase
//         .from('estudiantes')
//         .insert({
//           numero_control: formData.controlNumber,
//           nombre: formData.firstName,
//           apellido_paterno: formData.paternalSurname,
//           apellido_materno: formData.maternalSurname,
//           semestre_actual: parseInt(formData.currentSemester),
//         })
//         .select()
//         .single();

//       if (studentError) throw studentError;

//       // Luego crear la cuenta de usuario
//       const { data: authData, error: signUpError } = await supabase.auth.signUp({
//         email: formData.email,
//         password: formData.password,
//         options: {
//           data: {
//             full_name: `${formData.firstName} ${formData.paternalSurname} ${formData.maternalSurname}`,
//             role: 'student',
//             student_id: newStudent.id,
//             control_number: formData.controlNumber,
//           },
//           emailRedirectTo: `${window.location.origin}`,
//         },
//       });

//       if (signUpError) {
//         // Si falla la creación del usuario, eliminar el estudiante creado
//         await supabase.from('estudiantes').delete().eq('id', newStudent.id);
//         throw signUpError;
//       }

//       setSuccess(true);
//     } catch (err: any) {
//       console.error('Error en registro:', err);
//       setError(err.message || 'Error al registrar. Intenta nuevamente.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (success) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
//         <div className="max-w-md w-full">
//           <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
//               <GraduationCap className="w-10 h-10 text-green-600" />
//             </div>
//             <h2 className="text-2xl font-bold text-gray-900 mb-3">
//               ¡Registro Exitoso!
//             </h2>
//             <p className="text-gray-600 mb-6">
//               Tu cuenta ha sido creada correctamente. 
//               Hemos enviado un correo de verificación a <strong>{formData.email}</strong>
//             </p>
//             <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
//               <p className="text-sm text-blue-900">
//                 <strong>Importante:</strong> Revisa tu bandeja de entrada y haz clic en el enlace de verificación 
//                 para activar tu cuenta y poder iniciar sesión.
//               </p>
//             </div>
//             <button
//               onClick={onBack}
//               className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
//             >
//               Ir a Iniciar Sesión
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
//       <div className="max-w-2xl w-full">
//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <button
//             onClick={onBack}
//             className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
//           >
//             <ArrowLeft className="w-4 h-4" />
//             Volver al inicio de sesión
//           </button>

//           <div className="text-center mb-8">
//             <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
//               <GraduationCap className="w-10 h-10 text-blue-600" />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">
//               Registro de Estudiante
//             </h1>
//             <p className="text-gray-600">
//               Instituto Tecnológico de Tijuana
//             </p>
//           </div>

//           {error && (
//             <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
//               <p className="text-sm text-red-800">{error}</p>
//             </div>
//           )}

//           <div className="space-y-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="md:col-span-2">
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Número de Control *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.controlNumber}
//                   onChange={(e) => setFormData({ ...formData, controlNumber: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                   placeholder="Ej: 20210001"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Nombre(s) *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.firstName}
//                   onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Apellido Paterno *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.paternalSurname}
//                   onChange={(e) => setFormData({ ...formData, paternalSurname: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Apellido Materno *
//                 </label>
//                 <input
//                   type="text"
//                   required
//                   value={formData.maternalSurname}
//                   onChange={(e) => setFormData({ ...formData, maternalSurname: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Semestre Actual *
//                 </label>
//                 <select
//                   required
//                   value={formData.currentSemester}
//                   onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
//                   className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                 >
//                   {[1,2,3,4,5,6,7,8,9,10,11,12].map(sem => (
//                     <option key={sem} value={sem}>Semestre {sem}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>

//             <div className="border-t pt-6">
//               <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Cuenta</h3>
              
//               <div className="space-y-4">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Correo Institucional *
//                   </label>
//                   <div className="relative">
//                     <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="email"
//                       required
//                       value={formData.email}
//                       onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="tu@correo.com"
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Contraseña *
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="password"
//                       required
//                       value={formData.password}
//                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="Mínimo 6 caracteres"
//                       minLength={6}
//                     />
//                   </div>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Confirmar Contraseña *
//                   </label>
//                   <div className="relative">
//                     <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//                     <input
//                       type="password"
//                       required
//                       value={formData.confirmPassword}
//                       onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
//                       className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                       placeholder="Repite tu contraseña"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <button
//               onClick={handleSubmit}
//               disabled={loading}
//               className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
//             >
//               {loading ? 'Registrando...' : 'Crear Cuenta'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { GraduationCap, Mail, Lock, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onBack: () => void;
}

export default function StudentRegister({ onBack }: RegisterProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    controlNumber: '',
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    currentSemester: '1',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (formData.password.length < 6) {
        throw new Error('La contraseña debe tener al menos 6 caracteres');
      }

      // Verificar si el número de control ya existe
      const { data: existingStudent } = await supabase
        .from('estudiantes')
        .select('id')
        .eq('numero_control', formData.controlNumber)
        .maybeSingle();

      if (existingStudent) {
        throw new Error('Este número de control ya está registrado');
      }

      // Primero crear el registro de estudiante
      const { data: newStudent, error: studentError } = await supabase
        .from('estudiantes')
        .insert({
          numero_control: formData.controlNumber,
          nombre: formData.firstName,
          apellido_paterno: formData.paternalSurname,
          apellido_materno: formData.maternalSurname,
          semestre_actual: parseInt(formData.currentSemester),
        })
        .select()
        .single();

      if (studentError) {
        console.error('Error creating student:', studentError);
        throw new Error(`Error al crear estudiante: ${studentError.message}`);
      }

      // Luego crear la cuenta de usuario
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.paternalSurname} ${formData.maternalSurname}`,
            role: 'student',
            student_id: newStudent.id,
            control_number: formData.controlNumber,
          },
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (signUpError) {
        console.error('Error creating auth user:', signUpError);
        // Si falla la creación del usuario, eliminar el estudiante creado
        await supabase.from('estudiantes').delete().eq('id', newStudent.id);
        throw new Error(`Error al crear usuario: ${signUpError.message}`);
      }

      setSuccess(true);
    } catch (err: any) {
      console.error('Error en registro:', err);
      setError(err.message || 'Error al registrar. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <GraduationCap className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              ¡Registro Exitoso!
            </h2>
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido creada correctamente. 
              Hemos enviado un correo de verificación a <strong>{formData.email}</strong>
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-900">
                <strong>Importante:</strong> Revisa tu bandeja de entrada y haz clic en el enlace de verificación 
                para activar tu cuenta y poder iniciar sesión.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio de sesión
          </button>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <GraduationCap className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Registro de Estudiante
            </h1>
            <p className="text-gray-600">
              Instituto Tecnológico de Tijuana
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número de Control *
                </label>
                <input
                  type="text"
                  required
                  value={formData.controlNumber}
                  onChange={(e) => setFormData({ ...formData, controlNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 20210001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre(s) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.paternalSurname}
                  onChange={(e) => setFormData({ ...formData, paternalSurname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido Materno *
                </label>
                <input
                  type="text"
                  required
                  value={formData.maternalSurname}
                  onChange={(e) => setFormData({ ...formData, maternalSurname: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semestre Actual *
                </label>
                <select
                  required
                  value={formData.currentSemester}
                  onChange={(e) => setFormData({ ...formData, currentSemester: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(sem => (
                    <option key={sem} value={sem}>Semestre {sem}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos de la Cuenta</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Institucional *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@correo.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Repite tu contraseña"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-400"
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}