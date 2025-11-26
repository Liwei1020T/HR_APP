import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '../lib/api-client';
import { registerSchema, RegisterFormData } from '../lib/validators/auth';
import {
  User,
  Mail,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  CheckCircle2,
  Crown,
  BadgeCheck,
  UserPlus
} from 'lucide-react';

const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Customer Success',
  'Finance',
  'Product',
  'Marketing',
  'Sales',
];

export default function RegisterPage() {
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Join the Jabil HR System today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {(apiError || success) && (
              <div
                className={`px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-in slide-in-from-top-2 ${apiError ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
                  }`}
              >
                <div className="mt-0.5">{apiError ? '⚠️' : '✅'}</div>
                <div>{apiError || success}</div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">Employee ID *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BadgeCheck className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('employee_id')}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors.employee_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="EMP-001"
                />
              </div>
              {errors.employee_id && (
                <p className="mt-1 text-xs text-red-600">{errors.employee_id.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  {...register('full_name')}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors.full_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Jane Doe"
                />
              </div>
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Work Email *</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  {...register('email')}
                  className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors.email ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="you@company.com"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Department</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    {...register('department')}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors appearance-none"
                  >
                    <option value="">Select...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    {...register('date_of_birth')}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    {...register('password')}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors.password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm *</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    {...register('confirm_password')}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                      }`}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {(errors.password || errors.confirm_password) && (
              <p className="text-xs text-red-600 mt-1">
                {errors.password?.message || errors.confirm_password?.message}
              </p>
            )}

            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Password must be at least 6 characters long.
            </div>

            <button
              type="submit"
              disabled={!isValid || loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
