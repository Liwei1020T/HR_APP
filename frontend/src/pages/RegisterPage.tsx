import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../lib/api-client';
import { registerSchema, RegisterFormData } from '../lib/validators/auth';
import { useAuth } from '../contexts/AuthContext';

const departmentSuggestions = [
  'Engineering',
  'Human Resources',
  'Customer Success',
  'Finance',
  'Product',
];

const roleSuggestions = ['Employee', 'HR', 'Admin', 'Superadmin'];

export default function RegisterPage() {
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['ADMIN', 'SUPERADMIN']);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      employee_id: '',
      full_name: '',
      email: '',
      department: '',
      date_of_birth: '',
      password: '',
      confirm_password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError('');
    setSuccess('');
    setLoading(true);

    try {
      await authApi.register(data);
      setSuccess('Registration successful! Redirecting to login...');
      reset();
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const apiData = err.response?.data;
      let detail = apiData?.detail || apiData?.message;

      if (detail === 'Validation error' && Array.isArray(apiData?.errors) && apiData.errors.length) {
        const fieldMessages = apiData.errors.map((error: any) => `${error.field}: ${error.message}`);
        detail = `Validation error – ${fieldMessages.join('; ')}`;
      }

      if (!detail) {
        detail = 'Registration failed. Please try again.';
      }

      setApiError(detail);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Register as an employee to access the HR Portal</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            {(apiError || success) && (
              <div
                className={`px-4 py-3 rounded ${apiError ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
              >
                {apiError || success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
                <input
                  type="text"
                  {...register('employee_id')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.employee_id ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="EMP-001"
                />
                {errors.employee_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.employee_id.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  {...register('full_name')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.full_name ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Jane Doe"
                />
                {errors.full_name && (
                  <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Work Email *</label>
              <input
                type="email"
                {...register('email')}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                  errors.email ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <input
                  type="text"
                  {...register('department')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                  placeholder="e.g., Engineering"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  {...register('date_of_birth')}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  {...register('password')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.password ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                <input
                  type="password"
                  {...register('confirm_password')}
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.confirm_password ? 'border-red-400 focus:border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>
                )}
              </div>
            </div>

            <p className="text-xs text-gray-500">Password must be at least 6 characters long.</p>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Sign in
            </Link>
          </p>

            <div className="mt-4 border-t border-dashed border-gray-200 pt-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-gray-500">Department suggestions</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {departmentSuggestions.map((dept) => (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => setValue('department', dept)}
                      className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-transparent hover:bg-blue-100 focus:outline-none"
                    >
                      {dept}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Pick the closest department above to speed up onboarding.
                </p>
              </div>

              <div className="rounded-lg border px-3 py-2 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-500">Role suggestions</p>
                  {isAdmin && (
                    <span className="text-xs font-medium text-white bg-blue-600 px-2 py-0.5 rounded-full">
                      Admin shortcut
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {roleSuggestions.map((role) => (
                    <span
                      key={role}
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full ${
                        isAdmin ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  Admins can use these as a reminder when registering teammates. Role changes happen after sign-up if needed.
                </p>
              </div>
            </div>
          </div>

        <p className="text-center text-sm text-gray-500">
          Production-ready HR Management System
        </p>
      </div>
    </div>
  );
}
