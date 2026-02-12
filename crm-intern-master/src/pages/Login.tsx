import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, AlertCircle } from 'lucide-react';
import { mockUsers } from '../data/mockData';

const Login = () => {
  const [isSignUp, ] = useState(false); //setIsSignUp
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const { login, signup, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // If user is loaded but has no ID (pending sync), wait or show something?
      // For now, dashboard handles it.
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isSignUp) {
      const { error } = await signup(email, password);
      if (error) {
        setError(error.message);
      } else {
        setMessage('Account created! Please check your email to confirm, or if auto-confirm is on, you can now login.');
        // In dev environment with auto-confirm, they might be logged in automatically.
      }
      return;
    }

    if (selectedRole) {
      // Quick login with role selection (Dev only feature really)
      const roleUser = mockUsers.find(u => u.role === selectedRole);
      if (roleUser) {
        const { error } = await login(roleUser.email, 'password');
        if (error) setError(error.message);
      }
    } else if (email && password) {
      const { error } = await login(email, password);
      if (error) setError(error.message);
    } else {
      setError('Please enter email and password');
    }
  };

  const roles = [
    'Sales Manager',
    'Sales Executive',
    'Marketing Executive',
    'Support Executive'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-10 h-10 text-primary-600" />
              <span className="ml-2 text-2xl font-bold text-gray-900">CRM Pro</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-gray-600">
              {isSignUp ? 'Sign up to access your CRM' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
              <Sparkles className="w-5 h-5 mr-2" />
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="user@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="password"
                required
              />
            </div>

            {!isSignUp && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                  Or Quick Login by Role:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`p-3 text-sm rounded-lg border transition-colors ${selectedRole === role
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'
                        }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary w-full">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {/* <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setMessage('');
                setSelectedRole('');
              }}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default Login;
