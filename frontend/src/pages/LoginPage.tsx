import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900">HR Portal</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin('user@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors"
              >
                <span className="text-lg mb-1">👤</span>
                <span>Employee</span>
              </button>

              <button
                onClick={() => quickLogin('hr@company.com', 'password123')}
                disabled={loading}
                className="flex flex-col items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors"
              >
                <span className="text-lg mb-1">💼</span>
                <span>HR</span>
              </button>

              <button
                onClick={() => quickLogin('admin@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors"
              >
                <span className="text-lg mb-1">⚙️</span>
                <span>Admin</span>
              </button>

              <button
                onClick={() => quickLogin('sa@demo.local', 'P@ssw0rd!')}
                disabled={loading}
                className="flex flex-col items-center px-4 py-3 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none disabled:opacity-50 transition-colors"
              >
                <span className="text-lg mb-1">👑</span>
                <span>Superadmin</span>
              </button>
            </div>

            {/* Credentials Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <p className="text-xs text-blue-800 font-medium mb-2">Quick Login Credentials:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div className="flex justify-between">
                  <span className="font-medium">Employee:</span>
                  <span className="font-mono">user@demo.local / P@ssw0rd!</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">HR:</span>
                  <span className="font-mono">hr@company.com / password123</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Admin:</span>
                  <span className="font-mono">admin@demo.local / P@ssw0rd!</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Superadmin:</span>
                  <span className="font-mono">sa@demo.local / P@ssw0rd!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Production-ready HR Management System
        </p>
      </div>
    </div>
  );
}
