import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Briefcase, Settings, Crown, LogIn, Wrench } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setLoading(true);

    try {
      await login(demoEmail, demoPassword);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <Crown className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Welcome back to Jabil HR System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-md hover:scale-[1.01]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Quick Demo Access</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-2">
              <button
                onClick={() => quickLogin('user@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                title="Employee Demo"
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors mb-1">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Emp</span>
              </button>

              <button
                onClick={() => quickLogin('hr@company.com', 'password123')}
                disabled={loading}
                title="HR Manager Demo"
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:bg-purple-50 hover:border-purple-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors mb-1">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">HR</span>
              </button>

              <button
                onClick={() => quickLogin('admin@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                title="Admin Demo"
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors mb-1">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Admin</span>
              </button>

              <button
                onClick={() => quickLogin('sa@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                title="Superadmin Demo"
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors mb-1">
                  <Crown className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Super</span>
              </button>

              <button
                onClick={() => quickLogin('vendor.facility@company.com', 'password123')}
                disabled={loading}
                title="Vendor Demo"
                className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors mb-1">
                  <Wrench className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-gray-600">Vendor</span>
              </button>
            </div>
          </div>

          <div className="mt-6">
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Register
                </Link>
              </span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          © 2025 Jabil HR System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
