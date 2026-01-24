import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../database';
import { Mail, Lock, Loader2, BookOpen, Eye, EyeOff, Sparkles } from '../components/Icons';
import Loader from '../components/Loader';

const Login: React.FC = () => {
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const user = db.auth.getCurrentUser();
    if (user) {
      const role = user.role?.toLowerCase();
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin');
      } else if (user.subscriptionPlan?.toLowerCase() === 'school' && user.schoolId) {
        // All school teachers go to teacher dashboard
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const user = await db.auth.login(formData.email, formData.password);
      const role = user.role?.toLowerCase();
      const isSchoolPlan = user.subscriptionPlan?.toLowerCase() === 'school';
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin');
      } else if (isSchoolPlan && user.schoolId) {
        // All school teachers go to teacher dashboard
        navigate('/teacher-dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-white dark:bg-slate-950">
      {/* Premium Ethereal Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#16A34A]/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#16A34A]/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-1/4 right-1/4 opacity-20"><Sparkles className="w-8 h-8 text-[#16A34A]" /></div>
        <div className="absolute bottom-1/4 left-1/4 opacity-10"><Sparkles className="w-12 h-12 text-[#16A34A]" /></div>
      </div>

      <div className="z-10 w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Login Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] shadow-2xl border border-slate-200/50 dark:border-slate-800/50 relative group">
          <div className="absolute inset-x-0 -top-6 flex justify-center">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-slate-700">
              <BookOpen className="w-6 h-6 text-[#16A34A]" />
            </div>
          </div>

          <div className="text-center pt-2 mb-10">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">Welcome back</h2>
            <p className="mt-2 text-sm font-bold text-slate-400 uppercase tracking-widest">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-3 animate-in shake duration-500">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Email address</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 outline-none transition-all"
                    placeholder="jane@example.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] ml-1">Password</label>
                <div className="relative group/field">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-300 group-focus-within/field:text-[#16A34A] transition-colors" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent focus:border-[#16A34A] rounded-2xl text-slate-900 dark:text-white font-bold placeholder-slate-300 outline-none transition-all tracking-[0.2em]"
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-300 hover:text-[#16A34A] transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pr-2">
              <Link to="/forgot-password" size-sm className="text-xs font-black text-[#16A34A] hover:text-[#16A34A]/80 transition-colors uppercase tracking-widest">
                Forgot your password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[60px] bg-[#16A34A] text-white font-black rounded-2xl shadow-xl shadow-[#16A34A]/20 hover:shadow-[#16A34A]/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  <span>Processing...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="mt-12 pt-8 border-t border-slate-50 dark:border-slate-800 text-center">
            <p className="text-sm font-bold text-slate-400">
              Don't have an account?
            </p>
            <Link to="/signup" className="mt-2 block text-md font-black text-[#16A34A] hover:text-[#16A34A]/80 transition-colors underline-offset-4 hover:underline">
              Create account
            </Link>
          </div>
        </div>

        {/* Footer Credit */}
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Advanced Pedagogy AI · Nigeria</p>
        </div>
      </div>
    </div>
  );
};

export default Login;