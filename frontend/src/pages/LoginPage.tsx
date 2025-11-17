import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const tabs = [
  { id: 'login', label: 'Login', path: '/login' },
  { id: 'register', label: 'Register', path: '/register' },
];

const demoAccounts = [
  { label: 'Employee', email: 'user@demo.local', password: 'P@ssw0rd!' },
  { label: 'HR', email: 'hr@company.com', password: 'password123' },
  { label: 'Admin', email: 'admin@demo.local', password: 'P@ssw0rd!' },
  { label: 'Superadmin', email: 'sa@demo.local', password: 'P@ssw0rd!' },
];

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
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">HR Platform</p>
            <h1 className="text-4xl font-black text-slate-900">Employee Portal</h1>
            <p className="text-sm text-slate-500">Sign in to access your HR platform.</p>
          </div>

          <div className="bg-slate-100 rounded-full p-1 flex text-sm font-medium">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className={`flex-1 py-2 rounded-full transition ${
                  tab.id === 'login'
                    ? 'bg-white text-slate-900 shadow'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="email" className="text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Enter your work email"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="Enter your password"
              />
              <p className="text-xs text-slate-400">
                Must be 8+ characters, with 1 uppercase letter, 1 number, and 1 special character.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="space-y-3">
            <p className="text-center text-xs text-slate-400">
              Or try any of the demo accounts below
            </p>
            <div className="grid grid-cols-2 gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.label}
                  onClick={() => quickLogin(account.email, account.password)}
                  disabled={loading}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 hover:border-blue-200 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="block text-base leading-4">•</span>
                  {account.label}
                </button>
              ))}
            </div>
            <div className="text-center text-[11px] text-slate-400 leading-tight">
              Employee: user@demo.local / P@ssw0rd!<br />
              HR: hr@company.com / password123<br />
              Admin: admin@demo.local / P@ssw0rd!<br />
              Superadmin: sa@demo.local / P@ssw0rd!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
