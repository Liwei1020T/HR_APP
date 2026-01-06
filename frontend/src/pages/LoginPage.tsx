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
          <div className="w-12 h-12 bg-[#1a4f9c] rounded-md flex items-center justify-center shadow-sm">
            <Crown className="w-7 h-7 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500 font-bold">
          Welcome back to Jabil HR System
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-md sm:rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm flex items-start gap-2">
                <div className="mt-0.5">⚠️</div>
                <div>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-bold text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-[#1a4f9c] focus:border-[#1a4f9c] sm:text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-bold text-gray-700">
                  Password
                </label>
                <div className="text-sm">
                  <a href="#" className="font-bold text-[#1a4f9c] hover:text-blue-800">
                    Forgot password?
                  </a>
                </div>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md focus:ring-[#1a4f9c] focus:border-[#1a4f9c] sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-md shadow text-sm font-bold text-white bg-[#1a4f9c] hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a4f9c] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
                </>
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wider font-bold">
                <span className="px-2 bg-white text-gray-500">Quick Demo Access</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-5 gap-2">
              <button
                onClick={() => quickLogin('user@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center justify-center py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <User className="w-4 h-4 text-gray-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-700">Staff</span>
              </button>

              <button
                onClick={() => quickLogin('hr@company.com', 'password123')}
                disabled={loading}
                className="flex flex-col items-center justify-center py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Briefcase className="w-4 h-4 text-gray-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-700">HR</span>
              </button>

              <button
                onClick={() => quickLogin('admin@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center justify-center py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Settings className="w-4 h-4 text-gray-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-700">Admin</span>
              </button>

              <button
                onClick={() => quickLogin('sa@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center justify-center py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Crown className="w-4 h-4 text-gray-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-700">Super</span>
              </button>

              <button
                onClick={() => quickLogin('vendor.facility@company.com', 'password123')}
                disabled={loading}
                className="flex flex-col items-center justify-center py-2 border border-gray-200 rounded-md bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Wrench className="w-4 h-4 text-gray-600 mb-1" />
                <span className="text-[10px] font-bold text-gray-700">Vendor</span>
              </button>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-center text-sm">
              <span className="text-gray-500 font-bold">
                Don't have an account?{' '}
                <Link to="/register" className="text-[#1a4f9c] hover:text-blue-800 font-bold underline decoration-blue-700/30 underline-offset-4">
                  Create an account
                </Link>
              </span>
            </div>
          </div>
        </div>

        <p className="mt-10 text-center text-xs text-gray-400 font-bold">
          © {new Date().getFullYear()} Jabil Inc. HR Management System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
